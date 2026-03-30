<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet, apiPost, apiPatch } from '@/composables/useTurso'
import MentionInput from '@/components/MentionInput.vue'
import { renderMarkdown } from '@/utils/markdown'
import MemoRelations from '@/components/MemoRelations.vue'
import MemoTimeline from '@/components/MemoTimeline.vue'
import MemoChecklist from '@/components/MemoChecklist.vue'
import MemoGraph from '@/components/MemoGraph.vue'
import { useAuth } from '@/composables/useAuth'

const { authUser } = useAuth()

interface Memo {
  id: number
  page_id: string
  content: string
  status: string
  created_by: string
  assigned_to: string | null
  created_at: string
}

interface Reply {
  id: number
  memo_id: number
  content: string
  created_by: string
  review_type: string
  created_at: string
}

const route = useRoute()
const router = useRouter()
const memos = ref<Memo[]>([])
const replies = ref<Record<number, Reply[]>>({})
const loading = ref(true)
const selectedId = computed(() => route.params.id ? Number(route.params.id) : null)

// Search / Filter
const searchKeyword = ref('')
const filterStatus = ref('')
const filterAuthor = ref('')
const memberList = ref<string[]>([])
const showNewMemo = ref(false)
const newMemoContent = ref('')
const newMemoChannel = ref('general')
const memoTemplates = ref<any[]>([])
const showTemplateModal = ref(false)

async function loadMemoTemplates() {
  const { data } = await apiGet('/api/v2/memos/templates')
  memoTemplates.value = (data as any)?.templates || []
}

function applyTemplate(tmpl: any) {
  const fields = JSON.parse(tmpl.fields || '[]')
  let content = `# ${tmpl.name}\n\n`
  for (const f of fields) {
    content += `## ${f.label}\n\n`
  }
  newMemoContent.value = content
  showTemplateModal.value = false
}
const newMemoType = ref('memo')
const newMemoAssignees = ref<string[]>([])
const pageSize = 20
const currentOffset = ref(0)
const totalMemos = ref(0)
const hasMore = computed(() => currentOffset.value + pageSize < totalMemos.value)
const loadingMore = ref(false)

async function loadMemos(append = false) {
  if (append) { loadingMore.value = true } else { loading.value = true; currentOffset.value = 0 }
  const params = new URLSearchParams({ limit: String(pageSize), offset: String(currentOffset.value) })
  if (searchKeyword.value) params.set('keyword', searchKeyword.value)
  if (filterStatus.value) params.set('status', filterStatus.value)
  if (filterAuthor.value) params.set('author', filterAuthor.value)
  const { data, error } = await apiGet(`/api/v2/memos/all?${params}`)
  if (!error && data?.memos) {
    if (append) {
      memos.value = [...memos.value, ...(data.memos as Memo[])]
    } else {
      memos.value = data.memos as Memo[]
    }
    totalMemos.value = Number(data.total) || 0
    // Load all replies
    const ids = memos.value.map(m => m.id)
    if (ids.length) {
      const { data: rData } = await apiGet(`/api/v2/memos/replies?memoIds=${ids.join(',')}`)
      if (rData?.replies) {
        const grouped: Record<number, Reply[]> = {}
        for (const r of rData.replies as Reply[]) {
          if (!grouped[r.memo_id]) grouped[r.memo_id] = []
          grouped[r.memo_id].push(r)
        }
        replies.value = grouped
      }
    }
  }
  loading.value = false
  loadingMore.value = false

  // Deep link: fetch individually if not in list
  if (selectedId.value && !memos.value.find(m => m.id === selectedId.value)) {
    const { data: singleData } = await apiGet(`/api/v2/memos/by-id/${selectedId.value}`)
    const singleMemos = singleData?.memos as Memo[] | undefined
    if (singleMemos?.length) {
      memos.value = [singleMemos[0], ...memos.value]
    }
  }
  // Load replies for deep-linked memo
  if (selectedId.value && !replies.value[selectedId.value]) {
    const { data: rData } = await apiGet(`/api/v2/memos/replies?memoIds=${selectedId.value}`)
    if (rData?.replies) {
      const grouped: Record<number, Reply[]> = { ...replies.value }
      for (const r of rData.replies as Reply[]) {
        if (!grouped[r.memo_id]) grouped[r.memo_id] = []
        grouped[r.memo_id].push(r)
      }
      replies.value = grouped
    }
  }
}

function loadMore() {
  currentOffset.value += pageSize
  loadMemos(true)
}

const activeTab = ref<'thread' | 'timeline'>('thread')
const showGraph = ref(false)

// Channels
const channels = ref<any[]>([])
const activeChannel = ref('')

