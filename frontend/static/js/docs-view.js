// frontend/static/js/docs-view.js

export const DocsView = {
  props: ['analysisRunId'],
  template: `
    <div>
      <div class="mb-4 p-4 border-2 border-dashed rounded-lg text-center"
           :class="{'bg-blue-50 border-blue-400': isDragOver}"
           @dragover.prevent="isDragOver = true"
           @dragleave.prevent="isDragOver = false"
           @drop.prevent="handleDrop">
        <label for="file-upload" class="cursor-pointer">
          <p class="text-gray-600">Drag & drop files here, or click to select files.</p>
          <p class="text-sm text-gray-500">Supports: PDF, DOCX, XLSX, TXT, MD, Images</p>
        </label>
        <input id="file-upload" type="file" multiple @change="handleFileInput" class="hidden" />
      </div>

      <div v-if="isProcessing" class="text-center text-gray-500">
        <loading-spinner></loading-spinner>
        <p>Processing {{ processingFile }}...</p>
      </div>

      <div v-if="documents.length > 0" class="space-y-4">
        <h3 class="text-xl font-semibold text-gray-800">Uploaded Documents</h3>
        <div v-for="doc in documents" :key="doc.id" class="bg-white p-4 rounded-lg shadow-sm border">
          <div class="flex justify-between items-start">
            <p class="font-medium text-gray-800">{{ doc.filename }}</p>
            <button @click="deleteDoc(doc.id)" class="text-red-500 hover:text-red-700">Delete</button>
          </div>
          <pre class="mt-2 bg-gray-50 p-2 rounded text-sm overflow-auto max-h-40 border">{{ doc.text.substring(0, 500) + (doc.text.length > 500 ? '...' : '') }}</pre>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      documents: [],
      isDragOver: false,
      isProcessing: false,
      processingFile: '',
    };
  },
  async created() {
    await this.fetchDocuments();
  },
  methods: {
    async fetchDocuments() {
      if (!this.analysisRunId) return;
      this.documents = await db.documents.where({ analysisRunId: this.analysisRunId }).toArray();
    },
    handleDrop(event) {
      this.isDragOver = false;
      const files = event.dataTransfer.files;
      this.handleFiles(files);
    },
    handleFileInput(event) {
      const files = event.target.files;
      this.handleFiles(files);
    },
    async handleFiles(files) {
      this.isProcessing = true;
      for (const file of Array.from(files)) {
        this.processingFile = file.name;
        try {
          const { text, filetype } = await this.extractText(file);
          await db.documents.add({
            analysisRunId: this.analysisRunId,
            filename: file.name,
            text: text,
            filetype: filetype
          });
        } catch (error) {
          console.error(`Failed to process file ${file.name}:`, error);
          alert(`Could not process ${file.name}. See console for details.`);
        }
      }
      this.isProcessing = false;
      this.processingFile = '';
      await this.fetchDocuments();
    },
    async deleteDoc(id) {
      await db.documents.delete(id);
      await this.fetchDocuments();
    },
    async extractText(file) {
      const filetype = file.type;
      const filename = file.name.toLowerCase();

      if (filetype.startsWith('image/')) {
        const text = await this.fileToBase64(file);
        return { text, filetype };
      }
      if (filename.endsWith('.pdf')) {
        const text = await this.extractPdfText(file);
        return { text, filetype };
      }
      if (filename.endsWith('.docx')) {
        const text = await this.extractDocxText(file);
        return { text, filetype };
      }
      if (filename.endsWith('.xlsx')) {
        const text = await this.extractXlsxText(file);
        return { text, filetype };
      }
      if (filename.endsWith('.md') || filename.endsWith('.txt')) {
        const text = await file.text();
        return { text, filetype };
      }
      throw new Error('Unsupported file type');
    },
    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },
    extractPdfText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const pdf = await window.pdfjsLib.getDocument({data: event.target.result}).promise;
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              text += content.items.map(item => item.str).join(' ');
            }
            resolve(text);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsArrayBuffer(file);
      });
    },
    extractDocxText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const result = await mammoth.extractRawText({ arrayBuffer: event.target.result });
            resolve(result.value);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsArrayBuffer(file);
      });
    },
    extractXlsxText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            let text = '';
            workbook.SheetNames.forEach(sheetName => {
              text += `Sheet: ${sheetName}\\n\\n`;
              const worksheet = workbook.Sheets[sheetName];
              text += XLSX.utils.sheet_to_csv(worksheet);
              text += '\\n\\n';
            });
            resolve(text);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsArrayBuffer(file);
      });
    }
  }
};
