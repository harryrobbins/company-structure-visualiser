// frontend/static/js/analysis-runs-view.js

export const AnalysisRunsView = {
  props: ['setId'],
  template: `
    <div>
      <div v-if="isLoading" class="text-center text-gray-500">
        <loading-spinner></loading-spinner>
        <p>Loading analysis runs...</p>
      </div>
      <div v-else>
        <div class="flex justify-between items-center mb-6">
          <div>
            <button @click="navigate('sets-view')" class="text-sm text-blue-600 hover:underline mb-2">&larr; Back to Agent Sets</button>
            <h2 class="text-3xl font-bold text-gray-800">Analyses for: {{ agentSet.name }}</h2>
          </div>
          <button @click="createNewRun" class="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors">
            + New Analysis Run
          </button>
        </div>

        <div v-if="runs.length === 0" class="text-center text-gray-500 bg-white p-8 rounded-lg shadow">
          <p>No analysis runs found for this set. Click "+ New Analysis Run" to create one.</p>
        </div>

        <div v-else class="space-y-4">
          <div v-for="run in runs" :key="run.id" class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" @click="goToRun(run.id)">
            <h3 class="text-xl font-semibold text-gray-900">{{ run.name }}</h3>
            <p class="text-sm text-gray-500 mt-1">Created: {{ new Date(run.createdAt).toLocaleString() }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      isLoading: true,
      agentSet: {},
      runs: [],
    };
  },
  async created() {
    // The setId prop is a string, but Dexie needs a number for lookups.
    await this.fetchData(parseInt(this.setId, 10));
  },
  methods: {
    async fetchData(setId) {
      this.isLoading = true;
      this.agentSet = await db.agentSets.get(setId);
      if (this.agentSet) {
        // Fetch runs for this set and sort them with the newest first.
        this.runs = await db.analysisRuns.where({ agentSetId: setId }).reverse().sortBy('createdAt');
      }
      this.isLoading = false;
    },
    async createNewRun() {
      // Prompt for a name for the new analysis run. A custom modal would be a good enhancement here.
      const name = prompt("Enter a name for this new analysis run:", `Analysis - ${new Date().toLocaleDateString()}`);
      if (name && name.trim()) {
        const newRun = {
          agentSetId: parseInt(this.setId, 10),
          name: name,
          context: '', // Context will be filled in on the detail view
          createdAt: new Date(),
          status: 'pending' // Initial status
        };
        // Add the new run to the database and get its ID.
        const newId = await db.analysisRuns.add(newRun);
        // Navigate to the detail view for the newly created run.
        this.goToRun(newId);
      }
    },
    goToRun(runId) {
      this.navigate('analysis-detail-view', { runId: runId });
    },
    navigate(view, params = {}) {
      // Use the global event bus to trigger navigation in the main App component.
      window.eventBus.emit('navigate', view, params);
    }
  }
};
