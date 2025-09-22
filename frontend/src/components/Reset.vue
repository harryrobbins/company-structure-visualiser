<script setup lang="ts">
import {useAppStore} from "@/stores/app.ts";
const appStore = useAppStore()
</script>

<template>
  <gv-back-link v-if="appStore.graph.type !== 'upload'" @click.prevent="appStore.$reset()">Upload another file</gv-back-link>
</template>

<style scoped>

</style>
