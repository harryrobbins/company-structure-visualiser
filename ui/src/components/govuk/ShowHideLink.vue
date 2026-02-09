<script setup lang="ts">
import { OhVueIcon } from 'oh-vue-icons'

defineProps<{
  name: string
}>()
const expanded = defineModel<boolean>()
</script>

<template>
  <button
    :aria-expanded="expanded"
    @click="expanded = !expanded"
    class="govuk-link cursor-pointer text-blue-500 flex items-center gap-1"
  >
    <OhVueIcon
      scale="1.3"
      :name="expanded ? 'fa-regular-arrow-alt-circle-up' : 'fa-regular-arrow-alt-circle-down'"
    />
    {{ expanded ? 'Hide' : 'Show' }} {{ name }}
  </button>
</template>

<style scoped></style>
