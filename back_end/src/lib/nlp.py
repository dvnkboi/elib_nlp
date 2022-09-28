
import os.path as path
import string
from typing import List, Text
import cv2
from geometry import Rect
from pytesseract import Output
import pytesseract
import re
import imageUtils as ImUtils
from json import dumps, loads
from langdetect import detect
import spacy
# from spacy.lang.ar import Arabic

defaults = {
    'cont_smooth': (3, 1),
    'gaus_filt': (7, 7),
    'tess_config': '',
    'tess_confid': 60,
    'tess_pattern': '^\w+$',
    'rect_pad': (3, 3),
}


def sendJson(dict):
    res = dumps(dict, ensure_ascii=False)
    print(res)


def parseJson(jsonStr):
    res = loads(jsonStr)
    return res


#! IMAGE ZONING PART

def readImageId(id):
    dir_path = path.dirname(path.normpath(__file__))
    image_path = path.normpath(path.join(dir_path, '../images/', id + '.png'))
    image = cv2.imread(image_path)
    if image is None:
        sendJson({'error': 'nodata', 'type': 'error'})
    return image


# try getting element off list/dict
def tryGet(list, index):
    try:
        list[index]
        return list[index]
    except IndexError:
        return False


def clamp(n, smallest, largest): return max(smallest, min(n, largest))


# group close rectangles together with a min distance
def group_by_dist(rectArr: List[Rect], minDist=10, removeRedundancies=True):
    if rectArr is None or len(rectArr) < 1 or minDist <= 0:
        return rectArr

    groupRect: List[Rect] = []
    minX = 0
    maxX = 0
    minY = 0
    maxY = 0
    indexUsed = {}

    for pivotIdx, pivot in enumerate(rectArr):
        if pivotIdx in indexUsed and indexUsed[pivotIdx]:
            continue
        for rectIdx, rect in enumerate(rectArr[(pivotIdx+1):], start=(pivotIdx+1)):
            if rectIdx in indexUsed and indexUsed[rectIdx]:
                continue
            if pivot.distance_to_rect(rect) <= minDist:
                minX = min(rect.minX, rect.maxX, pivot.minX, pivot.maxX)
                maxX = max(rect.minX, rect.maxX, pivot.minX, pivot.maxX)
                minY = min(rect.minY, rect.maxY, pivot.minY, pivot.maxY)
                maxY = max(rect.minY, rect.maxY, pivot.minY, pivot.maxY)
                pivot = Rect(minX, minY, maxX - minX, maxY - minY)
                indexUsed[rectIdx] = True
        groupRect.append(pivot)
        indexUsed[pivotIdx] = True

    if removeRedundancies:
        for pivotIdx, pivot in enumerate(groupRect):
            for rectIdx, rect in enumerate(groupRect[(pivotIdx+1):], start=(pivotIdx+1)):
                if rect.is_inside(pivot):
                    groupRect.remove(rect)

    return groupRect


