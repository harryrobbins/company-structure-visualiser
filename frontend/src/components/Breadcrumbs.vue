<script setup lang="ts">
import {useAppStore} from "@/stores/app.ts";
import {computed} from "vue";
const appStore = useAppStore()

interface Breadcrumb {
  text: string
  action?: () => void
}

const confirmSearchResult = { text: 'Confirm search result', action: () => appStore.backToConfirmation() }

const breadcrumbs = computed(() => {
  const breadcrumbs: Breadcrumb[] = [{ text: 'Upload file', action: () => appStore.$reset() }]
  switch (appStore.graph.type) {
    case "upload":
      break
    case "confirmation":
      breadcrumbs.push(confirmSearchResult)
      if (appStore.graph.editing !== null) {
        breadcrumbs.push({ text: 'Edit search result' })
      }
      break
    case "visualize":
      breadcrumbs.push(confirmSearchResult)
      breadcrumbs.push({ text: 'Visualize' })

      break
    case "failed":
      breadcrumbs.push({ text: 'Error' })
      break
  }
  return breadcrumbs
})


</script>

<template>
  <gv-back-link v-if="appStore.graph.type === 'failed'" @click.prevent="appStore.$reset()">Upload another file</gv-back-link>
  <gv-breadcrumbs v-else-if="breadcrumbs.length > 1">
    <template v-for="(breadcrumb, index) in breadcrumbs" :key="breadcrumb.text">
      <gv-breadcrumb-item v-if="breadcrumb.action && index < breadcrumbs.length - 1" @click.prevent="breadcrumb.action">
        {{ breadcrumb.text }}
      </gv-breadcrumb-item>
      <gv-breadcrumb-item v-else>
        {{ breadcrumb.text }}
      </gv-breadcrumb-item>
    </template>
  </gv-breadcrumbs>
</template>

<style scoped>

</style>
