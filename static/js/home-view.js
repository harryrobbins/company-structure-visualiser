// frontend/static/js/home-view.js

export const HomeView = {
  template: `
    <div class="bg-white p-8 rounded-lg shadow">
      <h1 class="text-4xl font-bold mb-4 text-gray-800">Welcome to AIGENT</h1>
      <p class="text-gray-600 text-lg mb-6">Your personal AI-powered document analysis workspace.</p>
      <div class="grid md:grid-cols-2 gap-6">
        <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 class="text-2xl font-semibold mb-2">1. Define Agents</h2>
            <p class="text-gray-600 mb-4">Create custom AI "Agents" with specific prompts and instructions to analyze your documents from any perspective you need.</p>
            <button @click="navigate('agents-view')" class="text-blue-600 font-semibold hover:underline">Manage Agents &rarr;</button>
        </div>
        <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 class="text-2xl font-semibold mb-2">2. Create Sets & Analyze</h2>
            <p class="text-gray-600 mb-4">Group your agents into "Sets", upload your documents, and run parallel analyses to get comprehensive insights quickly.</p>
            <button @click="navigate('sets-view')" class="text-blue-600 font-semibold hover:underline">Manage Agent Sets &rarr;</button>
        </div>
      </div>
    </div>
  `,
  methods: {
    navigate(view, params) {
      window.eventBus.emit('navigate', view, params);
    }
  }
};