# get image zones
def get_image_zones(image, mode='cv2_contours', options=defaults):
    height, width = image.shape[0], image.shape[1]

    filteredImage = ImUtils.get_grayscale(image)
    if mode == 'cv2_contours':
        filteredImage = ImUtils.filter_lines(filteredImage, (255, 255, 255))
        filteredImage = cv2.GaussianBlur(
            filteredImage, options['gaus_filt'], 0)
    filteredImage = ImUtils.thresholding(filteredImage, 0, 255)

    rectangles = []

    if mode == 'tesseract':
        tessData = pytesseract.image_to_data(
            filteredImage, output_type=Output.DICT, config=options['tess_config'])
        for i in range(len(tessData['text'])):
            if int(tessData['conf'][i]) > options['tess_confid']:
                if re.match(options['tess_pattern'], tessData['text'][i]):
                    (x, y, w, h) = (tessData['left'][i], tessData['top']
                                    [i], tessData['width'][i], tessData['height'][i])
                    rectangles.append(Rect(x - options['rect_pad'][0], y - options['rect_pad']
                                           [1], w + options['rect_pad'][0], h + options['rect_pad'][1]))
    elif mode == 'cv2_contours':
        kernel = cv2.getStructuringElement(
            cv2.MORPH_RECT, options['cont_smooth'])
        filteredImage = cv2.dilate(filteredImage, kernel, iterations=4)
        cnts = cv2.findContours(
            filteredImage, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cnts = cnts[0] if len(cnts) == 2 else cnts[1]
        for c in cnts:
            x, y, w, h = cv2.boundingRect(c)
            rectangles.append(Rect(x - options['rect_pad'][0], y - options['rect_pad']
                              [1], w + options['rect_pad'][0], h + options['rect_pad'][1]))

    coords = []
    for rect in rectangles:
        coord = {}
        coord['maxX'] = clamp(rect.maxX, 0, width)
        coord['maxY'] = clamp(rect.maxY, 0, height)
        coord['minX'] = clamp(rect.minX, 0, width)
        coord['minY'] = clamp(rect.minY, 0, height)
        if coord['maxX'] - coord['minX'] > 1 and coord['maxY'] - coord['minY'] > 1:
            coords.append(coord)

    return coords


def remove_lines(rectArr, minThresh=5, maxThresh=20) -> List[Rect]:
    for _, pivot in enumerate(rectArr):
        if (pivot.maxX - pivot.minX < minThresh and pivot.maxY - pivot.minY > maxThresh) or (pivot.maxY - pivot.minY < minThresh and pivot.maxX - pivot.minX > maxThresh):
            rectArr.remove(pivot)
    return rectArr

#! tesseract OCR part


def get_OCR_multi(image, zones):
    i = 0
    for zone in zones:
        zone['text'] = get_OCR_single(image, zone)
        i += 1
    return zones


def get_OCR_single(image, zone):
    crop = ImUtils.crop(image, zone['minX'], zone['minY'],
                        zone['maxX'] - zone['minX'], zone['maxY'] - zone['minY'])
    text: Text = pytesseract.image_to_string(
        crop, lang='fra+eng', config='--psm 6')
    pattern = re.compile('[^a-zA-Z0-9\s]')
    text = re.sub(pattern, '', text)
    return text.strip()


def get_lang(text):
    return detect(text)


en_nlp = spacy.load("en_core_web_sm")
fr_nlp = spacy.load("fr_core_news_sm")
# ar_nlp = Arabic()

sendJson({
    'type': 'nlpReady'
})


def get_nlp_doc(text, lang):
    # if lang == 'ar':
    #     nlp = ar_nlp(text).to_json()
    #     return nlp
    if lang == 'fr':
        nlp = [chunk.text for chunk in fr_nlp(text).noun_chunks]
        return nlp
    elif lang == 'en':
        nlp = [chunk.text for chunk in en_nlp(text).noun_chunks]
        return nlp
    else:
        return None


def filter_zones(zones, minX, minY, maxX, maxY, xPadding=8, yPadding=3):
    res = []
    for zone in zones:
        zoneRect = Rect(zone['minX'], zone['minY'], zone['maxX'] -
                        zone['minX'], zone['maxY'] - zone['minY'])
        boundaryRect = Rect(int(minX - xPadding), int(minY - yPadding), int(
            maxX) - int(minX) + xPadding * 2, int(maxY) - int(minY) + yPadding * 2)
        if zoneRect.overlaps_with(boundaryRect):
            res.append(zone)
    return res


def resolution_consistent_crop(image, minX, minY, maxX, maxY, filler_rgb=(255, 255, 255)):
    minX, minY, maxX, maxY = int(minX), int(minY), int(maxX), int(maxY)
    height, width = image.shape[0], image.shape[1]
    crop = ImUtils.crop(image, minX, minY, maxX - minX, maxY - minY)
    blank_image = ImUtils.blank_image(width, height, filler_rgb)
    merge = ImUtils.merge_image(back=blank_image, front=crop, x=minX, y=minY)
    return merge
