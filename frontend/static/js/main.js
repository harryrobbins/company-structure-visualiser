// frontend/static/js/main.js

// --- Import Views ---
import { HomeView } from './home-view.js';
import { AgentsView } from './agents-view.js';
import { SetsView } from './sets-view.js';
import { AnalysisRunsView } from './analysis-runs-view.js'; // <-- ADDED
import { AnalysisDetailView } from './analysis-detail-view.js';

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

const App = {
  data() {
    return {
      currentView: 'home-view',
      viewParams: {},
    }
  },
  created() {
    eventBus.on('navigate', (view, params = {}) => {
      this.navigate(view, params);
    });
  },
  methods: {
    navigate(view, params = {}) {
      this.currentView = view;
      this.viewParams = params;
      window.scrollTo(0, 0);
    },
    isActive(view) {
      // This logic helps highlight the correct navigation tab.
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
                 </div>
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
app.component('analysis-runs-view', AnalysisRunsView); // <-- ADDED
app.component('analysis-detail-view', AnalysisDetailView);

// These components are used dynamically by other views
app.component('docs-view', DocsView);
app.component('results-view', ResultsView);


// Mount the app
app.mount('#app');
