<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet, apiPut } from '@/composables/useTurso'
import { renderMarkdown } from '@/utils/markdown'

const route = useRoute()
const router = useRouter()
const docId = computed(() => route.params.docId as string | undefined)
const isNew = computed(() => !docId.value)

const title = ref('')
const content = ref('')
const saving = ref(false)
const docVersion = ref<number | undefined>(undefined)
const conflictError = ref('')

onMounted(async () => {
  if (docId.value) {
    const { data } = await apiGet<{ doc: { title: string; content: string; version?: number } }>(`/api/v2/docs/${docId.value}`)
    if (data?.doc) {
      title.value = data.doc.title
      content.value = data.doc.content
      docVersion.value = data.doc.version
    }
  }
})

function generateId(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'untitled'
}

async function save() {
  if (!title.value.trim()) { alert('Please enter a title'); return }
  saving.value = true
  conflictError.value = ''
  const id = docId.value || generateId(title.value)
  const { data, error } = await apiPut<{ ok: boolean; version?: number }>(`/api/v2/docs/${id}`, {
    title: title.value,
    content: content.value,
    version: docVersion.value,
  })
  saving.value = false

  if (error?.includes('HTTP 409') || error?.includes('VERSION_CONFLICT')) {
    conflictError.value = 'Someone else edited this document while you were working. Please refresh the page to get the latest version, then re-apply your changes.'
    return
  }
  if (error) { alert(error); return }

  // Update local version from server response
  if (data?.version !== undefined) {
    docVersion.value = data.version
  }

  router.push(`/docs/${id}`)
}
</script>

<template>
  <div class="editor-page">
    <div class="editor-header">
      <h1>{{ isNew ? 'New Document' : 'Edit Document' }}</h1>
      <div class="editor-actions">
        <button class="btn" @click="router.back()">Cancel</button>
        <button class="btn btn--primary" :disabled="saving || !title.trim()" @click="save">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>

    <div v-if="conflictError" class="conflict-banner">
      ⚠️ {{ conflictError }}
    </div>

    <input
      v-model="title"
      class="editor-title"
      placeholder="Document title"
    />

    <div class="editor-split">
      <div class="editor-pane">
        <div class="pane-label">Markdown</div>
        <textarea
          v-model="content"
          class="editor-textarea"
          placeholder="Write in markdown..."
        />
      </div>
      <div class="preview-pane">
        <div class="pane-label">Preview</div>
        <div class="preview-content" v-html="renderMarkdown(content)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-page { max-width: 1200px; margin: 0 auto; padding: 24px; }
.editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.editor-header h1 { font-size: 20px; font-weight: 700; }
.editor-actions { display: flex; gap: 8px; }

.conflict-banner {
  background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px;
  padding: 12px 16px; margin-bottom: 16px; font-size: 14px; color: #92400e;
  line-height: 1.5;
}

.editor-title {
  width: 100%; padding: 12px 16px; font-size: 18px; font-weight: 600;
  border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; margin-bottom: 16px;
  box-sizing: border-box;
}

.editor-split { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; min-height: 60vh; }
.pane-label { font-size: 12px; font-weight: 600; color: var(--text-muted, #888); margin-bottom: 8px; }

.editor-textarea {
  width: 100%; height: 100%; min-height: 500px;
  border: 1px solid rgba(0,0,0,0.1); border-radius: 12px;
  padding: 16px; font-size: 14px; font-family: 'Fira Code', monospace;
  resize: vertical; box-sizing: border-box; line-height: 1.6;
}

.preview-pane { overflow-y: auto; }
.preview-content {
  border: 1px solid rgba(0,0,0,0.1); border-radius: 12px;
  padding: 16px; min-height: 500px; font-size: 14px; line-height: 1.7;
}
.preview-content :deep(h1) { font-size: 22px; font-weight: 700; margin: 16px 0 8px; }
.preview-content :deep(h2) { font-size: 18px; font-weight: 600; margin: 24px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
.preview-content :deep(h3) { font-size: 15px; font-weight: 600; margin: 16px 0 8px; }
.preview-content :deep(code) { background: rgba(0,0,0,0.06); padding: 2px 5px; border-radius: 3px; font-size: 12px; }
.preview-content :deep(.code-block) { background: #1e293b; color: #e2e8f0; border-radius: 8px; padding: 12px; overflow-x: auto; }
.preview-content :deep(.code-block code) { background: none; color: inherit; }
.preview-content :deep(blockquote) { border-left: 4px solid #3b82f6; background: #f9fafb; padding: 8px 12px; margin: 12px 0; border-radius: 0 8px 8px 0; }
.preview-content :deep(hr) { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
.preview-content :deep(a) { color: #3b82f6; }
.preview-content :deep(ul) { padding-left: 20px; }

@media (max-width: 768px) {
  .editor-split { grid-template-columns: 1fr; }
}
</style>
