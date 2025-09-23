<script setup lang="ts">
import type {CompanyMatch, CompanyMatchResponse, CompanyMatchResult} from "@/api";
import Address from "@/components/Address.vue";
import MatchConfidence from "@/components/MatchConfidence.vue";

interface Props {
  searchString: string;
  company: CompanyMatchResult
  onSelectCompany: (selected: CompanyMatch) => void;
}

const props = defineProps<Props>();
</script>

<template>
  <div class="govuk-heading-xl">Edit Match '{{searchString}}'</div>

  <gv-summary-list v-if="props.company.recommended_match" card-title="Current Best Match">
    <gv-summary-list-row
      key-text="Company Name"
      :value-text="props.company.recommended_match.CompanyName"
    />
    <gv-summary-list-row
      key-text="Company Number"
      :value-text="props.company.recommended_match.CompanyNumber"
    />
    <gv-summary-list-row key-text="Registered Address">
      <template #value>
        <Address :company="props.company.recommended_match" />
      </template>
    </gv-summary-list-row>
  </gv-summary-list>

  <div class="govuk-heading-m">Other Matches</div>

  <template v-if="props.company.other_matches.length > 0">
    <gv-summary-list v-for="(match, index) in props.company.other_matches" :key="index">
      <template #card-title>
        <span class="mr-2">{{ match.CompanyName }}</span>
        <MatchConfidence :key="index" :match="match" />
      </template>

      <template #card-actions>
        <gv-summary-card-action
          @click.prevent="props.onSelectCompany(match)"
          :visually-hidden-text="match.CompanyName"
        >
          Select
        </gv-summary-card-action>
      </template>

      <gv-summary-list-row
        key-text="Company Name"
        :value-text="match.CompanyName"
      />
      <gv-summary-list-row
        key-text="Company Number"
        :value-text="match.CompanyNumber"
      />
      <gv-summary-list-row key-text="Registered Address">
        <template #value>
          <Address :company="match" />
        </template>
      </gv-summary-list-row>
    </gv-summary-list>
  </template>
  <template v-else>
    <p class="govuk-body">No other matches found.</p>
  </template>
</template>

<style scoped>

</style>
