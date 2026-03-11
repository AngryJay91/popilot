<script setup lang="ts">
import { ref, watchEffect, computed } from 'vue'
import { sprints } from '@/composables/useNavStore'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps<{
  sprint: string
  epicId: string
  pageLabel: string
}>()

const sprintLabel = computed(() => sprints.value.find((s: { id: string }) => s.id === props.sprint)?.label ?? props.sprint)

const markdownHtml = ref('')
const loading = ref(true)
const error = ref(false)

const mdModules = import.meta.glob(
  '../../../../.context/sprints/*/epic-specs/*.md',
  { query: '?raw', import: 'default' }
)

watchEffect(async () => {
  loading.value = true
  error.value = false
  markdownHtml.value = ''

  // Try multiple filename patterns: E-XX.md, e-xx.md, partial match
  const candidates = [
    `${props.epicId}.md`,
    `${props.epicId.toLowerCase()}.md`,
    `${props.epicId.toUpperCase()}.md`,
  ]

  const prefix = `../../../../.context/sprints/${props.sprint}/epic-specs/`
  let loader: (() => Promise<unknown>) | undefined

  for (const name of candidates) {
    const key = prefix + name
    if (mdModules[key]) {
      loader = mdModules[key]
      break
    }
  }

  // Fallback: partial key match
  if (!loader) {
    const partialKey = Object.keys(mdModules).find(
      (k: string) => k.includes(`/${props.sprint}/`) && k.toLowerCase().includes(props.epicId.toLowerCase())
    )
    if (partialKey) loader = mdModules[partialKey]
  }

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
</script>

<template>
  <div class="policy-fallback">
    <div class="fallback-banner">
      <span class="banner-icon">📄</span>
      <span>No wireframe spec for <strong>{{ pageLabel }}</strong> in {{ sprintLabel }}. Showing policy document ({{ epicId }}) instead.</span>
    </div>

    <div class="fallback-content">
      <div v-if="loading" class="fallback-loading">Loading...</div>
      <div v-else-if="error" class="fallback-error">
        <p>Policy document not found.</p>
      </div>
      <article v-else class="markdown-body" v-html="markdownHtml"></article>
    </div>
  </div>
</template>

<style scoped>
.policy-fallback {
  height: calc(100vh - var(--header-height));
  overflow-y: auto;
  background: var(--bg);
}

.fallback-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: var(--blue-bg);
  border-bottom: 1px solid var(--border-light);
  font-size: 13px;
  color: var(--text-secondary);
}
.banner-icon { font-size: 16px; }

.fallback-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 40px;
}

.fallback-loading,
.fallback-error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: var(--text-muted);
  font-size: 14px;
}

/* ---- Markdown styles ---- */
.markdown-body {
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
  font-size: 12px; background: var(--border-light); padding: 2px 5px;
  border-radius: 3px; font-family: 'SF Mono', 'Menlo', monospace;
}
.markdown-body :deep(pre) {
  background: var(--text-primary); color: #e5e7eb; padding: 16px;
  border-radius: var(--radius-sm); overflow-x: auto; margin: 12px 0;
  font-size: 12px; line-height: 1.6;
}
.markdown-body :deep(pre code) { background: none; padding: 0; color: inherit; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { margin: 8px 0; padding-left: 24px; }
.markdown-body :deep(li) { margin: 4px 0; }
.markdown-body :deep(blockquote) {
  border-left: 3px solid var(--primary); padding: 8px 16px; margin: 12px 0;
  background: var(--primary-light); color: var(--text-secondary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.markdown-body :deep(hr) { border: none; border-top: 1px solid var(--border); margin: 24px 0; }
.markdown-body :deep(table) { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
.markdown-body :deep(th) { text-align: left; padding: 8px 12px; background: var(--border-light); font-weight: 700; border: 1px solid var(--border); }
.markdown-body :deep(td) { padding: 8px 12px; border: 1px solid var(--border); }
.markdown-body :deep(a) { color: var(--primary); text-decoration: none; }
.markdown-body :deep(a:hover) { text-decoration: underline; }
</style>
