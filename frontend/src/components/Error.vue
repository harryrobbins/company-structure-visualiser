<script setup lang="ts">

import {useAppStore} from "@/stores/app.ts";

const appStore = useAppStore()
</script>

<template>
  <gv-error-summary v-if="appStore.graph.type == 'failed'" :disable-auto-focus="true">
    <gv-error-link target-id="file-upload">
      {{ appStore.graph.message }}
    </gv-error-link>
  </gv-error-summary>
</template>

<style scoped>

</style>
