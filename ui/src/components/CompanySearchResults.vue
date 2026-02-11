<script setup lang="ts">
import type { CompanyMatch, CompanyMatches } from '@/api/models.ts'
import Card from '@/components/govuk/Card.vue'
import MatchConfidence from '@/components/MatchConfidence.vue'
import Address from '@/components/Address.vue'
import Button from '@/components/govuk/Button.vue'
import ModalOverlay from '@/components/ModalOverlay.vue'
import SummaryList from '@/components/govuk/SummaryList.vue'
import SummaryListItem from '@/components/govuk/SummaryListItem.vue'
import ToggleSwitch from 'primevue/toggleswitch'
import { ref, computed, watch } from 'vue'
import ShowHideLink from '@/components/govuk/ShowHideLink.vue'
import { deepToRaw } from '@/vue-extra.ts'

const model = defineModel<CompanyMatches>({ required: true })
const emit = defineEmits<{
  update: [CompanyMatches]
}>()

const selectedCompanies = ref<Set<string>>(new Set())
const expandedCompanies = ref<Set<string>>(new Set())

watch(
  model.value,
  (newMatches) => {
    selectedCompanies.value.clear()
    for (const name of Object.keys(newMatches)) {
      selectedCompanies.value.add(name)
    }
  },
  { deep: true, immediate: true },
)

const selectedList = computed(() => Array.from(selectedCompanies.value))

const hasAnyExpanded = computed(() => expandedCompanies.value.size > 0)

function toggleSelection(name: string, selected: boolean) {
  if (selected) {
    selectedCompanies.value.add(name)
  } else {
    selectedCompanies.value.delete(name)
  }
}

function isExpanded(name: string): boolean {
  return expandedCompanies.value.has(name)
}

function setExpanded(name: string, expanded: boolean | undefined) {
  if (expanded) {
    expandedCompanies.value.add(name)
  } else {
    expandedCompanies.value.delete(name)
  }
}

function closeAllExpanded() {
  expandedCompanies.value.clear()
}

function updateMatch(originalCompanyName: string, selected: CompanyMatch) {
  if (!(originalCompanyName in model.value)) {
    return
  }

  const editing = model.value[originalCompanyName]!

  // Check if selected match exists in other_matches
  const selectedIndex = editing.other_matches.findIndex((match) => match.CompanyName === selected.CompanyName)
  if (selectedIndex === -1) {
    return
  }

  // remove selected match from other_matches
  const selectedMatch = editing.other_matches.splice(selectedIndex, 1)[0]

  // Add old best_match to other_matches if it exists
  const originalSelection = editing.recommended_match
  if (originalSelection) {
    editing.other_matches.push(originalSelection)
  }
  editing.recommended_match = selectedMatch
  editing.other_matches.sort((a, b) => b.score - a.score)

  if (editing.manual_selection) {
    if (editing.manual_selection.original_selection === selected.CompanyNumber) {
      // user selected back the original selection, remove manually_selection
      delete editing.manual_selection
    }
  } else if (originalSelection) {
    editing.manual_selection = {
      original_selection: originalSelection.CompanyNumber,
    }
  }

  expandedCompanies.value.clear()
}

function confirmUpdate() {
  const result: CompanyMatches = {}
  for (const name of selectedList.value) {
    result[name] = deepToRaw(model.value[name])!
  }
  emit('update', result)
  closeAllExpanded()
}
</script>

<template>
  <ModalOverlay v-if="hasAnyExpanded" @click="closeAllExpanded" />
  <h2 class="govuk-heading-l">Best matches:</h2>
  <div class="grid lg:grid-cols-2 gap-4 mb-4">
    <div v-for="[name, match] in Object.entries(model)" :key="name" class="relative">
      <Card class="mb-0!" :class="{ 'absolute z-1001 border-2 border-blue-500 shadow': isExpanded(name) }">
        <template #title>
          <div class="flex gap-2 w-full items-center">
            <h2 class="govuk-heading-m mb-0! grow">“{{ name }}”</h2>
            <MatchConfidence
              v-if="match.recommended_match"
              :match="match.recommended_match"
              :manually-selected="!!match.manual_selection"
            />
          </div>
        </template>

        <div v-if="match.recommended_match" class="flex flex-col h-full w-full">
          <div class="grow">
            <SummaryList>
              <SummaryListItem key-text="Company Name">
                <mark class="bg-yellow-200">{{ match.recommended_match.CompanyName }}</mark>
              </SummaryListItem>
              <SummaryListItem key-text="Company Number">
                {{ match.recommended_match.CompanyNumber }}
              </SummaryListItem>
              <SummaryListItem key-text="Registered Address">
                <Address :company="match.recommended_match" />
              </SummaryListItem>
            </SummaryList>
          </div>

          <div class="flex flex-col sm:flex-row mb-3 gap-4 sm:gap-1 items-start sm:items-center mt-3">
            <div class="grow">
              <ShowHideLink
                v-if="match.other_matches && match.other_matches.length > 0"
                name="other potential matches"
                :model-value="isExpanded(name)"
                @update:model-value="(value) => setExpanded(name, value)"
              />
              <span v-else class="text-dark-gray-500"> There are no other potential matches for this company. </span>
            </div>

            <div class="flex items-center gap-2">
              <label :for="`${name}-selected`" class="font-bold">Selected:</label>
              <ToggleSwitch
                :input-id="`${name}-selected`"
                :model-value="selectedCompanies.has(name)"
                @update:model-value="(value) => toggleSelection(name, value)"
              />
            </div>
          </div>

          <!-- Other Matches Section -->
          <div v-if="isExpanded(name) && match.other_matches && match.other_matches.length > 0" class="mt-4">
            <div v-for="(otherMatch, index) in match.other_matches" :key="index" class="border-t py-6">
              <SummaryList>
                <SummaryListItem key-text="Company Name">
                  <div class="w-full flex gap-2 items-center">
                    <span class="grow"
                      ><mark class="bg-yellow-200">{{ otherMatch.CompanyName }}</mark></span
                    >
                    <MatchConfidence
                      class="shrink-0"
                      :match="otherMatch"
                      :manually-selected="!!otherMatch.manual_selection"
                    />
                  </div>
                </SummaryListItem>
                <SummaryListItem key-text="Company Number">
                  {{ otherMatch.CompanyNumber }}
                </SummaryListItem>
                <SummaryListItem key-text="Registered Address">
                  <Address :company="otherMatch" />
                </SummaryListItem>
              </SummaryList>
              <div class="flex">
                <span class="grow" />
                <Button @click="updateMatch(name, otherMatch)" class="mb-0!"> Select this match </Button>
              </div>
            </div>
          </div>
        </div>

        <template v-else>
          <p class="govuk-body">No matches</p>
        </template>
      </Card>
    </div>
  </div>

  <h2 class="govuk-heading-l mt-10!">Confirm company details</h2>
  <p class="govuk-body">
    Update the visualisation tool with the matched companies from your document with the companies from Companies House
    database.
  </p>

  <Button @click="confirmUpdate">Confirm and update</Button>
</template>

<style>
.govuk-summary-list__row {
  border-bottom: 0;

  .govuk-summary-list__key,
  .govuk-summary-list__value {
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
  }
}
</style>
