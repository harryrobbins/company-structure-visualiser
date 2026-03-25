<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useUpdateEntity, useVisualization } from '@/db/useVisualization.ts'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorSummary from '@/components/govuk/ErrorSummary.vue'
import GroupStructureTable from '@/components/GroupStructureTable.vue'
import { computed } from 'vue'
import Button from '@/components/govuk/Button.vue'
import { exportGroupStructureToXlsx, downloadXlsx } from '@/composables/export.ts'

const route = useRoute()
const uploadId = computed(() => parseInt(route.params.uploadId as string))
const { result: visualization, isLoading, error } = useVisualization(uploadId)
const { updateEntities, isLoading: updateLoading, error: updateError } = useUpdateEntity(uploadId)
</script>

<template>
  <LoadingSpinner v-if="isLoading || updateLoading" />
  <ErrorSummary v-else-if="error" title="Error loading visualization" :description="error" />
  <div v-else-if="visualization">
    <ErrorSummary v-if="updateError" title="Error loading visualization" :description="updateError" />

    <GroupStructureTable :entities="visualization.structure.entities" @save="updateEntities" />

    <p class="govuk-body">These companies are the ones I want to visualize.</p>
    <Button :to="{ name: 'visualize', params: { uploadId } }" data-testid="confirm-and-visualize"> Confirm and visualize </Button>

    <p class="govuk-body">These companies are not the ones I want to visualize.</p>
    <Button :to="{ name: 'match', params: { uploadId } }" data-testid="check-companies-house"> Check companies against Companies House database </Button>

    <p class="govuk-body">I want to export this group structure.</p>
    <Button
      variant="secondary"
      @click="exportGroupStructureToXlsx(visualization!.structure).then((buf) => downloadXlsx(buf, visualization!.filename))"
    >Export as xlsx</Button>
  </div>
</template>

<style scoped></style>
