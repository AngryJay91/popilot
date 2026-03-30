<script setup lang="ts">
import { useRouter } from 'vue-router'

interface DocNode {
  id: string; title: string; icon: string | null; is_folder: number
  parent_id: string | null; sort_order: number; children: DocNode[]
}

const props = defineProps<{
  node: DocNode
  activeDocId?: string
  expanded: Set<string>
  depth?: number
}>()

const emit = defineEmits<{
  toggle: [id: string]
  dragstart: [e: DragEvent, id: string]
  drop: [e: DragEvent, node: DocNode]
  dropRoot: [e: DragEvent]
  contextmenu: [e: MouseEvent, node: DocNode]
}>()

const router = useRouter()
const depth = props.depth ?? 0

function onDragStart(e: DragEvent) {
  e.stopPropagation()
  e.dataTransfer?.setData('doc-id', props.node.id)
  emit('dragstart', e, props.node.id)
}

function navigate() {
  router.push(`/docs/${props.node.id}`)
}
</script>

<template>
  <div>
    <div
      class="tree-item"
      :class="{ active: activeDocId === node.id }"
      :style="{ paddingLeft: (12 + depth * 16) + 'px' }"
      draggable="true"
      @dragstart.stop="onDragStart($event)"
      @dragover.prevent
      @drop.prevent.stop="emit('drop', $event, node)"
      @contextmenu.prevent.stop="emit('contextmenu', $event, node)"
      @click="navigate"
    >
      <span v-if="node.children.length" class="tree-arrow" @click.stop="emit('toggle', node.id)">
        {{ expanded.has(node.id) ? '▼' : '▶' }}
      </span>
      <span class="tree-icon">{{ (node.icon && !node.icon.startsWith('Icon') && !node.icon.startsWith('<')) ? node.icon : '📄' }}</span>
      <span class="tree-label">{{ node.title }}</span>
    </div>
    <div v-if="node.children.length && expanded.has(node.id)">
      <TreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :active-doc-id="activeDocId"
        :expanded="expanded"
        :depth="depth + 1"
        @toggle="emit('toggle', $event)"
        @dragstart="(e: DragEvent, id: string) => emit('dragstart', e, id)"
        @drop="(e: DragEvent, n: any) => emit('drop', e, n)"
        @contextmenu="(e: MouseEvent, n: any) => emit('contextmenu', e, n)"
      />
    </div>
  </div>
</template>

<style scoped>
.tree-item { display: flex; align-items: center; gap: 8px; padding: 4px 12px; font-size: 13px; line-height: 28px; cursor: pointer; border-radius: 6px; margin: 1px 6px; transition: background 0.1s; position: relative; color: var(--text-sidebar, #d1d5db); }
.tree-item:hover { background: rgba(255,255,255,0.06); }
.tree-item.active { background: rgba(255,255,255,0.1); color: #fff; font-weight: 600; }
.tree-item.active::before { content: ''; position: absolute; left: 0; top: 4px; bottom: 4px; width: 3px; background: var(--primary); border-radius: 2px; }
.tree-arrow { font-size: 10px; width: 14px; text-align: center; cursor: pointer; transition: transform 0.15s; }
.tree-icon { font-size: 15px; flex-shrink: 0; }
.tree-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
</style>
