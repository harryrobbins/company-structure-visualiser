<script setup lang="ts">
import type { Visualization } from '@/db/models.ts'
import Checkbox from '@/components/govuk/Checkbox.vue'
import Checkboxes from '@/components/govuk/Checkboxes.vue'
import Button from '@/components/govuk/Button.vue'
import { computed, ref } from 'vue'
import type { CompanyMatches, CompanyMatchRequest } from '@/api/models.ts'
import { useSearchCompanies } from '@/api/useApi.ts'
import ErrorSummary from '@/components/govuk/ErrorSummary.vue'
import CompanySearchResults from '@/components/CompanySearchResults.vue'

const props = defineProps<{ visualization: Visualization }>()
const emit = defineEmits<{
  update: [CompanyMatches]
}>()

const allEntityIds = computed(() => props.visualization.structure.entities.map((entity) => entity.id))
const selectedMatches = ref<string[]>([])

const allSelected = computed(
  () => selectedMatches.value.length === allEntityIds.value.length && allEntityIds.value.length > 0,
)

function toggleSelectAll() {
  if (allSelected.value) {
    selectedMatches.value = []
  } else {
    selectedMatches.value = [...allEntityIds.value]
  }
}

const searchRequest = ref<CompanyMatchRequest>({
  company_names: [],
})
const { searchResult, isLoading, error } = useSearchCompanies(searchRequest)

function startMatchCompanies() {
  const matchSet = new Set(selectedMatches.value)
  searchRequest.value.company_names = props.visualization.structure.entities
    .filter((entity) => matchSet.has(entity.id))
    .map((entity) => entity.name)
}
</script>

<template>
  <CompanySearchResults
    v-if="!isLoading && searchResult && Object.keys(searchResult.matches).length > 0"
    v-model="searchResult.matches"
    @update="emit('update', $event)"
  />

  <template v-else>
    <h2 class="govuk-heading-m">Which companies would you like to match?</h2>

    <Checkbox
      value="select-all"
      :label="allSelected ? 'Deselect all' : 'Select all'"
      :model-value="allSelected"
      @click="toggleSelectAll"
      :disabled="isLoading"
    />

    <hr class="govuk-section-break govuk-section-break--m govuk-section-break--visible" />

    <Checkboxes v-model="selectedMatches" class="sm:grid sm:grid-cols-2 sm:gap-x-4 lg:grid-cols-3">
      <Checkbox
        v-for="entity in visualization.structure.entities"
        :key="entity.id"
        :value="entity.id"
        :label="entity.name"
        :disabled="isLoading"
      />
    </Checkboxes>

    <Button
      @click="startMatchCompanies"
      class="mb-3!"
      :disabled="selectedMatches.length === 0"
      :loading="isLoading"
      loading-text="Searching..."
      >Match companies</Button
    >

    <ErrorSummary v-if="error" title="Error searching for companies" :description="error" />
  </template>
</template>

<style scoped></style>