// Read receipts + Presence
const readers = ref<any[]>([])
const presentUsers = ref<any[]>([])
const readMemoIds = ref<Set<number>>(new Set())
let presenceTimer: ReturnType<typeof setInterval> | null = null

async function loadMyReads() {
  const { data } = await apiGet(`/api/v2/memos/my-reads?userName=${encodeURIComponent(currentUser.value)}`)
  const ids = (data as any)?.memoIds || []
  readMemoIds.value = new Set(ids)
}

async function markRead(memoId: number) {
  await apiPost(`/api/v2/memos/${memoId}/read`, {})
  readMemoIds.value.add(memoId)
}

async function loadReaders(memoId: number) {
  const { data } = await apiGet(`/api/v2/memos/${memoId}/readers`)
  readers.value = (data as any)?.readers || []
}

async function sendPresence(memoId: number) {
  await apiPost(`/api/v2/memos/${memoId}/presence`, {})
  const { data } = await apiGet(`/api/v2/memos/${memoId}/presence`)
  presentUsers.value = (data as any)?.present || []
}

// Typing indicator
const typingUsers = ref<string[]>([])
let typingTimer: ReturnType<typeof setInterval> | null = null

async function sendTyping(memoId: number) {
  await apiPost(`/api/v2/memos/${memoId}/typing`, {})
}

async function pollTyping(memoId: number) {
  const { data } = await apiGet(`/api/v2/memos/${memoId}/typing`)
  typingUsers.value = ((data as any)?.typing || []).map((t: any) => t.user_name)
}

function startTypingPoll(memoId: number) {
  if (typingTimer) clearInterval(typingTimer)
  typingTimer = setInterval(() => pollTyping(memoId), 3000)
}

function stopTypingPoll() {
  if (typingTimer) { clearInterval(typingTimer); typingTimer = null }
  typingUsers.value = []
}

function startPresence(memoId: number) {
  if (presenceTimer) clearInterval(presenceTimer)
  sendPresence(memoId)
  presenceTimer = setInterval(() => sendPresence(memoId), 5000)
}

function stopPresence() {
  if (presenceTimer) { clearInterval(presenceTimer); presenceTimer = null }
  presentUsers.value = []
}

const unreadCounts = ref<Record<string, number>>({})
const showMobileSearch = ref(false)

async function loadChannels() {
  const { data } = await apiGet('/api/v2/memos/channels')
  channels.value = (data as any)?.channels || []
  // Unread counts
  const { data: ucData } = await apiGet('/api/v2/memos/channels/unread-counts')
  unreadCounts.value = (ucData as any)?.counts || {}
}

// Extended filters
const currentUser = ref(localStorage.getItem('spec-user-name') || '')
const filterAssignedTo = ref('')
const filterDateFrom = ref('')

const filteredMemos = computed(() => {
  let result = memos.value
  if (activeChannel.value) result = result.filter(m => (m as any).channel_id === activeChannel.value)
  if (filterStatus.value) result = result.filter(m => m.status === filterStatus.value)
  if (filterAssignedTo.value === 'me') result = result.filter(m => m.assigned_to === currentUser.value)
  else if (filterAssignedTo.value) result = result.filter(m => m.assigned_to === filterAssignedTo.value)
  if (filterDateFrom.value) result = result.filter(m => m.created_at >= filterDateFrom.value)
  return result
})

// Presets
function presetMyMemos() { filterAssignedTo.value = 'me'; filterStatus.value = '' }
function presetOpen() { filterStatus.value = 'open'; filterAssignedTo.value = '' }
function presetThisWeek() {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  now.setDate(now.getDate() - diff)
  filterDateFrom.value = now.toISOString().split('T')[0]
  filterStatus.value = ''; filterAssignedTo.value = ''
}
function clearFilters() { filterStatus.value = ''; filterAssignedTo.value = ''; filterDateFrom.value = '' }

// Saved views
const savedViews = ref<any[]>([])
async function loadViews() {
  const { data } = await apiGet('/api/v2/memos/views')
  savedViews.value = (data as any)?.views || []
}
async function saveView() {
  const name = prompt('View name:')
  if (!name) return
  await apiPost('/api/v2/memos/views', { name, filters: { status: filterStatus.value, assignedTo: filterAssignedTo.value, dateFrom: filterDateFrom.value } })
  await loadViews()
}
function applyView(v: any) {
  const f = JSON.parse(v.filters || '{}')
  filterStatus.value = f.status || ''; filterAssignedTo.value = f.assignedTo || ''; filterDateFrom.value = f.dateFrom || ''
}
const linkedDocs = ref<any[]>([])

