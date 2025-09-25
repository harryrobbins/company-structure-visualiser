<script setup lang="ts">
import Graph from '@/components/Graph.vue'
import FileUpload from '@/components/FileUpload.vue'
import SearchConfirmation from "@/components/SearchConfirmation.vue";
import Error from "@/components/Error.vue";
import Breadcrumbs from "@/components/Breadcrumbs.vue";
import Loading from "@/components/Loading.vue";
</script>

<template>
  <gv-header :rebrand="true" />
  <gv-service-navigation service-name="Company Visualizer" service-url="/" />
  <main class="container mx-auto p-4">
    <Breadcrumbs />
    <Error />
    <FileUpload />
    <Loading />
    <SearchConfirmation />
    <Graph />
  </main>
  <gv-footer :rebrand="true" />
</template>

<style scoped>
</style>
