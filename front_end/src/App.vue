<template>
  <div ref="app" class="flex justify-start items-start h-full w-full relative overflow-hidden">
    <!-- sidebar -->
    <div
      class="w-2/12 min-w-max bg-gray-100 shadow-2xl h-full px-4 py-2 gap-4 flex justify-start items-start flex-col relative">
      <h1 class="text-3xl font-bold">
        Settings
      </h1>
      <div class="w-full flex justify-start items-start flex-col gap-2">
        <h2 class="text-lg font-bold">
          Processing
        </h2>
        <div class="w-full flex justify-start items-center flex-col px-4 gap-2">
          <h3 class="text-base w-full font-semibold">Zone detection</h3>
          <div
            class="flex justify-between items-center bg-gray-100 transition duration-300 w-48 gap-2 py-1 shadow-lg rounded-xl relative px-2 text-sm">
            <h4 @click="zoneDetectionAuto = true"
              :class="{ 'opacity-100 text-gray-50': zoneDetectionAuto, 'opacity-60 hover:bg-red-500 hover:bg-opacity-40': !zoneDetectionAuto }"
              class="z-10 font-semibold transition-all duration-300 cursor-pointer rounded-xl px-2 py-1">Automatic</h4>
            <h4 @click="zoneDetectionAuto = false"
              :class="{ 'opacity-100 text-gray-50': !zoneDetectionAuto, 'opacity-60 hover:bg-red-500 hover:bg-opacity-40': zoneDetectionAuto }"
              class="z-10 font-semibold transition-all duration-300 cursor-pointer rounded-xl px-2 py-1">Manual</h4>
            <div :class="{ 'left-0.5 right-[96px]': zoneDetectionAuto, 'left-[114.5px] right-0.5': !zoneDetectionAuto }"
              class="z-0 absolute bottom-0 top-0 px-2 py-1 transition-all duration-300">
              <div class="w-full h-full bg-rose-500 rounded-xl"></div>
            </div>
          </div>
          <div class="flex justify-start items-start flex-col w-full">
            <input id="lineHeightInput" type="number" v-model="lineHeight"
              class="focus:bg-gray-200 bg-transparent rounded-2xl transition-all duration-300 text-5xl font-semibold focus:px-2 focus:py-2 w-16 h-12 focus:h-16">
            <label for="lineHeightInput" class="text-base w-full font-normal">Line Height</label>
          </div>
          <div class="flex justify-start items-start flex-col w-full">
            <input id="lineWdithtInput" type="number" v-model="lineWidth"
              class="focus:bg-gray-200 bg-transparent rounded-2xl transition-all duration-300 text-5xl font-semibold focus:px-2 focus:py-2 w-16 h-12 focus:h-16">
            <label for="lineWdithtInput" class="text-base w-full font-normal">Line Width</label>
          </div>
          <div @click.prevent.stop="sendZoneRequest"
            class="mt-2 px-4 py-1 bg-blue-500 font-semibold text-base rounded-xl text-gray-50 group hover:-translate-y-0.5 transition duration-300 cursor-pointer">
            <h1 class="hover:-translate-y-0.5 transition duration-300">get zones</h1>
          </div>
        </div>
      </div>
      <div class="w-full flex justify-start items-start flex-col gap-2">
        <h2 class="text-lg font-bold">
          Product search
        </h2>
        <div class="w-full flex justify-start items-center flex-col px-4 gap-2">
          <div class="flex justify-start items-start flex-col w-full">
            <input id="confidenceInput" type="number" v-model="allowedConfidence"
              class="focus:bg-gray-200 bg-transparent rounded-2xl transition-all duration-300 text-5xl font-semibold focus:px-2 focus:py-2 w-24 h-12 focus:h-16">
            <label for="confidenceInput" class="text-base w-full font-normal">Minimum Confidence</label>
          </div>
        </div>
      </div>
      <div class="w-full flex justify-start items-start flex-col gap-2">
        <h2 class="text-lg font-bold">
          Upload
        </h2>
        <div class="w-full flex justify-start items-center flex-col gap-2">
          <div @click="fileUpload.click()"
            class="font-semibold text-sm px-2 py-1.5 bg-blue-500 text-gray-50 shadow-md rounded-xl flex justify-center items-center group hover:-translate-y-0.5 transition duration-300 cursor-pointer">
            <h1 class="hover:-translate-y-0.5 transition duration-300">Upload file</h1>
          </div>
          <h1 v-if="!rawFile || fileUpload?.files.length < 1" class="w-full text-center">No file Uploaded</h1>
          <div v-else
            class="bg-gray-100 w-full flex flex-col justify-start items-start gap-2 shadow-2xl rounded-2xl px-4 pb-4 pt-1">
            <h2 class="text-lg w-full font-bold">Summary</h2>
            <div class="flex justify-start items-start flex-col gap-0 w-full">
              <h4 class="text-5xl w-full font-bold leading-none flex justify-start items-end gap-0.5">{{ (rawFile.size /
                  1048576).toFixed(2)
              }} <h5 class="text-sm font-semibold">mb</h5>
              </h4>
              <h3 class="text-base w-full font-normal leading-none">Size</h3>
            </div>
            <div class="flex justify-start items-start flex-col gap-0 w-full">
              <h4 class="text-4xl w-full font-bold leading-none flex justify-start items-end gap-0.5">{{ (res.w * (1 /
                  scaling)).toFixed(0)
              }} x {{ (res.h * (1 / scaling)).toFixed(0) }} <h5 class="text-sm font-semibold">
                  px</h5>
              </h4>
              <h3 class="text-base w-full font-normal leading-none">resolution</h3>
            </div>
            <div class="flex justify-start items-start flex-col gap-1 w-full">
              <h4 class="text-2xl w-full font-bold leading-none flex justify-start items-end gap-0.5">{{ rawFile.type }}
              </h4>
              <h3 class="text-base w-full font-normal leading-none">Type</h3>
            </div>
            <div class="flex justify-start items-start flex-col gap-0 w-full max-w-[25ch]">
              <h4 class="text-2xl w-full font-bold gap-0.5 truncate text-ellipsis">{{ rawFile.name }}</h4>
              <h3 class="text-base w-full font-normal leading-none">name</h3>
            </div>
          </div>
          <input class="w-0 h-0 overflow-hidden" type="file" ref="fileUpload" @change="encodeImageFileAsURL" />
        </div>
      </div>
      <div class="flex justify-center items-center absolute bottom-2 left-2 right-2">
        <div @click.prevent.stop="sendProcessRequest"
          class="px-4 py-1 bg-blue-500 font-semibold text-base rounded-xl text-gray-50 group hover:-translate-y-0.5 transition duration-300 cursor-pointer">
          <h1 class="hover:-translate-y-0.5 transition duration-300">Process</h1>
        </div>
      </div>
    </div>
    <!-- content -->
    <div :class="{ 'justify-center': !imageOverflows.x, 'items-center': !imageOverflows.y }" ref="workspace"
      class="flex w-10/12 h-full pointer-events-auto overflow-auto px-4 py-4 relative">
      <div class="fixed right-2 top-2 px-6 py-2 z-50">
        <transition name="fade-right" appear mode="out-in">
          <div v-if="loading.show"
            class="shadow-xl rounded-xl text-base font-semibold px-2 py-1 transform transition duration-300 bg-green-300"
            :key="loading.text">{{ loading.text }}</div>
        </transition>
      </div>

      <div class="fixed top-2 right-2 bottom-2 px-6 py-2 z-50 flex justify-end items-end pointer-events-none">
        <transition name="fade-right" appear>
          <div v-if="selectedResult.text != '' && selectedResult.show && !dragging"
            :class="[dragging ? 'pointer-events-none' : 'pointer-events-auto']"
            class="relative bg-gray-100 shadow-xl w-full h-full max-w-2xl min-w-[20rem] max-h-96 rounded-2xl transition duration-300">
            <div class="absolute top-0 right-0 -translate-y-1/2 -translate-x-6">
              <div @click="selectedResult.show = false"
                class="w-10 h-10 bg-blue-300 flex justify-center items-center text-3xl font-semibold rounded-xl select-none cursor-pointer transition duration-300 group hover:-translate-y-1 active:scale-90">
                <h1 class="-mt-1.5 -mr-[0.3rem] rotate-45 transition duration-300 group-hover:-translate-y-0.5 ">+</h1>
              </div>
            </div>
            <div
              class="flex justify-start items-start flex-col overflow-auto w-full h-full flex-grow gap-4 max-w-2xl min-w-[20rem] max-h-96 px-4 pt-4 pb-4">
              <h2 class="text-xl font-bold">
                Result
              </h2>
              <div
                class="flex justify-start items-start flex-col gap-0 w-full px-4 pt-2 pb-4 bg-blue-100 shadow-lg rounded-2xl">
                <h3 class="text-3xl w-full font-bold">Text</h3>
                <h4 :class="[selectedResult.text.length > 30 ? 'text-base' : 'text-4xl']"
                  class="w-full font-semibold leading-none flex justify-start items-end gap-0.5">{{ selectedResult.text
                  }}</h4>
              </div>
              <div
                v-if="selectedResult.dbRes?.article && selectedResult.dbRes?.article.confidenceScore > allowedConfidence"
                class="flex justify-start items-start flex-wrap gap-4 w-full">
                <div class="flex justify-start items-start flex-col gap-0 px-4 py-2 bg-rose-100 shadow-lg rounded-2xl">
                  <h1 class="font-bold text-4xl leading-none">${{ selectedResult.dbRes.article.price.toFixed(0) }}<small
                      class="text-sm">.{{ selectedResult.dbRes.article.price.toFixed(2).split('.')[1] }}</small></h1>
                  <h3 class="text-base w-full font-semibold leading-none">Price</h3>
                </div>
                <div class="flex justify-start items-start flex-col gap-0 px-4 py-2 bg-rose-100 shadow-lg rounded-2xl">
                  <h1 class="font-bold text-4xl leading-none">{{ selectedResult.dbRes.article.author }}</h1>
                  <h3 class="text-base w-full font-semibold leading-none">Author</h3>
                </div>
                <div class="flex justify-start items-start flex-col gap-0 px-4 py-2 bg-rose-100 shadow-lg rounded-2xl">
                  <h1 class="font-bold text-4xl leading-none">{{ selectedResult.dbRes.article.title }}</h1>
                  <h3 class="text-base w-full font-semibold leading-none">Title</h3>
                </div>
                <div class="flex justify-start items-start flex-col gap-0 px-4 py-2 bg-rose-100 shadow-lg rounded-2xl">
                  <h1 class="font-bold text-4xl leading-none">{{ selectedResult.dbRes.article.group }}</h1>
                  <h3 class="text-base w-full font-semibold leading-none">Group</h3>
                </div>
              </div>
              <div v-else class="flex justify-start items-start flex-col px-2 py-2 bg-rose-100 shadow-lg rounded-2xl">
                <h2 class="text-xl font-bold">
                  We are not quite confident about that one
                </h2>
                <div class="flex justify-start items-start flex-col gap-0">
                  <h1 class="font-bold text-6xl leading-none">{{ selectedResult.dbRes.article.confidenceScore }}</h1>
                  <h3 class="text-base w-full font-semibold leading-none">Confidence</h3>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
      <transition name="fade" appear mode="out-in">
        <div ref="selectionContainer" :class="[selectionObj.color.border]"
          class="border-2 pointer-events-none rounded-lg transition-opacity duration-300 border-dashed absolute z-10 flex-shrink-0"
          v-show="!selectionObj.hidden && !rescaling"
          :style="`top:${selectionObj.pos.minY}px;left:${selectionObj.pos.minX}px;width:${selectionObj.pos.maxX - selectionObj.pos.minX}px;height:${selectionObj.pos.maxY - selectionObj.pos.minY}px;`">
        </div>
      </transition>
      <div v-if="base64Image != ''" :style="`transform: scale(${scaling})`"
        class="relative flex-shrink-0 pointer-events-none transition duration-300" ref="imageContainer">
        <div draggable="false" ref="image" onmousedown="return false" class="pb-20 relative pointer-events-none">
          <img draggable="false" ref="image" onmousedown="return false"
            class="object-contain pointer-events-none transition-all duration-300 rounded-lg w-max select-none shadow-2xl"
            :src="base64Image" alt="" />
        </div>
        <svg v-for="(item, index) in zoneObj" :key="index"
          :tabindex="Object.keys(zoneObj).length - parseInt(index.toString()) + 2"
          :viewbox="`0 0 ${item.pos.maxX - item.pos.minX} ${item.pos.maxY - item.pos.minY}`"
          :style="`top:${item.pos.minY}px;left:${item.pos.minX}px;width:${item.pos.maxX - item.pos.minX}px;height:${item.pos.maxY - item.pos.minY}px;`"
          @focus="selectResult(item); selectionObj.hidden = true;" @blur="selectionObj.hidden = false;"
          :class="[item.hidden ? 'opacity-0 pointer-events-none' : '', item.text.trim() == '' ? item.color.border : 'border-blue-300', `bg-opacity-5 ${item.color.bg}`, dragging ? 'pointer-events-none select-none' : 'pointer-events-auto select-auto']"
          class="absolute border-0 rounded-lg transition-all duration-300 focus:z-50 overflow-visible group focus:scale-110"
          preserveAspectRatio="xMinYMin meet">
          <foreignObject class="node overflow-visible relative z-50" x="0" y="0" width="100%" height="100%">
            <div v-if="item?.text != ''"
              class="bg-green-300 h-3 w-3 z-30 absolute left-full -ml-5 bottom-1/2 translate-x-5 -translate-y-3 opacity-100 transition-all duration-300 rounded-xl">
            </div>
            <div :class="[item.text.trim() == '' ? item.color.border : 'border-blue-300']"
              class="absolute border-2 rounded-lg transition-all duration-300 focus:scale-125 overflow-visible w-full h-full z-50">
            </div>
          </foreignObject>
          <!-- <foreignObject class="node relative z-40 overflow-visible" x="0" y="0" width="100%" height="100%">
            <div class="flex justify-center items-center absolute overflow-auto z-50 ">
              <p xmlns="http://www.w3.org/1999/xhtml" class="font-semibold text-xl">{{item.text}}</p>
            </div>
          </foreignObject> -->
        </svg>
      </div>
      <div v-else class="px-4 py-2 bg-red-200 rounded-xl text-sm font-semibold border-spacing-1">
        No image loaded
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { PointerUtils } from './lib/pointerUtils';
import { io } from 'socket.io-client';
import { computed, Ref } from '@vue/reactivity';

