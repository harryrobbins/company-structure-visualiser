// frontend/src/main.js
import { createApp } from 'vue';
import { createLogger, setContext } from './logging.js';
import App from './App.vue';

// This is the crucial line. It imports your stylesheet, which
// loads Tailwind and allows the application layout to work correctly.
import './index.css';

const log = createLogger('app');
window.LOG = log; // optional global for quick diagnostics

setContext({ env: 'browser', root: window.ROOT_PATH || '' });

const app = createApp(App);
app.mount('#app');

log.info('app.mounted');

