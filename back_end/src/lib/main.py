import nlp
import threading
import traceback

threads = {}


def ocr_one(croppedImage, zone, idx, id):
    if not threads[id]:
        text = nlp.get_OCR_single(croppedImage, zone)
        lang = ''
        try:
            lang = nlp.get_lang(text)
        except:
            lang = 'unknown'
        nlp.sendJson({'text': text, 'idx': idx, 'lang': lang,
                      'type': 'zoneText', 'id': id, 'nlpResult': nlp.get_nlp_doc(text, lang)})


def process(command, options, id):
    global threads
    try:
        if command == "process":
            nlp.sendJson({'type': 'starting', 'id': id,
                         'options': options, 'command': 'process'})
            image = nlp.readImageId(id)
            croppedImage = nlp.resolution_consistent_crop(
                image, options['zone']['minX'], options['zone']['minY'], options['zone']['maxX'], options['zone']['maxY'])
            zones = nlp.get_image_zones(
                croppedImage, 'cv2_contours', options=options)
            nlp.sendJson({'zones': zones, 'type': 'zones', 'id': id})
            i = 0
            subThreads = []
            for zone in zones:
                thread = threading.Thread(
                    target=ocr_one, args=(croppedImage, zone, i, id,), name='inner_' + str(id) + "_" + str(i))
                subThreads.append(thread)
                i += 1

            # start all threads
            for thread in subThreads:
                thread.start()

            # wait for all threads to finish
            for thread in subThreads:
                thread.join()

            nlp.sendJson({'type': 'done', 'id': id})

        elif command == "get_zones":
            nlp.sendJson({'type': 'starting', 'id': id,
                         'options': options, 'command': 'get_zones'})
            image = nlp.readImageId(id)
            croppedImage = nlp.resolution_consistent_crop(
                image, options['zone']['minX'], options['zone']['minY'], options['zone']['maxX'], options['zone']['maxY'])
            zones = nlp.get_image_zones(
                croppedImage, 'cv2_contours', options=options)
            nlp.sendJson({'zones': zones, 'type': 'zones', 'id': id})
            nlp.sendJson({'type': 'done', 'id': id})
    except Exception as e:
        nlp.sendJson({'err': repr(e), 'stack': traceback.format_exc(),
                     'type': 'error', 'id': id})
    finally:
        return


def set_interval(func, sec):
    def func_wrapper():
        set_interval(func, sec)
        func()
    t = threading.Timer(sec, func_wrapper)
    t.start()
    return t


while True:
    inp = input(" ")
    inp = nlp.parseJson(inp)
    command = inp['command']
    id = inp['id']
    if command == 'stop':
        threads[id] = True
    else:
        options = inp['options']
        threads[id] = False
        thread = threading.Thread(
            target=lambda: process(command, options, id), name=id)
        thread.start()
