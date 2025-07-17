// frontend/static/js/analysis-runs-view.js

export const AnalysisRunsView = {
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
            window.eventBus.emit('navigate', 'analysis-detail-view', { runId: runId });
        },
        navigate(view, params) {
            window.eventBus.emit('navigate', view, params);
        }
    }
};
