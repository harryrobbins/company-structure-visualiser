<script setup lang="ts">
import { ref } from 'vue'
import GvButton from '@/components/govuk/Button.vue'
import GvCheckboxes from '@/components/govuk/Checkboxes.vue'
import GvCheckbox from '@/components/govuk/Checkbox.vue'
import GvInput from '@/components/govuk/Input.vue'
import ColorSelect from '@/components/visualization/ColorSelect.vue'

const searchQuery = defineModel<string>('searchQuery', { required: true })
const highlightColor = defineModel<string>('highlightColor', { required: true })
const searchToggles = defineModel<string[]>('searchToggles', { required: true })

const show = ref(false)

function open() {
  show.value = true
}

function close() {
  show.value = false
}

function clear() {
  searchQuery.value = ''
}
</script>

<template>
  <GvButton variant="secondary" class="mb-0!" @click="open">Search</GvButton>

  <div v-if="show" class="fixed inset-0 z-2000 flex items-center justify-center bg-black/40" @click.self="close">
    <div class="bg-white p-6 max-w-md w-full mx-4 border-2 border-black">
      <h2 class="govuk-heading-m">Search &amp; highlight nodes</h2>

      <GvInput class="text-black!" label="Search" v-model="searchQuery" placeholder="Search by name or TIN…" />

      <div class="govuk-form-group">
        <label class="govuk-label" for="modal-highlight-color">Highlight color</label>
        <ColorSelect v-model="highlightColor" id="modal-highlight-color" />
      </div>

      <GvCheckboxes v-model="searchToggles" form-group-class="mb-4!" size="small">
        <GvCheckbox
          value="highlightParents"
          id="modal-highlight-parents"
          label="Also highlight parent nodes"
          label-class="whitespace-nowrap"
        />
      </GvCheckboxes>

      <div class="flex gap-2">
        <GvButton variant="secondary" class="mb-0!" @click="close">Close</GvButton>
        <GvButton v-if="searchQuery" variant="warning" class="mb-0!" @click="clear">Clear search</GvButton>
      </div>
    </div>
  </div>
</template>
