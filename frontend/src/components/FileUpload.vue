<script setup lang="ts">
import { ref, watch } from 'vue'
import {useAppStore} from "@/stores/app.ts";

const files = ref<FileList | null>(null)
const appStore = useAppStore()

watch(files, async () => {
  const file = files.value?.[0]
  if (!file) return;

  try {
    await appStore.upload(file)
  } finally {
    files.value = null
  }
})

</script>

<template>
  <gv-file-upload
    v-if="appStore.graph.type == 'upload'"
    :disabled="appStore.loading"
    id="file-upload"
    label="Upload your company organization data"
    no-file-chosen-text=""
    v-model="files"
    accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  />
</template>

<style>
.govuk-file-upload-button__status {
  display: none;
}
</style>
