<script setup lang="ts">
import { nextTick, watch, ref } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { VueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { useLayout } from '@/composables/useLayout.ts'
import EntityNode from '@/components/EntityNode.vue'
import { entityGraph } from '@/db/graph.ts'
import type { EntityGraph, GroupStructure } from '@/db/models.ts'

import type { CompanyMatches } from '@/api/models.ts'

const { layout } = useLayout()
const { fitView } = useVueFlow()

const props = defineProps<{
  structure: GroupStructure
  matches?: CompanyMatches
}>()

const graph = ref<EntityGraph>()
watch(props, ({ structure, matches = {} }) => (graph.value = entityGraph(structure, matches)), {
  immediate: true,
  deep: true,
})

async function layoutGraph() {
  if (graph.value) {
    graph.value.nodes = layout(graph.value)
  }
  await nextTick(() => fitView())
}
</script>

<template>
  <section class="h-200">
    <VueFlow v-if="graph" :nodes="graph.nodes" :edges="graph.edges" fit-view-on-init @nodes-initialized="layoutGraph">
      <Controls position="top-right" />

      <template #node-company="props">
        <EntityNode :id="props.id" :data="props.data" />
      </template>
    </VueFlow>
  </section>
</template>

<style>
.vue-flow__edge-textbg {
  fill: white;
  stroke: #000;
  stroke-width: 1px;
}

.vue-flow__edge-text {
  fill: #000;
}
</style>
