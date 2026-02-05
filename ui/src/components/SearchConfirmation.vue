<script setup lang="ts">
import {useAppStore} from '@/stores/app.ts'
import MatchConfidence from "@/components/MatchConfidence.vue";
import Address from "@/components/Address.vue";
import EditSearchResult from "@/components/EditSearchResult.vue";
import type {CompanyMatch} from "@/api";

const appStore = useAppStore()

function scrollToTop() {
  window.scroll({ top: 0, behavior: 'smooth' })
}

function edit(key: string | null) {
  if (appStore.state.type === 'confirmation') {
    appStore.state.editing = key
    scrollToTop()
  }
}

function updateMatch(selected: CompanyMatch) {
  appStore.updateMatch(selected)
  scrollToTop()
}

function confirm() {
  appStore.confirm()
  scrollToTop()
}

</script>

<template>
  <div v-if="appStore.state.type == 'confirmation'">
    <template v-if="appStore.state.editing">
      <EditSearchResult
        :search-string="appStore.state.editing"
        :company="appStore.state.matches[appStore.state.editing]!"
        :onSelectCompany="updateMatch"
      />
      <gv-button @click="edit(null)">Confirm search result</gv-button>
    </template>
    <template v-else>
      <div class="govuk-heading-xl">Matched Companies</div>

      <p class="govuk-body">
        We found {{ Object.keys(appStore.state.matches).length }} companies in the supplied spreadsheet.
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
        v-for="([key, result], index) in Object.entries(appStore.state.matches)"
        :key="index"
      >
        <template #card-title>
          <span class="mr-2">{{ key }}</span>
          <MatchConfidence v-if="result.recommended_match" :key="index" :match="result.recommended_match" :manually-selected="!!result.manual_selection" />
        </template>

        <template #card-actions>
          <gv-summary-card-action
            @click="edit(key)"
            :visually-hidden-text="`match for ${key}`"
          >
            Edit
          </gv-summary-card-action>
        </template>

        <template v-if="result.recommended_match">
          <gv-summary-list-row
            key-text="Company Name"
            :value-text="result.recommended_match.CompanyName"
          />
          <gv-summary-list-row
            key-text="Company Number"
            :value-text="result.recommended_match.CompanyNumber"
          />
          <gv-summary-list-row key-text="Registered Address">
            <template #value>
              <Address :company="result.recommended_match" />
            </template>
          </gv-summary-list-row>
        </template>
        <template v-else>
          <p class="govuk-body">No matches</p>
        </template>
      </gv-summary-list>

      <gv-button @click="confirm">View Company Organisation Chart</gv-button>
    </template>
  </div>
</template>

<style scoped>

</style>
