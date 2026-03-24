<script setup lang="ts">
import type { PmTask } from '@/composables/usePmStore'
import { TASK_STATUSES, TASK_STATUS_LABELS, updateTaskStatus, updateTask } from '@/composables/usePmStore'

const props = defineProps<{
  task: PmTask
}>()

const emit = defineEmits<{
  updated: []
}>()

async function updateTaskDate(value: string) {
  await updateTask(props.task.id, { dueDate: value || null } as any)
  emit('updated')
}

async function cycleStatus() {
  const idx = TASK_STATUSES.indexOf(props.task.status)
  const next = TASK_STATUSES[(idx + 1) % TASK_STATUSES.length]
  await updateTaskStatus(props.task.id, next)
  emit('updated')
}
</script>

<template>
  <div class="task-item" :class="{ done: task.status === 'done' }">
    <button class="task-check" @click="cycleStatus" :title="TASK_STATUS_LABELS[task.status]">
      <span v-if="task.status === 'done'">&#10003;</span>
      <span v-else-if="task.status === 'in-progress'" class="check-progress">&#9654;</span>
      <span v-else class="check-empty">&#9675;</span>
    </button>
    <span class="task-title">{{ task.title }}</span>
    <span v-if="task.storyPoints" class="task-sp">{{ task.storyPoints }}SP</span>
    <span v-if="task.assignee" class="task-assignee">{{ task.assignee }}</span>
    <input type="date" class="task-date" :value="task.dueDate ?? ''" @change="updateTaskDate(($event.target as HTMLInputElement).value)" title="Due date" />
  </div>
</template>

<style scoped>
.task-item { display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 4px; font-size: 12px; transition: background 0.1s; }
.task-item:hover { background: #f8fafc; }
.task-item.done .task-title { text-decoration: line-through; color: #94a3b8; }
.task-check { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border: none; background: none; cursor: pointer; font-size: 14px; flex-shrink: 0; border-radius: 4px; transition: background 0.1s; }
.task-check:hover { background: #e2e8f0; }
.check-empty { color: #cbd5e1; }
.check-progress { color: #f59e0b; font-size: 10px; }
.task-title { flex: 1; color: #334155; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.task-sp { font-size: 10px; font-weight: 700; color: #3b82f6; flex-shrink: 0; }
.task-date { border: 1px solid rgba(0,0,0,0.06); border-radius: 4px; padding: 1px 4px; font-size: 10px; background: transparent; color: var(--text-muted); flex-shrink: 0; width: 100px; }
.task-assignee { font-size: 11px; color: #94a3b8; flex-shrink: 0; background: #f1f5f9; padding: 1px 6px; border-radius: 3px; }
</style>
