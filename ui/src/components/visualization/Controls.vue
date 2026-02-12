<script setup lang="ts">
import { useVueFlow } from '@vue-flow/core'
import { OhVueIcon } from 'oh-vue-icons'
import GvButton from '@/components/govuk/Button.vue'
import { useScreenshot } from '@/components/visualization/useScreenshot'

const { zoomIn, zoomOut, fitView, vueFlowRef } = useVueFlow()
const { capture } = useScreenshot()

function doScreenshot() {
  if (!vueFlowRef.value) {
    console.warn('VueFlow element not found')
    return
  }

  capture(vueFlowRef.value)
}
</script>

<template>
  <div class="w-full flex bg-blue-50 p-2 text-blue-500 justify-end">
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
