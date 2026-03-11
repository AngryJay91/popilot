<script setup lang="ts">
import { ref } from 'vue'
import type { Task, TaskStatus } from '@/composables/poc/useTaskBoardStore'
import { STATUS_LABELS } from '@/composables/poc/useTaskBoardStore'
import TaskCard from './TaskCard.vue'

const props = defineProps<{
  status: TaskStatus
  tasks: Task[]
}>()

const emit = defineEmits<{
  (e: 'drop', taskId: string, newStatus: TaskStatus): void
  (e: 'card-click', task: Task): void
  (e: 'card-dragstart', task: Task): void
}>()

const dragOver = ref(false)

function onDragOver(ev: DragEvent) {
  ev.preventDefault()
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}

function onDrop(ev: DragEvent) {
  ev.preventDefault()
  dragOver.value = false
  const taskId = ev.dataTransfer?.getData('text/plain')
  if (taskId) emit('drop', taskId, props.status)
}
</script>

<template>
  <div
    class="kanban-col"
    :class="{ 'drag-over': dragOver }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div class="col-header">
      <span class="col-title">{{ STATUS_LABELS[status] }}</span>
      <span class="col-count">{{ tasks.length }}</span>
    </div>
    <div class="col-body">
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        @click="emit('card-click', task)"
        @dragstart="emit('card-dragstart', task)"
      />
      <div v-if="tasks.length === 0" class="col-empty">No tasks</div>
    </div>
  </div>
</template>

<style scoped>
.kanban-col {
  flex: 1;
  min-width: 260px;
  max-width: 380px;
  background: var(--bg, #f9fafb);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  transition: background 0.2s;
}
.kanban-col.drag-over {
  background: #eff6ff;
}

.col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
}
.col-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary, #6b7280);
}
.col-count {
  font-size: 12px;
  font-weight: 700;
  background: var(--border, #e5e7eb);
  color: var(--text-secondary, #6b7280);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.col-body {
  flex: 1;
  padding: 0 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 120px;
}

.col-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--text-muted, #9ca3af);
  border: 2px dashed var(--border, #e5e7eb);
  border-radius: 8px;
  min-height: 80px;
}
</style>
