<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { apiGet } from '@/composables/useTurso'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  rows?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
}>()

interface Member { id: number; name: string; role: string }

const members = ref<Member[]>([])
const showSuggestions = ref(false)
const suggestions = ref<Member[]>([])
const cursorPos = ref(0)
const mentionStart = ref(-1)
const selectedIdx = ref(0)
const textareaRef = ref<HTMLTextAreaElement>()

onMounted(() => loadMembers())

async function loadMembers() {
  if (members.value.length) return
  const { data } = await apiGet<{ members: any[] }>('/api/v2/admin/members')
  if (data?.members) {
    members.value = data.members
      .filter((m: any) => m.is_active)
      .map((m: any) => ({ id: m.id, name: m.display_name || m.name || '', role: m.role || '' }))
  }
}

async function onInput(e: Event) {
  const el = e.target as HTMLTextAreaElement
  const val = el.value
  emit('update:modelValue', val)
  cursorPos.value = el.selectionStart || 0
  await checkMention(val, cursorPos.value)
}

async function checkMention(text: string, pos: number) {
  // Find text after @
  const before = text.slice(0, pos)
  const atIdx = before.lastIndexOf('@')
  if (atIdx === -1 || (atIdx > 0 && before[atIdx - 1] !== ' ' && before[atIdx - 1] !== '\n')) {
    showSuggestions.value = false
    return
  }
  const query = before.slice(atIdx + 1).toLowerCase()
  if (query.includes(' ') || query.includes('\n')) {
    showSuggestions.value = false
    return
  }
  mentionStart.value = atIdx
  await loadMembers()
  suggestions.value = members.value.filter(m =>
    m.name.toLowerCase().includes(query)
  ).slice(0, 5)
  showSuggestions.value = suggestions.value.length > 0
  selectedIdx.value = 0
}

function selectMember(m: Member) {
  const text = props.modelValue
  const before = text.slice(0, mentionStart.value)
  const after = text.slice(cursorPos.value)
  const newText = `${before}@${m.name} ${after}`
  emit('update:modelValue', newText)
  showSuggestions.value = false
  nextTick(() => {
    if (textareaRef.value) {
      const newPos = mentionStart.value + m.name.length + 2
      textareaRef.value.focus()
      textareaRef.value.setSelectionRange(newPos, newPos)
    }
  })
}

const isComposing = ref(false)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !showSuggestions.value && !isComposing.value) {
    e.preventDefault()
    emit('submit')
  }
  if (e.key === 'Escape') {
    showSuggestions.value = false
  }
  // Keyboard navigation
  if (showSuggestions.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedIdx.value = Math.min(selectedIdx.value + 1, suggestions.value.length - 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedIdx.value = Math.max(selectedIdx.value - 1, 0)
    } else if ((e.key === 'Tab' || e.key === 'Enter') && suggestions.value.length > 0) {
      e.preventDefault()
      selectMember(suggestions.value[selectedIdx.value])
    }
  }
}
</script>

<template>
  <div class="mention-input-wrap">
    <textarea
      ref="textareaRef"
      :value="modelValue"
      :placeholder="placeholder || 'Write a reply... (@ to mention)'"
      :rows="rows || 3"
      @input="onInput"
      @compositionstart="isComposing = true"
      @compositionend="isComposing = false; onInput($event)"
      @keydown="onKeydown"
    />
    <div v-if="showSuggestions" class="mention-suggestions">
      <div
        v-for="(m, i) in suggestions"
        :key="m.id"
        class="mention-item"
        :class="{ 'mention-item--selected': i === selectedIdx }"
        @mousedown.prevent="selectMember(m)"
        @touchend.prevent="selectMember(m)"
      >
        <span class="mention-name">{{ m.name }}</span>
        <span class="mention-role">{{ m.role }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mention-input-wrap { position: relative; overflow: visible; }
.mention-input-wrap textarea {
  width: 100%;
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: 8px;
  padding: 8px;
  font-size: 13px;
  resize: vertical;
  box-sizing: border-box;
}
.mention-suggestions {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  right: 0;
  min-width: 200px;
  background: #fff;
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 1000;
  max-height: 160px;
  overflow-y: auto;
}
.mention-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
.mention-item:hover, .mention-item--selected { background: #f0f4ff; }
.mention-name { font-weight: 600; }
.mention-role { font-size: 11px; color: #888; }
</style>
