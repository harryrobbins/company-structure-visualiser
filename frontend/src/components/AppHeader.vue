<template>
  <header class="bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
    <div>
      <h1 class="text-xl font-bold text-gray-900">Company Structure Visualiser</h1>
      <p class="text-sm text-gray-600 h-5">{{ status }}</p>
    </div>
    <div class="flex items-center gap-4">
      <div v-if="loading" class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <label class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors" :class="{'opacity-50 cursor-not-allowed': loading}">
        <span>Upload XLSX</span>
        <input type="file" @change="$emit('file-select', $event)" accept=".xlsx" class="hidden" :disabled="loading">
      </label>
    </div>
  </header>
</template>

<script setup>
const props = defineProps({
  status: String,
  loading: Boolean,
});

const emit = defineEmits(['file-select']);
</script>
