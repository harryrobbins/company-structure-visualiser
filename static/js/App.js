// static/js/App.js (ESM + robust logging & errors)
import { ref, onMounted, computed } from 'vue';
import { db } from './db.js';
import { createLogger, logFetch } from 'logging';
import * as pdfjsLib from 'pdfjs';

const log = createLogger('App');

// Ensure PDF.js worker path is local (no network)
pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.ROOT_PATH || ''}/static/libs/pdf.worker.mjs`;

export default {
  setup() {
    // --- State ---
    const pdfs = ref([]);
    const selectedPdfId = ref(null);
    const status = ref('Select a PDF file to begin.');
    const loading = ref(false);
    const scale = ref(3.0);

    // --- Derived ---
    const selectedPdf = computed(() => {
      return selectedPdfId.value ? pdfs.value.find(p => p.id === selectedPdfId.value) || null : null;
    });

    // --- Helpers ---
    const updateStatus = (msg) => {
      status.value = msg;
      log.info('status.update', { msg });
    };

    // --- Data access ---
    const loadPdfs = async () => {
      try {
        updateStatus('Loading previous PDFs...');
        const allPdfs = await db.pdfs.orderBy('createdAt').reverse().toArray();
        pdfs.value = allPdfs;
        updateStatus(allPdfs.length ? 'Select a PDF to view.' : 'No PDFs found. Please upload one.');
        log.info('pdfs.loaded', { count: allPdfs.length });
      } catch (error) {
        log.error('pdfs.load_failed', { error: String(error) });
        status.value = 'Error: Could not load PDFs.';
      }
    };

    // --- UI actions ---
    const handleFileSelect = async (event) => {
      const file = event?.target?.files?.[0];
      if (!file || file.type !== 'application/pdf') {
        status.value = 'Please select a valid PDF file.';
        log.warn('file.invalid', { type: file?.type || null, name: file?.name || null });
        return;
      }

      loading.value = true;
      updateStatus('Loading PDF...');
      selectedPdfId.value = null;

      try {
        const pdfData = await file.arrayBuffer();
        const pdfId = await db.pdfs.add({
          name: file.name,
          pages: [],
          responseText: '',
          createdAt: new Date(),
        });
        log.info('db.pdf_added', { pdfId, name: file.name, size: file.size });

        const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(pdfData) }).promise;
        updateStatus(`Processing ${pdfDoc.numPages} pages...`);

        const pagePromises = Array.from({ length: pdfDoc.numPages }, (_, i) => renderPageAsPng(pdfDoc, i + 1));
        const pageImagesAll = await Promise.all(pagePromises);
        const pageImages = pageImagesAll.filter(Boolean); // drop failed pages if any
        if (pageImages.length !== pageImagesAll.length) {
          log.warn('render.pages_partial', { requested: pageImagesAll.length, rendered: pageImages.length });
        }
        await db.pdfs.update(pdfId, { pages: pageImages });

        updateStatus('PDF pages converted. Extracting text...');
        await processAndExtractText(pdfId, pageImages);
        await loadPdfs();
        selectPdf(pdfId);
      } catch (error) {
        log.error('file.process_failed', { error: String(error) });
        status.value = `Error: ${error?.message || error}`;
      } finally {
        loading.value = false;
        if (event && event.target) event.target.value = '';
      }
    };

    const renderPageAsPng = async (pdfDoc, pageNum) => {
      try {
        updateStatus(`Rendering page ${pageNum}...`);
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: Number(scale.value) || 3.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/png');
        log.debug('render.page_done', { page: pageNum, w: canvas.width, h: canvas.height });
        return dataUrl;
      } catch (error) {
        log.error('render.page_failed', { page: pageNum, error: String(error) });
        return null;
      }
    };

    const processAndExtractText = async (pdfId, pageImages) => {
      status.value = 'Sending images to AI for text extraction...';
      try {
        const extractionPromises = pageImages.map((imageData, index) =>
          logFetch(`${window.ROOT_PATH || ''}/api/extract_text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page_number: index + 1, image_data: imageData }),
          }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        );

        const results = await Promise.all(extractionPromises);
        log.info('extraction.complete', { pages: results.length });

        const combinedText = results
          .sort((a, b) => a.page_number - b.page_number)
          .map((res) => `--- Page ${res.page_number} ---\n\n${res.text}`)
          .join('\n\n');

        await db.pdfs.update(pdfId, { responseText: combinedText });
        status.value = 'Text extraction complete!';
      } catch (error) {
        log.error('extraction.failed', { error: String(error) });
        const errorMessage = `Error during text extraction: ${error?.message || error}`;
        status.value = errorMessage;
        await db.pdfs.update(pdfId, { responseText: errorMessage });
      }
    };

    const selectPdf = (id) => {
      selectedPdfId.value = id;
      const pdf = pdfs.value.find((p) => p.id === id);
      if (pdf) {
        updateStatus(`Viewing ${pdf.name}`);
      } else {
        log.warn('pdf.select_missing', { id });
      }
    };

    // --- Lifecycle ---
    onMounted(() => {
      log.info('mounted');
      loadPdfs();
    });

    // --- Expose to template ---
    return {
      pdfs,
      selectedPdf,
      selectedPdfId,
      status,
      loading,
      scale,
      handleFileSelect,
      selectPdf,
    };
  },
  template: `
    <div class="flex h-screen bg-gray-100 font-sans">
      <pdf-sidebar
        :pdfs="pdfs"
        :selected-pdf-id="selectedPdfId"
        @select-pdf="selectPdf"
      ></pdf-sidebar>

      <main class="flex-1 flex flex-col">
        <app-header
          :status="status"
          :loading="loading"
          v-model:scale="scale"
          @file-select="handleFileSelect"
        ></app-header>

        <pdf-viewer :selected-pdf="selectedPdf"></pdf-viewer>
      </main>
    </div>
  `,
};
