<script setup lang="ts">

import {useAppStore} from "@/stores/app.ts";

const appStore = useAppStore()
</script>

<template>
  <gv-error-summary v-if="appStore.state.type == 'failed'" :disable-auto-focus="true">
    <gv-error-link href="#" @click.prevent="appStore.$reset()">
      {{ appStore.state.message }}
    </gv-error-link>
  </gv-error-summary>
</template>

<style scoped>

</style>