const socket = io('http://localhost:3001', {
  port: 3001,
  forceNew: true,

});
socket.disconnect();

const reconnectSocket = () => {
  if (socket.connected) socket.disconnect();
  socket.connect();
};

onMounted(() => {

  let currentIdx = 1;
  socket.on('zones', async (data) => {
    await deleteAllZones();
    for (const idx in data.zones) {
      createText(
        {
          minX: data.zones[idx].minX,
          maxX: data.zones[idx].maxX,
          minY: data.zones[idx].minY,
          maxY: data.zones[idx].maxY,
        },
        ''
      );
    }
    showLoading(`zones loaded`);
    currentIdx = 1;
  });

  socket.on('zoneText', async (data) => {
    const zoneCount = Object.keys(zoneObj.value).length;
    zoneObj.value[data.idx].dbRes = data.dbRes;
    if (data.text.trim() != '') {
      zoneObj.value[data.idx].text = data.text.trim();
    }
    showLoading(`processed zone ${currentIdx}/${zoneCount}`);
    currentIdx++;
  });

  // socket.on('error',() => loading.value.show = false);
  // socket.on('done',() => loading.value.show = false);

  // let scrollDeb = null 
  workspace.value.addEventListener('scroll', () => {
    currentScroll.x = workspace.value.scrollLeft;
    currentScroll.y = workspace.value.scrollTop;
  });

  let resizeDeb = null;
  window.addEventListener('resize', async () => {
    // hideSelection();
    rescaling.value = true;
    await resetScaling();
    showLoading('rescaling image');
    if (resizeDeb) clearTimeout(resizeDeb);
    resizeDeb = setTimeout(async () => {
      await updateImageOverFlow();
      nextTick(() => {
        if (base64Image.value != '')
          setPositionReal(selectionObj.value.realCoords.minX * scaling.value, selectionObj.value.realCoords.minY * scaling.value, selectionObj.value.realCoords.maxX * scaling.value, selectionObj.value.realCoords.maxY * scaling.value);
        showLoading('rescaling image done');
        rescaling.value = false;
      });
    }, 600);
  });
});

