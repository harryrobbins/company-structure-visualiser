<script setup lang="ts">
import { nextTick, watch, ref, computed, provide } from 'vue'
import { StepEdge, useVueFlow, type BaseEdgeProps, BezierEdge, StraightEdge } from '@vue-flow/core'
import { VueFlow, Panel } from '@vue-flow/core'
import Controls from '@/components/visualization/Controls.vue'
import { useLayout } from '@/components/visualization/useLayout.ts'
import EntityNode from '@/components/visualization/EntityNode.vue'
import type { EntityGraph, GroupStructure, SupplementalConnection } from '@/db/models.ts'

import type { CompanyMatches } from '@/api/models.ts'

import GvSelect from '@/components/govuk/Select.vue'
import GvButton from '@/components/govuk/Button.vue'
import GvCheckboxes from '@/components/govuk/Checkboxes.vue'
import GvCheckbox from '@/components/govuk/Checkbox.vue'
import ShowHideLink from '@/components/govuk/ShowHideLink.vue'
import ColorSelect from '@/components/visualization/ColorSelect.vue'
import HighlightRulesModal from '@/components/visualization/HighlightRulesModal.vue'
import type { HighlightRule } from '@/components/visualization/HighlightRulesModal.vue'
import SearchModal from '@/components/visualization/SearchModal.vue'

const { layout } = useLayout()
const { fitView, onConnect, nodesConnectable } = useVueFlow()

nodesConnectable.value = true

const emit = defineEmits<{
  'add-connection': [connection: SupplementalConnection]
  'remove-connection': [connection: SupplementalConnection]
  'remove-all-connections': []
}>()

const pendingConnection = ref<{ source: string; target: string } | null>(null)
const pendingLabel = ref('')
const pendingColor = ref('#ef4444')

// --- Node search / highlight ---
const searchQuery = ref('')
const highlightColor = ref('#ef4444')
const searchToggles = ref<string[]>(['highlightParents'])

const matchedNodeIds = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q || !graph.value) return new Set<string>()
  return new Set(
    graph.value.nodes
      .filter((n) => {
        const label = n.data?.label?.toLowerCase() ?? ''
        const name = n.data?.entity.name?.toLowerCase() ?? ''
        const tin = n.data?.entity.tin?.toLowerCase() ?? ''
        return label.includes(q) || name.includes(q) || tin.includes(q)
      })
      .map((n) => n.id),
  )
})

const highlightedNodeIds = computed(() => {
  const matched = matchedNodeIds.value
  if (!searchToggles.value.includes('highlightParents') || !graph.value || matched.size === 0) return matched
  const all = new Set(matched)
  const queue = [...matched]
  while (queue.length) {
    const current = queue.shift()!
    for (const edge of graph.value.edges) {
      if (edge.target === current && !all.has(edge.source)) {
        all.add(edge.source)
        queue.push(edge.source)
      }
    }
  }
  return all
})

const highlightedEdgeIds = computed(() => {
  if (!graph.value || highlightedNodeIds.value.size === 0) return new Set<string>()
  return new Set(
    graph.value.edges
      .filter((e) => highlightedNodeIds.value.has(e.source) && highlightedNodeIds.value.has(e.target))
      .map((e) => e.id),
  )
})

// --- Rule-based highlight ---
const highlightRules = ref<HighlightRule[]>([])

const ruleHighlightedNodeColorMap = computed(() => {
  const map = new Map<string, string>()
  if (!graph.value || highlightRules.value.length === 0) return map
  for (const node of graph.value.nodes) {
    const entity = node.data?.entity
    if (!entity) continue
    for (const rule of highlightRules.value) {
      const entityValue =
        rule.field === 'type'
          ? entity.type
          : rule.field === 'taxJurisdictionOfIncorporation'
            ? entity.taxJurisdictionOfIncorporation
            : entity.taxJurisdiction
      if (entityValue === rule.value) {
        // First matching rule wins the color for this node
        if (!map.has(node.id)) {
          map.set(node.id, rule.color)
        }
      }
    }
  }
  return map
})

// --- Merged highlight color map (node id → color) ---
const nodeHighlightColorMap = computed(() => {
  const map = new Map<string, string>()
  // Search-based highlights
  for (const id of highlightedNodeIds.value) {
    map.set(id, highlightColor.value)
  }
  // Rule-based highlights (rule color takes precedence if not already search-highlighted)
  for (const [id, color] of ruleHighlightedNodeColorMap.value) {
    if (!map.has(id)) {
      map.set(id, color)
    }
  }
  return map
})

