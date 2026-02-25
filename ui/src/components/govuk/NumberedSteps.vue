<script setup lang="ts">
import { provide, ref } from 'vue'

const stepCount = ref(0)
const registerStep = () => ++stepCount.value
defineProps<{ title: string }>()

provide('registerStep', registerStep)
</script>

<template>
  <div class="bg-blue-50 p-6 lg:p-12 text-center lg:text-left w-full">
    <h2 class="govuk-heading-l">{{ title }}</h2>
    <ul class="flex flex-col lg:flex-row gap-6 list-none px-1 py-0 sm:px-4 md:px-10 lg:p-0">
      <slot />
    </ul>
  </div>
</template>
