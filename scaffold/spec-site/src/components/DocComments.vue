<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGet, apiPost, apiPatch, apiDelete } from '@/composables/useTurso'

interface Comment {
  id: number; doc_id: string; parent_id: number | null; author: string; content: string; created_at: string; updated_at: string
}

const props = defineProps<{ docId: string; currentUser: string }>()

const comments = ref<Comment[]>([])
const newComment = ref('')
const replyTo = ref<number | null>(null)
const editingId = ref<number | null>(null)
const editingText = ref('')

async function load() {
  const { data } = await apiGet<{ comments: Comment[] }>(`/api/v2/docs/${props.docId}/comments`)
  comments.value = data?.comments || []
}

const rootComments = () => comments.value.filter(c => !c.parent_id)
const replies = (parentId: number) => comments.value.filter(c => c.parent_id === parentId)

async function submit() {
  const trimmed = newComment.value.trim()
  if (!trimmed) return
  await apiPost(`/api/v2/docs/${props.docId}/comments`, { content: trimmed, parentId: replyTo.value })
  // @mention notification for doc comments
  if (trimmed.includes('@')) {
    apiPost('/api/v2/notifications/mention', {
      content: trimmed,
      sourceType: 'doc',
      sourceId: props.docId,
      pageId: `/docs/${props.docId}`,
      actor: props.currentUser,
    }).catch(() => {})
  }
  newComment.value = ''; replyTo.value = null
  await load()
}

async function startEdit(c: Comment) { editingId.value = c.id; editingText.value = c.content }

async function saveEdit() {
  if (!editingId.value) return
  await apiPatch(`/api/v2/docs/comments/${editingId.value}`, { content: editingText.value })
  editingId.value = null; await load()
}

async function remove(id: number) {
  if (!confirm('Delete this comment?')) return
  await apiDelete(`/api/v2/docs/comments/${id}`)
  await load()
}

onMounted(load)
</script>

<template>
  <div class="doc-comments">
    <h3 class="comments-title">Comments ({{ comments.length }})</h3>

    <div v-for="c in rootComments()" :key="c.id" class="comment-thread">
      <div class="comment-item">
        <div class="comment-header">
          <span class="comment-author">{{ c.author }}</span>
          <span class="comment-time">{{ c.created_at }}</span>
        </div>
        <div v-if="editingId === c.id" class="comment-edit">
          <textarea v-model="editingText" class="comment-textarea" rows="2" />
          <button class="btn btn--xs btn--primary" @click="saveEdit">Save</button>
          <button class="btn btn--xs" @click="editingId = null">Cancel</button>
        </div>
        <div v-else class="comment-body">{{ c.content }}</div>
        <div class="comment-actions">
          <button class="comment-action" @click="replyTo = c.id">Reply</button>
          <template v-if="c.author === currentUser">
            <button class="comment-action" @click="startEdit(c)">Edit</button>
            <button class="comment-action danger" @click="remove(c.id)">Delete</button>
          </template>
        </div>

        <!-- Replies -->
        <div v-for="r in replies(c.id)" :key="r.id" class="comment-reply">
          <div class="comment-header">
            <span class="comment-author">{{ r.author }}</span>
            <span class="comment-time">{{ r.created_at }}</span>
          </div>
          <div v-if="editingId === r.id" class="comment-edit">
            <textarea v-model="editingText" class="comment-textarea" rows="2" />
            <button class="btn btn--xs btn--primary" @click="saveEdit">Save</button>
            <button class="btn btn--xs" @click="editingId = null">Cancel</button>
          </div>
          <div v-else class="comment-body">{{ r.content }}</div>
          <div v-if="r.author === currentUser" class="comment-actions">
            <button class="comment-action" @click="startEdit(r)">Edit</button>
            <button class="comment-action danger" @click="remove(r.id)">Delete</button>
          </div>
        </div>

        <!-- Reply input -->
        <div v-if="replyTo === c.id" class="reply-form">
          <textarea v-model="newComment" class="comment-textarea" rows="2" placeholder="Reply..." />
          <button class="btn btn--xs btn--primary" @click="submit">Submit</button>
          <button class="btn btn--xs" @click="replyTo = null">Cancel</button>
        </div>
      </div>
    </div>

    <!-- New comment -->
    <div v-if="!replyTo" class="new-comment">
      <textarea v-model="newComment" class="comment-textarea" rows="2" placeholder="Write a comment..." />
      <button class="btn btn--sm btn--primary" @click="submit" :disabled="!newComment.trim()">Submit</button>
    </div>
  </div>
</template>

<style scoped>
.doc-comments { margin-top: 24px; border-top: 1px solid var(--border, #e5e7eb); padding-top: 16px; }
.comments-title { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
.comment-thread { margin-bottom: 12px; }
.comment-item { padding: 8px 0; }
.comment-header { display: flex; gap: 8px; align-items: center; margin-bottom: 4px; }
.comment-author { font-size: 13px; font-weight: 600; }
.comment-time { font-size: 11px; color: #9ca3af; }
.comment-body { font-size: 13px; line-height: 1.6; color: #374151; }
.comment-actions { display: flex; gap: 8px; margin-top: 4px; }
.comment-action { border: none; background: none; font-size: 11px; color: #6b7280; cursor: pointer; padding: 0; }
.comment-action:hover { color: #3b82f6; }
.comment-action.danger:hover { color: #ef4444; }
.comment-reply { margin-left: 24px; padding: 6px 0; border-left: 2px solid #e5e7eb; padding-left: 12px; }
.comment-textarea { width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; font-size: 13px; resize: vertical; box-sizing: border-box; }
.comment-edit { display: flex; flex-direction: column; gap: 4px; }
.reply-form { margin-top: 8px; margin-left: 24px; display: flex; flex-direction: column; gap: 4px; }
.new-comment { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
</style>
