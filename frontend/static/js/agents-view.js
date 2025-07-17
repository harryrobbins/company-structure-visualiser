// frontend/static/js/agents-view.js

export const AgentsView = {
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

      // FIX: Use JSON.parse(JSON.stringify(...)) to create a deep, non-reactive copy.
      // This is the most reliable way to strip Vue's reactivity proxies before saving to IndexedDB.
      const agentToSave = JSON.parse(JSON.stringify(this.currentAgent));

      // Clean up any empty rankings from the plain object before saving.
      agentToSave.rankings = agentToSave.rankings.filter(r => r.title && r.title.trim() !== '');

      if (this.isEditing) {
        await db.agents.update(agentToSave.id, agentToSave);
      } else {
        delete agentToSave.id;
        await db.agents.add(agentToSave);
      }
      await this.fetchAgents();
      this.closeModal();
    },
    async deleteAgent(agent) {
      if (window.confirm(`Are you sure you want to delete the agent "${agent.name}"?`)) {
        await db.agents.delete(agent.id);
        await this.fetchAgents();
      }
    }
  }
};
