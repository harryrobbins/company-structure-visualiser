// frontend/static/js/results-view.js
import { logger } from './logger.js';

export const ResultsView = {
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
            <!-- FIX: Use v-html to render the report after converting it from Markdown to HTML. -->
            <!-- The 'prose' class from Tailwind will style the rendered HTML nicely. -->
            <div class="prose max-w-none p-4 bg-gray-50 rounded-md border" v-html="formatMarkdown(res.report)"></div>
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
      liveQuery: null,
      // FIX: Create an instance of the showdown converter when the component is created.
      markdownConverter: new showdown.Converter(),
    };
  },
  created() {
    logger.log('ResultsView created for analysisRunId:', this.analysisRunId);
    this.setupLiveListener();
  },
  unmounted() {
    logger.log('ResultsView unmounted, unsubscribing from live query.');
    // Clean up the live query when the component is destroyed
    if (this.liveQuery) {
        this.liveQuery.unsubscribe();
    }
  },
  methods: {
    // FIX: Add a method to convert a Markdown string to HTML.
    formatMarkdown(text) {
        // Ensure that if the report is empty or null, we don't cause an error.
        if (!text) return '';
        return this.markdownConverter.makeHtml(text);
    },
    setupLiveListener() {
      if (!this.analysisRunId) {
        logger.warn('ResultsView: No analysisRunId provided, cannot set up listener.');
        this.isLoading = false;
        return;
      }
      this.isLoading = true;

      // BUG FIX: The analysisRunId prop is a string, but it's stored as a number in the database.
      // We must parse it to an integer to ensure the 'where' clause finds a match.
      const runId = parseInt(this.analysisRunId, 10);
      logger.log(`Setting up live listener for runId: ${runId}`);

      this.liveQuery = Dexie.liveQuery(() =>
        db.results.where({ analysisRunId: runId }).sortBy('createdAt')
      );

      this.liveQuery.subscribe({
        next: (updatedResults) => {
          logger.info(`Live query updated for runId ${runId}. Found ${updatedResults.length} results.`, { updatedResults });
          this.results = updatedResults;
          this.isLoading = false;
        },
        error: (error) => {
          logger.error(`Live query failed for runId ${runId}:`, error);
          this.isLoading = false;
        }
      });
    }
  }
};