// --- Merged edge highlights ---
const allHighlightedEdgeColors = computed(() => {
  const map = new Map<string, string>()
  if (!graph.value) return map
  // Search-based edge highlights
  for (const edgeId of highlightedEdgeIds.value) {
    map.set(edgeId, highlightColor.value)
  }
  return map
})

// Available jurisdictions for the rules modal
const availableJurisdictions = computed(() => {
  if (!graph.value) return []
  const jurisdictions = new Set<string>()
  for (const node of graph.value.nodes) {
    const entity = node.data?.entity
    if (!entity) continue
    if (entity.taxJurisdiction) jurisdictions.add(entity.taxJurisdiction)
    if (entity.taxJurisdictionOfIncorporation) jurisdictions.add(entity.taxJurisdictionOfIncorporation)
  }
  return [...jurisdictions].sort()
})

provide(
  'nodeHighlightColorMap',
  computed(() => nodeHighlightColorMap.value),
)

onConnect(({ source, target }: { source: string; target: string }) => {
  // Ignore if duplicate supplemental connection
  if (graph.value?.edges.some((e) => e.source === source && e.target === target && e.type === 'supplemental') ?? false)
    return
  pendingConnection.value = { source, target }
  pendingLabel.value = ''
  pendingColor.value = '#ef4444'
})

function getNodeLabel(id: string): string {
  return graph.value?.nodes?.find((n) => n?.id === id)?.data?.label ?? id
}

function confirmConnection() {
  if (!pendingConnection.value || !graph.value) return
  const { source, target } = pendingConnection.value
  const connection: SupplementalConnection = {
    parent: source,
    child: target,
    label: pendingLabel.value,
    color: pendingColor.value,
  }
  graph.value.edges = [
    ...graph.value.edges,
    {
      id: `supplemental:${source}->${target}`,
      source,
      target,
      label: connection.label,
      data: { connection },
      type: 'supplemental',
      style: { stroke: connection.color },
    },
  ]
  emit('add-connection', connection)
  pendingConnection.value = null
}

function cancelConnection() {
  pendingConnection.value = null
}

// --- Delete supplemental edge state ---
const edgeToDelete = ref<{ source: string; target: string; connection: SupplementalConnection } | null>(null)

function onEdgeClick({ edge }: { edge: any }) {
  if (edge.type !== 'supplemental' || !edge.data?.connection) return
  edgeToDelete.value = { source: edge.source, target: edge.target, connection: edge.data.connection }
}

function confirmDeleteEdge() {
  if (!edgeToDelete.value || !graph.value) return
  const { source, target, connection } = edgeToDelete.value
  graph.value.edges = graph.value.edges.filter(
    (e) => !(e.source === source && e.target === target && e.type === 'supplemental'),
  )
  emit('remove-connection', connection)
  edgeToDelete.value = null
}

function cancelDeleteEdge() {
  edgeToDelete.value = null
}

const supplementalEdges = computed(() => graph.value?.edges.filter((e) => e.type === 'supplemental') ?? [])

function removeAllConnections() {
  if (!graph.value) return
  graph.value.edges = graph.value.edges.filter((e) => e.type !== 'supplemental')
  emit('remove-all-connections')
}

const edgeTypeOptions = [
  { value: 'step', label: 'Step' },
  { value: 'straight', label: 'Straight' },
  { value: 'bezier', label: 'Curved' },
] as const

const spacingOptions = [
  { value: 0, label: 'Default' },
  { value: 15, label: 'Comfortable' },
  { value: 30, label: 'Spacious' },
  { value: 50, label: 'Generous' },
] as const

type EdgeType = (typeof edgeTypeOptions)[number]['value']
type SpacingValue = (typeof spacingOptions)[number]['value']
const edgeType = ref<EdgeType>('step')
const extraHSpacing = ref<SpacingValue>(0)
const extraVSpacing = ref<SpacingValue>(0)
const showCustomControls = ref(false)
const toggleControls = ref<string[]>([
  'showEdgeLabels',
  'hide100PercentLabels',
  'showCountryFlags',
  'showUnconnectedHandles',
])

provide(
  'showCountryFlags',
  computed(() => toggleControls.value.includes('showCountryFlags')),
)

provide(
  'showUnconnectedHandles',
  computed(() => toggleControls.value.includes('showUnconnectedHandles')),
)

