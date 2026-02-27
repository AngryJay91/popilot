<script setup lang="ts">
import type { RetroAction } from '@/composables/useRetro'
import { ref } from 'vue'

defineProps<{
  actions: RetroAction[]
  teamMembers: string[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: 'add-action', content: string, assignee: string | null): void
  (e: 'toggle-status', id: number, status: 'pending' | 'done'): void
}>()

const newContent = ref('')
const newAssignee = ref('')

function handleAdd() {
  const text = newContent.value.trim()
  if (!text) return
  emit('add-action', text, newAssignee.value || null)
  newContent.value = ''
  newAssignee.value = ''
}
</script>

<template>
  <div class="retro-actions">
    <div class="actions-title">Action Items</div>

    <div v-if="!readonly" class="actions-add">
      <input
        v-model="newContent"
        class="actions-input"
        placeholder="Add action item..."
        @keydown.enter="handleAdd"
      />
      <select v-model="newAssignee" class="actions-select">
        <option value="">Assignee</option>
        <option v-for="m in teamMembers" :key="m" :value="m">{{ m }}</option>
      </select>
      <button class="actions-add-btn" :disabled="!newContent.trim()" @click="handleAdd">
        Add
      </button>
    </div>

    <div class="actions-list">
      <div
        v-for="action in actions"
        :key="action.id"
        class="action-row"
        :class="{ done: action.status === 'done' }"
      >
        <button
          class="action-check"
          :disabled="readonly"
          @click="emit('toggle-status', action.id, action.status)"
        >
          {{ action.status === 'done' ? '&#9989;' : '&#11036;' }}
        </button>
        <span class="action-content">{{ action.content }}</span>
        <span v-if="action.assignee" class="action-assignee">@{{ action.assignee }}</span>
      </div>
      <div v-if="actions.length === 0" class="actions-empty">No action items yet</div>
    </div>
  </div>
</template>

<style scoped>
.retro-actions {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  margin: 0 16px 16px;
}

.actions-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.actions-add {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.actions-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-family: var(--font-kr);
  outline: none;
  transition: border-color 0.15s;
}
.actions-input:focus {
  border-color: var(--primary);
}

.actions-select {
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-family: var(--font-kr);
  background: #fff;
  min-width: 90px;
}

.actions-add-btn {
  padding: 8px 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-kr);
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}
.actions-add-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.1s;
}
.action-row:hover {
  background: var(--bg);
}
.action-row.done .action-content {
  text-decoration: line-through;
  color: var(--text-muted);
}

.action-check {
  border: none;
  background: none;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
}
.action-check:disabled {
  cursor: default;
}

.action-content {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
}

.action-assignee {
  font-size: 12px;
  color: var(--primary);
  font-weight: 500;
  background: var(--primary-light);
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

.actions-empty {
  text-align: center;
  padding: 20px;
  color: var(--text-muted);
  font-size: 13px;
}
</style>
