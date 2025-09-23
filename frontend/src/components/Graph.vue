<script setup lang="ts">
import { nextTick } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { VueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls';
import { useAppStore } from '@/stores/app.ts'
import { useLayout } from '@/composables/useLayout.ts'
import EntityNode from "@/components/EntityNode.vue";

const appStore = useAppStore()
const { layout } = useLayout()
const { fitView, vueFlowRef } = useVueFlow()

async function layoutGraph() {
  if (appStore.state.type == 'visualize') {
    appStore.state.graph.nodes = layout(appStore.state.graph)
    return nextTick(() => fitView())
  }
}
</script>

<template>
  <section class="h-200" v-if="appStore.state.type == 'visualize'">
    <VueFlow
      v-if="appStore.state.graph"
      :nodes="appStore.state.graph?.nodes"
      :edges="appStore.state.graph?.edges"
      fit-view-on-init
      @nodes-initialized="layoutGraph"
    >
      <Controls position="top-right" />

      <template #node-company="props">
        <EntityNode :id="props.id" :data="props.data" />
      </template>
    </VueFlow>
  </section>
</template>

<style scoped></style>

