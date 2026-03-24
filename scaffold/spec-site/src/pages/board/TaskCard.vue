<script setup lang="ts">
import type { PmStory } from '@/composables/usePmStore'

defineProps<{ story: PmStory }>()
defineEmits<{ (e: 'click'): void }>()

function statusColor(status: string): string {
  const map: Record<string, string> = { done: '#22c55e', 'in-progress': '#f59e0b', review: '#8b5cf6', backlog: '#94a3b8', draft: '#94a3b8', blocked: '#ef4444' }
  return map[status] || '#6b7280'
}
</script>

<template>
  <div class="task-card" @click="$emit('click')" draggable="true">
    <div class="task-header">
      <span class="task-id">S{{ story.id }}</span>
      <span class="task-status-dot" :style="{ background: statusColor(story.status) }" />
    </div>
    <div class="task-title">{{ story.title }}</div>
    <div class="task-footer">
      <span v-if="story.assignee" class="task-assignee">{{ story.assignee }}</span>
      <span v-if="story.storyPoints" class="task-sp">{{ story.storyPoints }} SP</span>
      <span class="task-priority" :class="'priority--' + story.priority">{{ story.priority }}</span>
    </div>
  </div>
</template>

<style scoped>
.task-card { padding: 12px 14px; background: var(--card-bg, #fff); border: 1px solid var(--border-light, #e2e8f0); border-radius: 10px; cursor: pointer; transition: all 0.15s; }
.task-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); transform: translateY(-1px); }
.task-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.task-id { font-size: 11px; font-weight: 600; color: var(--text-muted); }
.task-status-dot { width: 8px; height: 8px; border-radius: 50%; }
.task-title { font-size: 13px; font-weight: 500; color: var(--text-primary); line-height: 1.4; margin-bottom: 8px; }
.task-footer { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-secondary); }
.task-assignee { font-weight: 500; }
.task-sp { background: rgba(59,130,246,0.1); color: #3b82f6; padding: 1px 6px; border-radius: 4px; font-weight: 600; }
.task-priority { padding: 1px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; }
.priority--high { background: rgba(239,68,68,0.1); color: #ef4444; }
.priority--medium { background: rgba(245,158,11,0.1); color: #f59e0b; }
.priority--low { background: rgba(34,197,94,0.1); color: #22c55e; }
</style>