const extraNodePadding = ref<SpacingValue>(0)
provide(
  'extraNodePadding',
  computed(() => extraNodePadding.value),
)

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
    graph.value.nodes = layout(graph.value, {
      direction: 'TB',
      extraHPadding: extraHSpacing.value,
      extraVPadding: extraVSpacing.value,
      extraNodePadding: extraNodePadding.value,
    })
  }
  await nextTick(fitView)
}

watch([extraHSpacing, extraVSpacing, extraNodePadding], layoutGraph)

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

function entityGraph(
  { entities, relationships, supplementalConnections = [] }: GroupStructure,
  matches: CompanyMatches = {},
): EntityGraph {
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
        connectable: true,
      })),
    edges: [
      ...relationships.map((relationship) => ({
        id: `${relationship.parent}->${relationship.child}`,
        source: relationship.parent,
        target: relationship.child,
        label: toggleControls.value.includes('showEdgeLabels')
          ? toggleControls.value.includes('hide100PercentLabels') && relationship.percentageOwnership >= 100
            ? ''
            : `${relationship.percentageOwnership.toFixed(0)}%`
          : '',
        markerStart: 'circle',
        markerEnd: 'circle',
        data: { relationship },
        type: edgeType.value,
      })),
      ...supplementalConnections.map((connection) => ({
        id: `supplemental:${connection.parent}->${connection.child}`,
        source: connection.parent,
        target: connection.child,
        label: connection.label,
        data: { connection },
        type: 'supplemental',
        style: { stroke: connection.color },
      })),
    ],
  }
}

const DEFAULT_EDGE_PROPS: Partial<BaseEdgeProps> = {
  labelBgPadding: [10, 8],
  labelBgStyle: { fill: 'var(--color-white)', stroke: 'var(--color-black)', strokeWidth: 2 },
  labelStyle: { fill: 'var(--color-black)', fontSize: '16px' },
  interactionWidth: 0,
}

function edgeHighlightProps(edgeId: string): Record<string, unknown> {
  const color = allHighlightedEdgeColors.value.get(edgeId)
  if (!color) return {}
  return {
    style: { stroke: color, strokeWidth: 4 },
    labelStyle: { fill: color, fontSize: '16px' },
    labelBgStyle: { fill: 'var(--color-white)', stroke: color, strokeWidth: 3 },
  }
}
</script>

