// frontend/static/js/sets-view.js

export const SetsView = {
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
      window.eventBus.emit('navigate', 'analysis-runs-view', { setId: setId });
    }
  }
};
