<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPut, apiPatch } from '@/composables/useTurso'
import TreeNode from './TreeNode.vue'
import Icon from './Icon.vue'

interface DocNode {
  id: string; title: string; icon: string | null; is_folder: number
  parent_id: string | null; sort_order: number; children: DocNode[]
}

const props = defineProps<{ activeDocId?: string }>()
const emit = defineEmits<{ refresh: [] }>()
const router = useRouter()

const tree = ref<DocNode[]>([])
const expanded = ref<Set<string>>(new Set())
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const selectedTag = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

async function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  if (!searchQuery.value.trim()) { searchResults.value = []; return }
  searchTimer = setTimeout(async () => {
    const { data } = await apiGet<{ results: any[] }>(`/api/v2/docs/search?q=${encodeURIComponent(searchQuery.value)}`)
    searchResults.value = data?.results || []
  }, 300)
}

const allTags = computed(() => {
  const tags = new Set<string>()
  function collect(nodes: DocNode[]) {
    for (const n of nodes) {
      if ((n as any).tags) {
        try { JSON.parse((n as any).tags).forEach((t: string) => tags.add(t)) } catch {}
      }
      if (n.children) collect(n.children)
    }
  }
  collect(tree.value)
  return Array.from(tags)
})
const creatingFolder = ref(false)
const newFolderName = ref('')
const dragId = ref('')
const ctxMenu = ref<{ x: number; y: number; node: any } | null>(null)
const renamingId = ref<string | null>(null)
const renameText = ref('')

function onCtxMenu(e: MouseEvent, node: any) {
  // Adjust scroll position + prevent overflow off-screen
  const menuH = 120 // estimated menu height
  const y = Math.min(e.clientY, window.innerHeight - menuH)
  const x = Math.min(e.clientX, window.innerWidth - 160)
  ctxMenu.value = { x, y, node }
}

function closeCtxMenu() { ctxMenu.value = null }

// Bulk MD file upload
const uploadProgress = ref({ current: 0, total: 0 })

async function bulkUploadMd(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (!files?.length) return
  const fileArr = Array.from(files)
  uploadProgress.value = { current: 0, total: fileArr.length }

  // Parent ID of current selected folder
  const parentId = props.activeDocId || null
  let count = 0
  // Fetch existing sibling titles from BE
  const { data: sibData } = await apiGet(`/api/v2/docs/children?parentId=${parentId || ''}`)
  const existingTitles = new Set(((sibData as any)?.docs || []).map((d: any) => d.title))

  for (const file of fileArr) {
    const text = await file.text()
    let title = file.name.replace(/\.(md|txt)$/i, '')
    // Duplicate title suffix
    let suffix = 1
    while (existingTitles.has(title)) { title = `${file.name.replace(/\.(md|txt)$/i, '')} (${suffix++})` }
    existingTitles.add(title)

    const slug = `upload-${Date.now()}-${count}`
    const { error } = await apiPut(`/api/v2/docs/${slug}`, { title, content: text, contentFormat: 'markdown', parentId })
    if (!error) count++
    uploadProgress.value.current = uploadProgress.value.current + 1
  }
  input.value = ''
  const failed = fileArr.length - count
  uploadProgress.value = { current: 0, total: 0 }
  alert(`${count} uploaded successfully${failed ? `, ${failed} failed` : ''}`)
  await loadTree()
}

async function ctxDelete() {
  if (!ctxMenu.value || !confirm('Delete this document?')) return
  await apiPatch(`/api/v2/docs/${ctxMenu.value.node.id}`, { archived: 1 })
  closeCtxMenu(); await loadTree()
}

function ctxRename() {
  if (!ctxMenu.value) return
  renamingId.value = ctxMenu.value.node.id
  renameText.value = ctxMenu.value.node.title
  closeCtxMenu()
}

async function submitRename() {
  if (!renamingId.value || !renameText.value.trim()) return
  await apiPatch(`/api/v2/docs/${renamingId.value}`, { title: renameText.value.trim() })
  renamingId.value = null; await loadTree()
}

async function ctxNewChild() {
  if (!ctxMenu.value) return
  const slug = `doc-${Date.now()}`
  await apiPut(`/api/v2/docs/${slug}`, { title: 'New Document', content: '' })
  await apiPatch(`/api/v2/docs/${slug}/move`, { parentId: ctxMenu.value.node.id })
  closeCtxMenu(); await loadTree()
  router.push(`/docs/${slug}`)
}

