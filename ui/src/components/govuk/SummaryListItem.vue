<script setup lang="ts">
defineProps<{
  keyText: string
  valueText?: string
}>()
</script>

<template>
  <div class="govuk-summary-list__row">
    <dt class="govuk-summary-list__key">{{ keyText }}</dt>
    <dd class="govuk-summary-list__value">
      <slot>
        {{ valueText }}
      </slot>
    </dd>
  </div>
</template>

<style scoped></style>
