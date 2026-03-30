<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Placeholder from '@tiptap/extension-placeholder'
import { SlashCommand } from './SlashCommand'

const props = defineProps<{ modelValue: string; editable?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: string]; 'focus': []; 'blur': [] }>()

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable !== false,
  extensions: [
    StarterKit,
    Link.configure({ openOnClick: false }),
    Image,
    Table.configure({ resizable: true }),
    TableRow, TableCell, TableHeader,
    Placeholder.configure({ placeholder: 'Start writing... Type / to open the block menu.' }),
    SlashCommand,
  ],
  onUpdate: ({ editor: e }) => {
    emit('update:modelValue', e.getHTML())
  },
  onFocus: () => emit('focus'),
  onBlur: () => emit('blur'),
})

watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val, false)
  }
})

onBeforeUnmount(() => { editor.value?.destroy() })
</script>

<template>
  <div v-if="editor" class="doc-editor">
    <!-- Toolbar -->
    <div v-if="editable !== false" class="editor-toolbar">
      <button :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()"><b>B</b></button>
      <button :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()"><i>I</i></button>
      <span class="toolbar-sep" />
      <button :class="{ active: editor.isActive('heading', { level: 1 }) }" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()">H1</button>
      <button :class="{ active: editor.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">H2</button>
      <button :class="{ active: editor.isActive('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">H3</button>
      <span class="toolbar-sep" />
      <button :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()">&#8226;</button>
      <button :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()">1.</button>
      <button :class="{ active: editor.isActive('codeBlock') }" @click="editor.chain().focus().toggleCodeBlock().run()">Code</button>
      <button :class="{ active: editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()">Quote</button>
      <span class="toolbar-sep" />
      <button @click="addLink">Link</button>
      <button @click="addImage">Image</button>
      <button @click="editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()">Table</button>
    </div>
    <EditorContent :editor="editor" class="editor-content" />
  </div>
</template>

<script lang="ts">
export default {
  methods: {
    addLink() {
      const url = prompt('Enter URL:')
      if (url) (this as any).editor?.chain().focus().setLink({ href: url }).run()
    },
    addImage() {
      const url = prompt('Enter image URL:')
      if (url) (this as any).editor?.chain().focus().setImage({ src: url }).run()
    },
  },
}
</script>

<style scoped>
.doc-editor { border: none; overflow: hidden; }
.editor-toolbar { display: flex; gap: 2px; padding: 8px 0; border-bottom: 1px solid #f0f0f0; margin-bottom: 16px; flex-wrap: wrap; position: sticky; top: 0; background: #fff; z-index: 10; }
.editor-toolbar button { border: none; background: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer; color: #374151; }
.editor-toolbar button:hover { background: #e5e7eb; }
.editor-toolbar button.active { background: #3b82f6; color: #fff; }
.toolbar-sep { width: 1px; background: #d1d5db; margin: 0 4px; }
.editor-content { min-height: 300px; padding: 16px; }
.editor-content :deep(.ProseMirror) { outline: none; min-height: 280px; }
.editor-content :deep(.ProseMirror) { font-size: 15px; line-height: 1.8; color: #1a1a1a; }
.editor-content :deep(.ProseMirror p) { margin: 0.5em 0; }
.editor-content :deep(.ProseMirror h1) { font-size: 24px; font-weight: 700; margin: 1em 0 0.5em; }
.editor-content :deep(.ProseMirror h2) { font-size: 20px; font-weight: 600; margin: 0.8em 0 0.4em; }
.editor-content :deep(.ProseMirror h3) { font-size: 16px; font-weight: 600; margin: 0.6em 0 0.3em; }
.editor-content :deep(.ProseMirror code) { background: #f1f5f9; color: #1e293b; padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: 'SF Mono', 'Fira Code', monospace; }
.editor-content :deep(.ProseMirror pre) { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.6; }
.editor-content :deep(.ProseMirror pre code) { background: none; color: inherit; padding: 0; border-radius: 0; font-size: inherit; }
.editor-content :deep(.ProseMirror pre::selection), .editor-content :deep(.ProseMirror pre *::selection) { background: rgba(99, 130, 191, 0.3); }
.editor-content :deep(.ProseMirror .ProseMirror-selectednode) { outline: 2px solid #3b82f6; }
.editor-content :deep(.ProseMirror blockquote) { border-left: 3px solid #3b82f6; padding-left: 16px; color: #475569; background: #f8fafc; margin: 12px 0; padding: 12px 16px; border-radius: 0 6px 6px 0; }
.editor-content :deep(.ProseMirror ul) { padding-left: 20px; }
.editor-content :deep(.ProseMirror ol) { padding-left: 20px; }
.editor-content :deep(.ProseMirror img) { max-width: 100%; border-radius: 8px; }
.editor-content :deep(.ProseMirror table) { border-collapse: collapse; width: 100%; }
.editor-content :deep(.ProseMirror td), .editor-content :deep(.ProseMirror th) { border: 1px solid #d1d5db; padding: 6px 8px; }
.editor-content :deep(.ProseMirror th) { background: #f9fafb; font-weight: 600; }
.editor-content :deep(.ProseMirror .is-empty::before) { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; float: left; height: 0; }
</style>

<style>
.slash-menu { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 4px; min-width: 180px; z-index: 9999; }
.slash-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 13px; }
.slash-item:hover, .slash-active { background: #eff6ff; }
.slash-icon { width: 20px; text-align: center; font-weight: 700; font-size: 12px; color: #6b7280; }
</style>
