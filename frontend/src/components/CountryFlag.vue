<script setup lang="ts">
import { getAlpha2Code, registerLocale } from 'i18n-iso-countries'
import { computed } from 'vue'

interface Props {
  countryName: string
  square?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  square: false
})

const alpha2Code = computed(() => {
  if (!props.countryName) return ''

  const alpha2 = getAlpha2Code(props.countryName, 'en')
  if (!alpha2) {
    console.warn(`Country name "${props.countryName}" not recognized.`)
  }

  return alpha2?.toLowerCase() || ''
})

const flagClasses = computed(() => {
  const baseClasses = ['fi']
  if (alpha2Code.value) {
    baseClasses.push(`fi-${alpha2Code.value}`)
  }
  if (props.square) {
    baseClasses.push('fis')
  }
  return baseClasses
})

</script>

<template>
  <span
    v-if="alpha2Code"
    :class="flagClasses"
    :title="countryName"
  />
</template>

<style scoped>

</style>
