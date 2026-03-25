<script setup lang="ts">
import { OhVueIcon } from 'oh-vue-icons'
import GvButton from '@/components/govuk/Button.vue'
import { useScreenshot } from '@/components/visualization/useScreenshot'

const props = defineProps<{
  zoomIn: () => void
  zoomOut: () => void
  fitView: () => void
  vueFlowEl?: HTMLElement | null
  screenshotFilename?: string
}>()

const { capture } = useScreenshot()

function doScreenshot() {
  if (!props.vueFlowEl) {
    console.warn('VueFlow element not found')
    return
  }

  capture(props.vueFlowEl, props.screenshotFilename)
}
</script>

<template>
  <div class="w-full flex bg-blue-50 border-2 border-blue-500 p-2 text-blue-500 justify-between items-center">
    <div class="flex gap-2 items-center">
      <slot />
    </div>
    <div class="flex gap-2 items-center">
      <button class="cursor-pointer" @click="zoomIn()">
        <OhVueIcon name="md-zoomin" scale="2" />
      </button>
      <button class="cursor-pointer" @click="zoomOut()">
        <OhVueIcon name="md-zoomout" scale="2" />
      </button>
      <button class="cursor-pointer" @click="fitView()">
        <OhVueIcon name="md-zoomoutmap" scale="2" />
      </button>
      <GvButton @click="doScreenshot" class="mb-0!">Export as Image</GvButton>
    </div>
  </div>
</template>

<style scoped></style>