async function loadLinkedDocs(memoId: number) {
  const { data } = await apiGet(`/api/v2/memos/${memoId}/linked-docs`)
  linkedDocs.value = (data as any)?.links || []
}

async function createDocFromMemo() {
  if (!selectedMemo.value) return
  const { data } = await apiPost(`/api/v2/memos/${selectedMemo.value.id}/create-doc`, {})
  if ((data as any)?.docId) {
    alert('Document has been created.')
    await loadLinkedDocs(selectedMemo.value.id)
  }
}

const selectedMemo = computed(() =>
  selectedId.value ? memos.value.find(m => m.id === selectedId.value) : null
)

const selectedReplies = computed(() =>
  selectedId.value ? (replies.value[selectedId.value] || []) : []
)

function selectMemo(id: number) {
  router.push(`/memos/${id}`)
  loadLinkedDocs(id)
  markRead(id)
  loadReaders(id)
  startPresence(id)
  startTypingPoll(id)
  nextTick(() => {
    const main = document.querySelector('.app-main')
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

function goBackClean() {
  stopPresence(); stopTypingPoll()
  router.push('/memos')
}

function goBack() {
  router.push('/memos')
}

function formatDate(d: string) {
  // DB stores UTC without Z suffix
  const date = new Date(d.endsWith('Z') ? d : d + 'Z')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    open: 'OPEN', resolved: 'RESOLVED', 'request-changes': 'REQUEST_CHANGES'
  }
  return map[s] || s
}

function statusClass(s: string) {
  return `status-${s}`
}

// Reply input
const replyContent = ref('')
async function submitReply() {
  if (!selectedId.value || !replyContent.value.trim()) return
  await apiPost('/api/v2/memos/replies', {
    memoId: selectedId.value,
    content: replyContent.value.trim(),
  })
  replyContent.value = ''
  await loadMemos()
  // Auto scroll
  await nextTick()
  const repliesEl = document.querySelector('.replies-section')
  if (repliesEl) repliesEl.scrollTop = repliesEl.scrollHeight
}

function highlightMentions(text: string): string {
  return text.replace(/@([^\s@][^\n@]*?)(?=\s|$|@)/g, '<span class="mention-chip">@$1</span>')
}

async function deleteReply(replyId: number) {
  if (!confirm('Delete this reply?')) return
  const { apiDelete } = await import('@/composables/useTurso')
  await apiDelete(`/api/v2/memos/replies/${replyId}`)
  await loadMemos()
}

async function quickResolve(id: number) {
  await apiPatch(`/api/v2/memos/${id}/resolve`, {})
  const memo = memos.value.find(m => m.id === id)
  if (memo) memo.status = 'resolved'
}

async function resolveMemo() {
  if (!selectedMemo.value) return
  await apiPatch(`/api/v2/memos/${selectedMemo.value.id}/resolve`, {})
  selectedMemo.value.status = 'resolved'
}

async function reopenMemo() {
  if (!selectedMemo.value) return
  await apiPatch(`/api/v2/memos/${selectedMemo.value.id}`, { status: 'open' })
  selectedMemo.value.status = 'open'
}

async function convertToStory() {
  if (!selectedMemo.value) return
  const title = selectedMemo.value.content.split('\n')[0].slice(0, 100)
  const ok = confirm(`Create story "${title}"?`)
  if (!ok) return
  const { error } = await apiPost('/api/v2/pm/stories', {
    title,
    description: selectedMemo.value.content,
    status: 'backlog',
  })
  if (error) { alert(error); return }
  // resolve memo
  await apiPatch(`/api/v2/memos/${selectedMemo.value.id}/resolve`, {})
  await loadMemos()
}

async function convertToInitiative() {
  if (!selectedMemo.value) return
  const title = selectedMemo.value.content.split('\n')[0].slice(0, 100)
  const ok = confirm(`Create initiative "${title}"?`)
  if (!ok) return
  const { error } = await apiPost('/api/v2/initiatives', {
    title,
    content: selectedMemo.value.content,
    source_context: `Memo #${selectedMemo.value.id}`,
  })
  if (error) { alert(error); return }
  await apiPatch(`/api/v2/memos/${selectedMemo.value.id}/resolve`, {})
  await loadMemos()
}

async function loadMembers() {
  const { data } = await apiGet('/api/v2/admin/members')
  if (data?.members) memberList.value = (data.members as any[]).filter(m => m.is_active).map(m => m.display_name)
}

async function createMemo() {
  if (!newMemoContent.value.trim()) return
  if (!newMemoAssignees.value.length) {
    if (!confirm('No recipients specified. Post anyway?')) return
  }
  await apiPost('/api/v2/memos', {
    pageId: 'general',
    content: newMemoContent.value,
    memoType: newMemoType.value,
    assignedTo: newMemoAssignees.value.join(', ') || null,
  })
  newMemoContent.value = ''; newMemoAssignees.value = []; showNewMemo.value = false
  await loadMemos()
}

onMounted(() => { loadMemos(); loadMembers(); loadViews(); loadChannels(); loadMemoTemplates(); loadMyReads() })
watch(() => route.params.id, () => {
  if (route.params.id && !memos.value.length) loadMemos()
})
</script>

<template>
  <div class="memos-page">
    <div class="memos-header">
      <h1>Memos</h1>
    </div>

    <!-- New memo modal -->
    <div v-if="showNewMemo" class="new-memo-card">
      <button v-if="memoTemplates.length" class="btn btn--xs btn--ghost" @click="showTemplateModal = true"><Icon name="sprint" :size="14" /> Template</button>
      <select v-model="newMemoChannel" class="channel-select">
        <option v-for="ch in channels" :key="ch.id" :value="ch.id">{{ ch.icon }} {{ ch.name }}</option>
      </select>
      <MentionInput v-model="newMemoContent" placeholder="Memo content..." :rows="3" @submit="createMemo" />
      <div class="new-memo-actions">
        <select v-model="newMemoType" class="filter-select">
          <option value="memo">Memo</option>
          <option value="decision">Decision</option>
          <option value="request">Request</option>
          <option value="feature_request">Feature Request</option>
          <option value="policy_request">Policy Request</option>
        </select>
        <div class="assignee-multi">
          <div v-if="newMemoAssignees.length" class="assignee-tags">
            <span v-for="a in newMemoAssignees" :key="a" class="assignee-tag">
              {{ a }} <button class="tag-remove" @click="newMemoAssignees = newMemoAssignees.filter(x => x !== a)">x</button>
            </span>
          </div>
          <select class="filter-select" @change="(e: Event) => { const v = (e.target as HTMLSelectElement).value; if (v && !newMemoAssignees.includes(v)) newMemoAssignees.push(v); (e.target as HTMLSelectElement).value = '' }">
            <option value="">+ Add recipient</option>
            <option v-for="m in memberList.filter(n => !newMemoAssignees.includes(n))" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <button class="btn btn--primary" @click="createMemo" :disabled="!newMemoContent.trim()">Submit</button>
        <button class="btn" @click="showNewMemo = false">Cancel</button>
      </div>
    </div>

    <!-- Detail view -->
    <div v-if="selectedMemo" class="memo-detail">
      <button class="btn-back" @click="goBack">Back to list</button>

      <div class="memo-card detail-card">
        <div class="memo-meta">
          <span class="memo-id">#{{ selectedMemo.id }}</span>
          <span :class="['memo-status', statusClass(selectedMemo.status)]">{{ statusLabel(selectedMemo.status) }}</span>
          <span class="memo-author">{{ selectedMemo.created_by }}</span>
          <span class="memo-date">{{ formatDate(selectedMemo.created_at) }}</span>
        </div>
        <div v-if="selectedMemo.assigned_to" class="memo-assigned">
          To: {{ selectedMemo.assigned_to }}
        </div>
        <div class="memo-content" v-html="renderMarkdown(selectedMemo.content)"></div>
        <div class="memo-actions">
          <button v-if="selectedMemo.status === 'open'" class="btn btn--primary btn--sm" @click="resolveMemo"><Icon name="check" :size="14" /> Resolve</button>
          <button v-if="selectedMemo.status === 'resolved'" class="btn btn--ghost btn--sm" @click="reopenMemo"><Icon name="refreshCw" :size="14" /> Reopen</button>
          <button v-if="selectedMemo.status === 'open'" class="btn btn--convert" @click="convertToStory">Convert to Story</button>
          <button v-if="selectedMemo.status === 'open'" class="btn btn--initiative" @click="convertToInitiative">Convert to Initiative</button>
        </div>
      </div>

      <!-- Read receipts + Presence -->
      <div v-if="readers.length || presentUsers.length" class="memo-presence-bar">
        <div v-if="presentUsers.length" class="presence-now">
          <span class="presence-dot" />
          <span v-for="u in presentUsers" :key="u.user_name" class="presence-avatar" :title="u.user_name">{{ u.user_name.length <= 3 ? u.user_name : u.user_name.slice(0, 3) }}</span>
        </div>
        <div v-if="readers.length" class="readers-list">
          Read by: {{ readers.map(r => r.user_name).join(', ') }}
        </div>
      </div>

      <!-- Template modal is moved via Teleport -->

      <!-- Typing indicator -->
      <div v-if="typingUsers.length" class="typing-indicator">
        {{ typingUsers.join(', ') }} {{ typingUsers.length === 1 ? 'is' : 'are' }} typing...
      </div>

      <!-- Checklist -->
      <MemoChecklist v-if="selectedMemo" :memo-id="selectedMemo.id" :members="memberList" />

      <!-- Related memos -->
      <MemoRelations v-if="selectedMemo" :memo-id="selectedMemo.id" />

      <!-- Linked documents -->
      <div v-if="selectedMemo && linkedDocs.length" class="linked-docs">
        <span class="linked-docs-title">Linked Documents</span>
        <div v-for="d in linkedDocs" :key="d.doc_id" class="linked-doc-item" @click="$router.push(`/docs/${d.doc_id}`)">
          {{ d.icon || '📄' }} {{ d.title }}
        </div>
      </div>
      <button v-if="selectedMemo" class="btn btn--xs btn--ghost" @click="createDocFromMemo">📄 Create Document</button>

      <!-- Tabs -->
      <div class="memo-tabs">
        <button class="memo-tab" :class="{ active: activeTab === 'thread' }" @click="activeTab = 'thread'">Thread</button>
        <button class="memo-tab" :class="{ active: activeTab === 'timeline' }" @click="activeTab = 'timeline'">Timeline</button>
      </div>

      <!-- Timeline -->
      <MemoTimeline v-if="activeTab === 'timeline' && selectedMemo" :memo-id="selectedMemo.id" />

      <!-- Reply thread -->
      <div v-if="activeTab === 'thread'" class="replies-section">
        <h3>Replies ({{ selectedReplies.length }})</h3>
        <div v-for="r in selectedReplies" :key="r.id" class="reply-card">
          <div class="reply-meta">
            <span class="reply-author">{{ r.created_by }}</span>
            <span v-if="r.review_type !== 'comment'" :class="['reply-type', `type-${r.review_type}`]">{{ r.review_type }}</span>
            <span class="reply-date">{{ formatDate(r.created_at) }}</span>
          </div>
          <div class="reply-content" v-html="renderMarkdown(highlightMentions(r.content))"></div>
          <button v-if="r.created_by === authUser" class="reply-delete-btn" @click="deleteReply(r.id)">Delete</button>
        </div>

        <div class="reply-input">
          <MentionInput v-model="replyContent" placeholder="Write a reply... (@ to mention)" @submit="submitReply" />
          <button class="btn btn--primary" @click="submitReply" :disabled="!replyContent.trim()">Reply</button>
        </div>
      </div>
    </div>

    <!-- List view -->
    <!-- Channels -->
    <div class="channel-tabs">
      <button class="channel-tab" :class="{ active: !activeChannel }" @click="activeChannel = ''">All</button>
      <button v-for="ch in channels" :key="ch.id" class="channel-tab" :class="{ active: activeChannel === ch.id }" @click="activeChannel = ch.id">
        {{ ch.icon }} {{ ch.name }}
        <span v-if="unreadCounts[ch.id]" class="unread-badge">{{ unreadCounts[ch.id] }}</span>
      </button>
    </div>

    <!-- Filters -->
    <div class="memo-filter-bar">
      <button class="btn btn--xs" :class="filterAssignedTo === 'me' ? 'btn--primary' : 'btn--ghost'" @click="presetMyMemos">My Memos</button>
      <button class="btn btn--xs" :class="filterStatus === 'open' ? 'btn--primary' : 'btn--ghost'" @click="presetOpen">Unresolved</button>
      <button class="btn btn--xs btn--ghost" @click="presetThisWeek">This Week</button>
      <button v-if="filterStatus || filterAssignedTo || filterDateFrom" class="btn btn--xs btn--ghost" @click="clearFilters">✕ Reset</button>
      <button class="btn btn--xs btn--ghost" @click="saveView">💾 Save View</button>
      <select v-if="savedViews.length" class="filter-view-select" @change="applyView(savedViews[($event.target as HTMLSelectElement).selectedIndex - 1])">
        <option value="">Saved Views</option>
        <option v-for="v in savedViews" :key="v.id">{{ v.name }}</option>
      </select>
    </div>

    <!-- Graph view toggle -->
    <div class="graph-toggle">
      <button class="btn btn--xs" :class="showGraph ? 'btn--primary' : 'btn--ghost'" @click="showGraph = !showGraph"><Icon name="link" :size="14" /> Graph</button>
    </div>
    <MemoGraph v-if="showGraph" :memos="memos" />

    <div v-else class="memo-list">
      <div class="memo-filters">
        <button class="mobile-search-btn" @click="showMobileSearch = !showMobileSearch"><Icon name="search" :size="14" /></button>
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="Search by keyword..."
          class="filter-input" :class="{ 'mobile-search-open': showMobileSearch }"
          @keydown.enter="loadMemos()"
        />
        <select v-model="filterStatus" class="filter-select" @change="loadMemos()">
          <option value="">All Statuses</option>
          <option value="open">OPEN</option>
          <option value="resolved">RESOLVED</option>
          <option value="request-changes">REQUEST_CHANGES</option>
        </select>
        <select v-model="filterAuthor" class="filter-select" @change="loadMemos()">
          <option value="">All Authors</option>
          <option v-for="m in memberList" :key="m" :value="m">{{ m }}</option>
        </select>
        <button class="btn btn--primary btn-search" @click="loadMemos()">Search</button>
        <button class="btn-new-memo" @click="showNewMemo = true">+ New Memo</button>
      </div>
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="!memos.length" class="empty">No memos found.</div>
      <div
        v-else
        v-for="m in filteredMemos"
        :key="m.id"
        class="memo-card list-card" :class="{ unread: !readMemoIds.has(m.id) }"
        @click="selectMemo(m.id)"
      >
        <div class="memo-meta">
          <span class="memo-id">#{{ m.id }}</span>
          <span :class="['memo-status', statusClass(m.status)]">{{ statusLabel(m.status) }}</span>
          <span class="memo-author">{{ m.created_by }}</span>
          <span class="memo-date">{{ formatDate(m.created_at) }}</span>
          <span v-if="replies[m.id]?.length" class="reply-count">{{ replies[m.id].length }} {{ replies[m.id].length === 1 ? 'reply' : 'replies' }}</span>
          <button v-if="m.status === 'open'" class="resolve-icon" @click.stop="quickResolve(m.id)" title="Resolve"><Icon name="check" :size="14" /></button>
        </div>
        <div class="memo-preview">{{ m.content.slice(0, 120) }}{{ m.content.length > 120 ? '...' : '' }}</div>
      </div>
      <div v-if="hasMore" class="load-more">
        <button class="btn btn--primary" @click="loadMore" :disabled="loadingMore">
          {{ loadingMore ? 'Loading...' : 'Load More' }}
        </button>
      </div>
      <div v-if="memos.length" class="memo-count">
        {{ memos.length }} / {{ totalMemos }} items
      </div>
    </div>
  </div>

  <!-- Template modal (Teleport) -->
  <Teleport to="body">
    <div v-if="showTemplateModal" class="tmpl-overlay" @click.self="showTemplateModal = false">
      <div class="tmpl-modal">
        <h4>Memo Templates</h4>
        <div v-for="t in memoTemplates" :key="t.id" class="tmpl-item" @click="applyTemplate(t)">
          {{ t.icon || '📝' }} {{ t.name }}
        </div>
        <div v-if="!memoTemplates.length" class="tmpl-empty">No templates available.</div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.memos-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 16px;
  background: var(--bg-main, #f5f6f8);
  min-height: calc(100vh - 60px);
}
.memos-header h1 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
}
.memo-card {
  background: var(--bg-card, #fff);
  border: none;
  border-radius: var(--radius-lg, 12px);
  padding: 16px;
  margin-bottom: 8px;
}
.list-card { cursor: pointer; transition: background 0.1s; }
.list-card:hover { background: var(--bg-hover, #f0f1f3); }
.memo-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted, #888);
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.memo-id { font-weight: 700; color: var(--text-primary, #333); }
.memo-status {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}
.status-open { background: #dbeafe; color: #1d4ed8; }
.status-resolved { background: #dcfce7; color: #16a34a; }
.status-request-changes { background: #fef3c7; color: #d97706; }
.memo-content { font-size: 14px; line-height: 1.6; padding: 16px; }
.memo-content :deep(pre) { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.6; margin: 12px 0; }
.memo-content :deep(code) { background: #f1f5f9; color: #1e293b; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
.memo-content :deep(pre code) { background: none; color: inherit; padding: 0; }
.memo-content :deep(blockquote) { border-left: 3px solid #3b82f6; padding: 8px 12px; margin: 12px 0; background: #f8fafc; border-radius: 0 8px 8px 0; }
.memo-content :deep(h1) { font-size: 20px; font-weight: 700; margin: 16px 0 8px; }
.memo-content :deep(h2) { font-size: 17px; font-weight: 600; margin: 14px 0 6px; }
.memo-content :deep(h3) { font-size: 15px; font-weight: 600; margin: 12px 0 4px; }
.memo-content :deep(ul), .memo-content :deep(ol) { padding-left: 20px; margin: 8px 0; }
.memo-content :deep(a) { color: #3b82f6; }
.memo-content :deep(hr) { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
.memo-content :deep(table) { border-collapse: collapse; width: 100%; margin: 12px 0; }
.memo-content :deep(th), .memo-content :deep(td) { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
.memo-content :deep(th) { background: #f9fafb; font-weight: 600; }
.memo-preview { font-size: 13px; color: var(--text-secondary, #666); }
.memo-assigned { font-size: 12px; color: var(--text-muted, #888); margin-top: 8px; }
.memo-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.resolve-icon { border: none; background: none; cursor: pointer; font-size: 14px; opacity: 0.4; transition: opacity 0.15s; }
.resolve-icon:hover { opacity: 1; }
.memo-tabs { display: flex; gap: 4px; margin: 12px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
.memo-tab { border: none; background: none; padding: 6px 12px; font-size: 13px; color: #6b7280; cursor: pointer; border-radius: 6px 6px 0 0; }
.memo-tab.active { color: #3b82f6; border-bottom: 2px solid #3b82f6; font-weight: 600; }
.linked-docs { margin: 8px 0; padding: 8px; background: #f8fafc; border-radius: 6px; }
.linked-docs-title { font-size: 12px; font-weight: 600; color: #6b7280; display: block; margin-bottom: 4px; }
.linked-doc-item { padding: 4px 0; font-size: 13px; color: #3b82f6; cursor: pointer; }
.linked-doc-item:hover { text-decoration: underline; }
.mobile-search-btn { display: none; border: none; background: #f3f4f6; padding: 4px 8px; border-radius: 6px; font-size: 14px; cursor: pointer; }
.memo-filter-bar { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px; align-items: center; }
.filter-view-select { border: 1px solid #d1d5db; border-radius: 6px; padding: 4px 8px; font-size: 11px; }
.channel-tabs { display: flex; gap: 4px; margin-bottom: 8px; overflow-x: auto; padding-bottom: 4px; }
.channel-tab { border: none; background: #f3f4f6; padding: 5px 12px; font-size: 12px; border-radius: 16px; cursor: pointer; white-space: nowrap; }
.channel-tab.active { background: #3b82f6; color: #fff; }
.channel-tab:hover:not(.active) { background: #e5e7eb; }
.unread-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 16px; height: 16px; border-radius: 8px; background: #ef4444; color: #fff; font-size: 10px; font-weight: 700; padding: 0 4px; margin-left: 4px; }
.channel-select { border: 1px solid #d1d5db; border-radius: 6px; padding: 4px 8px; font-size: 12px; margin-bottom: 4px; }
.memo-card.unread { border-left: 3px solid #3b82f6; font-weight: 600; }
.memo-presence-bar { display: flex; gap: 16px; align-items: center; padding: 8px 0; font-size: 12px; color: #6b7280; }
.presence-now { display: flex; align-items: center; gap: 4px; }
.presence-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.presence-avatar, .reader-avatar { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: #eff6ff; color: #3b82f6; font-size: 10px; font-weight: 600; cursor: pointer; }
.reader-names { font-size: 11px; color: var(--text-muted); margin-left: 4px; }
.readers-list { display: flex; align-items: center; gap: 4px; }
.tmpl-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 9999; display: flex; align-items: center; justify-content: center; }
.tmpl-modal { background: #fff; border-radius: 12px; padding: 20px; width: 320px; }
.tmpl-modal h4 { margin: 0 0 12px; }
.tmpl-item { padding: 10px; cursor: pointer; border-radius: 6px; font-size: 14px; }
.tmpl-item:hover { background: #eff6ff; }
.tmpl-empty { color: #9ca3af; text-align: center; padding: 16px; }
.typing-indicator { font-size: 12px; color: #6b7280; font-style: italic; padding: 4px 0; animation: blink 1.5s infinite; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.btn--convert { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: pointer; }
.btn--initiative { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: pointer; }
.reply-count { background: #e0e7ff; color: #4338ca; padding: 1px 6px; border-radius: 8px; font-size: 10px; }

.btn-back {
  background: none;
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 16px;
}

.replies-section { margin-top: 24px; }
.replies-section h3 { font-size: 14px; margin-bottom: 12px; }
.reply-card {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
}
.reply-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted, #888);
  margin-bottom: 6px;
}
.reply-author { font-weight: 600; color: var(--text-primary, #333); }
.reply-type { padding: 1px 4px; border-radius: 3px; font-size: 10px; }
.type-approve { background: #dcfce7; color: #16a34a; }
.type-request-changes { background: #fef3c7; color: #d97706; }
.reply-content { font-size: 13px; line-height: 1.5; }
.reply-content :deep(pre) { background: #1e293b; color: #e2e8f0; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 12px; margin: 8px 0; }
.reply-content :deep(code) { background: #f1f5f9; color: #1e293b; padding: 1px 4px; border-radius: 3px; font-size: 12px; }
.reply-content :deep(pre code) { background: none; color: inherit; padding: 0; }
.reply-content :deep(blockquote) { border-left: 2px solid #3b82f6; padding: 4px 8px; margin: 8px 0; background: #f8fafc; }
.reply-content :deep(h1), .reply-content :deep(h2), .reply-content :deep(h3) { font-size: 14px; font-weight: 600; margin: 8px 0 4px; }
.reply-content :deep(ul), .reply-content :deep(ol) { padding-left: 16px; margin: 4px 0; }
.reply-input { margin-top: 16px; }
.reply-input textarea {
  width: 100%;
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: 8px;
  padding: 8px;
  font-size: 13px;
  resize: vertical;
  margin-bottom: 8px;
  box-sizing: border-box;
}
.btn--primary {
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 13px;
}
.memo-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.filter-input {
  flex: 1;
  min-width: 120px;
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
}
.filter-author { max-width: 120px; }
.filter-select {
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  background: #fff;
}
.btn-search { padding: 6px 16px; white-space: nowrap; }
.assignee-multi { display: flex; flex-direction: column; gap: 4px; }
.assignee-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.assignee-tag { background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 12px; font-size: 12px; display: flex; align-items: center; gap: 4px; }
.tag-remove { background: none; border: none; color: #1d4ed8; cursor: pointer; font-size: 12px; padding: 0; }
.btn-new-memo { background: #3b82f6; color: #fff; border: none; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.new-memo-card { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.new-memo-actions { display: flex; gap: 8px; margin-top: 8px; align-items: center; }
.load-more { text-align: center; padding: 16px 0; }
.memo-count { text-align: center; font-size: 12px; color: var(--text-muted, #888); padding: 8px 0; }
.mention-chip { background: #dbeafe; color: #1d4ed8; padding: 1px 4px; border-radius: 4px; font-weight: 500; }
.reply-delete-btn { background: none; border: none; color: #ef4444; font-size: 11px; cursor: pointer; padding: 2px 4px; }
.reply-delete-btn:hover { text-decoration: underline; }
.loading, .empty { text-align: center; color: var(--text-muted, #888); padding: 40px; }
@media (max-width: 767px) {
  .memos-page { padding: 8px; }
  .channel-tabs { overflow-x: auto; flex-wrap: nowrap; gap: 4px; padding-bottom: 2px; -webkit-overflow-scrolling: touch; }
  .channel-tab { padding: 4px 10px; font-size: 12px; flex-shrink: 0; }
  .memo-filter-bar { flex-direction: row; flex-wrap: wrap; gap: 4px; }
  .memo-filter-bar .btn { padding: 4px 10px; font-size: 11px; }
  .filter-view-select { width: auto; font-size: 11px; }
  .memo-filter-bar { flex-direction: row; flex-wrap: nowrap; overflow-x: auto; gap: 4px; -webkit-overflow-scrolling: touch; }
  .filter-view-select { font-size: 10px; padding: 2px 6px; width: auto; }
  .mobile-search-btn { display: inline-flex; }
  .filter-input { display: none; }
  .filter-input.mobile-search-open { display: block; width: 100%; }
  .memo-filters { flex-direction: row; flex-wrap: wrap; gap: 4px; }
  .memo-filters select { width: auto; min-width: 80px; font-size: 12px; padding: 4px 6px; min-height: 36px; }
  .graph-toggle { display: none; }
  .memo-graph { display: none; }
  .memo-card { padding: 10px; margin-bottom: 6px; border-radius: 10px; }
  .memo-meta { flex-wrap: wrap; gap: 4px; font-size: 11px; }
  .memo-preview { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .detail-card { padding: 10px; }
  .memo-actions { flex-wrap: wrap; gap: 4px; }
  .memo-actions .btn { min-height: 40px; }
  .replies-section { padding: 0; }
  .reply-card { padding: 8px; }
  .memo-tabs { overflow-x: auto; flex-wrap: nowrap; }
  .memo-presence-bar { flex-wrap: wrap; font-size: 11px; }
  h1 { font-size: 18px; }
  .btn { min-height: 40px; }
  input, select, textarea { min-height: 40px; font-size: 16px; }
}
</style>
