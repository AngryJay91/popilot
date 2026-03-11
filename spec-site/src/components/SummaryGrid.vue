<script setup lang="ts">
defineProps<{
  items: {
    label: string
    value: string
    delta: string
    deltaDir: 'up' | 'down' | 'flat'
  }[]
}>()
</script>

<template>
  <div class="summary-grid">
    <div v-for="(item, i) in items" :key="i" class="summary-item">
      <div class="summary-label">{{ item.label }}</div>
      <div class="summary-value">{{ item.value }}</div>
      <div class="summary-delta" :class="`delta-${item.deltaDir}`">{{ item.delta }}</div>
    </div>
  </div>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.summary-label { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
.summary-value {
  font-family: var(--font-num);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.5px;
}
.summary-delta { font-size: 12px; margin-top: 2px; font-family: var(--font-num); }
.delta-up { color: var(--green); }
.delta-down { color: var(--red); }
.delta-flat { color: var(--text-muted); }
</style>
