<script setup lang="ts">
import type { TaskStatus } from '@/composables/poc/useTaskBoardStore'
import { STATUS_LABELS } from '@/composables/poc/useTaskBoardStore'

defineProps<{
  counts: Record<TaskStatus, number>
  assignees: string[]
  currentFilter: string
}>()

const emit = defineEmits<{
  (e: 'filter', assignee: string): void
  (e: 'create'): void
}>()

const COLUMNS: TaskStatus[] = ['todo', 'in-progress', 'done']
const STATUS_COLORS: Record<TaskStatus, string> = {
  'todo': '#94a3b8',
  'in-progress': '#3b82f6',
  'done': '#22c55e',
}
</script>

<template>
  <div class="board-toolbar">
    <div class="bt-counters">
      <div v-for="col in COLUMNS" :key="col" class="bt-counter">
        <span class="bt-dot" :style="{ background: STATUS_COLORS[col] }" />
        <span class="bt-label">{{ STATUS_LABELS[col] }}</span>
        <span class="bt-num">{{ counts[col] }}</span>
      </div>
    </div>

    <div class="bt-right">
      <select
        class="bt-filter"
        :value="currentFilter"
        @change="emit('filter', ($event.target as HTMLSelectElement).value)"
      >
        <option value="">All members</option>
        <option v-for="a in assignees" :key="a" :value="a">{{ a }}</option>
      </select>

      <button class="bt-add" @click="emit('create')">+ New Task</button>
    </div>
  </div>
</template>

<style scoped>
.board-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.bt-counters {
  display: flex;
  gap: 16px;
}
.bt-counter {
  display: flex;
  align-items: center;
  gap: 6px;
}
.bt-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.bt-label {
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
}
.bt-num {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary, #111827);
}

.bt-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bt-filter {
  padding: 8px 12px;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: var(--text-primary, #111827);
  background: #fff;
  cursor: pointer;
}
.bt-filter:focus {
  outline: none;
  border-color: var(--primary, #2563eb);
}

.bt-add {
  padding: 8px 16px;
  background: var(--primary, #2563eb);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}
.bt-add:hover {
  opacity: 0.9;
}
</style>
