<script setup lang="ts">
defineProps<{
  label: string
  type?: 'status' | 'priority' | 'area'
  value: string
}>()

const statusColors: Record<string, string> = {
  'draft': '#94a3b8',
  'backlog': '#a78bfa',
  'ready': '#3b82f6',
  'in-progress': '#f59e0b',
  'review': '#8b5cf6',
  'done': '#22c55e',
  'todo': '#94a3b8',
}

const priorityColors: Record<string, string> = {
  'low': '#94a3b8',
  'medium': '#3b82f6',
  'high': '#f59e0b',
  'critical': '#ef4444',
}

function getColor(type: string, value: string): string {
  if (type === 'priority') return priorityColors[value] ?? '#94a3b8'
  return statusColors[value] ?? '#94a3b8'
}
</script>

<template>
  <span
    class="status-badge"
    :style="{
      '--badge-color': getColor(type ?? 'status', value),
    }"
  >{{ label }}</span>
</template>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  background: color-mix(in srgb, var(--badge-color) 15%, transparent);
  color: var(--badge-color);
  white-space: nowrap;
  line-height: 1.6;
}
</style>
