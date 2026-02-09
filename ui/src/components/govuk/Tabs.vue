<script setup lang="ts">
const tabNames = defineProps<{
  tabNames: string[]
}>()

const selectedTab = defineModel<string>({ required: true })
</script>

<template>
  <div class="flex gap-4 border-b border-gray-300 overflow-x-auto whitespace-nowrap">
    <button
      v-for="tab in tabNames.tabNames"
      :key="tab"
      @click="selectedTab = tab"
      class="pb-2 px-2 font-bold transition-colors cursor-pointer"
      :class="
        selectedTab === tab
          ? 'border-b-4 border-blue-600 text-blue-600'
          : 'text-gray-600 hover:text-blue-600'
      "
      role="tab"
    >
      {{ tab }}
    </button>
  </div>
</template>
