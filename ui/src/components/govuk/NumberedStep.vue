<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'

defineProps<{
  title: string
}>()

const registerStep = inject<() => number>('registerStep')
const stepNumber = ref(0)

onMounted(() => {
  if (registerStep) {
    stepNumber.value = registerStep()
  }
})
</script>

<template>
  <li class="flex flex-col items-center lg:items-baseline flex-1">
    <div class="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-6">
      {{ stepNumber }}
    </div>
    <h3 class="govuk-heading-s mb-1!">{{ title }}</h3>
    <p>
      <slot />
    </p>
  </li>
</template>
