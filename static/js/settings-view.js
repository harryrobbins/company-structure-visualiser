// frontend/static/js/settings-view.js
import { logger } from './logger.js';

export const SettingsView = {
  template: `
    <div>
      <div v-if="mode === 'menu'">
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Settings</h2>
        <div class="grid md:grid-cols-2 gap-6">
          <div class="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <h3 class="text-xl font-semibold mb-2">Export Data</h3>
            <p class="text-gray-600 mb-4">Export your agents and agent sets to a JSON file for backup or sharing.</p>
            <button @click="showExport" class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700">Go to Export &rarr;</button>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <h3 class="text-xl font-semibold mb-2">Import Data</h3>
            <p class="text-gray-600 mb-4">Import agents and agent sets from a previously exported JSON file.</p>
            <button @click="showImport" class="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700">Go to Import &rarr;</button>
          </div>
        </div>
      </div>

      <div v-if="mode === 'export'">
        <button @click="showMenu" class="text-sm text-blue-600 hover:underline mb-4">&larr; Back to Settings</button>
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Export Data</h2>
        <div v-if="isLoading" class="text-center"><loading-spinner></loading-spinner></div>
        <div v-else class="grid md:grid-cols-2 gap-8">
          <div>
            <h3 class="text-xl font-semibold mb-3">Select Agents</h3>
            <div class="bg-white p-4 rounded-lg border max-h-96 overflow-y-auto">
              <div v-for="agent in exportableAgents" :key="'agent-'+agent.id" class="flex items-center p-2 border-b">
                <input type="checkbox" :id="'agent-export-'+agent.id" v-model="selectedAgents[agent.id]" class="h-4 w-4 text-blue-600 border-gray-300 rounded">
                <label :for="'agent-export-'+agent.id" class="ml-3 text-sm text-gray-700">{{ agent.name }}</label>
              </div>
            </div>
          </div>
          <div>
            <h3 class="text-xl font-semibold mb-3">Select Sets (and their Agents)</h3>
            <div class="bg-white p-4 rounded-lg border max-h-96 overflow-y-auto">
              <div v-for="set in exportableSets" :key="'set-'+set.id" class="p-2 border-b">
                <!-- MODIFICATION: Added a @change handler to cascade selection down to agents -->
                <div class="flex items-center">
                    <input type="checkbox" :id="'set-export-'+set.id" v-model="selectedSets[set.id]" @change="onSetSelectionChange(set, $event.target.checked)" class="h-4 w-4 text-blue-600 border-gray-300 rounded">
                    <label :for="'set-export-'+set.id" class="ml-3 font-semibold text-gray-800">{{ set.name }}</label>
                </div>
                <!-- Nested Agent Checkboxes -->
                <div class="pl-8 pt-2 space-y-2">
                    <div v-for="agent in set.agentDetails" :key="'set-agent-'+agent.id" class="flex items-center">
                        <input type="checkbox" :id="'set-agent-export-'+agent.id" v-model="selectedAgents[agent.id]" class="h-4 w-4 text-blue-600 border-gray-300 rounded">
                        <label :for="'set-agent-export-'+agent.id" class="ml-3 text-sm text-gray-600">{{ agent.name }}</label>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-6 text-right">
            <button @click="generateExport" class="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700" :disabled="!hasSelection">Export Selected Data</button>
        </div>
      </div>

      <div v-if="mode === 'import'">
        <button @click="showMenu" class="text-sm text-blue-600 hover:underline mb-4">&larr; Back to Settings</button>
        <h2 class="text-3xl font-bold text-gray-800 mb-6">Import Data</h2>
        <div class="bg-white p-6 rounded-lg shadow-sm border">
            <input type="file" @change="handleFileUpload" accept=".json" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
        </div>

        <div v-if="importData" class="mt-6">
            <h3 class="text-xl font-semibold mb-4">Items to Import</h3>
            <div class="grid md:grid-cols-2 gap-8">
                <div>
                    <h4 class="text-lg font-medium mb-2">Agents ({{ importData.agents.length }})</h4>
                    <div class="bg-white p-4 rounded-lg border max-h-96 overflow-y-auto">
                        <div v-for="(agent, index) in importData.agents" :key="'agent-import-'+index" class="flex items-center p-2 border-b">
                            <input type="checkbox" :id="'agent-import-check-'+index" v-model="importSelection.agents[index]" class="h-4 w-4 text-blue-600 border-gray-300 rounded">
                            <label :for="'agent-import-check-'+index" class="ml-3 text-sm text-gray-700">{{ agent.name }}</label>
                            <span v-if="importConflicts.agents[agent.name]" class="ml-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Conflict: Name exists</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h4 class="text-lg font-medium mb-2">Agent Sets ({{ importData.agentSets.length }})</h4>
                    <div class="bg-white p-4 rounded-lg border max-h-96 overflow-y-auto">
                        <div v-for="(set, index) in importData.agentSets" :key="'set-import-'+index" class="flex items-center p-2 border-b">
                            <input type="checkbox" :id="'set-import-check-'+index" v-model="importSelection.sets[index]" class="h-4 w-4 text-blue-600 border-gray-300 rounded">
                            <label :for="'set-import-check-'+index" class="ml-3 text-sm text-gray-700">{{ set.name }}</label>
                            <span v-if="importConflicts.sets[set.name]" class="ml-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Conflict: Name exists</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mt-6 text-right">
                <button @click="performImport" class="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700" :disabled="!hasImportSelection">Import Selected (No Conflicts)</button>
            </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      mode: 'menu', // 'menu', 'export', 'import'
      isLoading: false,
      // Export state
      exportableAgents: [],
      exportableSets: [],
      selectedAgents: {},
      selectedSets: {},
      // Import state
      importFile: null,
      importData: null,
      importSelection: { agents: {}, sets: {} },
      importConflicts: { agents: {}, sets: {} },
    };
  },
  computed: {
    hasSelection() {
        return Object.values(this.selectedAgents).some(v => v) || Object.values(this.selectedSets).some(v => v);
    },
    hasImportSelection() {
        return Object.values(this.importSelection.agents).some(v => v) || Object.values(this.importSelection.sets).some(v => v);
    }
  },
  // MODIFICATION: The watch logic is changed to handle two-way data synchronization.
  watch: {
    selectedAgents: {
        handler(newSelectedAgents) {
            this.exportableSets.forEach(set => {
                // If a set has agents, check if all of them are selected
                const allAgentsInSetSelected = set.agentIds.length > 0 && set.agentIds.every(agentId => newSelectedAgents[agentId]);
                // Update the parent set's checkbox state
                this.selectedSets[set.id] = allAgentsInSetSelected;
            });
        },
        deep: true
    }
  },
  methods: {
    showMenu() {
      this.mode = 'menu';
      this.resetImportState();
      this.resetExportState();
    },
    async showExport() {
      this.isLoading = true;
      this.mode = 'export';
      const [agents, sets] = await Promise.all([
        db.agents.toArray(),
        db.agentSets.toArray()
      ]);

      const agentsById = new Map(agents.map(agent => [agent.id, agent]));

      // Add agent details to each set for the nested display
      sets.forEach(set => {
        set.agentDetails = set.agentIds.map(id => agentsById.get(id)).filter(Boolean);
      });

      this.exportableAgents = agents;
      this.exportableSets = sets;
      this.isLoading = false;
    },
    showImport() {
      this.mode = 'import';
    },
    resetExportState() {
        this.exportableAgents = [];
        this.exportableSets = [];
        this.selectedAgents = {};
        this.selectedSets = {};
    },
    resetImportState() {
        this.importFile = null;
        this.importData = null;
        this.importSelection = { agents: {}, sets: {} };
        this.importConflicts = { agents: {}, sets: {} };
    },
    // MODIFICATION: New method to handle when a set checkbox is clicked.
    onSetSelectionChange(set, isSelected) {
        // Update all agents within that set to match the new selection state.
        set.agentIds.forEach(agentId => {
            this.selectedAgents[agentId] = isSelected;
        });
    },
    generateExport() {
        const dataToExport = {
            agents: [],
            agentSets: [],
        };

        // Export agents that are selected
        const selectedAgentIds = new Set();
        this.exportableAgents.forEach(agent => {
            if (this.selectedAgents[agent.id]) {
                dataToExport.agents.push({ ...agent });
                selectedAgentIds.add(agent.id);
            }
        });

        // Export sets that are selected
        this.exportableSets.forEach(set => {
            if (this.selectedSets[set.id]) {
                const setCopy = { ...set };
                delete setCopy.id;
                delete setCopy.agentDetails; // Don't export the temporary UI property
                // Crucially, only include agent IDs that are actually being exported
                setCopy.agentIds = setCopy.agentIds.filter(id => selectedAgentIds.has(id));
                dataToExport.agentSets.push(setCopy);
            }
        });

        this.downloadJson(dataToExport, `aigent-export-${new Date().toISOString().split('T')[0]}.json`);
    },
    downloadJson(data, filename) {
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    async handleFileUpload(event) {
        this.resetImportState();
        const file = event.target.files[0];
        if (!file) return;

        this.importFile = file;
        const text = await file.text();
        try {
            const data = JSON.parse(text);
            if (!data.agents || !data.agentSets) {
                throw new Error("Invalid format: 'agents' or 'agentSets' key missing.");
            }
            this.importData = data;
            await this.checkForConflicts();
        } catch (e) {
            alert('Error parsing file. Please ensure it is a valid JSON export from AIGENT.');
            logger.error("Import error:", e);
        }
    },
    async checkForConflicts() {
        if (!this.importData) return;

        const existingAgents = await db.agents.toArray();
        const existingSets = await db.agentSets.toArray();
        const existingAgentNames = new Set(existingAgents.map(a => a.name));
        const existingSetNames = new Set(existingSets.map(s => s.name));

        const agentConflicts = {};
        this.importData.agents.forEach(agent => {
            if (existingAgentNames.has(agent.name)) {
                agentConflicts[agent.name] = true;
            }
        });

        const setConflicts = {};
        this.importData.agentSets.forEach(set => {
            if (existingSetNames.has(set.name)) {
                setConflicts[set.name] = true;
            }
        });

        this.importConflicts = { agents: agentConflicts, sets: setConflicts };
    },
    async performImport() {
        if (!this.importFile) return;

        const rawImportData = JSON.parse(await this.importFile.text());

        const agentsToImport = [];
        rawImportData.agents.forEach((agent, index) => {
            if (this.importSelection.agents[index] && !this.importConflicts.agents[agent.name]) {
                if (!agent.id) {
                    agent.id = crypto.randomUUID();
                }
                agentsToImport.push(agent);
            }
        });

        const setsToImport = [];
        rawImportData.agentSets.forEach((set, index) => {
            if (this.importSelection.sets[index] && !this.importConflicts.sets[set.name]) {
                setsToImport.push(set);
            }
        });

        try {
            if (agentsToImport.length > 0) {
                await db.agents.bulkPut(agentsToImport);
            }
            if (setsToImport.length > 0) {
                await db.agentSets.bulkAdd(setsToImport);
            }
            alert(`Import successful!\n- ${agentsToImport.length} agents imported.\n- ${setsToImport.length} agent sets imported.`);
            this.showMenu();
        } catch (error) {
            logger.error("Failed to perform bulk import:", error);
            alert("An error occurred during import. Some items may not have been saved. Check the console for details.");
        }
    }
  }
};
