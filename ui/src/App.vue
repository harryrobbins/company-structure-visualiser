<script setup lang="ts">
import Breadcrumbs from '@/components/govuk/Breadcrumbs.vue'
import Header from '@/components/govuk/Header.vue'
import Footer from '@/components/govuk/Footer.vue'
</script>

<template>
  <Header />
  <main class="container mx-auto p-4">
    <Breadcrumbs />
    <RouterView />
  </main>
  <Footer />
</template>

<style scoped></style>
