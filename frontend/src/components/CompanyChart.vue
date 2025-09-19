<script setup lang="ts">
import { nextTick } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { VueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls';
import { useGraphStore } from '@/stores/graph.ts'
import { useLayout } from '@/composables/useLayout.ts'

const companyStore = useGraphStore()
const { layout } = useLayout()
const { fitView } = useVueFlow()

async function layoutGraph() {
  if (companyStore.graph) {
    companyStore.graph.nodes = layout(companyStore.graph.nodes, companyStore.graph.edges)
    return nextTick(() => {
      fitView()
    })
  }
}
</script>

<template>
  <section class="h-200">
    <VueFlow
      v-if="companyStore.graph"
      :nodes="companyStore.graph?.nodes"
      :edges="companyStore.graph?.edges"
      fit-view-on-init
      @nodes-initialized="layoutGraph"
    >
      <Controls position="top-right" />
    </VueFlow>
  </section>
</template>

<style scoped></style>

