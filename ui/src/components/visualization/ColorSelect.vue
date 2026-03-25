<script setup lang="ts">
const modelValue = defineModel<string>({ required: true })

defineProps<{
  id: string
  class?: string
}>()

const colorOptions = [
  { value: '#ef4444', label: 'Red' },
  { value: '#000000', label: 'Black' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#f97316', label: 'Orange' },
] as const
</script>

<template>
  <select :id="id" class="govuk-select min-w-25!" :class="$props.class" v-model="modelValue">
    <option v-for="option in colorOptions" :key="option.value" :value="option.value">
      {{ option.label }}
    </option>
  </select>
</template>