const workspace = ref<HTMLElement>();
const app = ref<HTMLElement>();
const zoneDetectionAuto = ref(true);
const dragging = ref(false);
const boxCount = ref(0);
const image = ref<HTMLImageElement>();
const fileUpload = ref<HTMLInputElement>();
const base64Image = ref('');
const rawFile = ref<File>();
const imageContainer = ref<HTMLElement>();
const selectionContainer = ref<HTMLElement>();
const allowedConfidence = ref(50);
const loading = ref({
  show: false,
  text: ''
});
const _lineW = ref(3);
const _lineH = ref(1);
const scaling = ref(1);
const rescaling = ref(false);
const selectedResult = ref({}) as Ref<{
  index: number;
  pos: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  },
  text?: string;
  color?: {
    bg: string;
    border: string;
  };
  hidden?: boolean;
  dbRes?: {
    article: {
      _id: number;
      author: string;
      confidenceScore: number;
      group: string;
      price: number;
      title: string;
    };
    query: string;
  },
  show: boolean;
}>;
const selectResult = (item) => {
  selectedResult.value = {
    ...item,
    show: true
  };
};

const currentScroll = {
  x: 0,
  y: 0
};
const startingScroll = {
  x: 0,
  y: 0
};
const res = ref({
  w: 0,
  h: 0
});
const lineWidth = computed({
  get() {
    return _lineW.value;
  },
  set(val) {
    _lineW.value = parseInt(val == NaN ? '0' : val.toString());
  }
});
const lineHeight = computed({
  get() {
    return _lineH.value;
  },
  set(val) {
    _lineH.value = parseInt(val.toString() == '' ? '0' : val.toString());
  }
});
const imageOverflows = ref({
  x: false,
  y: false
});
let overflowTimeout = 0;
let overflowResetTimeout = 0;