async function loadTree() {
  const { data } = await apiGet<{ tree: DocNode[] }>('/api/v2/docs/tree')
  tree.value = data?.tree || []
  // Auto-expand: parents of the current document
  if (props.activeDocId) expandParents(tree.value, props.activeDocId)
}

function expandParents(nodes: DocNode[], targetId: string): boolean {
  for (const n of nodes) {
    if (n.id === targetId) return true
    if (n.children.length && expandParents(n.children, targetId)) {
      expanded.value.add(n.id)
      return true
    }
  }
  return false
}

function toggle(id: string) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
}

function navigate(id: string) {
  router.push(`/docs/${id}`)
}

async function createFolder() {
  if (!newFolderName.value.trim()) return
  const slug = newFolderName.value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  await apiPut('/api/v2/docs/' + slug, { title: newFolderName.value.trim(), content: '' })
  newFolderName.value = ''
  creatingFolder.value = false
  await loadTree()
}

function onDragStart(e: DragEvent, id: string) {
  dragId.value = id
  e.dataTransfer?.setData('doc-id', id)
}

async function onDropRoot(e: DragEvent) {
  e.preventDefault()
  const sourceId = e.dataTransfer?.getData('doc-id') || dragId.value
  if (!sourceId) return
  await apiPatch(`/api/v2/docs/${sourceId}/move`, { parentId: null })
  await loadTree(); dragId.value = ''
}

async function onDrop(e: DragEvent, target: DocNode) {
  e.preventDefault()
  const sourceId = e.dataTransfer?.getData('doc-id') || dragId.value
  if (!sourceId || sourceId === target.id) return

  await apiPatch(`/api/v2/docs/${sourceId}/move`, { parentId: target.id })
  await loadTree()
  dragId.value = ''
}

// Sidebar tree polling (60s)
let treePollTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => { loadTree(); treePollTimer = setInterval(loadTree, 60000) })
onUnmounted(() => { if (treePollTimer) clearInterval(treePollTimer) })
</script>

