<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { ref, onMounted, computed, nextTick, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { renderMarkdown } from '@/utils/markdown'
import DocsSidebar from '@/components/DocsSidebar.vue'
import DocEditor from '@/components/DocEditor.vue'
import DocComments from '@/components/DocComments.vue'

const route = useRoute()
const docId = computed(() => route.params.docId as string)
const content = ref('')
const title = ref('')
const author = ref('')
const updatedAt = ref('')
const contentFormat = ref('markdown')
const loading = ref(true)
const editing = ref(false) // skip polling while editing
const childDocs = ref<{ id: string; title: string; icon: string | null }[]>([])
const docIcon = ref('📄')
const sourceMemos = ref<any[]>([])
const showEmojiPicker = ref(false)
const DOC_EMOJIS = ['📄', '📋', '🏃', '📌', '🔖', '📊', '🎯', '💡', '🔧', '📦', '🚀', '⚡', '🎨', '📐', '🔒', '🌐', '📁', '📅', '💼', '🛠️']

async function changeDocIcon(icon: string) {
  docIcon.value = icon
  showEmojiPicker.value = false
  const { apiPatch: ap } = await import('@/composables/useTurso')
  await ap(`/api/v2/docs/${docId.value}`, { icon })
}
const editContent = ref('')
const docTags = ref<string[]>([])
const newTag = ref('')

function addTag() {
  const tag = newTag.value.trim()
  if (!tag || docTags.value.includes(tag)) return
  docTags.value.push(tag)
  newTag.value = ''
  saveTags()
}

function removeTag(tag: string) {
  docTags.value = docTags.value.filter(t => t !== tag)
  saveTags()
}

async function onTitleBlur(e: Event) {
  const newTitle = (e.target as HTMLElement).textContent?.trim() || ''
  if (newTitle && newTitle !== title.value) {
    title.value = newTitle
    const { apiPatch: ap } = await import('@/composables/useTurso')
    await ap(`/api/v2/docs/${docId.value}`, { title: newTitle })
  }
}

async function saveTags() {
  const { apiPatch: ap } = await import('@/composables/useTurso')
  await ap(`/api/v2/docs/${docId.value}`, { tags: docTags.value })
}
const saveStatus = ref<'saved' | 'saving' | 'changed'>('saved')
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
const showHistory = ref(false)
const revisions = ref<any[]>([])
const previewRevision = ref<any>(null)

async function saveDoc() {
  saveStatus.value = 'saving'
  const { apiPut } = await import('@/composables/useTurso')
  await apiPut(`/api/v2/docs/${docId.value}`, { title: title.value, content: editContent.value, contentFormat: 'html' })
  saveStatus.value = 'saved'
  // Re-sync baseline after own save
  const { apiGet: ag2 } = await import('@/composables/useTurso')
  const { data: freshDoc } = await ag2(`/api/v2/docs/${docId.value}`)
  remoteUpdatedAt.value = (freshDoc as any)?.doc?.updated_at || ''
  hasRemoteUpdate.value = false
}

function onEditorChange(val: string) {
  editContent.value = val
  saveStatus.value = 'changed'
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => saveDoc(), 3000)
}



function onBeforeUnload(e: BeforeUnloadEvent) {
  if (saveStatus.value === 'changed') {
    e.preventDefault()
    e.returnValue = ''
  }
}

async function loadRevisions() {
  const { apiGet: ag } = await import('@/composables/useTurso')
  const { data } = await ag(`/api/v2/docs/${docId.value}/revisions`)
  revisions.value = (data as any)?.revisions || []
  showHistory.value = true
}

async function previewRev(revId: number) {
  const { apiGet: ag } = await import('@/composables/useTurso')
  const { data } = await ag(`/api/v2/docs/${docId.value}/revisions/${revId}`)
  previewRevision.value = (data as any)?.revision || null
}

async function restoreRev(revId: number) {
  if (!confirm('Restore this version?')) return
  const { apiPost: ap } = await import('@/composables/useTurso')
  await ap(`/api/v2/docs/${docId.value}/revisions/restore/${revId}`, {})
  location.reload()
}
const toc = ref<Array<{ id: string; text: string; level: number }>>([])
const activeHeading = ref('')

