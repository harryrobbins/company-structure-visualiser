<script setup lang="ts">
defineProps<{
  title?: string
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6
}>()

const slots = defineSlots<{
  default: string
  title?: string
  actions?: string
}>()
</script>

<template>
  <div class="govuk-summary-card flex! flex-col!">
    <div class="govuk-summary-card__title-wrapper">
      <component v-if="!slots.title" :is="`h${headingLevel || 2}`" class="govuk-summary-card__title">
        {{ title }}
      </component>
      <slot v-else name="title" />
      <ul v-if="!!slots.actions" class="govuk-summary-card__actions">
        <slot name="actions" />
      </ul>
    </div>
    <div class="govuk-summary-card__content grow! bg-white!">
      <slot />
    </div>
  </div>
</template>

<style scoped></style>
