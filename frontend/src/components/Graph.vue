<script setup lang="ts">
import { nextTick } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { VueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls';
import { useAppStore } from '@/stores/app.ts'
import { useLayout } from '@/composables/useLayout.ts'

const appStore = useAppStore()
const { layout } = useLayout()
const { fitView } = useVueFlow()

async function layoutGraph() {
  if (appStore.graph.type == 'visualize') {
    appStore.graph.graph.nodes = layout(appStore.graph.graph)
    return nextTick(() => fitView())
  }
}
</script>

<template>
  <section class="h-200" v-if="appStore.graph.type == 'visualize'">
    <VueFlow
      v-if="appStore.graph.graph"
      :nodes="appStore.graph.graph?.nodes"
      :edges="appStore.graph.graph?.edges"
      fit-view-on-init
      @nodes-initialized="layoutGraph"
    >
      <Controls position="top-right" />
    </VueFlow>
  </section>
</template>

<style scoped></style>

