<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useVisualization } from '@/db/useVisualization.ts'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorSummary from '@/components/govuk/ErrorSummary.vue'
import Graph from '@/components/Graph.vue'

const route = useRoute()
const uploadId = computed(() => parseInt(route.params.uploadId as string))
const { result: visualization, isLoading, error } = useVisualization(uploadId)
</script>

<template>
  <LoadingSpinner v-if="isLoading" />
  <ErrorSummary v-else-if="error" title="Error loading visualization" :description="error" />
  <div v-else-if="visualization">
    <Graph :structure="visualization.structure" />
  </div>
</template>

<style scoped></style>
