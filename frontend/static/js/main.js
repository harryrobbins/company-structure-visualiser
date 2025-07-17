// frontend/static/js/main.js

// --- Simple Event Bus for Vue 3 ---
// A simple event emitter to replace the Vue 2 event bus.
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


// --- Component Definitions ---

const LoadingSpinner = {
  template: `
    <div class="flex items-center justify-center p-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  `
};

const ModalComponent = {
  props: ['title'],
  template: `
    <transition name="modal-fade">
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click.self="$emit('close')">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
          <div class="p-4 border-b flex justify-between items-center">
            <h3 class="text-xl font-semibold">{{ title }}</h3>
            <button @click="$emit('close')" class="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
          </div>
          <div class="p-4 overflow-y-auto">
            <slot></slot>
          </div>
        </div>
      </div>
    </transition>
  `
};

const HomeView = {
  template: `
    <div class="bg-white p-8 rounded-lg shadow">
      <h1 class="text-4xl font-bold mb-4 text-gray-800">Welcome to AIGENT</h1>
      <p class="text-gray-600 text-lg mb-6">Your personal AI-powered document analysis workspace.</p>
      <div class="grid md:grid-cols-2 gap-6">
        <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 class="text-2xl font-semibold mb-2">1. Define Agents</h2>
            <p class="text-gray-600 mb-4">Create custom AI "Agents" with specific prompts and instructions to analyze your documents from any perspective you need.</p>
            <button @click="navigate('agents-view')" class="text-blue-600 font-semibold hover:underline">Manage Agents &rarr;</button>
        </div>
        <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 class="text-2xl font-semibold mb-2">2. Create Sets & Analyze</h2>
            <p class="text-gray-600 mb-4">Group your agents into "Sets", upload your documents, and run parallel analyses to get comprehensive insights quickly.</p>
            <button @click="navigate('sets-view')" class="text-blue-600 font-semibold hover:underline">Manage Agent Sets &rarr;</button>
        </div>
      </div>
    </div>
  `,
  methods: {
    navigate(view, params) {
      eventBus.emit('navigate', view, params);
    }
  }
};

