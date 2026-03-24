<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGet } from '@/api/client'

interface DocEntry {
  id: number
  title: string
  path: string
  updated_by: string
  updated_at: string
  children?: DocEntry[]
}

interface DocsData {
  documents: DocEntry[]
  recent_edits: { id: number; title: string; user: string; updated_at: string }[]
}

const loading = ref(true)
const error = ref<string | null>(null)
const docs = ref<DocEntry[]>([])
const recentEdits = ref<DocsData['recent_edits']>([])
const expandedIds = ref<Set<number>>(new Set())

function toggleExpand(id: number) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

onMounted(async () => {
  const { data, error: err } = await apiGet<DocsData>('/api/v2/docs')
  if (err) {
    error.value = err
  } else if (data) {
    docs.value = data.documents
    recentEdits.value = data.recent_edits
  }
  loading.value = false
})
</script>

<template>
  <div class="docs-page">
    <h1>Documents</h1>
    <p class="page-desc">Team documentation hub.</p>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <span>Loading documents...</span>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">&#9888;</div>
      <p>{{ error }}</p>
    </div>

    <template v-else>
      <div class="docs-layout">
        <!-- Document tree -->
        <div class="docs-tree">
          <h2>All Documents</h2>
          <div v-if="!docs.length" class="empty-msg">No documents yet.</div>
          <ul class="tree-list">
            <li v-for="doc in docs" :key="doc.id" class="tree-item">
              <div class="tree-row" @click="toggleExpand(doc.id)">
                <span class="tree-icon" v-if="doc.children?.length">
                  {{ expandedIds.has(doc.id) ? '&#9660;' : '&#9654;' }}
                </span>
                <span class="tree-icon tree-leaf" v-else>&#9679;</span>
                <span class="tree-title">{{ doc.title }}</span>
                <span class="tree-meta">{{ doc.updated_by }}</span>
              </div>
              <ul v-if="doc.children?.length && expandedIds.has(doc.id)" class="tree-children">
                <li v-for="child in doc.children" :key="child.id" class="tree-item tree-child">
                  <div class="tree-row">
                    <span class="tree-icon tree-leaf">&#9679;</span>
                    <span class="tree-title">{{ child.title }}</span>
                    <span class="tree-meta">{{ child.updated_by }}</span>
                  </div>
                </li>
              </ul>
            </li>
          </ul>
        </div>

        <!-- Recent edits -->
        <div class="docs-recent">
          <h2>Recent Edits</h2>
          <div v-if="!recentEdits.length" class="empty-msg">No recent edits.</div>
          <ul class="edit-list">
            <li v-for="edit in recentEdits" :key="edit.id" class="edit-item">
              <div class="edit-title">{{ edit.title }}</div>
              <div class="edit-meta">
                <span>{{ edit.user }}</span>
                <span>{{ edit.updated_at }}</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.docs-page { padding: 32px 40px; max-width: 960px; margin: 0 auto; }
h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
.page-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 24px; }

.loading-state, .error-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 0; gap: 12px; color: var(--text-muted);
}
.loading-spinner {
  width: 28px; height: 28px; border: 3px solid var(--border);
  border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.error-icon { font-size: 32px; }
.error-state p { color: var(--red); font-size: 14px; }
.empty-msg { font-size: 13px; color: var(--text-muted); }

.docs-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
@media (max-width: 768px) { .docs-layout { grid-template-columns: 1fr; } }

.docs-tree, .docs-recent {
  background: var(--card-bg); border: 1px solid var(--border-light);
  border-radius: var(--radius); padding: 20px;
}
h2 { font-size: 15px; font-weight: 600; margin-bottom: 16px; }

.tree-list { list-style: none; padding: 0; margin: 0; }
.tree-item { margin-bottom: 2px; }
.tree-row {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px;
  border-radius: 6px; cursor: pointer; font-size: 13px;
}
.tree-row:hover { background: var(--bg); }
.tree-icon { font-size: 8px; color: var(--text-muted); width: 12px; text-align: center; flex-shrink: 0; }
.tree-leaf { font-size: 6px; }
.tree-title { flex: 1; font-weight: 500; }
.tree-meta { font-size: 11px; color: var(--text-muted); }
.tree-children { list-style: none; padding-left: 20px; margin: 0; }
.tree-child .tree-row { padding: 6px 10px; }

.edit-list { list-style: none; padding: 0; margin: 0; }
.edit-item {
  padding: 10px 0; border-bottom: 1px solid var(--border-light);
}
.edit-item:last-child { border-bottom: none; }
.edit-title { font-size: 13px; font-weight: 500; margin-bottom: 4px; }
.edit-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); }
</style>
