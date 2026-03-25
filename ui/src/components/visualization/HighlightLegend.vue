<script setup lang="ts">
import type { HighlightRule } from '@/components/visualization/HighlightRulesModal.vue'
import { computed } from 'vue'

const props = defineProps<{
  searchQuery: string
  highlightColor: string
  highlightParents: boolean
  highlightRules: HighlightRule[]
}>()

const fieldLabels: Record<HighlightRule['field'], string> = {
  taxJurisdiction: 'Tax Jurisdiction',
  taxJurisdictionOfIncorporation: 'Jurisdiction of Incorporation',
  type: 'Entity Type',
}

const hasContent = computed(() => props.searchQuery.trim().length > 0 || props.highlightRules.length > 0)
</script>

<template>
  <div v-if="hasContent" class="bg-white/90 border-2 border-gray-600 rounded text-sm max-w-72">
    <!-- Search entry -->
    <div v-if="searchQuery.trim()" class="flex items-center gap-2 px-3 py-1.5">
      <span class="inline-block w-3 h-3 shrink-0 rounded-sm" :style="{ backgroundColor: highlightColor }"></span>
      <span class="truncate">
        <strong>{{ searchQuery.trim() }}</strong>
        <span v-if="highlightParents"> (and parents)</span>
      </span>
    </div>

    <!-- Highlight rules -->
    <div v-for="rule in highlightRules" :key="rule.id" class="flex items-center gap-2 px-3 py-1.5">
      <span class="inline-block w-3 h-3 shrink-0 rounded-sm" :style="{ backgroundColor: rule.color }"></span>
      <span class="truncate"
        >{{ fieldLabels[rule.field] }}: <strong>{{ rule.value }}</strong></span
      >
    </div>

    <div class="pb-1.5"></div>
  </div>
</template>
