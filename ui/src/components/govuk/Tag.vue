<script setup lang="ts">
export type TagColour =
  | 'grey'
  | 'green'
  | 'turquoise'
  | 'blue'
  | 'light-blue'
  | 'purple'
  | 'pink'
  | 'red'
  | 'orange'
  | 'yellow'

defineProps<{ colour?: TagColour; text?: string }>()
</script>

<template>
  <strong class="govuk-tag" :class="`${colour ? `govuk-tag--${colour}` : ''}`">
    <slot>
      {{ text }}
    </slot>
  </strong>
</template>
