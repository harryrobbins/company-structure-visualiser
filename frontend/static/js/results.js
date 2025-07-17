// frontend/static/js/results.js

Vue.component('results-view', {
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
    };
  },
  async created() {
    await this.fetchResults();
    // Set up a listener for real-time updates
    this.setupLiveListener();
  },
  methods: {
    async fetchResults() {
      if (!this.analysisRunId) {
        this.isLoading = false;
        return;
      }
      this.isLoading = true;
      this.results = await db.results
        .where({ analysisRunId: this.analysisRunId })
        .sortBy('createdAt');
      this.isLoading = false;
    },
    setupLiveListener() {
      // Dexie's liveQuery provides real-time updates from the database
      Dexie.liveQuery(() =>
        db.results.where({ analysisRunId: this.analysisRunId }).sortBy('createdAt')
      ).subscribe(
        (updatedResults) => {
          this.results = updatedResults;
        },
        (error) => {
          console.error("Live query failed:", error);
        }
      );
    }
  }
});
