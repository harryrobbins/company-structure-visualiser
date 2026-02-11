<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useApplyCompanyMatches, useVisualization } from '@/db/useVisualization.ts'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorSummary from '@/components/govuk/ErrorSummary.vue'
import CompanySearch from '@/components/CompanySearch.vue'
import type { CompanyMatches } from '@/api/models.ts'

const route = useRoute()
const uploadId = computed(() => parseInt(route.params.uploadId as string))
const { result: visualization, isLoading, error } = useVisualization(uploadId)
const {
  applyCompanyMatches,
  isLoading: applyCompanyMatchesLoading,
  error: applyCompanyMatchesError,
} = useApplyCompanyMatches()

function updateMatches(matches: CompanyMatches) {
  applyCompanyMatches(uploadId.value, matches)
}
</script>

<template>
  <h1 class="govuk-heading-xl">Match Companies</h1>
  <p class="govuk-body">
    Use our integrated AI technology to match your companies against Companies House data. Use this to confirm you have
    the correct information, and add additional details to your data.
  </p>

  <LoadingSpinner v-if="isLoading || applyCompanyMatchesLoading" />
  <ErrorSummary v-else-if="error" title="Error loading visualization" :description="error" />
  <div v-else-if="visualization">
    <ErrorSummary
      v-if="applyCompanyMatchesError"
      title="Error applying company matches to visualization"
      :description="applyCompanyMatchesError"
    />

    <CompanySearch :visualization="visualization" @update="updateMatches" />
    <p>
      <RouterLink :to="{ name: 'visualize', params: { uploadId } }" class="govuk-link govuk-link--no-visited-state">
        Cancel and return to visualization
      </RouterLink>
    </p>
  </div>
</template>
