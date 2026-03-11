<script setup lang="ts">
import type { Task } from '@/composables/poc/useTaskBoardStore'
import { PRIORITY_COLORS } from '@/composables/poc/useTaskBoardStore'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  (e: 'click', task: Task): void
  (e: 'dragstart', task: Task): void
}>()

function onDragStart(ev: DragEvent) {
  ev.dataTransfer?.setData('text/plain', props.task.id)
  emit('dragstart', props.task)
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
</script>

<template>
  <div
    class="task-card"
    draggable="true"
    @click="emit('click', task)"
    @dragstart.stop="onDragStart"
  >
    <div class="tc-header">
      <span class="tc-priority" :style="{ background: PRIORITY_COLORS[task.priority] }">
        {{ task.priority }}
      </span>
    </div>
    <div class="tc-title">{{ task.title }}</div>
    <div v-if="task.description" class="tc-desc">{{ task.description }}</div>
    <div class="tc-footer">
      <div class="tc-avatar" :title="task.assignee">{{ initials(task.assignee) }}</div>
      <span class="tc-assignee">{{ task.assignee }}</span>
    </div>
  </div>
</template>

<style scoped>
.task-card {
  background: #fff;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
  padding: 12px;
  cursor: grab;
  transition: box-shadow 0.15s, transform 0.15s;
  user-select: none;
}
.task-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}
.task-card:active {
  cursor: grabbing;
  opacity: 0.7;
}

.tc-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 6px;
}
.tc-priority {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
  letter-spacing: 0.3px;
}

.tc-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin-bottom: 4px;
  line-height: 1.3;
}
.tc-desc {
  font-size: 12px;
  color: var(--text-muted, #9ca3af);
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tc-footer {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tc-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary, #2563eb);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tc-assignee {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
}
</style>
