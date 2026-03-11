<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Task, Priority } from '@/composables/poc/useTaskBoardStore'
import { TEAM_MEMBERS } from '@/composables/poc/useTaskBoardStore'
import ModalOverlay from './ModalOverlay.vue'

const props = defineProps<{
  task: Task | null  // null = create mode
}>()

const emit = defineEmits<{
  (e: 'save', data: { title: string; description: string; assignee: string; priority: Priority }): void
  (e: 'delete', id: string): void
  (e: 'close'): void
}>()

const title = ref('')
const description = ref('')
const assignee = ref(TEAM_MEMBERS[0])
const priority = ref<Priority>('medium')

watch(
  () => props.task,
  (t) => {
    if (t) {
      title.value = t.title
      description.value = t.description
      assignee.value = t.assignee
      priority.value = t.priority
    } else {
      title.value = ''
      description.value = ''
      assignee.value = TEAM_MEMBERS[0]
      priority.value = 'medium'
    }
  },
  { immediate: true },
)

function handleSave() {
  if (!title.value.trim()) return
  emit('save', {
    title: title.value.trim(),
    description: description.value.trim(),
    assignee: assignee.value,
    priority: priority.value,
  })
}

function handleDelete() {
  if (props.task && confirm('Delete this task?')) {
    emit('delete', props.task.id)
  }
}

const isEdit = () => props.task !== null
</script>

<template>
  <ModalOverlay @close="emit('close')">
    <div class="tm-content">
      <div class="tm-header">
        <h2>{{ isEdit() ? 'Edit Task' : 'New Task' }}</h2>
        <button class="tm-close" @click="emit('close')">&times;</button>
      </div>

      <form @submit.prevent="handleSave">
        <div class="tm-field">
          <label>Title *</label>
          <input v-model="title" type="text" placeholder="What needs to be done?" autofocus />
        </div>

        <div class="tm-field">
          <label>Description</label>
          <textarea v-model="description" rows="3" placeholder="Add details..." />
        </div>

        <div class="tm-row">
          <div class="tm-field">
            <label>Assignee</label>
            <select v-model="assignee">
              <option v-for="m in TEAM_MEMBERS" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>
          <div class="tm-field">
            <label>Priority</label>
            <select v-model="priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <div class="tm-actions">
          <button v-if="isEdit()" type="button" class="tm-delete" @click="handleDelete">
            Delete
          </button>
          <div class="tm-spacer" />
          <button type="button" class="tm-cancel" @click="emit('close')">Cancel</button>
          <button type="submit" class="tm-save" :disabled="!title.trim()">
            {{ isEdit() ? 'Save' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </ModalOverlay>
</template>

<style scoped>
.tm-content {
  padding: 24px;
}
.tm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.tm-header h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #111827);
  margin: 0;
}
.tm-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-muted, #9ca3af);
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.tm-close:hover {
  color: var(--text-primary, #111827);
}

.tm-field {
  margin-bottom: 16px;
  flex: 1;
}
.tm-field label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 6px;
}
.tm-field input,
.tm-field textarea,
.tm-field select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: var(--text-primary, #111827);
  background: #fff;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.tm-field input:focus,
.tm-field textarea:focus,
.tm-field select:focus {
  outline: none;
  border-color: var(--primary, #2563eb);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
.tm-field textarea {
  resize: vertical;
}

.tm-row {
  display: flex;
  gap: 12px;
}

.tm-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border, #e5e7eb);
}
.tm-spacer {
  flex: 1;
}
.tm-cancel {
  padding: 8px 16px;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
}
.tm-cancel:hover {
  background: var(--bg, #f9fafb);
}
.tm-save {
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  background: var(--primary, #2563eb);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.tm-save:hover {
  opacity: 0.9;
}
.tm-save:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.tm-delete {
  padding: 8px 16px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #ef4444;
  cursor: pointer;
}
.tm-delete:hover {
  background: #fef2f2;
}
</style>
