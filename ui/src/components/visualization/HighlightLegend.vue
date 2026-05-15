<script setup lang="ts">
import type { HighlightRule } from '@/components/visualization/HighlightRulesModal.vue'
import type { EntityType } from '@/db/models.ts'
import { computed } from 'vue'

const props = defineProps<{
  searchQuery: string
  highlightColor: string
  highlightParents: boolean
  highlightRules: HighlightRule[]
  entityTypes: EntityType[]
}>()

const fieldLabels: Record<HighlightRule['field'], string> = {
  taxJurisdiction: 'Tax Jurisdiction',
  taxJurisdictionOfIncorporation: 'Jurisdiction of Incorporation',
  type: 'Entity Type',
}

const hasHighlights = computed(() => props.searchQuery.trim().length > 0 || props.highlightRules.length > 0)
const hasContent = computed(() => hasHighlights.value || props.entityTypes.length > 0)
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

    <hr v-if="hasHighlights && entityTypes.length > 0" class="border-gray-300 mx-3 my-1" />

    <!-- Entity type shapes -->
    <div v-for="type in entityTypes" :key="type" class="flex items-center gap-2 px-3 py-1">
      <span class="shrink-0 flex items-center justify-center" style="width: 32px; height: 24px">
        <!-- Company: rectangle -->
        <svg v-if="type === 'Company'" width="28" height="18" viewBox="0 0 28 18">
          <rect x="1" y="1" width="26" height="16" fill="none" stroke="#000" stroke-width="2" />
        </svg>
        <!-- Company Hybrid: oval inside rectangle -->
        <svg v-else-if="type === 'Company Hybrid'" width="28" height="18" viewBox="0 0 28 18">
          <rect x="1" y="1" width="26" height="16" fill="none" stroke="#000" stroke-width="2" />
          <ellipse cx="14" cy="9" rx="11" ry="6" fill="none" stroke="#000" stroke-width="2" />
        </svg>
        <!-- Partnership: triangle -->
        <svg v-else-if="type === 'Partnership'" width="28" height="22" viewBox="0 0 28 22">
          <polygon points="14,1 1,21 27,21" fill="none" stroke="#000" stroke-width="2" />
        </svg>
        <!-- Partnership Hybrid: triangle inside rectangle -->
        <svg v-else-if="type === 'Partnership Hybrid'" width="28" height="18" viewBox="0 0 28 18">
          <rect x="1" y="1" width="26" height="16" fill="none" stroke="#000" stroke-width="2" />
          <polygon points="14,3 4,15 24,15" fill="none" stroke="#000" stroke-width="1.5" />
        </svg>
        <!-- Branch: oval -->
        <svg v-else-if="type === 'Branch'" width="28" height="18" viewBox="0 0 28 18">
          <ellipse cx="14" cy="9" rx="13" ry="8" fill="none" stroke="#000" stroke-width="2" />
        </svg>
        <!-- Trust: diamond -->
        <svg v-else-if="type === 'Trust'" width="22" height="22" viewBox="0 0 22 22">
          <polygon points="11,1 21,11 11,21 1,11" fill="none" stroke="#000" stroke-width="2" />
        </svg>
      </span>
      <span>{{ type }}</span>
    </div>

    <div class="pb-1.5"></div>
  </div>
</template>
