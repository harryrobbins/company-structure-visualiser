<script setup lang="ts">
import { nextTick, watch, ref } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { VueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { useLayout } from '@/composables/useLayout.ts'
import EntityNode from '@/components/visualization/EntityNode.vue'
import type { EntityGraph, GroupStructure } from '@/db/models.ts'

import type { CompanyMatches } from '@/api/models.ts'

import GvSelect from '@/components/govuk/Select.vue'
import GvButton from '@/components/govuk/Button.vue'
import ShowHideLink from '@/components/govuk/ShowHideLink.vue'

const { layout } = useLayout()
const { fitView } = useVueFlow()

const edgeTypeOptions = [
  { value: 'straight', label: 'Straight' },
  { value: 'simplebezier', label: 'Bezier' },
  { value: 'step', label: 'Step' },
  { value: 'smoothstep', label: 'Smooth Step' },
] as const

type EdgeType = (typeof edgeTypeOptions)[number]['value']
const edgeType = ref<EdgeType>('step')

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

// Watch for edge type changes and regenerate the graph
watch(edgeType, () => {
  if (props.structure) {
    graph.value = entityGraph(props.structure, props.matches || {})
    layoutGraph()
  }
})

function entityGraph({ entities, relationships }: GroupStructure, matches: CompanyMatches = {}): EntityGraph {
  return {
    nodes: entities
      .map((entity) => {
        const result = matches[entity.name]?.recommended_match
        return result ? { ...entity, name: result.CompanyName } : entity
      })
      .map((entity) => ({
        id: entity.id,
        data: { label: entity.name, entity },
        position: { x: 0, y: 0 },
        type: 'company',
      })),
    edges: relationships.map((relationship) => ({
      id: `${relationship.parent}->${relationship.child}`,
      source: relationship.parent,
      target: relationship.child,
      label: `${relationship.percentageOwnership.toFixed(0)}%`,
      markerStart: 'circle',
      markerEnd: 'circle',
      data: { relationship },
      type: edgeType.value,
    })),
  }
}

const showCustomControls = ref(false)
</script>

<template>
  <ShowHideLink name="custom controls" v-model="showCustomControls" class="mb-4" />
  <div class="my-4" v-if="showCustomControls">
    <GvSelect v-model="edgeType" id="edge-type-select" label="Edge type">
      <option v-for="option in edgeTypeOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </GvSelect>

    <GvButton @click="layoutGraph" variant="secondary" class="mt-2">Reset</GvButton>
  </div>

  <section class="h-200">
    <VueFlow
      v-if="graph"
      :nodes="graph.nodes"
      :edges="graph.edges"
      fit-view-on-init
      @nodes-initialized="layoutGraph"
      class="border-2 border-blue-500"
    >
      <template #default>
        <Controls position="top-right" />
      </template>

      <template #node-company="props">
        <EntityNode :id="props.id" :data="props.data" />
      </template>
    </VueFlow>
  </section>
</template>

<style>
.vue-flow__edge-path {
  stroke: var(--color-black);
  stroke-width: 2px;
}
.vue-flow__edge-textbg {
  fill: white;
  stroke: #000;
  stroke-width: 1px;
}

.vue-flow__edge-text {
  fill: #000;
}
</style>
