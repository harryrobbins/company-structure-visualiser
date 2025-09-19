<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCompanyStore } from '../stores/company.ts'
import { parseCompanyOwnershipWorkbook } from './parse.ts'

const files = ref<FileList | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)
const companyStore = useCompanyStore()

watch(files, async () => {
  const file = files.value?.[0]
  if (!file) return;

  loading.value = true

  try {
    const arrayBuffer = await file.arrayBuffer()
    const companyGraph = await parseCompanyOwnershipWorkbook(arrayBuffer)
    companyStore.addGraph(companyGraph)
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
  companyStore.$reset()
}

</script>

<template>
  <div class="p-4">
    <gv-back-link v-if="companyStore.graph" @click.prevent="reset">Upload another file</gv-back-link>

    <gv-error-summary v-if="!companyStore.graph && error" :disable-auto-focus="true">
      <gv-error-link target-id="file-upload">
        {{ error }}
      </gv-error-link>
    </gv-error-summary>

    <gv-file-upload
      v-if="!companyStore.graph"
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
