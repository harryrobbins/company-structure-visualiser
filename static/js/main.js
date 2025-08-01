// frontend/static/js/main.js

// --- Import Logger ---
import { logger } from './logger.js';

// --- Import Views ---
import { HomeView } from './home-view.js';
import { AgentsView } from './agents-view.js';
import { SetsView } from './sets-view.js';
import { AnalysisRunsView } from './analysis-runs-view.js';
import { AnalysisDetailView } from './analysis-detail-view.js';
// MODIFICATION: Import the new SettingsView
import { SettingsView } from './settings-view.js';


// --- Import Component Building Blocks ---
import { LoadingSpinner, ModalComponent } from './components.js';
import { DocsView } from './docs-view.js';
import { ResultsView } from './results-view.js';

// --- Simple Event Bus for Vue 3 ---
const eventBus = {
  events: {},
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  },
  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(...args));
    }
  }
};
window.eventBus = eventBus;

// --- Vue 3 App Initialization ---

// Initialize the logger as soon as the app starts.
logger.init();

const App = {
  data() {
    return {
      currentView: 'home-view',
      viewParams: {},
      isLoggingEnabled: logger.isEnabled(), // Control the toggle's appearance
    }
  },
  created() {
    // FIX: Add listeners for URL changes (initial load and back/forward buttons)
    window.addEventListener('popstate', this.handleRouteChange);
    this.handleRouteChange(); // Handle the initial URL on page load

    // The event bus is still used for programmatic navigation from components
    eventBus.on('navigate', (view, params = {}) => {
      this.navigate(view, params);
    });
  },
  methods: {
    /**
     * Toggles the console logger on/off and updates the button state.
     */
    toggleLogging() {
        logger.toggle();
        this.isLoggingEnabled = logger.isEnabled();
    },
    // FIX: New method to parse the URL hash and set the view
    handleRouteChange() {
        const hash = window.location.hash.slice(1) || '/';
        const [path, ...paramParts] = hash.split('/').filter(p => p);
        let view = 'home-view';
        let params = {};

        if (path === 'agents-view') {
            view = 'agents-view';
        } else if (path === 'sets-view') {
            view = 'sets-view';
        } else if (path === 'analysis-runs-view' && paramParts.length) {
            view = 'analysis-runs-view';
            params.setId = paramParts[0];
        } else if (path === 'analysis-detail-view' && paramParts.length) {
            view = 'analysis-detail-view';
            params.runId = paramParts[0];
        } else if (path === 'settings-view') {
            // MODIFICATION: Add routing for the new settings view
            view = 'settings-view';
        }


        this.currentView = view;
        this.viewParams = params;
    },
    // FIX: Update navigate method to push state to the browser history
    navigate(view, params = {}) {
      let hash = `#/${view}`;
      if (params.setId) {
          hash += `/${params.setId}`;
      }
      if (params.runId) {
          hash += `/${params.runId}`;
      }
      // Only push a new state if the URL is actually changing
      if (window.location.hash !== hash) {
          history.pushState(null, '', hash);
      }
      // Manually call the route handler to update the view
      this.handleRouteChange();
      window.scrollTo(0, 0);
    },
    isActive(view) {
      if (this.currentView.startsWith('analysis')) return view === 'sets';
      return this.currentView.startsWith(view);
    }
  },
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm sticky top-0 z-40">
        <div class="container mx-auto px-4">
          <nav class="flex items-center justify-between h-16">
            <div class="flex items-center space-x-8">
                <h1 class="text-2xl font-bold text-blue-600">AIGENT</h1>
                <div class="flex space-x-4">
                   <button @click="navigate('home-view')" :class="{'text-blue-600 border-b-2 border-blue-600': isActive('home')}" class="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Home</button>
                    <button @click="navigate('agents-view')" :class="{'text-blue-600 border-b-2 border-blue-600': isActive('agents')}" class="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Agents</button>
                    <button @click="navigate('sets-view')" :class="{'text-blue-600 border-b-2 border-blue-600': isActive('sets')}" class="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Agent Sets</button>
                    <!-- MODIFICATION: Add a navigation button for the Settings view -->
                    <button @click="navigate('settings-view')" :class="{'text-blue-600 border-b-2 border-blue-600': isActive('settings')}" class="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Settings</button>
                 </div>
            </div>
            <!-- Logging Toggle Button -->
            <div class="flex items-center">
                <button @click="toggleLogging" class="p-2 rounded-md hover:bg-gray-100" :title="isLoggingEnabled ? 'Disable Console Logging' : 'Enable Console Logging'">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" :class="{'text-green-500': isLoggingEnabled, 'text-gray-400': !isLoggingEnabled}">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </button>
            </div>
          </nav>
        </div>
      </header>
      <main class="container mx-auto p-4 md:p-6">
        <component :is="currentView" :key="JSON.stringify(viewParams)" v-bind="viewParams"></component>
      </main>
    </div>
  `
};

const app = Vue.createApp(App);

// Register all components globally
app.component('loading-spinner', LoadingSpinner);
app.component('modal-component', ModalComponent);
app.component('home-view', HomeView);
app.component('agents-view', AgentsView);
app.component('sets-view', SetsView);
app.component('analysis-runs-view', AnalysisRunsView);
app.component('analysis-detail-view', AnalysisDetailView);
app.component('docs-view', DocsView);
app.component('results-view', ResultsView);
// MODIFICATION: Register the new SettingsView component
app.component('settings-view', SettingsView);


app.mount('#app');
