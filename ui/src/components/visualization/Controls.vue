<script setup lang="ts">
import { useVueFlow } from '@vue-flow/core'
import { OhVueIcon } from 'oh-vue-icons'

const { zoomIn, zoomOut, fitView } = useVueFlow()
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
    </div>
  </div>
</template>

<style scoped></style>
