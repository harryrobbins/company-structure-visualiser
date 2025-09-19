<script setup lang="ts">
import { computed } from 'vue'
import type { CompanyMatch } from '@/api'

interface Props {
  match: CompanyMatch | null
}

const props = defineProps<Props>()

interface MatchConfidence {
  confidence: 'High Confidence' | 'Medium Confidence' | 'Low Confidence' | 'No Match'
  color: 'green' | 'yellow' | 'red' | 'grey'
}

function getMatchConfidence(match: CompanyMatch | null): MatchConfidence {
  if (!match || !match.score) {
    return { confidence: 'No Match', color: 'grey' }
  }

  const score = match.score

  if (score >= 0.8) {
    return { confidence: 'High Confidence', color: 'green' }
  } else if (score >= 0.6) {
    return { confidence: 'Medium Confidence', color: 'yellow' }
  } else if (score > 0) {
    return { confidence: 'Low Confidence', color: 'red' }
  } else {
    return { confidence: 'No Match', color: 'grey' }
  }
}

const confidenceOption = computed(() => {
  const confidence = getMatchConfidence(props.match)
  return {
    colour: confidence.color,
    text: confidence.confidence
  }
})
</script>

<template>
  <gv-tag :colour="confidenceOption.colour" :text="confidenceOption.text" />
</template>
