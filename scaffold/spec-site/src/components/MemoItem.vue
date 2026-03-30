<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import type { MemoItem, MemoType, ReplyItem } from '@/composables/useMemo'
import { MEMO_TYPES } from '@/composables/useMemo'
import { parseMentions } from '@/utils/parseMentions'
import { useRouter } from 'vue-router'
import MentionInput from '@/components/MentionInput.vue'

const props = defineProps<{
  memo: MemoItem
  replies: ReplyItem[]
  authUser: string | null
  replyOpenId: number | null
  replyText: string
  replyReviewType: string
  showPageLabel?: boolean
}>()

const router = useRouter()

const emit = defineEmits<{
  resolve: [id: number]
  reopen: [id: number]
  delete: [id: number]
  toggleReply: [id: number]
  'update:replyText': [text: string]
  'update:replyReviewType': [type: string]
  addReply: [memoId: number]
  deleteReply: [replyId: number]
  convertToTask: [memo: MemoItem]
  convertToInitiative: [memo: MemoItem]
}>()

function getMemoTypeInfo(type: MemoType | undefined) {
  return MEMO_TYPES.find(t => t.value === type) ?? MEMO_TYPES[0]
}

function formatTime(ts: number | string): string {
  const d = typeof ts === 'string' ? new Date(ts) : new Date(ts)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}/${dd} ${hh}:${mi}`
}

function handleMentionClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.classList.contains('memo-mention')) {
    e.preventDefault()
    const path = target.getAttribute('data-mention-page')
    if (path) router.push(path)
  }
}

const PAGE_LABELS: Record<string, string> = {
  home: 'Home', diagnosis: 'AI Diagnosis', worknote: 'Coaching Notes',
  onboarding: 'Onboarding', pricing: 'Pricing',
}

function getPageLabel(pageId: string): string {
  if (PAGE_LABELS[pageId]) return PAGE_LABELS[pageId]
  if (pageId.startsWith('policy/')) {
    const parts = pageId.split('/')
    return parts.length === 3 ? `Policy ${parts[2]}` : `Policy`
  }
  if (pageId.startsWith('retro/')) return 'Retrospective'
  return pageId
}
</script>

<template>
  <div
    class="memo-item"
    :class="[`memo-item--${memo.memo_type}`, { 'memo-item--resolved': memo.status === 'resolved' }]"
  >
    <div class="memo-item-type-bar" :style="{ background: getMemoTypeInfo(memo.memo_type).color }"></div>
    <div class="memo-item-content">
      <div class="memo-item-header">
        <span class="memo-item-type-label">{{ getMemoTypeInfo(memo.memo_type).icon }} {{ getMemoTypeInfo(memo.memo_type).label }}</span>
        <span class="memo-item-time">{{ formatTime(memo.ts) }}</span>
      </div>
      <div class="memo-item-route">
        <span class="memo-item-author">{{ memo.author }}</span>
        <span class="memo-item-arrow">→</span>
        <template v-if="memo.assigned_to">
          <span
            v-for="name in memo.assigned_to.split(',').map((s: string) => s.trim()).filter(Boolean)"
            :key="name"
            class="memo-item-recipient-tag"
          >@{{ name }}</span>
        </template>
        <span v-else class="memo-item-assigned memo-item-assigned--all">Everyone</span>
      </div>
      <div v-if="showPageLabel && memo.page_id" class="memo-item-page" @click="router.push('/' + memo.page_id)">
        📄 {{ getPageLabel(memo.page_id) }}
      </div>
      <div v-if="memo.title" class="memo-item-title">{{ memo.title }}</div>
      <div
        class="memo-item-text"
        :class="{ 'memo-item-text--resolved': memo.status === 'resolved' }"
        v-html="parseMentions(memo.text)"
        @click="handleMentionClick"
      ></div>

      <!-- Replies -->
      <div v-if="replies.length" class="memo-reply-list">
        <div v-for="r in replies" :key="r.id" class="memo-reply-item" :class="`reply-${(r.review_type || 'comment').replace('_', '-')}`">
          <div class="memo-reply-header">
            <span v-if="r.review_type === 'approve'" class="memo-review-badge badge-approve"><Icon name="check" :size="14" /> Approved</span>
            <span v-else-if="r.review_type === 'request_changes'" class="memo-review-badge badge-changes"><Icon name="refreshCw" :size="14" /> Changes Requested</span>
            <span class="memo-reply-author">{{ r.created_by }}</span>
            <span class="memo-reply-time">{{ formatTime(r.created_at) }}</span>
            <button
              v-if="r.created_by === authUser"
              class="memo-action-btn memo-action-btn--delete"
              @click="emit('deleteReply', r.id)"
              title="Delete reply"
              style="margin-left:auto;padding:1px 4px;font-size:10px;"
            ><Icon name="trash" :size="14" /></button>
          </div>
          <div class="memo-reply-text" v-html="parseMentions(r.content)" @click="handleMentionClick"></div>
        </div>
      </div>

      <!-- Reply Input -->
      <div v-if="replyOpenId === memo.id" class="memo-reply-input">
        <div class="memo-review-type-select">
          <label class="review-type-option" :class="{ active: replyReviewType === 'comment' }">
            <input type="radio" name="replyReviewType" :checked="replyReviewType === 'comment'" @change="emit('update:replyReviewType', 'comment')" /> <Icon name="messageCircle" :size="14" /> Comment
          </label>
          <label class="review-type-option" :class="{ active: replyReviewType === 'approve' }">
            <input type="radio" name="replyReviewType" :checked="replyReviewType === 'approve'" @change="emit('update:replyReviewType', 'approve')" /> <Icon name="check" :size="14" /> Approve
          </label>
          <label class="review-type-option" :class="{ active: replyReviewType === 'request_changes' }">
            <input type="radio" name="replyReviewType" :checked="replyReviewType === 'request_changes'" @change="emit('update:replyReviewType', 'request_changes')" /> <Icon name="refreshCw" :size="14" /> Request Changes
          </label>
        </div>
        <MentionInput
          :model-value="replyText"
          placeholder="Write a reply... (@ to mention)"
          :rows="2"
          @update:model-value="emit('update:replyText', $event)"
          @submit="emit('addReply', memo.id)"
        />
        <div class="memo-reply-input-actions">
          <button class="memo-reply-send" @click="emit('addReply', memo.id)" :disabled="!replyText.trim()">Send</button>
          <button class="memo-reply-cancel" @click="emit('toggleReply', memo.id)">Cancel</button>
        </div>
      </div>

      <div class="memo-item-actions">
        <button
          class="memo-action-btn memo-action-btn--reply"
          @click="emit('toggleReply', memo.id)"
          title="Reply"
        ><Icon name="messageCircle" :size="14" /> {{ replies.length || '' }}</button>
        <button
          v-if="memo.status === 'open'"
          class="memo-action-btn memo-action-btn--convert"
          @click="emit('convertToTask', memo)"
          title="Convert to task"
        ><Icon name="sprint" :size="14" /> Convert to Task</button>
        <button
          v-if="memo.status === 'open'"
          class="memo-action-btn memo-action-btn--initiative"
          @click="emit('convertToInitiative', memo)"
          title="Convert to initiative"
        >Convert to Initiative</button>
        <button
          v-if="memo.status === 'open'"
          class="memo-action-btn memo-action-btn--resolve"
          @click="emit('resolve', memo.id)"
          title="Mark as resolved"
        >✓ resolve</button>
        <button
          v-else
          class="memo-action-btn memo-action-btn--reopen"
          @click="emit('reopen', memo.id)"
          title="Reopen"
        >↩ reopen</button>
        <button
          v-if="memo.author === authUser"
          class="memo-action-btn memo-action-btn--delete"
          @click="emit('delete', memo.id)"
          title="Delete"
        ><Icon name="trash" :size="14" /></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.memo-item {
  display: flex; border-radius: 8px; margin-bottom: 10px;
  background: #f8fafc; border: 1px solid #e2e8f0;
  overflow: hidden; transition: opacity 0.2s;
}
.memo-item--resolved { opacity: 0.6; }
.memo-item-type-bar { width: 3px; flex-shrink: 0; }
.memo-item-content { flex: 1; padding: 10px 12px; min-width: 0; }

.memo-item-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 4px;
}
.memo-item-type-label { font-size: 10px; font-weight: 600; color: #64748b; }
.memo-item-time { font-size: 10px; color: #94a3b8; }

.memo-item-route {
  display: flex; align-items: center; gap: 4px;
  margin-bottom: 6px; font-size: 12px;
}
.memo-item-author { color: #3b82f6; font-weight: 600; }
.memo-item-arrow { color: #94a3b8; }
.memo-item-assigned { color: #1e293b; font-weight: 500; }
.memo-item-assigned--all { color: #94a3b8; font-weight: 400; }
.memo-item-recipient-tag {
  display: inline-block;
  padding: 1px 7px; background: #dbeafe; color: #1d4ed8;
  font-size: 11px; font-weight: 600; border-radius: 10px;
  margin-right: 2px;
}

.memo-item-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.memo-item-text {
  font-size: 13px; color: #1e293b; line-height: 1.6;
  white-space: pre-wrap; word-break: break-word;
}
.memo-item-text--resolved { text-decoration: line-through; color: #94a3b8; }

.memo-item-actions {
  display: flex; gap: 6px; margin-top: 8px; justify-content: flex-end;
}
.memo-action-btn {
  background: none; border: 1px solid transparent; font-size: 11px;
  padding: 3px 8px; border-radius: 4px; cursor: pointer; font-weight: 500;
  transition: all 0.15s;
}
.memo-action-btn--resolve { color: #22c55e; border-color: #bbf7d0; }
.memo-action-btn--resolve:hover { background: #f0fdf4; }
.memo-action-btn--reopen { color: #3b82f6; border-color: #bfdbfe; }
.memo-action-btn--reopen:hover { background: #eff6ff; }
.memo-action-btn--delete { color: #cbd5e1; border-color: transparent; }
.memo-action-btn--delete:hover { color: #ef4444; }
.memo-action-btn--reply { color: #3b82f6; border-color: #bfdbfe; }
.memo-action-btn--reply:hover { background: #eff6ff; }
.memo-action-btn--convert { color: #f59e0b; border-color: #fde68a; }
.memo-action-btn--convert:hover { background: #fffbeb; }
.memo-action-btn--initiative { color: #1d4ed8; border-color: #bfdbfe; }
.memo-action-btn--initiative:hover { background: #eff6ff; }

/* Reply */
.memo-reply-list {
  margin-top: 8px; padding-left: 10px; border-left: 2px solid #e2e8f0;
}
.memo-reply-item { padding: 6px 0; font-size: 12px; }
.memo-reply-item + .memo-reply-item { border-top: 1px solid #f1f5f9; }
.memo-reply-header {
  display: flex; align-items: center; gap: 6px; margin-bottom: 2px;
}
.memo-reply-author { color: #3b82f6; font-weight: 600; font-size: 11px; }
.memo-reply-time { color: #94a3b8; font-size: 10px; }
.memo-reply-text { color: #334155; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }

.memo-reply-input { margin-top: 8px; }
.memo-reply-textarea {
  width: 100%; border: 1px solid #e2e8f0; border-radius: 6px;
  padding: 8px 10px; font-size: 12px; line-height: 1.4;
  resize: none; font-family: inherit; color: #1e293b; box-sizing: border-box;
}
.memo-reply-textarea:focus { outline: none; border-color: #3b82f6; }
.memo-reply-input-actions { display: flex; gap: 6px; margin-top: 4px; justify-content: flex-end; }
.memo-reply-send {
  padding: 4px 12px; background: #1e293b; color: #fff; border: none;
  border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer;
}
.memo-reply-send:hover { background: #334155; }
.memo-reply-send:disabled { background: #cbd5e1; cursor: not-allowed; }
.memo-reply-cancel {
  padding: 4px 10px; background: none; border: 1px solid #e2e8f0;
  border-radius: 4px; font-size: 11px; color: #94a3b8; cursor: pointer;
}
.memo-reply-cancel:hover { color: #64748b; border-color: #94a3b8; }

/* Page label (global inbox) */
.memo-item-page {
  display: inline-block;
  font-size: 10px; font-weight: 600; color: #3b82f6;
  background: #eff6ff; padding: 2px 8px; border-radius: 10px;
  margin-bottom: 4px; cursor: pointer;
}
.memo-item-page:hover { background: #dbeafe; }

/* Mention links (v-html injected) */
.memo-item-text :deep(.memo-mention),
.memo-reply-text :deep(.memo-mention) {
  color: #3b82f6; font-weight: 600; text-decoration: none;
  background: #eff6ff; padding: 1px 4px; border-radius: 3px;
  cursor: pointer;
}
.memo-item-text :deep(.memo-mention:hover),
.memo-reply-text :deep(.memo-mention:hover) {
  background: #dbeafe; text-decoration: underline;
}
.memo-item-text :deep(.mention-chip),
.memo-reply-text :deep(.mention-chip) {
  background: #dbeafe; color: #1d4ed8; padding: 1px 4px; border-radius: 4px; font-weight: 500;
}
.memo-review-type-select {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.review-type-option {
  font-size: 10px;
  padding: 2px 6px;
  border: 1px solid #e2e8f0;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 3px;
  transition: all 0.1s;
}
.review-type-option input[type="radio"] {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap; border: 0;
}
.review-type-option.active { border-color: #8b5cf6; background: #f5f3ff; color: #7c3aed; font-weight: 600; }

.memo-review-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 3px;
  margin-right: 4px;
}
.badge-approve { background: #dcfce7; color: #16a34a; }
.badge-changes { background: #fef3c7; color: #d97706; }
.reply-approve { border-left-color: #22c55e; }
.reply-request-changes { border-left-color: #f59e0b; }
</style>
