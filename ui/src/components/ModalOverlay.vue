<script setup lang="ts">
const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <div class="modal-overlay" @click="emit('click')" />
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  transition: right 0.2s ease-in-out;
}
</style>
