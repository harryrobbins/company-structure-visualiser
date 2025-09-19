<script setup lang="ts">
import CompanyChart from '@/components/CompanyChart.vue'
import FileUpload from '@/components/FileUpload.vue'
import SearchConfirmation from "@/components/SearchConfirmation.vue";
</script>

<template>
  <gv-header :rebrand="true" />
  <gv-service-navigation service-name="Company Visualizer" service-url="/example-page" />
  <main class="container mx-auto p-4">
    <FileUpload />
    <SearchConfirmation />
    <CompanyChart />
  </main>
  <gv-footer :rebrand="true" />
</template>

<style scoped>
</style>