<template>
  <ShowHideLink name="advanced controls" v-model="showCustomControls" class="mb-4" />
  <div
    class="my-6 flex flex-col md:flex-row flex-wrap md:items-center gap-4 border-l-4 border-gray-500 pl-4"
    v-if="showCustomControls"
  >
    <GvSelect v-model="edgeType" id="edge-type-select" form-group-class="mb-0!" label="Edge type">
      <option v-for="option in edgeTypeOptions" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </GvSelect>

    <GvCheckboxes v-model="toggleControls" form-group-class="mb-0!" size="small">
      <GvCheckbox
        value="showEdgeLabels"
        id="show-edge-labels"
        label="Show edge labels"
        label-class="whitespace-nowrap"
      />
      <GvCheckbox
        value="hide100PercentLabels"
        id="hide-100-percent-labels"
        label="Hide 100% ownership labels"
        label-class="whitespace-nowrap"
      />
      <GvCheckbox
        value="showCountryFlags"
        id="show-country-flags"
        label="Show country flags"
        label-class="whitespace-nowrap"
      />
      <GvCheckbox
        value="showUnconnectedHandles"
        id="show-unconnected-handles"
        label="Show unconnected handles"
        label-class="whitespace-nowrap"
      />
    </GvCheckboxes>

    <div class="flex flex-col gap-1">
      <span class="govuk-label font-bold! mb-0!">Node size</span>
      <GvSelect v-model="extraNodePadding" id="node-size-select" form-group-class="mb-0!">
        <option v-for="option in spacingOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </GvSelect>
    </div>

    <div class="flex flex-col gap-1">
      <span class="govuk-label font-bold! mb-0!">Spacing</span>
      <div class="flex flex-row items-center gap-2">
        <label for="h-spacing-select" class="govuk-label whitespace-nowrap mb-0!">Horizontal</label>
        <GvSelect v-model="extraHSpacing" id="h-spacing-select" form-group-class="mb-0!">
          <option v-for="option in spacingOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </GvSelect>
      </div>
      <div class="flex flex-row items-center gap-2">
        <label for="v-spacing-select" class="govuk-label whitespace-nowrap mb-0! grow">Vertical</label>
        <GvSelect v-model="extraVSpacing" id="v-spacing-select" form-group-class="mb-0!">
          <option v-for="option in spacingOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </GvSelect>
      </div>
    </div>

    <GvButton @click="layoutGraph" variant="secondary" class="mb-0!">Reset layout</GvButton>
  </div>

  <!-- Delete supplemental edge confirmation modal -->
  <div
    v-if="edgeToDelete"
    class="fixed inset-0 z-2000 flex items-center justify-center bg-black/40"
    @click.self="cancelDeleteEdge"
  >
    <div class="bg-white p-6 max-w-sm w-full mx-4 border-2 border-black">
      <h2 class="govuk-heading-m">Remove connection</h2>
      <p class="govuk-body">
        Are you sure you want to remove the custom connection
        <strong v-if="edgeToDelete.connection.label">"{{ edgeToDelete.connection.label }}"</strong>
        between
        <strong>{{ getNodeLabel(edgeToDelete.source) }}</strong>
        and
        <strong>{{ getNodeLabel(edgeToDelete.target) }}</strong
        >?
      </p>
      <div class="flex gap-2">
        <GvButton class="bg-red-600! border-red-600!" @click="confirmDeleteEdge">Remove</GvButton>
        <GvButton variant="secondary" @click="cancelDeleteEdge">Cancel</GvButton>
      </div>
    </div>
  </div>

  <div
    v-if="pendingConnection"
    class="fixed inset-0 z-2000 flex items-center justify-center bg-black/40"
    @click.self="cancelConnection"
  >
    <div class="bg-white p-6 max-w-sm w-full mx-4 border-2 border-black">
      <h2 class="govuk-heading-m">Add connection</h2>
      <p class="govuk-body">
        <strong>{{ getNodeLabel(pendingConnection.source) }}</strong>
        &rarr;
        <strong>{{ getNodeLabel(pendingConnection.target) }}</strong>
      </p>
      <div class="govuk-form-group">
        <label class="govuk-label" for="pending-label">Label</label>
        <input
          id="pending-label"
          class="govuk-input"
          type="text"
          v-model="pendingLabel"
          @keyup.enter="confirmConnection"
          @keyup.escape="cancelConnection"
        />
      </div>
      <div class="govuk-form-group">
        <label class="govuk-label" for="pending-color">Color</label>
        <ColorSelect v-model="pendingColor" id="pending-color" />
      </div>
      <div class="flex gap-2">
        <GvButton @click="confirmConnection">Confirm</GvButton>
        <GvButton variant="secondary" @click="cancelConnection">Cancel</GvButton>
      </div>
    </div>
  </div>

  <section class="h-200" data-testid="graph-section">
    <VueFlow
      v-if="graph"
      :nodes="graph.nodes"
      :edges="graph.edges"
      fit-view-on-init
      @nodes-initialized="layoutGraph"
      @edge-click="onEdgeClick"
      class="border-2 border-blue-500"
    >
      <template #default>
        <Panel position="top-left" class="w-full m-0! z-1000 border-b-2 border-blue-500">
          <Controls>
            <GvButton v-if="supplementalEdges.length > 0" variant="warning" class="mb-0!" @click="removeAllConnections">
              Clear connections
            </GvButton>
            <SearchModal
              v-model:search-query="searchQuery"
              v-model:highlight-color="highlightColor"
              v-model:search-toggles="searchToggles"
            />
            <HighlightRulesModal v-model="highlightRules" :available-jurisdictions="availableJurisdictions" />
          </Controls>
        </Panel>
      </template>

      <template #edge-step="props">
        <StepEdge v-bind="{ ...props, ...DEFAULT_EDGE_PROPS, ...edgeHighlightProps(props.id) }" />
      </template>

      <template #edge-bezier="props">
        <BezierEdge v-bind="{ ...props, ...DEFAULT_EDGE_PROPS, ...edgeHighlightProps(props.id) }" />
      </template>

      <template #edge-straight="props">
        <StraightEdge v-bind="{ ...props, ...DEFAULT_EDGE_PROPS, ...edgeHighlightProps(props.id) }" />
      </template>

      <template #edge-supplemental="props">
        <BezierEdge
          v-bind="{
            ...props,
            ...DEFAULT_EDGE_PROPS,
            labelStyle: { fill: props.style?.stroke ?? '#ef4444', fontSize: '16px' },
            labelBgStyle: { fill: 'var(--color-white)', stroke: props.style?.stroke ?? '#ef4444', strokeWidth: 3 },
            style: { stroke: props.style?.stroke ?? '#ef4444', strokeWidth: 3, strokeDasharray: '8,4' },
          }"
        />
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
  cursor: crosshair;
}
</style>