function formatDate(d: string) {
  if (!d) return ''
  const date = new Date(d.endsWith('Z') ? d : d + 'Z')
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function loadDoc() {
  loading.value = true
  try {
    const { apiGet } = await import('@/composables/useTurso')
    const { data } = await apiGet<{ doc: { title: string; content: string; created_by?: string; updated_at?: string } }>(`/api/v2/docs/${docId.value}`)
    if (data?.doc) {
      content.value = data.doc.content
      title.value = data.doc.title
      author.value = data.doc.created_by || ''
      updatedAt.value = data.doc.updated_at || ''
      remoteUpdatedAt.value = data.doc.updated_at || '' // sync polling baseline
      contentFormat.value = (data.doc as any).content_format || 'markdown'
      try { docTags.value = JSON.parse((data.doc as any).tags || '[]') } catch { docTags.value = [] }
      docIcon.value = (data.doc as any).icon || '📄'
      // Source memos
      const { data: srcData } = await apiGet(`/api/v2/docs/${docId.value}/source-memos`)
      sourceMemos.value = (srcData as any)?.memos || []
      // Markdown to HTML conversion
      if (contentFormat.value === 'markdown' || !contentFormat.value || contentFormat.value === 'null') {
        // One-time markdown to HTML conversion + update DB
        const html = renderMarkdown(content.value)
        editContent.value = html
        content.value = html
        contentFormat.value = 'html'
        // DB migration (one-time)
        const { apiPut: ap2 } = await import('@/composables/useTurso')
        await ap2(`/api/v2/docs/${docId.value}`, { title: title.value, content: html, contentFormat: 'html' })
      } else {
        editContent.value = content.value
      }
      // Fetch child documents
      const { data: treeData } = await apiGet<{ tree: any[] }>('/api/v2/docs/tree')
      if (treeData?.tree) {
        function findNode(nodes: any[], id: string): any {
          for (const n of nodes) {
            if (n.id === id) return n
            const found = findNode(n.children || [], id)
            if (found) return found
          }
          return null
        }
        const node = findNode(treeData.tree, docId.value)
        childDocs.value = (node?.children || []).map((c: any) => ({ id: c.id, title: c.title, icon: c.icon }))
      }
    } else {
      // Document not found — auto-create new document
      const { apiPut } = await import('@/composables/useTurso')
      await apiPut(`/api/v2/docs/${docId.value}`, { title: 'New Document', content: '' })
      title.value = 'New Document'
      editContent.value = ''
    }
  } catch (_) {
    content.value = '# Failed to load document'
  }
  loading.value = false
  await nextTick()
  buildToc()
  addCopyButtons()
  window.addEventListener('scroll', onScroll)
}

// Real-time document refresh (compare updated_at + visibility/focus polling)
let docPollTimer: ReturnType<typeof setInterval> | null = null
const remoteUpdatedAt = ref('')
const hasRemoteUpdate = ref(false)

async function checkForUpdates() {
  if (editing.value) return
  const { apiGet } = await import('@/composables/useTurso')
  const { data } = await apiGet(`/api/v2/docs/${docId.value}`)
  const remote = (data as any)?.doc?.updated_at || ''
  if (remote && remoteUpdatedAt.value && remote !== remoteUpdatedAt.value) {
    hasRemoteUpdate.value = true
  }
  if (!remoteUpdatedAt.value) remoteUpdatedAt.value = remote
}

function onVisibilityChange() {
  if (!document.hidden) checkForUpdates()
}

function applyRemoteUpdate() {
  hasRemoteUpdate.value = false
  loadDoc()
}

onMounted(() => {
  loadDoc()
  window.addEventListener('beforeunload', onBeforeUnload)
  document.addEventListener('visibilitychange', onVisibilityChange)
  docPollTimer = setInterval(checkForUpdates, 30000)
})
watch(docId, () => { remoteUpdatedAt.value = ''; hasRemoteUpdate.value = false; loadDoc() })
onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('beforeunload', onBeforeUnload)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  if (docPollTimer) clearInterval(docPollTimer)
})