const AgentsView = {
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-3xl font-bold text-gray-800">Agents</h2>
        <button @click="openCreateModal" class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors">
          + New Agent
        </button>
      </div>

      <div v-if="isLoading" class="text-center text-gray-500">
        <loading-spinner></loading-spinner>
        <p>Loading agents...</p>
      </div>
      <div v-else-if="agents.length === 0" class="text-center text-gray-500 bg-white p-8 rounded-lg shadow">
        <p>No agents found. Click "+ New Agent" to create one.</p>
      </div>
      <div v-else class="space-y-4">
        <div v-for="agent in agents" :key="agent.id" class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-xl font-semibold text-gray-900">{{ agent.name }}</h3>
              <p class="text-sm text-gray-500 mt-1 truncate">{{ agent.prompt }}</p>
            </div>
            <div class="flex space-x-2">
              <button @click="openEditModal(agent)" class="text-blue-500 hover:text-blue-700">Edit</button>
              <button @click="deleteAgent(agent)" class="text-red-500 hover:text-red-700">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <modal-component v-if="isModalOpen" :title="isEditing ? 'Edit Agent' : 'Create New Agent'" @close="closeModal">
        <form @submit.prevent="saveAgent">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Agent Name</label>
              <input v-model="currentAgent.name" type="text" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">System Prompt</label>
              <textarea v-model="currentAgent.prompt" rows="8" required class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="You are a helpful assistant..."></textarea>
            </div>
            <div>
              <h4 class="text-md font-medium text-gray-700 mb-2">Rankings (Optional)</h4>
              <div v-for="(ranking, index) in currentAgent.rankings" :key="index" class="flex items-center space-x-2 mb-2 bg-gray-50 p-2 rounded-md">
                <input v-model="ranking.title" type="text" placeholder="Ranking Title (e.g., 'Clarity')" class="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2">
                <button @click.prevent="removeRanking(index)" class="text-red-500 hover:text-red-700">&times;</button>
              </div>
              <button @click.prevent="addRanking" class="text-sm text-blue-600 hover:underline">+ Add Ranking</button>
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button type="button" @click="closeModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Agent</button>
          </div>
        </form>
      </modal-component>
    </div>
  `,
  data() {
    return {
      agents: [],
      isLoading: true,
      isModalOpen: false,
      isEditing: false,
      currentAgent: this.getEmptyAgent(),
    };
  },
  async created() {
    await this.fetchAgents();
  },
  methods: {
    getEmptyAgent() {
      return { id: null, name: '', prompt: '', rankings: [] };
    },
    async fetchAgents() {
      this.isLoading = true;
      this.agents = await db.agents.orderBy('name').toArray();
      this.isLoading = false;
    },
    addRanking() {
      this.currentAgent.rankings.push({ title: '' });
    },
    removeRanking(index) {
      this.currentAgent.rankings.splice(index, 1);
    },
    openCreateModal() {
      this.isEditing = false;
      this.currentAgent = this.getEmptyAgent();
      this.isModalOpen = true;
    },
    openEditModal(agent) {
      this.isEditing = true;
      this.currentAgent = JSON.parse(JSON.stringify(agent));
      this.isModalOpen = true;
    },
    closeModal() {
      this.isModalOpen = false;
    },
    async saveAgent() {
      if (!this.currentAgent.name || !this.currentAgent.prompt) {
        alert('Agent Name and Prompt are required.');
        return;
      }
      this.currentAgent.rankings = this.currentAgent.rankings.filter(r => r.title.trim() !== '');

      if (this.isEditing) {
        await db.agents.update(this.currentAgent.id, this.currentAgent);
      } else {
        await db.agents.add(this.currentAgent);
      }
      await this.fetchAgents();
      this.closeModal();
    },
    async deleteAgent(agent) {
      if (confirm(`Are you sure you want to delete the agent "${agent.name}"?`)) {
        await db.agents.delete(agent.id);
        await this.fetchAgents();
      }
    }
  }
};

const SetsView = {
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-3xl font-bold text-gray-800">Agent Sets</h2>
        <button @click="openCreateModal" class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors">
          + New Set
        </button>
      </div>

      <div v-if="isLoading" class="text-center text-gray-500">
        <loading-spinner></loading-spinner>
        <p>Loading sets...</p>
      </div>
      <div v-else-if="sets.length === 0" class="text-center text-gray-500 bg-white p-8 rounded-lg shadow">
        <p>No agent sets found. Click "+ New Set" to create one.</p>
      </div>
      <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="set in sets" :key="set.id" class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col">
          <div class="p-4 flex-grow">
            <h3 class="text-xl font-semibold text-gray-900">{{ set.name }}</h3>
            <p class="text-sm text-gray-500 mt-2">{{ (set.agentDetails || []).length }} agent(s)</p>
            <ul class="text-sm text-gray-600 mt-2 space-y-1 pl-4 list-disc">
              <li v-for="agent in set.agentDetails" :key="agent.id">{{ agent.name }}</li>
            </ul>
          </div>
          <div class="p-4 bg-gray-50 border-t flex justify-between items-center">
             <button @click="openEditModal(set)" class="text-sm text-blue-500 hover:text-blue-700">Manage Agents</button>
             <button @click="deleteSet(set)" class="text-sm text-red-500 hover:text-red-700">Delete</button>
          </div>
          <button @click="goToSet(set.id)" class="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-b-lg font-semibold text-blue-700">
            View Analyses &rarr;
          </button>
        </div>
      </div>

      <modal-component v-if="isModalOpen" :title="isEditing ? 'Manage Agents in Set' : 'Create New Set'" @close="closeModal">
        <form @submit.prevent="saveSet">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Set Name</label>
              <input v-model="currentSet.name" type="text" required :disabled="isEditing" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 disabled:bg-gray-100">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Select Agents</label>
              <div class="mt-2 border rounded-md max-h-60 overflow-y-auto">
                <div v-for="agent in allAgents" :key="agent.id" class="p-2 border-b flex items-center">
                  <input type="checkbox" :id="'agent-'+agent.id" :value="agent.id" v-model="currentSet.agentIds" class="h-4 w-4 text-blue-600 border-gray-300 rounded">
                  <label :for="'agent-'+agent.id" class="ml-3 text-sm text-gray-700">{{ agent.name }}</label>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button type="button" @click="closeModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Set</button>
          </div>
        </form>
      </modal-component>
    </div>
  `,
  data() {
    return {
      sets: [],
      allAgents: [],
      isLoading: true,
      isModalOpen: false,
      isEditing: false,
      currentSet: this.getEmptySet(),
    };
  },
  async created() {
    await this.fetchData();
  },
  methods: {
    getEmptySet() {
      return { id: null, name: '', agentIds: [] };
    },
    async fetchData() {
      this.isLoading = true;
      [this.allAgents, this.sets] = await Promise.all([
        db.agents.orderBy('name').toArray(),
        db.agentSets.orderBy('name').toArray()
      ]);
      for (const set of this.sets) {
        set.agentDetails = this.allAgents.filter(agent => set.agentIds.includes(agent.id));
      }
      this.isLoading = false;
    },
    openCreateModal() {
      this.isEditing = false;
      this.currentSet = this.getEmptySet();
      this.isModalOpen = true;
    },
    openEditModal(set) {
      this.isEditing = true;
      this.currentSet = JSON.parse(JSON.stringify(set));
      this.isModalOpen = true;
    },
    closeModal() {
      this.isModalOpen = false;
    },
    async saveSet() {
      if (!this.currentSet.name) {
        alert('Set Name is required.');
        return;
      }
      if (this.isEditing) {
        await db.agentSets.update(this.currentSet.id, { agentIds: this.currentSet.agentIds });
      } else {
        await db.agentSets.add({ name: this.currentSet.name, agentIds: this.currentSet.agentIds });
      }
      await this.fetchData();
      this.closeModal();
    },
    async deleteSet(set) {
      if (confirm(`Are you sure you want to delete the set "${set.name}"? This will not delete associated analyses.`)) {
        await db.agentSets.delete(set.id);
        await this.fetchData();
      }
    },
    goToSet(setId) {
      eventBus.emit('navigate', 'analysis-runs-view', { setId: setId });
    }
  }
};

