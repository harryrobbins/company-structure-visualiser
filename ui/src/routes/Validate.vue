<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useVisualization } from '@/db/useVisualization.ts'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorSummary from '@/components/govuk/ErrorSummary.vue'
import GroupStructureTable from '@/components/GroupStructureTable.vue'
import { computed } from 'vue'
import Button from '@/components/govuk/Button.vue'

const route = useRoute()
const uploadId = computed(() => parseInt(route.params.uploadId as string))
const { result: visualization, isLoading, error } = useVisualization(uploadId)
</script>

<template>
  <LoadingSpinner v-if="isLoading" />
  <ErrorSummary v-else-if="error" title="Error loading visualization" :description="error" />
  <div v-else-if="visualization">
    <GroupStructureTable :entities="visualization.structure.entities" :editable="true" />

    <p class="govuk-body">These companies are the ones I want to visualize.</p>
    <Button :to="{ name: 'visualize', params: { uploadId } }"> Confirm and visualize </Button>

    <p class="govuk-body">These companies are not the ones I want to visualize.</p>
    <Button :to="{ name: 'match', params: { uploadId } }"> Check companies against Companies House database </Button>
  </div>
</template>

<style scoped></style>
