<script setup lang="ts">
import type { Task, Priority } from '@/composables/poc/useTaskBoardStore'
import { useTaskBoardStore } from '@/composables/poc/useTaskBoardStore'
import KanbanColumn from './KanbanColumn.vue'
import BoardToolbar from './BoardToolbar.vue'
import TaskModal from './TaskModal.vue'

const store = useTaskBoardStore()

function handleDrop(taskId: string, newStatus: Task['status']) {
  store.moveTask(taskId, newStatus)
}

function handleSave(data: { title: string; description: string; assignee: string; priority: Priority }) {
  if (store.editingTask.value) {
    store.updateTask(store.editingTask.value.id, data)
  } else {
    store.addTask({ ...data, status: 'todo' })
  }
  store.closeModal()
}

function handleDelete(id: string) {
  store.deleteTask(id)
  store.closeModal()
}
</script>

<template>
  <div class="kanban-page">
    <div class="kanban-title-bar">
      <h1>Task Board</h1>
    </div>

    <BoardToolbar
      :counts="store.statusCounts.value"
      :assignees="store.uniqueAssignees.value"
      :current-filter="store.filterAssignee.value"
      @filter="store.setFilter"
      @create="store.openCreateModal"
    />

    <div class="kanban-columns">
      <KanbanColumn
        v-for="col in store.COLUMNS"
        :key="col"
        :status="col"
        :tasks="store.getTasksByStatus(col).value"
        @drop="handleDrop"
        @card-click="store.openEditModal"
        @card-dragstart="() => {}"
      />
    </div>

    <TaskModal
      v-if="store.isModalOpen.value"
      :task="store.editingTask.value"
      @save="handleSave"
      @delete="handleDelete"
      @close="store.closeModal"
    />
  </div>
</template>

<style scoped>
.kanban-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f1f5f9;
  overflow: hidden;
}

.kanban-title-bar {
  padding: 20px 20px 0;
}
.kanban-title-bar h1 {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary, #111827);
  margin: 0;
}

.kanban-columns {
  flex: 1;
  display: flex;
  gap: 12px;
  padding: 0 20px 20px;
  overflow-x: auto;
  min-height: 0;
}

@media (max-width: 768px) {
  .kanban-columns {
    padding: 0 12px 12px;
  }
}
</style>
