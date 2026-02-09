<script setup lang="ts">
import { computed } from 'vue'
import Button from '@/components/govuk/Button.vue'

interface Props {
  totalPages: number
}

const props = defineProps<Props>()

const currentPage = defineModel<number>({ required: true })

const pageOptions = computed(() => {
  return Array.from({ length: props.totalPages }, (_, i) => ({
    label: `Page ${i + 1}`,
    value: i + 1,
  }))
})

const previous = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const next = () => {
  if (currentPage.value < props.totalPages) {
    currentPage.value++
  }
}
</script>

<template>
  <div class="flex items-center gap-2" data-testid="pagination">
    <Button @click="previous" :disabled="currentPage === 1" variant="secondary" class="mb-0!">
      Previous
    </Button>

    <select
      name="pagination-select"
      class="govuk-select mb-0! min-w-28! w-28!"
      v-model="currentPage"
      aria-describedby="Pagination select"
    >
      <option v-for="page in pageOptions" :key="page.value" :value="page.value">
        {{ page.label }}
      </option>
    </select>

    <Button @click="next" :disabled="currentPage === totalPages" variant="secondary" class="mb-0!">
      Next
    </Button>
  </div>
</template>

<style scoped></style>
