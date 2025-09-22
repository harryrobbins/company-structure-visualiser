<script setup lang="ts">
import {type CompanyConfirmationUpdate, useAppStore} from '@/stores/app.ts'
import CompanyMatchTag from "@/components/CompanyMatchTag.vue";
import CompanyAddress from "@/components/CompanyAddress.vue";
import {ref} from "vue";

const appStore = useAppStore()

const updates = ref<CompanyConfirmationUpdate>({})

function confirmSelection() {
  appStore.confirm(updates.value)
}

</script>

<template>
  <div v-if="appStore.graph.type == 'confirmation'">
    <div class="govuk-heading-xl">Matched Companies</div>

    <p class="govuk-body">
      We found {{ appStore.graph.searchResults.length }} companies in the supplied spreadsheet.
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
      v-for="(result, index) in appStore.graph.searchResults"
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
          :value-text="result.best_match.CompanyName"
        />
        <gv-summary-list-row
          key-text="Company Number"
          :value-text="result.best_match.CompanyNumber"
        />
        <gv-summary-list-row key-text="Registered Address">
          <template #value>
            <CompanyAddress :company="result.best_match" />
          </template>
        </gv-summary-list-row>
      </template>
    </gv-summary-list>

    <gv-button @click="confirmSelection">View Company Organisation Chart</gv-button>
  </div>
</template>

<style scoped>

</style>
