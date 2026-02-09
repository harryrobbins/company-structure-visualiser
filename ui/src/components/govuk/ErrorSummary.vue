<script setup lang="ts">
import { useSlots } from 'vue'

defineProps<{ title: string; description?: string }>()
const slots = useSlots()
</script>

<template>
  <div class="govuk-error-summary">
    <div role="alert">
      <h2 class="govuk-error-summary__title">
        <!-- @slot The heading of the error summary block. If content is provided in this slot, the `title` prop will be ignored. -->
        <slot name="title">
          {{ title }}
        </slot>
      </h2>
      <div class="govuk-error-summary__body">
        <p v-if="!!description || !!slots.description">
          <slot name="description">
            {{ description }}
          </slot>
        </p>
        <ul v-if="!!slots.default" class="govuk-list govuk-error-summary__list">
          <slot />
        </ul>
      </div>
    </div>
  </div>
</template>
