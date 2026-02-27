<script setup lang="ts">
import type { RetroItem, RetroPhase } from '@/composables/useRetro'

const props = defineProps<{
  item: RetroItem
  phase: RetroPhase
  currentUser: string
  canVote: boolean
}>()

const emit = defineEmits<{
  (e: 'delete'): void
  (e: 'toggle-vote'): void
}>()
</script>

<template>
  <div class="retro-card" :class="{ voted: item.hasVoted }">
    <div class="card-content">{{ item.content }}</div>
    <div class="card-footer">
      <span class="card-author">{{ item.author }}</span>
      <div class="card-actions">
        <button
          v-if="phase === 'vote' || phase === 'discuss'"
          class="card-vote-btn"
          :class="{ active: item.hasVoted, disabled: !canVote && !item.hasVoted }"
          :disabled="!canVote && !item.hasVoted"
          @click="emit('toggle-vote')"
        >
          {{ item.hasVoted ? '&#128077;' : '&#9757;' }} {{ item.voteCount }}
        </button>
        <button
          v-if="phase === 'write' && item.author === currentUser"
          class="card-del-btn"
          @click="emit('delete')"
        >
          &times;
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.retro-card {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: all 0.15s;
}
.retro-card.voted {
  border-color: var(--primary);
  background: var(--primary-light);
}

.card-content {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  gap: 8px;
}

.card-author {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-vote-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--text-secondary);
}
.card-vote-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
}
.card-vote-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.card-vote-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.card-del-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.card-del-btn:hover {
  background: var(--red-bg);
  color: var(--red);
}
</style>
