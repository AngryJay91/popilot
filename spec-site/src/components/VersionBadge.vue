<script setup lang="ts">
import type { PageVersion } from '@/data/types'

defineProps<{
  version: PageVersion
}>()

function statusColor(s: string) {
  const m: Record<string, string> = { draft: 'yellow', review: 'blue', approved: 'green', dev: 'green' }
  return m[s] ?? 'blue'
}
</script>

<template>
  <div class="version-badge">
    <span class="ver-tag">v{{ version.version }}</span>
    <span class="ver-status" :class="`status-${statusColor(version.status)}`">
      {{ version.status }}
    </span>
    <span class="ver-date">{{ version.lastUpdated }}</span>
  </div>
</template>

<style scoped>
.version-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; }
.ver-tag { font-family: var(--font-num); font-weight: 700; color: var(--text-secondary); }
.ver-status {
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.status-yellow { background: var(--yellow-bg); color: var(--yellow); }
.status-blue { background: var(--blue-bg); color: var(--blue); }
.status-green { background: var(--green-bg); color: var(--green); }
.ver-date { color: var(--text-muted); }
</style>
