<!-- frontend/src/App.vue -->
<template>
  <div class="h-screen w-screen bg-gray-100 flex flex-col">
    <!-- LAYOUT FIX: Added a fixed height to the header (h-16) -->
    <header class="bg-white shadow-md p-4 flex items-center justify-between h-16">
      <h1 class="text-2xl font-bold text-gray-800">Company Structure Visualizer</h1>
      <label class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition-colors duration-300">
        <span>Upload XLSX</span>
        <input type="file" @change="handleFileUpload" class="hidden" accept=".xlsx" />
      </label>
    </header>

    <!-- LAYOUT FIX: Changed from flex-grow to an explicit height calculation.
         This ensures the container has a size before the graph component mounts. -->
    <main class="relative h-[calc(100vh-4rem)]">
      <VueFlow v-model="elements" :fit-view-on-init="true" class="w-full h-full bg-gray-200">
        <Background />
        <MiniMap />
        <Controls />
      </VueFlow>
      <div v-if="isLoading" class="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
        <p class="text-white text-xl">Processing file...</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { VueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { MiniMap } from '@vue-flow/minimap';
import { Controls } from '@vue-flow/controls';
import { db } from './db';

// Import Vue Flow styles
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
import '@vue-flow/minimap/dist/style.css';

const elements = ref([]);
const isLoading = ref(false);

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  isLoading.value = true;

  try {
    const XLSX = await import('xlsx');
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const companiesSheet = workbook.Sheets['Companies'];
        const ownershipSheet = workbook.Sheets['Ownership'];

        if (!companiesSheet || !ownershipSheet) {
          alert('Spreadsheet must contain "Companies" and "Ownership" sheets.');
          return;
        }

        const rawCompanies = XLSX.utils.sheet_to_json(companiesSheet);
        const rawOwnership = XLSX.utils.sheet_to_json(ownershipSheet);

        // --- DATABASE REFACTOR ---
        // Use a Dexie transaction for an all-or-nothing save operation.
        await db.transaction('rw', db.spreadsheets, db.companies, db.ownership, async () => {
          // 1. Create a record for the new spreadsheet upload.
          const spreadsheetId = await db.spreadsheets.add({
            name: file.name,
            lastUpdated: new Date(),
          });
          console.log(`Created new spreadsheet record with ID: ${spreadsheetId}`);

          // 2. Process companies, generating a UUID for each and creating a name-to-UUID map.
          const nameToUuidMap = new Map();
          const companiesToSave = rawCompanies.map(c => {
            const name = c['Company Name'] ? String(c['Company Name']).trim() : null;
            if (!name) return null;
            const uuid = crypto.randomUUID();
            nameToUuidMap.set(name, uuid);
            return {
              spreadsheetId,
              uuid,
              companyName: name,
              companyNumber: c['Company Number'] || null,
            };
          }).filter(Boolean);
          await db.companies.bulkAdd(companiesToSave);
          console.log(`Saved ${companiesToSave.length} companies.`);

          // 3. Process ownership relationships using the UUID map for linking.
          const ownershipToSave = rawOwnership.map(o => {
            const ownerName = o['Owner'] ? String(o['Owner']).trim() : null;
            const ownsName = o['Owns'] ? String(o['Owns']).trim() : null;
            if (!ownerName || !ownsName) return null;

            return {
              spreadsheetId,
              ownerUuid: nameToUuidMap.get(ownerName),
              ownsUuid: nameToUuidMap.get(ownsName),
              percentage: o['Percentage Ownership'] || 0,
            };
          }).filter(o => o && o.ownerUuid && o.ownsUuid); // Ensure relationships are valid
          await db.ownership.bulkAdd(ownershipToSave);
          console.log(`Saved ${ownershipToSave.length} ownership relations.`);

          // 4. Generate the graph with the newly saved, structured data.
          generateGraphData(companiesToSave, ownershipToSave);
        });

      } catch (error) {
        console.error('Error processing file:', error);
        alert('There was an error processing the spreadsheet.');
      } finally {
        isLoading.value = false;
        event.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  } catch (error) {
    console.error('Failed to load xlsx library:', error);
    isLoading.value = false;
  }
};

const generateGraphData = (companies, ownership) => {
  // --- DATABASE REFACTOR ---
  // Now uses UUIDs for IDs, which is much more robust and prevents name clashes.
  const graphNodes = companies.map(company => ({
    id: company.uuid, // Use the unique ID for the node
    label: company.companyName, // Use the name for the display label
    position: { x: Math.random() * 500, y: Math.random() * 500 },
  }));

  const graphEdges = ownership.map(rel => ({
    id: `e-${rel.ownerUuid}-${rel.ownsUuid}`,
    source: rel.ownerUuid, // Link using the source company's UUID
    target: rel.ownsUuid, // Link using the target company's UUID
    label: `${rel.percentage}%`,
    animated: true,
  }));
  
  elements.value = [...graphNodes, ...graphEdges];
  console.log('Graph data successfully generated and rendered from new schema.');
};

onMounted(async () => {
  // --- DATABASE REFACTOR ---
  // Load the most recently uploaded spreadsheet on startup.
  try {
    const latestSpreadsheet = await db.spreadsheets.orderBy('id').last();

    if (latestSpreadsheet) {
      console.log(`Loading data for spreadsheet ID: ${latestSpreadsheet.id}`);
      // Fetch all companies and ownership records for that spreadsheet.
      const companies = await db.companies.where('spreadsheetId').equals(latestSpreadsheet.id).toArray();
      const ownership = await db.ownership.where('spreadsheetId').equals(latestSpreadsheet.id).toArray();
      
      if (companies.length > 0) {
        generateGraphData(companies, ownership);
      }
    } else {
      console.log('No saved spreadsheets found in Dexie.');
    }
  } catch (error) {
    console.error("Failed to load data from Dexie.", error);
  }
});

</script>

<style>
/* These styles ensure the default Vue Flow attribution is visible */
.vue-flow__attribution {
  background: rgba(255, 255, 255, 0.7);
  padding: 2px 4px;
  border-radius: 4px;
}
</style>

