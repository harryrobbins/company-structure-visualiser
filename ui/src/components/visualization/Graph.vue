<script setup lang="ts">
import { nextTick, watch, ref } from 'vue'
import { StepEdge, useVueFlow, type BaseEdgeProps, BezierEdge, StraightEdge } from '@vue-flow/core'
import { VueFlow, Panel } from '@vue-flow/core'
import Controls from '@/components/visualization/Controls.vue'
import { useLayout } from '@/components/visualization/useLayout.ts'
import EntityNode from '@/components/visualization/EntityNode.vue'
import type { EntityGraph, GroupStructure } from '@/db/models.ts'

import type { CompanyMatches } from '@/api/models.ts'

import GvSelect from '@/components/govuk/Select.vue'
import GvButton from '@/components/govuk/Button.vue'
import GvCheckboxes from '@/components/govuk/Checkboxes.vue'
import GvCheckbox from '@/components/govuk/Checkbox.vue'
import ShowHideLink from '@/components/govuk/ShowHideLink.vue'

const { layout } = useLayout()
const { fitView } = useVueFlow()

const edgeTypeOptions = [
  { value: 'step', label: 'Step' },
  { value: 'straight', label: 'Straight' },
  { value: 'bezier', label: 'Curved' },
] as const

type EdgeType = (typeof edgeTypeOptions)[number]['value']
const edgeType = ref<EdgeType>('step')
const showCustomControls = ref(false)
const toggleControls = ref<string[]>(['showEdgeLabels'])

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
  await nextTick(fitView)
}

// Watch for edge type changes and regenerate the graph
watch(edgeType, () => {
  if (props.structure) {
    graph.value = entityGraph(props.structure, props.matches || {})
    layoutGraph()
  }
})

// Watch for edge label visibility changes and regenerate the graph
watch(
  toggleControls,
  (newValue) => {
    console.log('Toggling edge labels, regenerating graph...', newValue)
    if (props.structure) {
      graph.value = entityGraph(props.structure, props.matches || {})
      layoutGraph()
    }
  },
  { deep: true },
)

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
      label: toggleControls.value.includes('showEdgeLabels') ? `${relationship.percentageOwnership.toFixed(0)}%` : '',
      markerStart: 'circle',
      markerEnd: 'circle',
      data: { relationship },
      type: edgeType.value,
    })),
  }
}

const DEFAULT_EDGE_PROPS: Partial<BaseEdgeProps> = {
  labelBgPadding: [10, 8],
  labelBgStyle: { fill: 'var(--color-white)', stroke: 'var(--color-black)', strokeWidth: 2 },
  labelStyle: { fill: 'var(--color-black)', fontSize: '16px' },
  interactionWidth: 0,
}
</script>

<template>
  <ShowHideLink name="advanced controls" v-model="showCustomControls" class="mb-4" />
  <div
    class="my-6 flex flex-col md:flex-row flex-wrap md:items-center gap-4 border-l-4 border-gray-500 pl-4"
    v-if="showCustomControls"
  >
    <div class="flex flex-row items-center gap-2">
      <label for="edge-type-select" class="govuk-label whitespace-nowrap mb-0!">Edge type:</label>
      <GvSelect v-model="edgeType" id="edge-type-select" form-group-class="mb-0!">
        <option v-for="option in edgeTypeOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </GvSelect>
    </div>

    <GvCheckboxes v-model="toggleControls" form-group-class="mb-0!" size="small">
      <GvCheckbox
        value="showEdgeLabels"
        id="show-edge-labels"
        label="Show edge labels"
        label-class="whitespace-nowrap"
      />
    </GvCheckboxes>

    <GvButton @click="layoutGraph" variant="secondary" class="mb-0!">Reset layout</GvButton>
  </div>

  <section class="h-200">
    <VueFlow
      v-if="graph"
      :nodes="graph.nodes"
      :edges="graph.edges"
      :nodes-connectable="false"
      fit-view-on-init
      @nodes-initialized="layoutGraph"
      class="border-2 border-blue-500"
    >
      <template #default>
        <Panel position="top-left" class="w-full m-0! z-1000 border-b-2 border-blue-500">
          <Controls />
        </Panel>
      </template>

      <template #edge-step="props">
        <StepEdge v-bind="{ ...props, ...DEFAULT_EDGE_PROPS }" />
      </template>

      <template #edge-bezier="props">
        <BezierEdge v-bind="{ ...props, ...DEFAULT_EDGE_PROPS }" />
      </template>

      <template #edge-straight="props">
        <StraightEdge v-bind="{ ...props, ...DEFAULT_EDGE_PROPS }" />
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

.vue-flow__handle {
  background-color: var(--color-black);
  width: 8px;
  height: 8px;
}
</style>