const resetScaling = async () => {
  return new Promise((resolve) => {
    scaling.value = 1;
    clearTimeout(overflowResetTimeout);
    overflowResetTimeout = setTimeout(() => {
      nextTick(() => resolve(true));
    }, 310);
  });
};


const updateImageOverFlow = () => {
  return new Promise((resolve) => {
    const scaleX = workspace.value?.scrollWidth / workspace.value?.offsetWidth ?? 1;
    const scaleY = workspace.value?.scrollHeight / workspace.value?.offsetHeight ?? 1;
    let clampedScale = 1;
    const maxScale = Math.max(scaleY, scaleX);
    const antiScale = 1 / maxScale;
    if (scaleX < 1 && scaleY < 1) {
      clampedScale = Math.max(Math.min(antiScale, 1.3), 1);
      imageOverflows.value = {
        x: workspace.value?.scrollWidth > workspace.value?.offsetWidth,
        y: workspace.value?.scrollHeight > workspace.value?.offsetHeight,
      };
    }
    else {

      clampedScale = Math.max(Math.min(antiScale, 1), 0.7);
      imageOverflows.value = {
        x: workspace.value?.scrollWidth > workspace.value?.offsetWidth,
        y: workspace.value?.scrollHeight > workspace.value?.offsetHeight,
      };
    }

    res.value.w *= clampedScale;
    res.value.h *= clampedScale;
    scaling.value = clampedScale;

    clearTimeout(overflowTimeout);
    overflowTimeout = setTimeout(() => {
      nextTick(() => resolve(true));
    }, 310);
  });
};