function buildToc() {
  const el = document.querySelector('.docs-body')
  if (!el) return
  const headings = el.querySelectorAll('h1, h2, h3')
  toc.value = Array.from(headings).map((h, i) => {
    const id = `h-${i}`
    h.id = id
    return { id, text: h.textContent || '', level: parseInt(h.tagName[1]) }
  })
}

function onScroll() {
  const headings = toc.value.map(t => document.getElementById(t.id)).filter(Boolean)
  for (let i = headings.length - 1; i >= 0; i--) {
    if (headings[i]!.getBoundingClientRect().top <= 80) {
      activeHeading.value = toc.value[i].id
      return
    }
  }
  if (toc.value.length) activeHeading.value = toc.value[0].id
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function addCopyButtons() {
  const el = document.querySelector('.docs-body')
  if (!el) return
  el.querySelectorAll('pre').forEach(pre => {
    if (pre.querySelector('.code-copy-btn')) return
    const btn = document.createElement('button')
    btn.className = 'code-copy-btn'
    btn.textContent = 'Copy'
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code')
      navigator.clipboard.writeText(code?.textContent || pre.textContent || '')
      btn.textContent = 'Copied!'
      setTimeout(() => { btn.textContent = 'Copy' }, 1500)
    })
    pre.style.position = 'relative'
    pre.appendChild(btn)
  })
}

const renderedHtml = computed(() => renderMarkdown(content.value))
</script>

<template>
  <div class="docs-page-wrap">
    <DocsSidebar :active-doc-id="docId" />
    <div class="docs-layout">
    <!-- Table of Contents -->
    <aside v-if="toc.length > 2" class="docs-toc">
      <div class="toc-title">Contents</div>
      <nav>
        <a
          v-for="item in toc"
          :key="item.id"
          :class="['toc-link', `toc-h${item.level}`, { active: activeHeading === item.id }]"
          @click.prevent="scrollTo(item.id)"
        >{{ item.text }}</a>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="docs-main">
      <!-- Remote update notification -->
      <div v-if="hasRemoteUpdate" class="remote-update-banner">
        ⚡ Another user has modified this document. <button @click="applyRemoteUpdate">Refresh</button>
      </div>
      <div v-if="loading" class="loading">Loading...</div>

      <template v-else>
        <div class="docs-meta">
          <div class="docs-title-row">
            <span class="doc-icon-btn" @click="showEmojiPicker = !showEmojiPicker">{{ docIcon }}</span>
            <div v-if="showEmojiPicker" class="doc-emoji-picker" @click.stop>
              <span v-for="e in DOC_EMOJIS" :key="e" class="emoji-opt" @click="changeDocIcon(e)">{{ e }}</span>
            </div>
            <h1 v-if="title" class="docs-title" contenteditable @blur="onTitleBlur" @keydown.enter.prevent="($event.target as HTMLElement).blur()">{{ title }}</h1>
          </div>
          <div class="meta-info">
            <span v-if="author" class="meta-author">{{ author }}</span>
            <span v-if="updatedAt" class="meta-date">{{ formatDate(updatedAt) }}</span>
          </div>
        </div>

        <div class="docs-actions">
          <span class="save-status">{{ saveStatus === 'saving' ? 'Saving...' : saveStatus === 'changed' ? 'Unsaved changes' : 'Saved <Icon name="check" :size="14" />' }}</span>
          <button class="btn btn--sm" @click="loadRevisions">History</button>
        </div>

        <!-- History panel -->
        <div v-if="showHistory" class="history-panel">
          <div class="history-header">
            <span>Revision History</span>
            <button class="btn btn--xs" @click="showHistory = false">Close</button>
          </div>
          <div v-for="rev in revisions" :key="rev.id" class="history-item" @click="previewRev(rev.id)">
            <span>{{ rev.edited_by }} — {{ rev.created_at }}</span>
            <button class="btn btn--xs" @click.stop="restoreRev(rev.id)">Restore</button>
          </div>
          <div v-if="previewRevision" class="history-preview" v-html="previewRevision.content"></div>
        </div>

        <!-- Tags -->
        <div class="tags-editor">
          <span class="tags-label">Tags:</span>
          <span v-for="tag in docTags" :key="tag" class="tag-chip">{{ tag }} <button class="tag-remove" @click="removeTag(tag)">✕</button></span>
          <input v-model="newTag" class="tag-input" placeholder="Add tag..." @keyup.enter="addTag" />
        </div>

        <!-- Child documents -->
        <div v-if="childDocs.length" class="child-docs">
          <div class="child-docs-title">Sub-documents ({{ childDocs.length }})</div>
          <div v-for="c in childDocs" :key="c.id" class="child-doc-item" @click="$router.push(`/docs/${c.id}`)">
            <span>{{ c.icon || '📄' }}</span>
            <span>{{ c.title }}</span>
          </div>
        </div>

        <!-- Source memos -->
        <div v-if="sourceMemos.length" class="source-memos">
          <span class="source-memos-title">Source Memos</span>
          <div v-for="sm in sourceMemos" :key="sm.memo_id" class="source-memo-item" @click="$router.push(`/memos/${sm.memo_id}`)">
            <Icon name="messageCircle" :size="14" /> #{{ sm.memo_id }} {{ (sm.content || '').split('\n')[0].slice(0, 50) }}
          </div>
        </div>

        <DocEditor :model-value="editContent" @update:model-value="onEditorChange" @focus="editing = true" @blur="editing = false" :editable="true" />

        <DocComments :doc-id="docId" :current-user="author" />
      </template>
    </main>
  </div>
  </div>
