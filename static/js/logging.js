// static/js/logging.js (ESM)
// Lightweight structured logger with context + global error capture.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const LEVEL_NAME = Object.fromEntries(Object.entries(LEVELS).map(([k, v]) => [v, k]));

let globalLevel = (typeof localStorage !== 'undefined' && localStorage.getItem('LOG_LEVEL')) || 'info';
if (!LEVELS[globalLevel]) globalLevel = 'info';

const globalContext = {
  app: 'pdf-text-extractor',
  requestId: sessionStorage.getItem('REQUEST_ID') || null,
};

export function setLogLevel(level) {
  if (LEVELS[level]) {
    globalLevel = level;
    try { localStorage.setItem('LOG_LEVEL', level); } catch {}
  }
}

export function setContext(ctx = {}) {
  Object.assign(globalContext, ctx);
  if (ctx.requestId) {
    try { sessionStorage.setItem('REQUEST_ID', ctx.requestId); } catch {}
  }
}

function nowIso() { return new Date().toISOString(); }

function shouldLog(level) { return LEVELS[level] >= LEVELS[globalLevel]; }

function write(level, ns, msg, extra) {
  if (!shouldLog(level)) return;
  const payload = {
    ts: nowIso(),
    level,
    ns,
    msg,
    ...globalContext,
    ...extra,
  };
  // Console output
  const line = `[${payload.ts}] ${level.toUpperCase()} ${ns}: ${msg}`;
  if (level === 'error') console.error(line, extra || {});
  else if (level === 'warn') console.warn(line, extra || {});
  else if (level === 'info') console.info(line, extra || {});
  else console.debug(line, extra || {});
  // Hook: forward to backend later if desired
}

export function createLogger(namespace) {
  return {
    debug: (msg, extra) => write('debug', namespace, msg, extra),
    info:  (msg, extra) => write('info',  namespace, msg, extra),
    warn:  (msg, extra) => write('warn',  namespace, msg, extra),
    error: (msg, extra) => write('error', namespace, msg, extra),
  };
}

// Global error capture
window.addEventListener('error', (e) => {
  write('error', 'global', e.message || 'uncaught error', { file: e.filename, line: e.lineno, col: e.colno });
});

window.addEventListener('unhandledrejection', (e) => {
  write('error', 'global', 'unhandled rejection', { reason: (e.reason && (e.reason.message || e.reason)) || null });
});

// Helper to extract request-id from responses and set context
export async function logFetch(input, init) {
  const start = performance.now();
  const res = await fetch(input, init);
  const rid = res.headers.get('x-request-id');
  if (rid) setContext({ requestId: rid });
  const ms = Math.round(performance.now() - start);
  write('info', 'fetch', 'http', { url: (typeof input === 'string' ? input : input.url), status: res.status, ms });
  return res;
}