const bgColors = ['bg-blue-500', 'bg-rose-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-green-500', 'bg-orange-500', 'bg-fuchsia-500'];
const borderColors = ['border-blue-500', 'border-rose-500', 'border-cyan-500', 'border-yellow-500', 'border-green-500', 'border-orange-500', 'border-fuchsia-500'];
let previousIdx = -1;
const getRandColor = () => {
  let index = Math.floor(Math.random() * bgColors.length);
  if (index == previousIdx) {
    index = (index + 1) % bgColors.length;
  }
  previousIdx = index;
  return {
    bg: bgColors[index],
    border: borderColors[index]
  };
};

const zoneObj = ref({}) as Ref<{
  [key: string | number]: {
    index: number;
    pos: {
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
    },
    text?: string;
    color?: {
      bg: string;
      border: string;
    };
    hidden?: boolean;
    dbRes?: {
      article: {
        _id: number;
        author: string;
        confidenceScore: number;
        group: string;
        price: number;
        title: string;
      };
      query: string;
    };
  };
}>;

let selectionObj = ref({
  pos: {
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
  },
  color: getRandColor()
}) as Ref<{
  hidden: boolean;
  pos: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  },
  realCoords: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  },
  color?: {
    bg: string;
    border: string;
  };
}>;

const pointer = new PointerUtils();