</template>

<style scoped>
.docs-page-wrap { display: flex; height: calc(100vh - 60px); background: var(--bg-main, #f5f6f8); }
.docs-layout { display: flex; max-width: 1100px; margin: 0 auto; padding: 32px 24px; gap: 32px; flex: 1; overflow-y: auto; }

/* TOC */
.docs-toc { width: 200px; flex-shrink: 0; position: sticky; top: 80px; height: fit-content; max-height: calc(100vh - 120px); overflow-y: auto; }
.toc-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em; margin-bottom: 12px; }
.toc-link { display: block; font-size: 13px; color: #6b7280; padding: 4px 0 4px 12px; border-left: 2px solid transparent; text-decoration: none; cursor: pointer; transition: all 0.15s; }
.toc-link:hover { color: #111; }
.toc-link.active { color: #3b82f6; border-left-color: #3b82f6; font-weight: 500; }
.toc-h2 { padding-left: 12px; }
.toc-h3 { padding-left: 24px; font-size: 12px; }

/* Main content */
.docs-main { flex: 1; max-width: 720px; min-width: 0; }
.docs-meta { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
.docs-content-area { max-width: 720px; margin: 0 auto; padding: 40px 24px; background: var(--bg-card, #fff); min-height: 100%; }
.docs-title-row { display: flex; align-items: center; gap: 8px; position: relative; margin-bottom: 8px; }
.doc-icon-btn { font-size: 28px; cursor: pointer; padding: 4px; border-radius: 6px; }
.doc-icon-btn:hover { background: #f3f4f6; }
.doc-emoji-picker { position: absolute; top: 40px; left: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px; display: flex; flex-wrap: wrap; gap: 2px; width: 200px; z-index: 100; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.emoji-opt { cursor: pointer; font-size: 18px; padding: 3px; border-radius: 4px; }
.emoji-opt:hover { background: #f3f4f6; }
.docs-title { font-size: 32px; font-weight: 700; line-height: 1.3; color: #1a1a1a; outline: none; cursor: text; border: none; flex: 1; }
.docs-title:empty::before { content: 'Untitled'; color: #9ca3af; }
.docs-meta { font-size: 12px; color: #9ca3af; margin-bottom: 24px; }
.meta-info { display: flex; gap: 12px; margin-top: 8px; font-size: 14px; color: #9ca3af; }
.meta-author { font-weight: 500; }

/* Content */
.docs-body { font-size: 16px; line-height: 1.8; color: #374151; }
.docs-body :deep(h1) { font-size: 32px; font-weight: 700; margin: 48px 0 16px; color: #111; }
.docs-body :deep(h2) { font-size: 24px; font-weight: 600; margin: 48px 0 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; color: #111; }
.docs-body :deep(h3) { font-size: 18px; font-weight: 500; margin: 32px 0 12px; color: #111; }
.docs-body :deep(p) { margin-bottom: 16px; }
.docs-body :deep(code) { background: #f1f3f5; padding: 2px 6px; border-radius: 4px; font-size: 14px; font-family: 'Fira Code', 'Consolas', monospace; color: #e83e8c; }
.docs-body :deep(pre) { position: relative; background: #1e1e2e; color: #cdd6f4; border-radius: 8px; padding: 16px; overflow-x: auto; margin: 24px 0; font-size: 14px; line-height: 1.6; }
.docs-body :deep(pre code) { background: none; padding: 0; color: inherit; font-size: 14px; }
.docs-body :deep(.code-copy-btn) { position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.1); color: #9ca3af; border: none; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; }
.docs-body :deep(.code-copy-btn:hover) { background: rgba(255,255,255,0.2); color: #fff; }
.docs-body :deep(blockquote) { border-left: 4px solid #3b82f6; background: #f0f4ff; padding: 12px 16px; margin: 24px 0; border-radius: 0 8px 8px 0; color: #374151; }
.docs-body :deep(blockquote p) { margin: 0; }
.docs-body :deep(hr) { border: none; border-top: 1px solid #e5e7eb; margin: 48px 0; }
.docs-body :deep(a) { color: #3b82f6; text-decoration: none; }
.docs-body :deep(a:hover) { text-decoration: underline; }
.docs-body :deep(ul), .docs-body :deep(ol) { padding-left: 24px; margin: 16px 0; }
.docs-body :deep(li) { margin: 6px 0; }
.docs-body :deep(table) { width: 100%; border-collapse: collapse; margin: 24px 0; }
.docs-body :deep(thead th) { background: #f8f9fa; font-weight: 600; text-align: left; }
.docs-body :deep(th), .docs-body :deep(td) { padding: 10px 14px; border: 1px solid #e5e7eb; font-size: 14px; }
.docs-body :deep(tbody tr:nth-child(even)) { background: #fafafa; }
.docs-body :deep(img) { max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin: 16px 0; }
.docs-body :deep(strong) { font-weight: 600; color: #111; }

.loading { text-align: center; color: #9ca3af; padding: 60px; }

@media (max-width: 768px) {
  .docs-layout { flex-direction: column; padding: 16px; }
  .docs-toc { display: none; }
  .docs-main { max-width: 100%; }
  .docs-title { font-size: 24px; }
}
.source-memos { margin: 8px 0; padding: 8px; background: #fef3c7; border-radius: 6px; }
.source-memos-title { font-size: 12px; font-weight: 600; color: #92400e; display: block; margin-bottom: 4px; }
.source-memo-item { padding: 4px 0; font-size: 13px; color: #92400e; cursor: pointer; }
.source-memo-item:hover { text-decoration: underline; }
.child-docs { margin: 12px 0; padding: 12px; background: #fafafa; border-radius: 8px; border: 1px solid #e5e7eb; }
.child-docs-title { font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px; }
.child-doc-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: 14px; }
.child-doc-item:hover { background: #eff6ff; }
.tags-editor, .tags-display { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; margin: 8px 0; }
.tags-label { font-size: 12px; font-weight: 600; color: #6b7280; }
.tag-chip { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: #eff6ff; color: #3b82f6; display: flex; align-items: center; gap: 2px; }
.tag-chip.readonly { cursor: default; }
.tag-remove { border: none; background: none; font-size: 10px; cursor: pointer; color: #3b82f6; padding: 0; }
.tag-input { border: 1px solid #d1d5db; border-radius: 6px; padding: 2px 8px; font-size: 11px; width: 100px; }
.save-status { font-size: 11px; color: #9ca3af; }
.history-panel { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin: 12px 0; background: #fafafa; }
.history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-weight: 600; font-size: 14px; }
.history-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; cursor: pointer; }
.history-item:hover { background: #f3f4f6; }
.history-preview { margin-top: 12px; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; background: #fff; font-size: 13px; max-height: 300px; overflow-y: auto; }
</style>
