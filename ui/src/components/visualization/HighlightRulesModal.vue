<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import GvButton from '@/components/govuk/Button.vue'
import GvSelect from '@/components/govuk/Select.vue'
import ColorSelect from '@/components/visualization/ColorSelect.vue'
import { ENTITY_TYPES } from '@/db/models.ts'

export interface HighlightRule {
  id: number
  field: 'taxJurisdiction' | 'taxJurisdictionOfIncorporation' | 'type'
  value: string
  color: string
}

const rules = defineModel<HighlightRule[]>({ required: true })
const props = defineProps<{
  availableJurisdictions: string[]
}>()

const show = ref(false)

function open() {
  show.value = true
}

function close() {
  show.value = false
}

defineExpose({ open })

// --- New rule form state ---
const fieldOptions = [
  { value: 'taxJurisdiction', label: 'Tax Jurisdiction' },
  { value: 'taxJurisdictionOfIncorporation', label: 'Tax Jurisdiction of Incorporation' },
  { value: 'type', label: 'Entity Type' },
] as const

const newField = ref<HighlightRule['field']>('taxJurisdiction')
const newValue = ref('')
const newColor = ref('#ef4444')

watch(newField, () => {
  newValue.value = ''
})

const valueOptions = computed(() => {
  if (newField.value === 'type') {
    return ENTITY_TYPES.map((t) => ({ value: t, label: t }))
  }
  return props.availableJurisdictions.map((j) => ({ value: j, label: j }))
})

let nextId = 1

function addRule() {
  if (!newValue.value) return
  rules.value = [
    ...rules.value,
    {
      id: nextId++,
      field: newField.value,
      value: newValue.value,
      color: newColor.value,
    },
  ]
  newValue.value = ''
}

function removeRule(id: number) {
  rules.value = rules.value.filter((r) => r.id !== id)
}

function clearAll() {
  rules.value = []
}

function fieldLabel(field: HighlightRule['field']): string {
  return fieldOptions.find((o) => o.value === field)?.label ?? field
}
</script>

<template>
  <GvButton variant="info" class="mb-0!" @click="open">Highlight nodes</GvButton>

  <div v-if="show" class="fixed inset-0 z-2000 flex items-center justify-center bg-black/40" @click.self="close">
    <div class="bg-white p-6 max-w-lg w-full mx-4 border-2 border-black">
      <h2 class="govuk-heading-m">Highlight nodes by attribute</h2>

      <!-- Existing rules -->
      <div v-if="rules.length > 0" class="mb-4">
        <table class="govuk-table">
          <thead class="govuk-table__head">
            <tr class="govuk-table__row">
              <th class="govuk-table__header">Attribute</th>
              <th class="govuk-table__header">Value</th>
              <th class="govuk-table__header">Color</th>
              <th class="govuk-table__header"></th>
            </tr>
          </thead>
          <tbody class="govuk-table__body">
            <tr v-for="rule in rules" :key="rule.id" class="govuk-table__row">
              <td class="govuk-table__cell">{{ fieldLabel(rule.field) }}</td>
              <td class="govuk-table__cell">{{ rule.value }}</td>
              <td class="govuk-table__cell">
                <span
                  class="inline-block w-4 h-4 rounded-full border border-gray-400"
                  :style="{ backgroundColor: rule.color }"
                ></span>
              </td>
              <td class="govuk-table__cell">
                <button class="govuk-link cursor-pointer" @click="removeRule(rule.id)">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="govuk-body text-gray-500">No highlight rules yet.</p>

      <!-- Add new rule form -->
      <div class="flex flex-col gap-3 pt-4">
        <h3 class="govuk-heading-s mb-0!">Add rule</h3>
        <div class="flex flex-wrap items-end gap-3">
          <GvSelect v-model="newField" id="rule-field" form-group-class="mb-0!" label="Attribute">
            <option v-for="option in fieldOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </GvSelect>

          <GvSelect v-model="newValue" id="rule-value" form-group-class="mb-0!" label="Value">
            <option value="" disabled>Select…</option>
            <option v-for="option in valueOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </GvSelect>

          <div class="govuk-form-group mb-0!">
            <label class="govuk-label" for="rule-color">Color</label>
            <ColorSelect v-model="newColor" id="rule-color" class="mb-0! h-10" />
          </div>

          <GvButton class="mb-0!" @click="addRule">Add</GvButton>
        </div>
      </div>

      <div class="flex gap-2 mt-6">
        <GvButton variant="secondary" class="mb-0!" @click="close">Close</GvButton>
        <GvButton v-if="rules.length > 0" variant="warning" class="mb-0!" @click="clearAll"> Clear all </GvButton>
      </div>
    </div>
  </div>
</template>
