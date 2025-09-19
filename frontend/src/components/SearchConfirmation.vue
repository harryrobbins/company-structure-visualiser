<script setup lang="ts">
import { useGraphStore } from '@/stores/graph'
import { computed } from 'vue'
import type {CompanyMatch} from "@/api";
import CompanyMatchTag from "@/components/CompanyMatchTag.vue";

const graphStore = useGraphStore()
const searchResults = computed(() => graphStore.currentSearch || [])

function formatAddress(match: CompanyMatch) {
  const addressFields = [
    match['RegAddress.CareOf'],
    match['RegAddress.POBox'],
    match['RegAddress.AddressLine1'],
    match['RegAddress.AddressLine2'],
    match['RegAddress.PostTown'],
    match['RegAddress.County'],
    match['RegAddress.Country'],
    match['RegAddress.PostCode']
  ]

  return addressFields
    .filter(field => field && field.trim())
    .join('<br>')
}

</script>

<template>
  <div v-if="searchResults.length > 0">
    <div class="govuk-heading-xl">Matched Companies</div>

    <p class="govuk-body">
      We found {{searchResults.length}} companies in the supplied spreadsheet.
    </p>

    <p class="govuk-body">
      We have matched these against the {insert database name here} database, using AI to resolve any ambiguous results.
      The confidence of each match is shown next to the search term.
    </p>

    <p class="govuk-body">
      If anything looks wrong, please click the Edit button to select from other potential results.
      If you cannot find the company you are looking for, you can try searching again by correcting your data and resubmitting it.
    </p>

    <gv-summary-list
      v-for="(result, index) in searchResults"
      :key="index"
    >
      <template #card-title>
        <span class="mr-2">{{ result.search_string }}</span>
        <CompanyMatchTag :key="index" :match="result.best_match" />
      </template>

      <template #card-actions>
        <gv-summary-card-action
          @click.prevent="$emit('select', result)"
          :visually-hidden-text="`for ${result.search_string}`"
        >
          Edit
        </gv-summary-card-action>
      </template>

      <template v-if="result.best_match">
        <gv-summary-list-row
          key-text="Company Name"
          :value-text="result.best_match!.CompanyName"
        />
        <gv-summary-list-row
          key-text="Company Number"
          :value-text="result.best_match!.CompanyNumber"
        />
        <gv-summary-list-row key-text="Registered Address">
          <template #value>
            <span v-html="formatAddress(result.best_match)"></span>
          </template>
        </gv-summary-list-row>
      </template>
    </gv-summary-list>

    <gv-button>View Company Organisation Chart</gv-button>
  </div>
</template>

<style scoped>

</style>
