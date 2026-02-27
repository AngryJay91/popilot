<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMemo } from '@/composables/useMemo'
import { useUser } from '@/composables/useUser'

const route = useRoute()
const pageId = computed(() => (route.params.pageId as string) || 'global')
const { currentUser } = useUser()

const memoStore = ref(useMemo(pageId.value))

watch(pageId, (newId) => {
  memoStore.value = useMemo(newId)
})

const memoOpen = ref(false)
const newMemo = ref('')
const isComposing = ref(false)

function openMemo() {
  memoOpen.value = true
  memoStore.value.loadMemos()
}

async function handleAdd() {
  if (isComposing.value) return
  const text = newMemo.value.trim()
  if (!text) return
  await memoStore.value.addMemo(text, currentUser.value ?? '')
  newMemo.value = ''
}

function handleClearAll() {
  if (confirm('Delete all memos?')) {
    memoStore.value.clearAll()
  }
}
</script>

<template>
  <!-- Tab -->
  <div class="memo-tab" :class="{ hidden: memoOpen }" @click="openMemo">
    <span class="memo-tab-icon">&#9998;</span>
    <span class="memo-tab-label">Memo</span>
    <span v-if="memoStore.memoCount > 0" class="memo-tab-count">
      {{ memoStore.memoCount }}
    </span>
  </div>

  <!-- Sidebar -->
  <Teleport to="body">
    <Transition name="memo-slide">
      <div v-if="memoOpen" class="memo-sidebar">
        <div class="memo-header">
          <span class="memo-title">{{ pageId }} memo</span>
          <button class="memo-close" @click="memoOpen = false">&times;</button>
        </div>
        <div class="memo-body">
          <div class="memo-input-area">
            <textarea
              v-model="newMemo"
              class="memo-textarea"
              placeholder="Write a memo... (Enter to save, Shift+Enter for newline)"
              rows="3"
              @compositionstart="isComposing = true"
              @compositionend="isComposing = false"
              @keydown.enter.exact.prevent="handleAdd"
            ></textarea>
            <button class="memo-add-btn" @click="handleAdd" :disabled="!newMemo.trim()">Save</button>
          </div>
          <div class="memo-list">
            <div v-for="m in memoStore.memos" :key="m.id" class="memo-item">
              <div class="memo-item-header">
                <span class="memo-item-meta">
                  <span v-if="m.author" class="memo-item-author">{{ m.author }}</span>
                  <span class="memo-item-time">{{ memoStore.formatTime(m.ts) }}</span>
                </span>
                <button class="memo-item-del" @click="memoStore.deleteMemo(m.id)" title="Delete">&times;</button>
              </div>
              <div class="memo-item-text">{{ m.text }}</div>
            </div>
            <div v-if="memoStore.memos.length === 0" class="memo-empty">
              No memos yet.<br>Record thoughts while reviewing specs.
            </div>
          </div>
        </div>
        <div class="memo-footer">
          <span class="memo-footer-info">Team shared memos</span>
          <button v-if="memoStore.memos.length > 0" class="memo-clear-btn" @click="handleClearAll">Clear all</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.memo-tab {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 6px;
  background: #1e293b;
  color: #fff;
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: -2px 0 8px rgba(0,0,0,0.15);
  writing-mode: vertical-rl;
}
.memo-tab:hover { background: #334155; padding-right: 10px; }
.memo-tab.hidden { display: none; }
.memo-tab-icon { font-size: 16px; writing-mode: horizontal-tb; }
.memo-tab-label { font-size: 12px; font-weight: 600; letter-spacing: 1px; }
.memo-tab-count {
  writing-mode: horizontal-tb;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

<style>
/* Teleported -- unscoped */
.memo-sidebar {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 360px;
  max-width: 90vw;
  background: #fff;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0,0,0,0.15);
  pointer-events: auto;
}
.memo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}
.memo-title { font-size: 15px; font-weight: 700; color: #1e293b; }
.memo-close {
  background: none; border: none; font-size: 22px; color: #94a3b8;
  cursor: pointer; padding: 0 4px; line-height: 1;
}
.memo-close:hover { color: #1e293b; }

.memo-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }

.memo-input-area { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
.memo-textarea {
  width: 100%; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 10px 12px; font-size: 13px; line-height: 1.5;
  resize: vertical; font-family: inherit; color: #1e293b; box-sizing: border-box;
}
.memo-textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.memo-textarea::placeholder { color: #94a3b8; }

.memo-add-btn {
  margin-top: 8px; width: 100%; padding: 8px; background: #1e293b;
  color: #fff; border: none; border-radius: 6px; font-size: 13px;
  font-weight: 600; cursor: pointer;
}
.memo-add-btn:hover { background: #334155; }
.memo-add-btn:disabled { background: #cbd5e1; cursor: not-allowed; }

.memo-list { flex: 1; overflow-y: auto; padding: 12px 20px; }
.memo-item {
  padding: 12px 14px; background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 8px; margin-bottom: 8px;
}
.memo-item-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.memo-item-meta { display: flex; align-items: center; gap: 6px; }
.memo-item-author { font-size: 11px; color: #3b82f6; font-weight: 600; }
.memo-item-time { font-size: 11px; color: #94a3b8; font-weight: 500; }
.memo-item-del {
  background: none; border: none; font-size: 16px; color: #cbd5e1;
  cursor: pointer; padding: 0 2px; line-height: 1;
}
.memo-item-del:hover { color: #ef4444; }
.memo-item-text {
  font-size: 13px; color: #1e293b; line-height: 1.6;
  white-space: pre-wrap; word-break: break-word;
}

.memo-empty {
  text-align: center; color: #94a3b8; font-size: 13px;
  padding: 40px 20px; line-height: 1.6;
}

.memo-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 20px; border-top: 1px solid #e2e8f0;
  background: #f8fafc; flex-shrink: 0;
}
.memo-footer-info { font-size: 11px; color: #94a3b8; }
.memo-clear-btn {
  background: none; border: 1px solid #fca5a5; color: #ef4444;
  font-size: 11px; padding: 4px 10px; border-radius: 4px;
  cursor: pointer; font-weight: 500;
}
.memo-clear-btn:hover { background: #fef2f2; }

/* Transitions */
.memo-slide-enter-active, .memo-slide-leave-active { transition: transform 0.25s ease; }
.memo-slide-enter-from, .memo-slide-leave-to { transform: translateX(100%); }
</style>
