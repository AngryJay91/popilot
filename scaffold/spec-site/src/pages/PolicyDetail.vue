<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sprints, getPagesByCategory, getEpicSpecFileName } from '../data/navigation'
import { renderMarkdown } from '../utils/markdown'

const route = useRoute()
const router = useRouter()

const sprintId = computed(() => (route.params.sprint as string) || sprints[0]?.id || '')
const epicId = computed(() => (route.params.epicId as string) || '')
const sprintConfig = computed(() => sprints.find(s => s.id === sprintId.value))
const epics = computed(() => getPagesByCategory(sprintId.value, 'policy'))
const currentEpic = computed(() => epics.value.find(e => e.id === epicId.value))

const markdownHtml = ref('')
const loading = ref(true)
const error = ref(false)

// Glob import all epic spec markdown files
const mdModules = import.meta.glob(
  '../../../.context/sprints/*/epic-specs/*.md',
  { query: '?raw', import: 'default' }
)

watchEffect(async () => {
  loading.value = true
  error.value = false
  markdownHtml.value = ''

  const fileName = getEpicSpecFileName(sprintId.value, epicId.value)
  if (!fileName) {
    error.value = true
    loading.value = false
    return
  }

  const key = `../../../.context/sprints/${sprintId.value}/epic-specs/${fileName}`
  const loader = mdModules[key]

  if (!loader) {
    error.value = true
    loading.value = false
    return
  }

  try {
    const raw = (await loader()) as string
    markdownHtml.value = renderMarkdown(raw)
  } catch {
    error.value = true
  }
  loading.value = false
})

function goBack() {
  router.push(`/policy/${sprintId.value}`)
}
</script>

<template>
  <div class="policy-detail">
    <!-- Sidebar: epic list -->
    <aside class="policy-sidebar">
      <div class="sidebar-header">
        <button class="back-btn" @click="goBack">&larr; {{ sprintConfig?.label }}</button>
      </div>
      <router-link
        v-for="epic in epics"
        :key="epic.id"
        :to="`/policy/${sprintId}/${epic.id}`"
        class="sidebar-item"
        :class="{ active: epic.id === epicId }"
      >
        <span class="sidebar-id">{{ epic.id }}</span>
        <span class="sidebar-label">{{ epic.label }}</span>
      </router-link>
    </aside>

    <!-- Content -->
    <main class="policy-content">
      <div v-if="loading" class="policy-loading">Loading...</div>
      <div v-else-if="error" class="policy-error">
        <p>Document not found.</p>
      </div>
      <article v-else class="markdown-body" v-html="markdownHtml"></article>
    </main>
  </div>
</template>

<style scoped>
.policy-detail {
  display: flex;
  height: calc(100vh - var(--header-height));
  overflow: hidden;
}

/* ---- Sidebar ---- */
.policy-sidebar {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  background: #fff;
  overflow-y: auto;
  padding: 12px 0;
}

.sidebar-header { padding: 0 12px 8px; }
.back-btn {
  font-size: 12px;
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-kr);
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.15s;
}
.back-btn:hover { background: var(--bg); color: var(--text-primary); }

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.1s;
  border-left: 3px solid transparent;
}
.sidebar-item:hover { background: var(--bg); color: var(--text-primary); }
.sidebar-item.active {
  background: var(--primary-light);
  color: var(--primary);
  border-left-color: var(--primary);
  font-weight: 600;
}

.sidebar-id {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  min-width: 32px;
}
.sidebar-item.active .sidebar-id { color: var(--primary); }
.sidebar-label { flex: 1; }

/* ---- Content ---- */
.policy-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  background: var(--bg);
}

.policy-loading,
.policy-error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--text-muted);
  font-size: 14px;
}

/* ---- Markdown styles ---- */
.markdown-body {
  max-width: 800px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-primary);
}
.markdown-body :deep(h1) { font-size: 24px; font-weight: 700; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 2px solid var(--border); }
.markdown-body :deep(h2) { font-size: 19px; font-weight: 700; margin: 32px 0 12px; }
.markdown-body :deep(h3) { font-size: 15px; font-weight: 700; margin: 24px 0 8px; }
.markdown-body :deep(h4) { font-size: 14px; font-weight: 700; margin: 20px 0 6px; color: var(--text-secondary); }
.markdown-body :deep(p) { margin: 0 0 10px; }
.markdown-body :deep(strong) { font-weight: 700; }
.markdown-body :deep(code) {
  font-size: 12px;
  background: var(--border-light);
  padding: 2px 5px;
  border-radius: 3px;
  font-family: 'SF Mono', 'Menlo', monospace;
}
.markdown-body :deep(pre) {
  background: var(--text-primary);
  color: #e5e7eb;
  padding: 16px;
  border-radius: var(--radius-sm);
  overflow-x: auto;
  margin: 12px 0;
  font-size: 12px;
  line-height: 1.6;
}
.markdown-body :deep(pre code) { background: none; padding: 0; color: inherit; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { margin: 8px 0; padding-left: 24px; }
.markdown-body :deep(li) { margin: 4px 0; }
.markdown-body :deep(blockquote) {
  border-left: 3px solid var(--primary);
  padding: 8px 16px;
  margin: 12px 0;
  background: var(--primary-light);
  color: var(--text-secondary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.markdown-body :deep(hr) { border: none; border-top: 1px solid var(--border); margin: 24px 0; }
.markdown-body :deep(table) { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
.markdown-body :deep(th) { text-align: left; padding: 8px 12px; background: var(--border-light); font-weight: 700; border: 1px solid var(--border); }
.markdown-body :deep(td) { padding: 8px 12px; border: 1px solid var(--border); }
.markdown-body :deep(a) { color: var(--primary); text-decoration: none; }
.markdown-body :deep(a:hover) { text-decoration: underline; }
</style>