const DocsView = {
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

const ResultsView = {
  props: ['analysisRunId'],
  template: `
    <div>
      <div v-if="isLoading" class="text-center text-gray-500">
        <loading-spinner></loading-spinner>
        <p>Loading results...</p>
      </div>
      <div v-else-if="results.length === 0" class="text-center text-gray-500 bg-white p-8 rounded-lg shadow">
        <p>No results yet. Run the analysis to see the output here.</p>
      </div>
      <div v-else class="space-y-6">
        <div v-for="res in results" :key="res.id" class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 class="text-2xl font-bold text-gray-800">{{ res.agentName }}</h3>
          <p class="text-sm text-gray-400 mb-4">Result received at: {{ new Date(res.createdAt).toLocaleString() }}</p>

          <div>
            <h4 class="font-semibold text-lg text-gray-700 mb-2">Report</h4>
            <div class="prose max-w-none p-4 bg-gray-50 rounded-md border whitespace-pre-wrap">{{ res.report }}</div>
          </div>

          <div v-if="res.rankings && res.rankings.length" class="mt-6">
            <h4 class="font-semibold text-lg text-gray-700 mb-3">Rankings</h4>
            <div class="space-y-4">
              <div v-for="r in res.rankings" :key="r.title" class="p-3 bg-gray-50 rounded-md border">
                <div class="flex justify-between items-center mb-1">
                    <span class="font-medium text-gray-700">{{ r.title }}</span>
                    <span class="font-bold text-blue-600 text-lg">{{ r.score.toFixed(1) }} / 10</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div class="bg-blue-500 h-2.5 rounded-full" :style="{ width: (r.score * 10) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      results: [],
      isLoading: true,
      liveQuery: null
    };
  },
  async created() {
    this.setupLiveListener();
  },
  unmounted() {
    // Clean up the live query when the component is destroyed
    if (this.liveQuery) {
        this.liveQuery.unsubscribe();
    }
  },
  methods: {
    setupLiveListener() {
      if (!this.analysisRunId) {
        this.isLoading = false;
        return;
      }
      this.isLoading = true;
      this.liveQuery = Dexie.liveQuery(() =>
        db.results.where({ analysisRunId: this.analysisRunId }).sortBy('createdAt')
      );

      this.liveQuery.subscribe({
        next: (updatedResults) => {
          this.results = updatedResults;
          this.isLoading = false;
        },
        error: (error) => {
          console.error("Live query failed:", error);
          this.isLoading = false;
        }
      });
    }
  }
};

// New Component: AnalysisRunsView
const AnalysisRunsView = {
    props: ['setId'],
    template: `
        <div>
            <div class="flex justify-between items-center mb-6">
                <div>
                    <button @click="navigate('sets-view')" class="text-sm text-blue-600 hover:underline mb-2">&larr; Back to Agent Sets</button>
                    <h2 class="text-3xl font-bold text-gray-800">Analyses for: {{ agentSet.name }}</h2>
                </div>
                <button @click="createNewRun" class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors">
                + New Analysis
                </button>
            </div>

            <div v-if="isLoading" class="text-center text-gray-500">
                <loading-spinner></loading-spinner>
            </div>
            <div v-else-if="runs.length === 0" class="text-center text-gray-500 bg-white p-8 rounded-lg shadow">
                <p>No analyses found for this set. Click "+ New Analysis" to create one.</p>
            </div>
            <div v-else class="space-y-4">
                <div v-for="run in runs" :key="run.id" class="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900">{{ run.name }}</h3>
                        <p class="text-sm text-gray-500">Created: {{ new Date(run.createdAt).toLocaleString() }}</p>
                    </div>
                    <button @click="goToRun(run.id)" class="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200">
                        Open
                    </button>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            isLoading: true,
            agentSet: {},
            runs: []
        }
    },
    async created() {
        await this.fetchData();
    },
    methods: {
        async fetchData() {
            this.isLoading = true;
            this.agentSet = await db.agentSets.get(this.setId);
            this.runs = await db.analysisRuns.where({ agentSetId: this.setId }).reverse().sortBy('createdAt');
            this.isLoading = false;
        },
        async createNewRun() {
            const name = prompt('Enter a name for this analysis run:', `Analysis ${new Date().toLocaleDateString()}`);
            if (name) {
                const newRunId = await db.analysisRuns.add({
                    agentSetId: this.setId,
                    name: name,
                    context: '',
                    createdAt: new Date(),
                    status: 'pending'
                });
                this.goToRun(newRunId);
            }
        },
        goToRun(runId) {
            alert(`Navigate to run ID ${runId} - not yet implemented`);
            // To implement, this would navigate to a tabbed view:
            // eventBus.emit('navigate', 'analysis-detail-view', { runId: runId });
        },
        navigate(view, params) {
            eventBus.emit('navigate', view, params);
        }
    }
};


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
app.component('docs-view', DocsView);
app.component('results-view', ResultsView);
app.component('analysis-runs-view', AnalysisRunsView);

// Mount the app
app.mount('#app');
