<script setup lang="ts">
import type { RetroItem, RetroCategory, RetroPhase } from '@/composables/useRetro'
import RetroCard from './RetroCard.vue'
import { ref } from 'vue'

const props = defineProps<{
  keepItems: RetroItem[]
  problemItems: RetroItem[]
  tryItems: RetroItem[]
  phase: RetroPhase
  currentUser: string
  votesRemaining: number
}>()

const emit = defineEmits<{
  (e: 'add-item', category: RetroCategory, content: string, author: string): void
  (e: 'delete-item', id: number): void
  (e: 'toggle-vote', id: number, hasVoted: boolean): void
}>()

const newContent = ref<Record<RetroCategory, string>>({
  keep: '',
  problem: '',
  try: '',
})

function handleAdd(cat: RetroCategory, e?: KeyboardEvent) {
  if (e?.isComposing) return
  const text = newContent.value[cat].trim()
  if (!text) return
  emit('add-item', cat, text, props.currentUser)
  newContent.value[cat] = ''
}

function getItems(cat: RetroCategory): RetroItem[] {
  if (cat === 'keep') return props.keepItems
  if (cat === 'problem') return props.problemItems
  return props.tryItems
}

function getSortedItems(cat: RetroCategory): RetroItem[] {
  const list = getItems(cat)
  if (props.phase === 'discuss') {
    return [...list].sort((a, b) => b.voteCount - a.voteCount)
  }
  return list
}

const COLUMNS: { id: RetroCategory; label: string; emoji: string; bg: string }[] = [
  { id: 'keep', label: 'Keep', emoji: '&#9989;', bg: '#E8F5E9' },
  { id: 'problem', label: 'Problem', emoji: '&#128308;', bg: '#FFF4F4' },
  { id: 'try', label: 'Try', emoji: '&#128161;', bg: '#EFF6FF' },
]
</script>

<template>
  <div class="retro-board">
    <div
      v-for="col in COLUMNS"
      :key="col.id"
      class="retro-col"
      :style="{ '--col-bg': col.bg }"
    >
      <div class="col-header">
        <span class="col-emoji" v-html="col.emoji" />
        <span class="col-label">{{ col.label }}</span>
        <span class="col-count">{{ getItems(col.id).length }}</span>
      </div>

      <!-- Input area: write phase only -->
      <div v-if="phase === 'write'" class="col-input">
        <textarea
          v-model="newContent[col.id]"
          class="col-textarea"
          placeholder="Add card... (Enter to submit)"
          rows="2"
          @keydown.enter.exact.prevent="handleAdd(col.id, $event)"
        />
        <button
          class="col-add-btn"
          :disabled="!newContent[col.id].trim()"
          @click="handleAdd(col.id)"
        >
          Add
        </button>
      </div>

      <!-- Cards -->
      <div class="col-cards">
        <RetroCard
          v-for="item in getSortedItems(col.id)"
          :key="item.id"
          :item="item"
          :phase="phase"
          :current-user="currentUser"
          :can-vote="votesRemaining > 0 || item.hasVoted"
          @delete="emit('delete-item', item.id)"
          @toggle-vote="emit('toggle-vote', item.id, item.hasVoted)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.retro-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.retro-col {
  background: var(--col-bg);
  border-radius: var(--radius);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 200px;
}

.col-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.col-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
  background: rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  padding: 1px 7px;
  font-weight: 600;
}

.col-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.col-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  font-size: 13px;
  font-family: var(--font-kr);
  resize: none;
  outline: none;
  transition: border-color 0.15s;
  background: #fff;
  box-sizing: border-box;
}
.col-textarea:focus {
  border-color: var(--primary);
}

.col-add-btn {
  align-self: flex-end;
  padding: 5px 14px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-kr);
  cursor: pointer;
  transition: opacity 0.15s;
}
.col-add-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.col-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
