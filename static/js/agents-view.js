// frontend/static/js/agents-view.js

export const AgentsView = {
  template: `
    <div>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-3xl font-bold text-gray-800">Agents</h2>
        <div>
          <!-- MODIFICATION: Button to delete selected agents. Disabled if none are selected. -->
          <button @click="deleteSelected" :disabled="selectedAgentIds.length === 0" class="px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mr-4">
              Delete Selected ({{ selectedAgentIds.length }})
          </button>
          <button @click="openCreateModal" class="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors">
            + New Agent
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="text-center text-gray-500">
        <loading-spinner></loading-spinner>
        <p>Loading agents...</p>
      </div>
      <div v-else-if="agents.length === 0" class="text-center text-gray-500 bg-white p-8 rounded-lg shadow">
        <p>No agents found. Click "+ New Agent" to create one.</p>
      </div>
      <!-- MODIFICATION: The agent list is now an expandable accordion -->
      <div v-else class="space-y-2">
        <div v-for="agent in agents" :key="agent.id" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div class="flex items-start space-x-4 p-4">
            <input type="checkbox" :value="agent.id" v-model="selectedAgentIds" class="h-5 w-5 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
            <div class="flex-1 cursor-pointer" @click="toggleExpand(agent.id)">
              <div class="flex justify-between items-start">
                <h3 class="text-xl font-semibold text-gray-900">{{ agent.name }}</h3>
                <div class="flex items-center space-x-2">
                  <button @click.stop="openEditModal(agent)" class="text-sm text-blue-500 hover:text-blue-700 font-medium">Edit</button>
                  <button class="text-gray-400">
                    <svg :class="{'rotate-180': isExpanded(agent.id)}" class="h-5 w-5 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              <p class="text-sm text-gray-500 mt-1 truncate">{{ agent.prompt }}</p>
            </div>
          </div>
          <!-- MODIFICATION: This section is shown only when the agent is expanded -->
          <div v-if="isExpanded(agent.id)" class="px-4 pb-4 pl-12">
              <h4 class="font-semibold text-gray-700">Full Prompt:</h4>
              <div class="mt-2 prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border">{{ agent.prompt }}</div>
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
              <div v-for="(ranking, index) in currentAgent.rankings" :key="index" class="bg-gray-50 p-3 rounded-md border mb-3">
                <div class="flex items-center justify-between mb-2">
                    <input v-model="ranking.title" type="text" placeholder="Ranking Title (e.g., 'Clarity')" class="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2">
                    <button @click.prevent="removeRanking(index)" class="ml-2 text-red-500 hover:text-red-700 text-xl">&times;</button>
                </div>
                <textarea v-model="ranking.description" rows="2" placeholder="Ranking description (e.g., 'Rank from 1-10 how clear the document is.')" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-sm"></textarea>
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
      // MODIFICATION: Added state for selection and expansion
      selectedAgentIds: [],
      expandedAgentIds: new Set(),
    };
  },
  async created() {
    await this.fetchAgents();
  },
  methods: {
    getEmptyAgent() {
      return { id: crypto.randomUUID(), name: '', prompt: '', rankings: [] };
    },
    async fetchAgents() {
      this.isLoading = true;
      this.agents = await db.agents.orderBy('name').toArray();
      this.isLoading = false;
    },
    addRanking() {
      this.currentAgent.rankings.push({ title: '', description: '' });
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
        console.error('Agent Name and Prompt are required.');
        return;
      }

      const agentToSave = JSON.parse(JSON.stringify(this.currentAgent));
      agentToSave.rankings = agentToSave.rankings.filter(r => r.title && r.title.trim() !== '');

      await db.agents.put(agentToSave);

      await this.fetchAgents();
      this.closeModal();
    },
    // MODIFICATION: New methods for expand/collapse functionality
    toggleExpand(agentId) {
        if (this.expandedAgentIds.has(agentId)) {
            this.expandedAgentIds.delete(agentId);
        } else {
            this.expandedAgentIds.add(agentId);
        }
    },
    isExpanded(agentId) {
        return this.expandedAgentIds.has(agentId);
    },
    // MODIFICATION: Replaced individual delete with bulk deletion
    async deleteSelected() {
      const count = this.selectedAgentIds.length;
      if (count === 0) return;

      if (window.confirm(`Are you sure you want to delete these ${count} agent(s)? This action cannot be undone.`)) {
        await db.agents.bulkDelete(this.selectedAgentIds);
        this.selectedAgentIds = []; // Clear the selection
        await this.fetchAgents(); // Refresh the list from the database
      }
    }
  }
};