watch(zoneDetectionAuto, async (newVal) => {
  if (newVal) {
    console.log('unhooked mouse');
    pointer.destroy();
  }
  else {
    console.log('hooked mouse');
    await hookManualZones();
  }

  if (base64Image.value != '') {
    setTimeout(() => {
      if (!selectionObj.value.pos) {
        createElement(0, 0);
      }
      setPositionReal(0, 0, res.value.w, res.value.h);
    }, 310);
  }
});

const deleteAllZones = async () => {
  return new Promise((resolve) => {
    for (const idx in zoneObj.value) {
      zoneObj.value[idx].hidden = true;
    }
    setTimeout(() => {
      for (const idx in zoneObj.value) {
        delete zoneObj.value[idx];
        boxCount.value = 0;
      }
      resolve(true);
    }, 300);
  });
};

const hideAllZones = () => {
  for (const idx in zoneObj.value) {
    zoneObj.value[idx].hidden = true;
  }
};

const showAllZones = () => {
  for (const idx in zoneObj.value) {
    zoneObj.value[idx].hidden = false;
  }
};

const deleteSelection = async () => {
  hideSelection();
};

const hideSelection = () => {
  selectionObj.value.hidden = true;
};

const showSelection = () => {
  selectionObj.value.hidden = false;
};

const hookManualZones = async () => {
  await pointer.hook();

  let index = -1;
  pointer.downEl = workspace.value;
  pointer.downPrevent = true;
  const startingCoords = {
    x: 0,
    y: 0
  };
  const endCoords = {
    x: 0,
    y: 0
  };

  pointer.longPressTime = 100;
  pointer.downPrevent = false;
  let pressTimeout = null as number;

  pointer.downCb = (e) => {
    if (zoneDetectionAuto.value) return;
    if (pressTimeout) clearTimeout(pressTimeout);
    pressTimeout = null;
    pointer.upPrevent = true;
    pointer.movePrevent = true;
    startingCoords.x = e.x;
    startingCoords.y = e.y;
    startingScroll.x = workspace.value.scrollLeft;
    startingScroll.y = workspace.value.scrollTop;
    pressTimeout = setTimeout(() => {

      hideAllZones();
      createElement(startingCoords.x, startingCoords.y);
      setPosition(startingCoords.x - 10, startingCoords.y - 10, startingCoords.x + 10, startingCoords.y + 10);
      showSelection();
      dragging.value = true;
    }, pointer.longPressTime);
  };

  pointer.movePrevent = false;
  pointer.moveEl = workspace.value;
  pointer.moveCb = (e) => {
    if (zoneDetectionAuto.value) return;
    if (dragging.value) {
      setPosition(startingCoords.x, startingCoords.y, e.clientX, e.clientY);
      const { x, y } = workspace.value.getBoundingClientRect();
      if (workspace.value.clientWidth - e.clientX + x < 20) {
        workspace.value.scrollLeft += 5;
      }

      if (workspace.value.clientHeight - e.clientY + y < 20) {
        workspace.value.scrollTop += 5;
      }
    }
  };

  pointer.upPrevent = false;
  pointer.upEl = workspace.value;
  pointer.upCb = () => {
    if (zoneDetectionAuto.value) return;
    if (pressTimeout) clearTimeout(pressTimeout);
    showAllZones();
    pointer.upPrevent = false;
    pointer.movePrevent = false;
    dragging.value = false;
  };
};

