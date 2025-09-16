<template>
  <div style="height: 100%">
    <VueFlow v-model="elements">
      <Background />
    </VueFlow>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';

const props = defineProps({
  companies: Array,
  ownership: Array,
});

const { onConnect, addEdges } = useVueFlow();

const elements = ref([]);

watch(() => [props.companies, props.ownership], () => {
  if (!props.companies || !props.ownership) return;

  const nodes = props.companies.map((company, index) => ({
    id: company.name,
    label: company.name,
    position: { x: index * 200, y: 100 },
  }));

  const edges = props.ownership.map(o => ({
    id: `e-${o.owner}-${o.owned}`,
    source: o.owner,
    target: o.owned,
    label: `${o.percentage_ownership}%`,
    animated: true,
  }));

  elements.value = [...nodes, ...edges];
}, { immediate: true, deep: true });

onConnect((params) => addEdges([params]));
</script>
