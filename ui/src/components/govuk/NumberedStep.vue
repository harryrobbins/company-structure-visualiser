<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    color?: 'yellow' | 'green' | 'blue' | 'pink'
  }>(),
  {
    color: 'blue',
  },
)

const registerStep = inject<() => number>('registerStep')
const stepNumber = ref(0)
const colorClass = computed(() => {
  // must have the full class name for tailwind to work
  switch (props.color) {
    case 'yellow':
      return 'bg-yellow-500 text-black'
    case 'green':
      return 'bg-green-500 text-white'
    case 'blue':
      return 'bg-blue-500 text-white'
    case 'pink':
      return 'bg-pink-500 text-white'
  }
})

onMounted(() => {
  if (registerStep) {
    stepNumber.value = registerStep()
  }
})
</script>

<template>
  <li class="flex flex:row lg:flex-col gap-6 lg:gap-2 items-center lg:items-baseline flex-1">
    <div
      class="w-16 h-16 rounded-full shrink-0 flex items-center justify-center text-4xl font-bold lg:mb-2"
      :class="colorClass"
    >
      {{ stepNumber }}
    </div>
    <div class="text-left">
      <h3 class="govuk-heading-s mb-1!">{{ title }}</h3>
      <p class="govuk-body mb-0!">
        <slot />
      </p>
    </div>
  </li>
</template>