const createText = (pos: { minX: 0, minY: 0, maxX: 0, maxY: 0; }, textContent = '') => {
  const color = getRandColor();
  zoneObj.value[boxCount.value] = {
    index: boxCount.value,
    pos: {
      minX: pos.minX,
      maxX: pos.maxX,
      minY: pos.minY,
      maxY: pos.maxY
    },
    text: textContent,
    color
  };
  return boxCount.value++;
};

const area = (x1, y1, x2, y2) => {
  return Math.abs((y2 - y1) * (x2 - x1));
};

const createElement = (x = 0, y = 0) => {
  deleteSelection();
  showSelection();
  const imageBoundaries = image.value.getBoundingClientRect();
  const parentBoudaries = selectionContainer.value.parentElement.getBoundingClientRect();
  x = x - parentBoudaries.x + startingScroll.x;
  y = y - parentBoudaries.y + startingScroll.y;
  selectionObj.value = {
    hidden: false,
    color: getRandColor(),
    pos: {
      minX: x,
      maxX: x,
      minY: y,
      maxY: y
    },
    realCoords: {
      minX: (x - parentBoudaries.x - imageBoundaries.left) * (1 / scaling.value),
      maxX: (x - parentBoudaries.x - imageBoundaries.left) * (1 / scaling.value),
      minY: (y - parentBoudaries.y - imageBoundaries.top) * (1 / scaling.value),
      maxY: (y - parentBoudaries.y - imageBoundaries.top) * (1 / scaling.value)
    }
  };
  return boxCount.value;
};

const setPosition = (x1 = 0, y1 = 0, x2 = 0, y2 = 0) => {
  const imageBoundaries = image.value.getBoundingClientRect();
  const parentBoudaries = selectionContainer.value.parentElement.getBoundingClientRect();
  x1 = x1 - parentBoudaries.x + startingScroll.x;
  y1 = y1 - parentBoudaries.y + startingScroll.y;
  x2 = x2 - parentBoudaries.x + currentScroll.x;
  y2 = y2 - parentBoudaries.y + currentScroll.y;
  const minX = Math.max(Math.min(x1, x2), imageBoundaries.left - parentBoudaries.x);
  const maxX = Math.min(Math.max(x1, x2), imageBoundaries.right - parentBoudaries.x + currentScroll.x);
  const minY = Math.max(Math.min(y1, y2), imageBoundaries.top - parentBoudaries.y);
  const maxY = Math.min(Math.max(y1, y2), imageBoundaries.bottom - parentBoudaries.y + currentScroll.y);
  selectionObj.value.pos = {
    minX,
    maxX,
    minY,
    maxY,
  };
  selectionObj.value.realCoords = {
    minX: (minX - imageBoundaries.left + parentBoudaries.x - currentScroll.x) * (1 / scaling.value),
    maxX: (maxX - imageBoundaries.left + parentBoudaries.x - currentScroll.x) * (1 / scaling.value),
    minY: (minY - imageBoundaries.top + parentBoudaries.y - currentScroll.y) * (1 / scaling.value),
    maxY: (maxY - imageBoundaries.top + parentBoudaries.y - currentScroll.y) * (1 / scaling.value)
  };
};

