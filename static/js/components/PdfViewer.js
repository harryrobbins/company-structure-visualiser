// static/js/components/PdfViewer.js

export default {
  props: {
    selectedPdf: Object,
  },
  template: `
    <div class="flex-1 flex overflow-hidden">
      <!-- Left panel for PDF page images -->
      <div class="w-1/2 p-6 overflow-y-auto bg-gray-50">
        <div v-if="!selectedPdf" class="text-center text-gray-500 pt-16">
          <h3 class="text-lg">Select a PDF from the list or upload a new one.</h3>
        </div>
        <div v-else class="space-y-4">
           <h3 class="text-lg font-semibold text-gray-800 sticky top-0 bg-gray-50 py-2 z-10">{{ selectedPdf.name }} - Pages</h3>
           <div v-for="(pageImage, index) in selectedPdf.pages" :key="index" class="bg-white p-2 rounded-lg shadow-md border">
             <img :src="pageImage" :alt="'Page ' + (index + 1)" class="w-full h-auto rounded">
             <p class="text-center text-sm font-medium text-gray-600 mt-2">Page {{ index + 1 }}</p>
           </div>
        </div>
      </div>
      <!-- Right panel for extracted text -->
      <div class="w-1/2 p-6 overflow-y-auto bg-white border-l">
         <h3 class="text-lg font-semibold text-gray-800 sticky top-0 bg-white py-2 z-10">Extracted Text</h3>
         <div v-if="selectedPdf && selectedPdf.responseText" class="prose max-w-none whitespace-pre-wrap text-gray-800">
            {{ selectedPdf.responseText }}
         </div>
         <div v-else-if="selectedPdf" class="text-center text-gray-500 pt-16">
            <p>No text extracted yet, or the process is ongoing.</p>
         </div>
         <div v-else class="text-center text-gray-500 pt-16">
            <p>Text will appear here after processing.</p>
         </div>
      </div>
    </div>
  `
};