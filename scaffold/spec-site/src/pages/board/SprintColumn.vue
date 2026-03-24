<script setup lang="ts">
import type { PmStory, StoryStatus } from '@/composables/usePmStore'
import TaskCard from './TaskCard.vue'

defineProps<{ status: StoryStatus; label: string; stories: PmStory[]; dragOver: boolean }>()
defineEmits<{
  (e: 'drag-over', event: DragEvent): void
  (e: 'drag-leave'): void
  (e: 'drop', event: DragEvent): void
  (e: 'drag-start', event: DragEvent, story: PmStory): void
  (e: 'drag-end'): void
  (e: 'select', story: PmStory): void
}>()

function statusDotColor(status: string): string {
  const map: Record<string, string> = { draft: '#94a3b8', backlog: '#a78bfa', ready: '#3b82f6', 'ready-for-dev': '#3b82f6', 'in-progress': '#f59e0b', review: '#8b5cf6', qa: '#ec4899', done: '#22c55e' }
  return map[status] || '#94a3b8'
}
</script>

<template>
  <div class="kanban-col" :class="{ 'kanban-col--dragover': dragOver }"
    @dragover="$emit('drag-over', $event)" @dragleave="$emit('drag-leave')" @drop="$emit('drop', $event)">
    <div class="kanban-col-header">
      <span class="kanban-col-dot" :style="{ background: statusDotColor(status) }" />
      <span class="kanban-col-label">{{ label }}</span>
      <span class="kanban-col-count">{{ stories.length }}</span>
    </div>
    <div class="kanban-col-body">
      <div v-for="story in stories" :key="story.id" class="kanban-card-wrap" draggable="true"
        @dragstart="$emit('drag-start', $event, story)" @dragend="$emit('drag-end')">
        <TaskCard :story="story" @click="$emit('select', story)" />
      </div>
      <div v-if="stories.length === 0" class="kanban-empty">Drag to move</div>
    </div>
  </div>
</template>

<style scoped>
.kanban-col { min-width: 200px; flex: 1; display: flex; flex-direction: column; }
.kanban-col-header { display: flex; align-items: center; gap: 6px; padding: 8px 10px; font-size: 12px; font-weight: 700; color: var(--text-secondary); background: var(--card-bg, #fff); border: 1px solid var(--border-light, #e2e8f0); border-radius: 12px 12px 0 0; border-bottom: none; }
.kanban-col-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.kanban-col-count { margin-left: auto; background: rgba(0,0,0,0.06); color: var(--text-secondary); font-size: 10px; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
.kanban-col-body { flex: 1; display: flex; flex-direction: column; gap: 8px; padding: 10px; border: 1px solid rgba(0,0,0,0.06); border-radius: 0 0 8px 8px; background: rgba(0,0,0,0.02); min-height: 100px; }
.kanban-empty { text-align: center; padding: 20px 0; color: var(--text-muted); font-size: 13px; }
.kanban-card-wrap { cursor: grab; transition: opacity 0.15s, transform 0.15s; }
.kanban-card-wrap:active { cursor: grabbing; }
.kanban-col--dragover .kanban-col-body { background: rgba(59,130,246,0.06); border-color: rgba(59,130,246,0.3); border-style: dashed; }
</style>
