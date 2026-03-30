<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  /** Raw markdown string (if available). If not provided, falls back to domRef text extraction */
  rawMarkdown?: string
  /** DOM element to extract text from when rawMarkdown is not available */
  domRef?: HTMLElement | null
  /** File name for download (without .md extension) */
  fileName?: string
}>()

const copied = ref(false)

function getContent(): string {
  if (props.rawMarkdown) return props.rawMarkdown
  if (props.domRef) return props.domRef.innerText
  return ''
}

async function handleCopy() {
  const content = getContent()
  if (!content) return
  try {
    await navigator.clipboard.writeText(content)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea')
    ta.value = content
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

function handleDownload() {
  const content = getContent()
  if (!content) return
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = (props.fileName || 'document') + '.md'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="doc-export-bar">
    <button class="export-btn" @click="handleCopy" :title="copied ? 'Copied!' : 'Copy to clipboard'">
      <span v-if="copied" class="export-icon">&#10003;</span>
      <span v-else class="export-icon">&#128203;</span>
      <span class="export-label">{{ copied ? 'Copied' : 'Copy' }}</span>
    </button>
    <button class="export-btn" @click="handleDownload" title="Download .md file">
      <span class="export-icon">&#8681;</span>
      <span class="export-label">.md</span>
    </button>
  </div>
</template>

<style scoped>
.doc-export-bar {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  font-family: var(--font-sans, 'Inter', sans-serif);
  color: var(--text-muted, #94a3b8);
  background: var(--bg, #f8fafc);
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.export-btn:hover {
  color: var(--text-primary, #1e293b);
  border-color: var(--text-muted, #94a3b8);
  background: #fff;
}

.export-icon {
  font-size: 13px;
  line-height: 1;
}

.export-label {
  font-size: 11px;
  font-weight: 500;
}
</style>