<template>
  <div class="docs-sidebar">
    <div class="sidebar-header">
      <span class="sidebar-title">Documents</span>
      <button class="sidebar-btn" @click="creatingFolder = true" title="New folder"><Icon name="folderPlus" :size="16" /></button>
      <button class="sidebar-btn" @click="router.push('/docs/new')" title="New document"><Icon name="filePlus" :size="16" /></button>
      <!-- Bulk MD file upload -->
      <label class="sidebar-btn" title="Upload MD files">
        <Icon name="upload" :size="16" />
        <input type="file" accept=".md,.txt" multiple hidden @change="bulkUploadMd" />
      </label>
      <span v-if="uploadProgress.total" class="upload-prog">{{ uploadProgress.current }}/{{ uploadProgress.total }}</span>
    </div>

    <div v-if="creatingFolder" class="folder-input-wrap">
      <input v-model="newFolderName" class="folder-input" placeholder="Folder name" @keyup.enter="createFolder" autofocus />
      <button class="sidebar-btn" @click="createFolder">&#10003;</button>
    </div>

    <!-- Search -->
    <div class="sidebar-search">
      <input v-model="searchQuery" class="search-input" placeholder="Search..." @input="onSearch" />
    </div>

    <!-- Search results -->
    <div v-if="searchResults.length" class="search-results">
      <div v-for="r in searchResults" :key="r.id" class="search-item" @click="navigate(r.id)">
        <span class="search-icon">{{ (r.icon && !r.icon.startsWith('Icon') && !r.icon.startsWith('<')) ? r.icon : '📄' }}</span>
        <div>
          <div class="search-title">{{ r.title }}</div>
          <div class="search-snippet">{{ r.snippet }}</div>
        </div>
      </div>
    </div>

    <!-- Tag filter -->
    <div v-if="allTags.length && !searchQuery" class="tag-filter">
      <span v-for="tag in allTags" :key="tag" class="tag-chip" :class="{ active: selectedTag === tag }" @click="selectedTag = selectedTag === tag ? '' : tag">{{ tag }}</span>
    </div>

    <!-- Root drop zone -->
    <div class="root-drop" @dragover.prevent @drop.prevent.stop="onDropRoot">Move to root</div>

    <div class="tree-list">
      <TreeNode
        v-for="node in tree"
        :key="node.id"
        :node="node"
        :active-doc-id="activeDocId"
        :expanded="expanded"
        :depth="0"
        @toggle="toggle"
        @dragstart="onDragStart"
        @drop="onDrop"
        @contextmenu="onCtxMenu"
      />
    </div>
    <!-- Context menu -->
    <div v-if="ctxMenu" class="ctx-overlay" @click="closeCtxMenu" />
    <div v-if="ctxMenu" class="ctx-menu" :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }">
      <div class="ctx-item" @click="ctxNewChild"><Icon name="filePlus" :size="14" /> New sub-document</div>
      <div class="ctx-item" @click="ctxRename"><Icon name="pencil" :size="14" /> Rename</div>
      <div class="ctx-item ctx-danger" @click="ctxDelete"><Icon name="trash" :size="14" /> Delete</div>
    </div>

    <!-- Rename inline -->
    <div v-if="renamingId" class="rename-overlay" @click.self="renamingId = null">
      <div class="rename-box">
        <input v-model="renameText" class="rename-input" @keyup.enter="submitRename" autofocus />
        <button class="btn btn--xs btn--primary" @click="submitRename">OK</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.docs-sidebar { width: 260px; min-width: 260px; height: 100%; overflow-y: auto; background: var(--bg-sidebar, #2b2d36); display: flex; flex-direction: column; color: var(--text-sidebar, #d1d5db); }
.sidebar-header { display: flex; align-items: center; padding: 12px 16px; gap: 4px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.tree-list { flex: 1; overflow-y: auto; padding: 8px 0; }
.sidebar-title { font-size: 13px; font-weight: 700; flex: 1; }
.sidebar-btn { border: none; background: none; font-size: 14px; cursor: pointer; padding: 2px 4px; border-radius: 4px; color: var(--text-sidebar); }
.sidebar-btn:hover { background: rgba(255,255,255,0.08); }
.folder-input-wrap { display: flex; gap: 4px; padding: 8px 12px; }
.folder-input { flex: 1; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 8px; font-size: 12px; }
.tree-list { padding: 4px 0; }
.tree-item { display: flex; align-items: center; gap: 4px; padding: 5px 12px; font-size: 13px; cursor: pointer; border-radius: 4px; margin: 1px 4px; }
.tree-item:hover { background: #f3f4f6; }
.tree-item.active { background: #eff6ff; color: #3b82f6; font-weight: 600; }
.tree-arrow { font-size: 10px; width: 14px; text-align: center; }
.tree-icon { font-size: 14px; }
.tree-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tree-children { padding-left: 16px; }
.tree-item.child { font-size: 12px; }
.root-drop { padding: 6px 12px; text-align: center; font-size: 11px; color: #9ca3af; border: 1px dashed #d1d5db; border-radius: 4px; margin: 4px 8px; }
.root-drop:hover { background: #f3f4f6; border-color: #3b82f6; }
.sidebar-search { padding: 8px 12px; }
.search-input { width: 100%; border: none; background: rgba(255,255,255,0.08); border-radius: 6px; padding: 8px 10px; font-size: 12px; box-sizing: border-box; outline: none; transition: box-shadow 0.15s; color: #fff; }
.search-input:focus { box-shadow: 0 0 0 2px var(--primary); background: rgba(255,255,255,0.12); }
.search-input::placeholder { color: rgba(255,255,255,0.4); }
.search-results { padding: 0 8px; }
.search-item { display: flex; gap: 6px; padding: 6px 4px; cursor: pointer; border-radius: 4px; }
.search-item:hover { background: #f3f4f6; }
.search-icon { font-size: 14px; }
.search-title { font-size: 12px; font-weight: 600; }
.search-snippet { font-size: 10px; color: #9ca3af; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
.tag-filter { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px 12px; }
.tag-chip { font-size: 10px; padding: 2px 8px; border-radius: 10px; background: #f3f4f6; color: #6b7280; cursor: pointer; }
.tag-chip.active { background: #3b82f6; color: #fff; }
.ctx-overlay { position: fixed; inset: 0; z-index: 998; }
.ctx-menu { position: fixed; z-index: 999; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 4px 0; min-width: 140px; }
.ctx-item { padding: 6px 12px; font-size: 12px; cursor: pointer; }
.ctx-item:hover { background: #f3f4f6; }
.ctx-danger { color: #ef4444; }
.rename-overlay { position: fixed; inset: 0; z-index: 999; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.2); }
.rename-box { background: #fff; padding: 16px; border-radius: 8px; display: flex; gap: 8px; }
.rename-input { border: 1px solid #d1d5db; border-radius: 6px; padding: 6px 10px; font-size: 13px; min-width: 200px; }
</style>
