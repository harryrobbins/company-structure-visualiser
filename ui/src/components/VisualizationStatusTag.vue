<script setup lang="ts">
import Tag from '@/components/govuk/Tag.vue'
import { visualizationStatus, visualizationStatusTitle, type Visualization } from '@/db/models.ts'

defineProps<{ visualization: Visualization }>()
</script>

<template>
  <Tag colour="blue" :text="visualizationStatusTitle(visualizationStatus(visualization))" />
</template>
