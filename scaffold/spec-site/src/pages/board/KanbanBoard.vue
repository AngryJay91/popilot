<script setup lang="ts">
import { computed } from 'vue'
import { apiPatch } from '@/composables/useTurso'

interface Story { id: number; title: string; status: string; priority: string; assignee: string; story_points: number; epic_id: number; epic_uid?: string }

const props = defineProps<{ stories: Story[]; onUpdate?: () => void }>()

const COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: '#9ca3af' },
  { id: 'ready-for-dev', label: 'Ready', color: '#3b82f6' },
  { id: 'in-progress', label: 'In Progress', color: '#f59e0b' },
  { id: 'review', label: 'Review', color: '#8b5cf6' },
  { id: 'done', label: 'Done', color: '#22c55e' },
]

const grouped = computed(() => {
  const groups: Record<string, Story[]> = {}
  for (const col of COLUMNS) groups[col.id] = []
  for (const s of props.stories) {
    const col = COLUMNS.find(c => c.id === s.status) ? s.status : 'backlog'
    groups[col].push(s)
  }
  return groups
})

let dragStoryId: number | null = null

function onDragStart(e: DragEvent, storyId: number) {
  dragStoryId = storyId
  e.dataTransfer?.setData('story-id', String(storyId))
}

async function onDrop(e: DragEvent, newStatus: string) {
  e.preventDefault()
  const id = Number(e.dataTransfer?.getData('story-id') || dragStoryId)
  if (!id) return
  await apiPatch(`/api/v2/pm/stories/${id}`, { status: newStatus })
  const story = props.stories.find(s => s.id === id)
  if (story) story.status = newStatus
  props.onUpdate?.()
  dragStoryId = null
}

const priorityColors: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }
</script>

<template>
  <div class="kanban-board">
    <div v-for="col in COLUMNS" :key="col.id" class="kanban-column" @dragover.prevent @drop="onDrop($event, col.id)">
      <div class="column-header" :style="{ borderTopColor: col.color }">
        <span class="column-title">{{ col.label }}</span>
        <span class="column-count">{{ grouped[col.id].length }}</span>
      </div>
      <div class="column-body">
        <div
          v-for="story in grouped[col.id]" :key="story.id"
          class="kanban-card"
          draggable="true"
          @dragstart="onDragStart($event, story.id)"
        >
          <div class="card-top">
            <span class="card-id">SID:{{ story.id }}</span>
            <span class="card-sp" v-if="story.story_points">{{ story.story_points }}SP</span>
          </div>
          <div class="card-title">{{ story.title }}</div>
          <div class="card-bottom">
            <span class="card-priority" :style="{ color: priorityColors[story.priority] || '#9ca3af' }">{{ story.priority }}</span>
            <span v-if="story.assignee" class="card-assignee">{{ story.assignee }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kanban-board { display: flex; gap: 12px; overflow-x: auto; padding: 8px 0; min-height: 400px; }
.kanban-column { flex: 1; min-width: 200px; background: var(--bg-card, #fff); border-radius: var(--radius-lg, 12px); display: flex; flex-direction: column; }
.column-header { padding: 12px 14px; border-top: 3px solid; display: flex; justify-content: space-between; align-items: center; border-radius: var(--radius-lg, 12px) var(--radius-lg, 12px) 0 0; }
.column-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.column-count { font-size: 11px; background: var(--bg-hover); padding: 1px 6px; border-radius: 8px; color: var(--text-secondary); }
.column-body { padding: 8px; flex: 1; display: flex; flex-direction: column; gap: 6px; min-height: 100px; }
.kanban-card { background: var(--bg-main, #f5f6f8); border-radius: var(--radius-md, 8px); padding: 10px 12px; cursor: grab; transition: transform 0.1s; }
.kanban-card:active { cursor: grabbing; opacity: 0.7; }
.kanban-card:hover { transform: translateY(-1px); }
.card-top { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-bottom: 4px; }
.card-title { font-size: 13px; font-weight: 600; color: var(--text-primary); line-height: 1.4; }
.card-bottom { display: flex; justify-content: space-between; font-size: 11px; margin-top: 6px; }
.card-priority { font-weight: 600; }
.card-assignee { color: var(--text-secondary); }
.card-sp { font-weight: 600; }
</style>
