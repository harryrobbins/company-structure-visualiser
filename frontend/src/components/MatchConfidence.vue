<script setup lang="ts">
import { computed } from 'vue'
import type {CompanyMatch, CompanyMatches} from '@/api'

interface Props {
  match: CompanyMatch
  manuallySelected?: boolean
}

const props = defineProps<Props>()

const confidenceOption = computed(() => {
  if (props.manuallySelected) {
    return { confidence: 'Manually Selected', colour: 'grey' }
  }

  if (!props.match || !props.match.score) {
    return { confidence: 'No Match', colour: 'grey' }
  }

  const score = props.match.score
  if (score >= 8) {
    return { confidence: 'High Confidence', colour: 'green' }
  } else if (score >= 3) {
    return { confidence: 'Medium Confidence', colour: 'yellow' }
  } else if (score > 0) {
    return { confidence: 'Low Confidence', colour: 'red' }
  } else {
    return { confidence: 'No Match', colour: 'grey' }
  }
})
</script>

<template>
  <gv-tag :colour="confidenceOption.colour" :text="confidenceOption.confidence" />
</template>

<style scoped>
.govuk-tag {
  max-width: unset;
}
</style>
