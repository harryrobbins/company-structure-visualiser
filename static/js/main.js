import { createApp } from 'vue';
import { createLogger, setContext } from 'logging';

import App from './App.js';
import AppHeader from './components/AppHeader.js';
import PdfSidebar from './components/PdfSidebar.js';
import PdfViewer from './components/PdfViewer.js';

const log = createLogger('app');
window.LOG = log; // optional global for quick diagnostics

setContext({ env: 'browser', root: window.ROOT_PATH || '' });

const app = createApp(App);
app.component('app-header', AppHeader);
app.component('pdf-sidebar', PdfSidebar);
app.component('pdf-viewer', PdfViewer);
app.mount('#app');

log.info('app.mounted');