<script setup lang="ts">
import { OhVueIcon } from 'oh-vue-icons'
withDefaults(defineProps<{ text?: string }>(), { text: 'Loading' })
</script>
<template>
  <div class="flex justify-center gap-2 items-center font-bold">
    <OhVueIcon name="fa-spinner" animation="spin" />
    <span>{{ text }}</span>
  </div>
</template>
