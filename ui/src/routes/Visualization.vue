<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useVisualization } from '@/db/useVisualization.ts'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorSummary from '@/components/govuk/ErrorSummary.vue'

const route = useRoute()
const {
  result: visualization,
  isLoading,
  error,
} = useVisualization(() => parseInt(route.params.visualizationId as string))
</script>

<template>
  <LoadingSpinner v-if="isLoading" />
  <ErrorSummary v-else-if="error" title="Error loading visualization" :description="error" />
  <div v-else-if="visualization">
    <h1 class="govuk-heading-l">{{ visualization.filename }}</h1>
  </div>
</template>

<style scoped></style>
