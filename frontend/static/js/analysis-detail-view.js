// frontend/static/js/analysis-detail-view.js

export const AnalysisDetailView = {
  props: ['runId'],
  template: `
    <div>
      <div v-if="isLoading" class="text-center text-gray-500">
        <loading-spinner></loading-spinner>
      </div>
      <div v-else>
        <div class="flex justify-between items-start mb-4">
            <div>
                <button @click="navigate('analysis-runs-view', { setId: run.agentSetId })" class="text-sm text-blue-600 hover:underline mb-2">&larr; Back to Analyses</button>
                <h2 class="text-3xl font-bold text-gray-800">{{ run.name }}</h2>
                <p class="text-gray-500">For Agent Set: {{ agentSet.name }}</p>
            </div>
            <button @click="startAnalysis" :disabled="isAnalyzing" class="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                <span v-if="isAnalyzing">
                    <loading-spinner></loading-spinner> Analyzing...
                </span>
                <span v-else>
                    Run Analysis
                </span>
            </button>
        </div>

        <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700">Analysis Context (Overall Goal)</label>
            <textarea v-model="run.context" @change="saveContext" rows="3" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., 'Review these recipes for a client with a nut allergy.'"></textarea>
        </div>


        <!-- Tab Navigation -->
        <div class="border-b border-gray-200">
            <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                <button @click="activeTab = 'documents'" :class="[activeTab === 'documents' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm']">
                Documents
                </button>
                <button @click="activeTab = 'results'" :class="[activeTab === 'results' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300', 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm']">
                Results
                </button>
            </nav>
        </div>

        <!-- Tab Content -->
        <div class="mt-6">
            <docs-view v-if="activeTab === 'documents'" :analysis-run-id="runId"></docs-view>
            <results-view v-if="activeTab === 'results'" :analysis-run-id="runId"></results-view>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      isLoading: true,
      isAnalyzing: false,
      run: {},
      agentSet: {},
      activeTab: 'documents', // 'documents' or 'results'
    };
  },
  async created() {
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      this.isLoading = true;
      this.run = await db.analysisRuns.get(this.runId);
      if (this.run) {
        this.agentSet = await db.agentSets.get(this.run.agentSetId);
      }
      this.isLoading = false;
    },
    async saveContext() {
        await db.analysisRuns.update(this.run.id, { context: this.run.context });
    },
    async startAnalysis() {
        this.isAnalyzing = true;
        const agents = await db.agents.where('id').anyOf(this.agentSet.agentIds).toArray();
        const documents = await db.documents.where({ analysisRunId: this.runId }).toArray();

        if (documents.length === 0) {
            alert('Please upload at least one document before running the analysis.');
            this.isAnalyzing = false;
            return;
        }

        // Clear previous results for this run
        await db.results.where({ analysisRunId: this.runId }).delete();
        this.activeTab = 'results';

        const analysisPromises = agents.map(agent => {
            const requestBody = {
                name: agent.name,
                prompt: agent.prompt,
                documents: documents.map(d => ({ filename: d.filename, text: d.text })),
                context: this.run.context
            };

            return fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.detail || 'Analysis failed') });
                }
                return response.json();
            })
            .then(result => {
                return db.results.add({
                    analysisRunId: this.runId,
                    agentId: agent.id,
                    agentName: result.name,
                    report: result.report,
                    rankings: result.rankings,
                    createdAt: new Date()
                });
            })
            .catch(error => {
                console.error(`Error analyzing with agent ${agent.name}:`, error);
                // Store an error result in the DB
                return db.results.add({
                    analysisRunId: this.runId,
                    agentId: agent.id,
                    agentName: agent.name,
                    report: `**Analysis Failed:**\n\n${error.message}`,
                    rankings: [],
                    createdAt: new Date()
                });
            });
        });

        await Promise.all(analysisPromises);
        this.isAnalyzing = false;
    },
    navigate(view, params) {
      window.eventBus.emit('navigate', view, params);
    }
  }
};
