<script setup lang="ts">
import FileUpload from '@/components/govuk/FileUpload.vue'
import { ref, watch } from 'vue'
import { useStartVisualization, useVisualizations, useDeleteVisualization } from '@/db/useVisualization.ts'
import ErrorSummary from '@/components/govuk/ErrorSummary.vue'
import VisualizationStatusTag from '@/components/VisualizationStatusTag.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { RouterLink } from 'vue-router'

const files = ref<FileList | null>(null)
const { start, isLoading: uploadLoading, error: uploadError } = useStartVisualization()
const { result: visualizations, error: visualizationError, isLoading: visualizationLoading } = useVisualizations()
const { deleteVisualization } = useDeleteVisualization()

watch(
  files,
  async (newFiles) => {
    if (!newFiles || newFiles.length === 0) {
      return
    }
    const file = newFiles[0]
    if (!file) {
      return
    }

    await start(file)
  },
  { deep: true },
)
</script>

<template>
  <h1 class="govuk-heading-xl">Company Visualizer</h1>

  <ErrorSummary v-if="uploadError" title="File upload failed" :description="uploadError" class="mb-4" />
  <FileUpload
    class="spreadsheet-upload"
    :disabled="uploadLoading"
    id="file-upload"
    label="Upload your company organization data"
    no-file-chosen-text=""
    :status="false"
    v-model="files"
    accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    drop-instruction-class="mb-0!"
  />

  <LoadingSpinner v-if="visualizationLoading" />
  <ErrorSummary
    v-else-if="visualizationError"
    title="Error loading visualizations"
    :description="visualizationError"
    class="mb-4"
  />
  <table v-else class="govuk-table">
    <tbody class="govuk-table__body">
      <tr v-for="visualization in visualizations" :key="visualization.id" class="govuk-table__row">
        <th class="govuk-table__header" scope="row">
          <RouterLink
            :to="{ name: 'validate', params: { uploadId: visualization.id } }"
            class="govuk-link govuk-link--no-visited-state"
          >
            {{ visualization.filename }}
          </RouterLink>
          <br />
          <small>{{ visualization.date.toLocaleString() }}</small>
        </th>
        <td class="govuk-table__cell">
          <VisualizationStatusTag :visualization="visualization" />
        </td>
        <td class="govuk-table__cell">
          <button
            @click="deleteVisualization(visualization.id)"
            class="govuk-link govuk-link--no-visited-state text-red-500 hover:text-red-600! cursor-pointer"
          >
            Remove
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.govuk-table__header,
.govuk-table__cell {
  vertical-align: middle;
}
</style>
