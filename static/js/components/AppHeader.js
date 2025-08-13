// static/js/components/AppHeader.js

export default {
  props: {
    status: String,
    loading: Boolean,
    scale: Number, // Use `scale` for the prop from the parent
  },
  emits: ['file-select', 'update:scale'], // Declare emitted events
  template: `
    <header class="bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 class="text-xl font-bold text-gray-900">PDF Text Extractor</h1>
        <p class="text-sm text-gray-600 h-5">{{ status }}</p>
      </div>
      <div class="flex items-center gap-4">
         <div v-if="loading" class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <div>
          <label for="scale" class="text-sm font-medium text-gray-700">Resolution:</label>
          <!-- Use v-model with a computed property for two-way binding -->
          <input 
            type="number" 
            id="scale" 
            :value="scale"
            @input="$emit('update:scale', $event.target.value)"
            min="1" max="10" step="0.1" 
            class="w-24 p-2 border border-gray-300 rounded-md ml-2 focus:ring-2 focus:ring-blue-500"
          >
        </div>
        <label class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 cursor-pointer transition-colors" :class="{'opacity-50 cursor-not-allowed': loading}">
          <span>Upload PDF</span>
          <input type="file" @change="$emit('file-select', $event)" accept="application/pdf" class="hidden" :disabled="loading">
        </label>
      </div>
    </header>
  `
};

