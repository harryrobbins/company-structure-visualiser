<script setup lang="ts">
import { computed } from 'vue'
import type { CompanyMatch } from '@/api/models.ts'
import Tag, { type TagColour } from '@/components/govuk/Tag.vue'
import { OhVueIcon } from 'oh-vue-icons'

interface Props {
  match: CompanyMatch
  manuallySelected?: boolean
}

const props = defineProps<Props>()

interface ConfidenceDisplay {
  percentage: number
  icon: string
  colour: TagColour
}

const confidenceDisplay = computed<ConfidenceDisplay>(() => {
  if (props.manuallySelected) {
    return {
      percentage: 100,
      icon: 'fa-user',
      colour: 'blue',
    }
  }

  if (!props.match || props.match.score === undefined || props.match.score === null) {
    return {
      percentage: 0,
      icon: 'fa-exclamation-circle',
      colour: 'red',
    }
  }

  // Calculate percentage from score (cap at 100%)
  const score = props.match.score
  const percentage = Math.min(Math.round((score / 10) * 100), 100)

  if (percentage >= 70) {
    return {
      percentage,
      icon: 'fa-regular-check-circle',
      colour: 'green',
    }
  } else if (percentage >= 50) {
    return {
      percentage,
      icon: 'fa-exclamation-triangle',
      colour: 'orange',
    }
  } else {
    return {
      percentage,
      icon: 'fa-exclamation-circle',
      colour: 'red',
    }
  }
})
</script>

<template>
  <Tag :colour="confidenceDisplay.colour">
    <span class="flex items-center gap-2">
      <OhVueIcon :name="confidenceDisplay.icon" />
      <span v-if="manuallySelected">Manually Selected</span>
      <span v-else>{{ confidenceDisplay.percentage }}% match</span>
    </span>
  </Tag>
</template>
