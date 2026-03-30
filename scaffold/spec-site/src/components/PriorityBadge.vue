<script setup lang="ts">
import { ArrowUp, Minus, ArrowDown } from 'lucide-vue-next'

const props = defineProps<{ priority: string }>()

const config: Record<string, { icon: any; color: string; label: string }> = {
  high: { icon: ArrowUp, color: '#ef4444', label: 'High' },
  medium: { icon: Minus, color: '#f59e0b', label: 'Medium' },
  low: { icon: ArrowDown, color: '#3b82f6', label: 'Low' },
}

const c = config[props.priority] || { icon: Minus, color: '#9ca3af', label: props.priority || '-' }
</script>

<template>
  <span class="priority-badge" :style="{ color: c.color }" :title="c.label">
    <component :is="c.icon" :size="14" />
  </span>
</template>

<style scoped>
.priority-badge { display: inline-flex; align-items: center; }
</style>
