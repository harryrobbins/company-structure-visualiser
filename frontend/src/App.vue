<script setup lang="ts">
import CompanyChart from '@/components/CompanyChart.vue'
import FileUpload from '@/components/FileUpload.vue'
</script>

<template>
  <gv-header :rebrand="true" />
  <gv-service-navigation service-name="Company Visualizer" service-url="/example-page" />


  <div class="flex flex-col h-[calc(100vh-20rem)]">
    <main class="flex-1">
      <div class="w-full h-full">
        <main class="container mx-auto p-4 h-full">
          <FileUpload />
          <CompanyChart />
        </main>
      </div>
    </main>
  </div>

</template>

<style scoped>
</style>
