<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useVisualization, useAddSupplementalConnection, useRemoveSupplementalConnection } from '@/db/useVisualization.ts'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorSummary from '@/components/govuk/ErrorSummary.vue'
import Graph from '@/components/visualization/Graph.vue'

const route = useRoute()
const uploadId = computed(() => parseInt(route.params.uploadId as string))
const { result: visualization, isLoading, error } = useVisualization(uploadId)
const { addSupplementalConnection } = useAddSupplementalConnection(uploadId)
const { removeSupplementalConnection, removeAllSupplementalConnections } = useRemoveSupplementalConnection(uploadId)
</script>

<template>
  <LoadingSpinner v-if="isLoading && !visualization" />
  <ErrorSummary v-if="error && !visualization" title="Error loading visualization" :description="error" />
  <div v-if="visualization">
    <h1 class="govuk-heading-xl">Visualization</h1>
    <p class="govuk-body">View company structure and relationships.</p>
    <Graph
      :structure="visualization.structure"
      @add-connection="addSupplementalConnection"
      @remove-connection="removeSupplementalConnection"
      @remove-all-connections="removeAllSupplementalConnections"
    />
  </div>
</template>

<style scoped></style>
