// frontend/static/js/logger.js

/**
 * A simple, globally accessible logger that can be enabled/disabled via the UI.
 * When enabled, it provides timestamped and color-coded logs in the browser's developer console.
 *
 * Usage:
 * 1. Import it: `import { logger } from './logger.js';`
 * 2. Use it: `logger.log('My message', myObject);`
 *
 * You can also toggle it from the console by typing `aigentLogger.toggle()`.
 */

const LOGGING_KEY = 'AIGENT_LOGGING_ENABLED';

// The logger object itself.
export const logger = {
  _isEnabled: false, // Internal state

  /**
   * Initializes the logger by checking localStorage for the persisted state.
   * This should be called once when the application starts.
   */
  init() {
    this._isEnabled = localStorage.getItem(LOGGING_KEY) === 'true';
    if (this._isEnabled) {
      console.log('%c[Logger] Logging is enabled. Refresh page to see initial load logs.', 'color: #4CAF50; font-weight: bold;');
    }
  },

  /**
   * Toggles the logging state on or off and saves the preference to localStorage.
   * @param {boolean} [forceState] - Optional: force logging to be on (true) or off (false).
   */
  toggle(forceState) {
    this._isEnabled = typeof forceState === 'boolean' ? forceState : !this._isEnabled;
    localStorage.setItem(LOGGING_KEY, this._isEnabled);
    console.log(`%c[Logger] Logging has been ${this._isEnabled ? 'ENABLED' : 'DISABLED'}.`, 'color: #4CAF50; font-weight: bold;');
    if (this._isEnabled) {
        console.log('%c[Logger] Refresh the page to see logs from initialization.', 'color: #FF9800;');
    }
  },

  /**
   * Checks if logging is currently enabled.
   * @returns {boolean}
   */
  isEnabled() {
    return this._isEnabled;
  },

  /**
   * The internal log-writing function.
   * @private
   */
  _log(level, ...args) {
    if (!this._isEnabled) return;

    const colors = {
      log: '#2196F3',   // Blue
      info: '#4CAF50',  // Green
      warn: '#FFC107',  // Amber
      error: '#F44336', // Red
    };

    const color = colors[level] || '#FFFFFF';
    const timestamp = new Date().toISOString();

    console[level](`%c[${timestamp}] [${level.toUpperCase()}]`, `color: ${color}; font-weight: bold;`, ...args);
  },

  // Public logging methods
  log(...args) { this._log('log', ...args); },
  info(...args) { this._log('info', ...args); },
  warn(...args) { this._log('warn', ...args); },
  error(...args) { this._log('error', ...args); },
};

// Make it globally available for convenience in the console.
window.aigentLogger = logger;
