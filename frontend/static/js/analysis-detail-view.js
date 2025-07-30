// frontend/static/js/analysis-detail-view.js
import { logger } from './logger.js';

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
            <!-- FIX: Group the action buttons together -->
            <div class="flex items-center space-x-2">
                <button @click="startAnalysis" :disabled="isAnalyzing" class="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                    <span v-if="isAnalyzing">
                        <loading-spinner></loading-spinner> Analyzing...
                    </span>
                    <span v-else>
                        Run Analysis
                    </span>
                </button>
                <!-- FIX: Add a button to re-run the analysis -->
                <button @click="reRunAnalysis" :disabled="isAnalyzing" title="Re-run Analysis" class="px-4 py-3 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors disabled:bg-gray-400">
                    <!-- A simple refresh icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
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
    logger.log('AnalysisDetailView created for runId:', this.runId);
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      this.isLoading = true;
      // The runId prop can be a string, so ensure it's a number for Dexie.
      const runId = parseInt(this.runId, 10);
      this.run = await db.analysisRuns.get(runId);
      if (this.run) {
        this.agentSet = await db.agentSets.get(this.run.agentSetId);
      }
      this.isLoading = false;
    },
    async saveContext() {
        await db.analysisRuns.update(this.run.id, { context: this.run.context });
    },
    // FIX: Add a method to handle re-running the analysis.
    async reRunAnalysis() {
        if (window.confirm("Are you sure you want to re-run this analysis? All existing results for this run will be deleted.")) {
            await this.startAnalysis();
        }
    },
    async startAnalysis() {
        logger.info(`Starting analysis for run ID: ${this.runId}`);
        this.isAnalyzing = true;
        const runId = parseInt(this.runId, 10);
        const agents = await db.agents.where('id').anyOf(this.agentSet.agentIds).toArray();
        const documents = await db.documents.where({ analysisRunId: runId }).toArray();

        logger.log('Analysis details:', {
            runId: runId,
            agentSet: this.agentSet.name,
            agentsToRun: agents.map(a => a.name),
            documentCount: documents.length
        });

        if (documents.length === 0) {
            logger.warn('Analysis stopped: No documents uploaded.');
            alert('Please upload at least one document before running the analysis.');
            this.isAnalyzing = false;
            return;
        }

        logger.log('Clearing previous results for this run.');
        await db.results.where({ analysisRunId: runId }).delete();
        this.activeTab = 'results';

        const analysisPromises = agents.map(agent => {
            const requestBody = {
                name: agent.name,
                prompt: agent.prompt,
                documents: documents.map(d => ({ filename: d.filename, text: d.text })),
                context: this.run.context
            };

            logger.log(`Preparing to call /api/analyze for agent: ${agent.name}`, { requestBody });

            return fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            })
            .then(response => {
                logger.log(`Received response from /api/analyze for agent ${agent.name}. Status: ${response.status}`);
                if (!response.ok) {
                    return response.json().then(err => {
                        logger.error(`Analysis failed for agent ${agent.name}.`, err);
                        throw new Error(err.detail || 'Analysis failed')
                    });
                }
                return response.json();
            })
            .then(result => {
                logger.info(`Successfully received and parsed result for agent ${agent.name}`, { result });
                const resultToSave = {
                    analysisRunId: runId,
                    agentId: agent.id,
                    agentName: result.name,
                    report: result.report,
                    rankings: result.rankings,
                    createdAt: new Date()
                };
                logger.log(`Saving result to database for agent ${agent.name}`, { resultToSave });
                return db.results.add(resultToSave);
            })
            .catch(error => {
                logger.error(`Error in analysis chain for agent ${agent.name}:`, error);
                // Store an error result in the DB
                return db.results.add({
                    analysisRunId: runId,
                    agentId: agent.id,
                    agentName: agent.name,
                    report: `**Analysis Failed:**\n\n${error.message}`,
                    rankings: [],
                    createdAt: new Date()
                });
            });
        });

        await Promise.all(analysisPromises);
        logger.info('All analysis promises have completed.');
        this.isAnalyzing = false;
    },
    navigate(view, params) {
      window.eventBus.emit('navigate', view, params);
    }
  }
};