const setPositionReal = (x1 = 0, y1 = 0, x2 = 0, y2 = 0) => {
  const imageBoundaries = image.value.getBoundingClientRect();
  const parentBoudaries = selectionContainer.value.parentElement.getBoundingClientRect();

  const minX = Math.max(Math.min(x1, x2), 0);
  const maxX = Math.min(Math.max(x1, x2), imageBoundaries.width);
  const minY = Math.max(Math.min(y1, y2), 0);
  const maxY = Math.min(Math.max(y1, y2), imageBoundaries.height);

  selectionObj.value.pos = {
    minX: (minX + imageBoundaries.left - parentBoudaries.x + startingScroll.x),
    maxX: (maxX + imageBoundaries.left - parentBoudaries.x + currentScroll.x),
    minY: (minY + imageBoundaries.top - parentBoudaries.y + startingScroll.y),
    maxY: (maxY + imageBoundaries.top - parentBoudaries.y + currentScroll.y)
  };

  selectionObj.value.realCoords = {
    minX: (selectionObj.value.pos.minX - imageBoundaries.left + parentBoudaries.x - currentScroll.x) * (1 / scaling.value),
    maxX: (selectionObj.value.pos.maxX - imageBoundaries.left + parentBoudaries.x - currentScroll.x) * (1 / scaling.value),
    minY: (selectionObj.value.pos.minY - imageBoundaries.top + parentBoudaries.y - currentScroll.y) * (1 / scaling.value),
    maxY: (selectionObj.value.pos.maxY - imageBoundaries.top + parentBoudaries.y - currentScroll.y) * (1 / scaling.value)
  };
};

const encodeImageFileAsURL = async () => {
  if (fileUpload.value.files?.[0]) {
    showLoading('loading image');
    rescaling.value = true;
    await deleteAllZones();
    rawFile.value = fileUpload.value.files?.[0];
    var reader = new FileReader();
    reader.onloadend = () => {
      base64Image.value = reader.result as string;
      const imageLoader = new Image();
      imageLoader.onload = async () => {
        res.value = {
          w: imageLoader.naturalWidth,
          h: imageLoader.naturalHeight
        };
        await updateImageOverFlow();
        setTimeout(() => {
          if (!selectionObj.value.pos) {
            createElement(0, 0);
          }
          setPositionReal(0, 0, res.value.w, res.value.h);
          rescaling.value = false;
          showLoading('image loaded');
        }, 310);
        reconnectSocket();
      };
      imageLoader.src = base64Image.value;
    };
    reader.readAsDataURL(rawFile.value as Blob);
  }
};

const emitMsg = async (msg, data, loadingText: string) => {
  if (base64Image.value != '') {
    if (loadingText != '') showLoading(loadingText, 2000);
    if (!selectionObj.value?.realCoords) {
      setPositionReal(0, 0, res.value.w, res.value.h);
    }
    if (selectionObj.value.realCoords.maxY - selectionObj.value.realCoords.minY < 15 || selectionObj.value.realCoords.maxX - selectionObj.value.realCoords.minX < 20) {
      setPositionReal(0, 0, res.value.w, res.value.h);
    };
    socket.once('handshake', (response) => {
      if (!response.exists) {
        response.image = base64Image.value;
      }
      socket.emit(msg, data);
    });
    socket.emit('handshake');
  }
};

const sendProcessRequest = async () => {
  await deleteAllZones();
  emitMsg('process', {
    image: base64Image.value,
    options: {
      cont_smooth: [lineWidth.value || 1, lineHeight.value || 1],
      zone: selectionObj.value.realCoords
    }
  }, 'processing image');
};

const sendZoneRequest = async () => {
  await deleteAllZones();
  emitMsg('get_zones', {
    image: base64Image.value,
    options: {
      cont_smooth: [lineWidth.value || 1, lineHeight.value || 1],
      zone: selectionObj.value.realCoords
    }
  }, 'getting zones');
};


let loadingTimeout = 0;
const showLoading = (msg: string, timeout = 2000) => {
  loading.value = {
    text: msg,
    show: true
  };
  clearTimeout(loadingTimeout);
  loadingTimeout = setTimeout(() => {
    loading.value = {
      text: msg,
      show: false
    };
  }, timeout);
}


</script>

<style scoped>
</style>
