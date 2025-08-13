// static/js/components/PdfSidebar.js

export default {
  props: {
    pdfs: Array,
    selectedPdfId: Number,
  },
  emits: ['select-pdf'],
  template: `
    <aside class="w-1/4 bg-white border-r border-gray-200 p-4 overflow-y-auto flex flex-col">
      <h2 class="text-lg font-semibold mb-4 text-gray-800 flex-shrink-0">My PDFs</h2>
      <div class="space-y-2 flex-grow overflow-y-auto">
        <div v-if="!pdfs.length" class="text-center text-gray-500 mt-8">
          <p>No PDFs processed yet.</p>
        </div>
        <a v-for="pdf in pdfs" :key="pdf.id"
           @click.prevent="$emit('select-pdf', pdf.id)"
           href="#"
           class="block p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200"
           :class="{ 'bg-blue-100 border-l-4 border-blue-500 font-semibold': selectedPdfId === pdf.id }">
          <p class="truncate text-sm text-gray-700">{{ pdf.name }}</p>
          <p class="text-xs text-gray-500">{{ pdf.createdAt ? new Date(pdf.createdAt).toLocaleString() : '' }}</p>
        </a>
      </div>
    </aside>
  `
};