<script setup lang="ts">
import { ref, watch } from 'vue'
import { useParse } from '@/composables/useParse'
import {useGraphStore} from "@/stores/graph.ts";

const files = ref<FileList | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)
const { parseFile, resetParse } = useParse()
const graphStore = useGraphStore()

watch(files, async () => {
  const file = files.value?.[0]
  if (!file) return;

  loading.value = true

  try {
    const arrayBuffer = await file.arrayBuffer()
    await parseFile(arrayBuffer)
    error.value = null
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'An error occurred while processing the file.'
  } finally {
    loading.value = false
  }
})

function reset() {
  files.value = null
  error.value = null
  resetParse()
}

</script>

<template>
  <div class="p-4">
    <gv-back-link v-if="graphStore.graph" @click.prevent="reset">Upload another file</gv-back-link>

    <gv-error-summary v-if="!graphStore.graph && error" :disable-auto-focus="true">
      <gv-error-link target-id="file-upload">
        {{ error }}
      </gv-error-link>
    </gv-error-summary>

    <gv-file-upload
      v-if="!graphStore.graph"
      :disabled="loading"
      id="file-upload"
      label="Upload your company organization data"
      no-file-chosen-text=""
      v-model="files"
      accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    />

  </div>
</template>

<style>
.govuk-file-upload-button__status {
  display: none;
}
</style>
