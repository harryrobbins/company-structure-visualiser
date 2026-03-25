<script setup lang="ts">
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import CountryFlag from '@/components/visualization/CountryFlag.vue'
import type { NodeData } from '@/db/models.ts'
import { inject, computed, ref, type Ref } from 'vue'
import { getAlpha2Code } from 'i18n-iso-countries'

interface Props {
  id: string
  data: NodeData
}

const props = defineProps<Props>()

const showCountryFlags = inject<{ value: boolean }>('showCountryFlags', { value: true })
const extraNodePadding = inject<Ref<number>>('extraNodePadding', ref(0))
const showUnconnectedHandles = inject<Ref<boolean>>('showUnconnectedHandles', ref(true))

const { getConnectedEdges } = useVueFlow()

let source = false
let target = false
for (const edge of getConnectedEdges(props.id)) {
  if (edge.source === props.id) source = true
  if (edge.target === props.id) target = true
}

function toIsoCode(countryName: string | undefined): string {
  if (!countryName) return ''
  return getAlpha2Code(countryName, 'en') || ''
}

const isoCodeDisplay = computed(() => {
  const tj = toIsoCode(props.data.entity.taxJurisdiction)
  const tjoi = toIsoCode(props.data.entity.taxJurisdictionOfIncorporation)
  if (tj && tjoi && tj !== tjoi) return `${tj}/${tjoi}`
  return tj || tjoi
})

const nodeClass = ['entity-node']
const flagsClass = ['tax-jurisdiction-flags']
switch (props.data.entity.type) {
  case 'Company':
    // rectangle
    nodeClass.push('entity-node--rectangle')
    break
  case 'Company Hybrid':
    // Oval inside a rectangle
    nodeClass.push('entity-node--rectangle')
    nodeClass.push('entity-node--inner-oval')
    break
  case 'Partnership':
    // Triangle
    nodeClass.push('entity-node--triangle')
    break
  case 'Partnership Hybrid':
    // Triangle inside a rectangle
    nodeClass.push('entity-node--rectangle')
    nodeClass.push('entity-node--triangle')
    break
  case 'Branch':
    // Oval
    nodeClass.push('entity-node--oval')
    break
  case 'Trust':
    // A Diamond
    nodeClass.push('entity-node--diamond')
    flagsClass.push('tax-jurisdiction-flags--diamond')
    break
}
</script>

<template>
  <div :class="nodeClass" :style="extraNodePadding ? { padding: `calc(1rem + ${extraNodePadding}px)` } : {}">
    <div
      v-if="nodeClass.some((clz) => clz.endsWith('triangle'))"
      class="triangle-container"
      :style="extraNodePadding ? { minWidth: `${180 + extraNodePadding * 2}px`, minHeight: `${100 + extraNodePadding * 2}px` } : {}"
    >
      <svg viewBox="0 0 100 87" preserveAspectRatio="none">
        <polygon points="50,0 0,86.5 100,86.5" fill="transparent" stroke="#000" stroke-width="1" />
      </svg>
      <p class="govuk-body">{{ props.data.label }}</p>
    </div>
    <div
      v-else-if="nodeClass.some((clz) => clz.endsWith('diamond'))"
      class="diamond-container"
      :style="extraNodePadding ? { width: `${150 + extraNodePadding * 2}px`, height: `${150 + extraNodePadding * 2}px` } : {}"
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon points="50,0 100,50 50,100 0,50" fill="transparent" stroke="#000" stroke-width="1" />
      </svg>
      <p class="govuk-body">{{ props.data.label }}</p>
    </div>
    <p v-else class="govuk-body">{{ props.data.label }}</p>

    <div :class="flagsClass">
      <template v-if="showCountryFlags">
        <CountryFlag :country-name="props.data.entity.taxJurisdiction" />
        <CountryFlag
          v-if="
            props.data.entity.taxJurisdictionOfIncorporation &&
            props.data.entity.taxJurisdictionOfIncorporation !== props.data.entity.taxJurisdiction
          "
          :country-name="props.data.entity.taxJurisdictionOfIncorporation"
        />
      </template>
      <span v-else-if="isoCodeDisplay" class="iso-code">{{ isoCodeDisplay }}</span>
    </div>
  </div>
  <Handle type="source" :position="Position.Bottom" v-if="source || showUnconnectedHandles" />
  <Handle type="target" :position="Position.Top" v-if="target || showUnconnectedHandles" />
</template>

<style scoped>
.entity-node {
  position: relative;
}

.entity-node--rectangle {
  padding: 1rem;
  border: 2px solid #000;
}

.entity-node--oval {
  border-radius: 50%;
  padding: 1rem;
  border: 2px solid #000;
}

.entity-node--inner-oval::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border: 2px solid #000;
  border-radius: 50%;
  background-color: transparent;
}

.entity-node--triangle {
  padding: 0 !important;
}

.triangle-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  min-width: 180px;

  svg {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    min-height: 100px;
    min-width: 180px;
  }

  p {
    position: absolute;
    bottom: 10%; /* where the triangle is widest */
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    margin: 0;
    width: 70%;
    max-width: calc(100% - 80px);
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
    line-height: 1.2;
    font-size: 1rem;
  }
}

.entity-node--diamond {
  padding: 0 !important;
}

.diamond-container {
  position: relative;
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }

  p {
    position: relative;
    z-index: 1;
    text-align: center;
    margin: 0;
    width: 70%;
    word-wrap: break-word;
    overflow-wrap: break-word;
    line-height: 1.2;
    font-size: 1rem;
  }
}

.govuk-body {
  margin: 0;
}

.tax-jurisdiction-flags {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 0;
  margin: 0;
  line-height: 0;
  z-index: 1;
}

.tax-jurisdiction-flags--diamond {
  bottom: 25px;
  right: 25px;
}

.iso-code {
  font-size: 0.75rem;
  font-weight: bold;
  line-height: 1;
  background-color: var(--color-white);
  border: 2px solid var(--color-black);
  padding: 1px 3px;
  transform: translate(4px, 4px);
  display: inline-block;
}
</style>
