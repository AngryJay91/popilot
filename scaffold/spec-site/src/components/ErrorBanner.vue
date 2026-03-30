<script setup lang="ts">
defineProps<{
  message?: string
}>()
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="error-banner">
    <span class="error-text">{{ message || 'Failed to load data' }}</span>
    <button class="error-retry" @click="emit('retry')">Retry</button>
  </div>
</template>

<style scoped>
.error-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  margin: 16px;
}
.error-text { font-size: 13px; color: #dc2626; }
.error-retry {
  padding: 4px 12px;
  border: 1px solid #dc2626;
  border-radius: 6px;
  background: none;
  color: #dc2626;
  font-size: 12px;
  cursor: pointer;
}
.error-retry:hover { background: #fee2e2; }
</style>
