<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { apiGet, apiPut } from '@/composables/useTurso'
import ComponentPalette from '@/mockup/ComponentPalette.vue'
import MockupCanvas from '@/mockup/MockupCanvas.vue'
import PropertyPanel from '@/mockup/PropertyPanel.vue'
import { getComponentDef, type ComponentDef } from '@/mockup/componentCatalog'
import { useScenarios } from '@/mockup/useScenarios'

const route = useRoute()
const slug = computed(() => route.params.slug as string)

interface CanvasComponent {
  id: string; componentType: string; props: Record<string, unknown>; children: CanvasComponent[]
}

const components = ref<CanvasComponent[]>([])
const selectedId = ref<string | null>(null)
const selectedIds = ref<string[]>([])

function onSelect(id: string, event?: MouseEvent) {
  if (event?.shiftKey || event?.metaKey || event?.ctrlKey) {
    // Shift+click: toggle multi-select
    const idx = selectedIds.value.indexOf(id)
    if (idx >= 0) selectedIds.value.splice(idx, 1)
    else selectedIds.value.push(id)
    selectedId.value = id
  } else {
    selectedId.value = id
    selectedIds.value = [id]
  }
}

// Multi-select delete
function onDeleteMulti() {
  if (selectedIds.value.length > 1) {
    saveUndo()
    for (const id of selectedIds.value) {
      components.value = removeComponent(components.value, id)
    }
    selectedIds.value = []
    selectedId.value = null
  }
}

// Ctrl+C / Ctrl+V
let clipboard: CanvasComponent[] = []

function onCopy() {
  clipboard = selectedIds.value
    .map(id => findComponent(components.value, id))
    .filter(Boolean)
    .map(c => JSON.parse(JSON.stringify(c!)))
}

function onPaste() {
  if (!clipboard.length) return
  saveUndo()
  for (const orig of clipboard) {
    const copy = JSON.parse(JSON.stringify(orig))
    copy.id = `c-${++idCounter}`
    if (typeof copy.props.x === 'number') copy.props.x += 20
    if (typeof copy.props.y === 'number') copy.props.y += 20
    components.value.push(copy)
  }
}
const pageTitle = ref('')
const pageDescription = ref('')
const viewport = ref<'mobile' | 'desktop'>('desktop')
const saving = ref(false)
const hasChanges = ref(false)
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
const zoom = ref(100)
const showGrid = ref(false)

function onWheel(e: WheelEvent) {
  if (!e.ctrlKey && !e.metaKey) return
  e.preventDefault()
  zoom.value = Math.min(400, Math.max(25, zoom.value + (e.deltaY > 0 ? -25 : 25)))
}
const saveToast = ref(false)
let idCounter = 0

// Scenarios
const token = localStorage.getItem('spec-auth-token') || ''
const { scenarios, activeScenarioId, fetchScenarios, selectScenario, createScenario, deleteScenario } = useScenarios(slug.value, token)
const showScenarioInput = ref(false)
const newScenarioName = ref('')

async function addScenario() {
  if (!newScenarioName.value.trim()) return
  await createScenario(newScenarioName.value.trim())
  newScenarioName.value = ''
  showScenarioInput.value = false
}

// Custom component management
const showCompModal = ref(false)
const customDefs = ref<any[]>([])
const newDef = ref({ id: '', name: '', category: 'Custom', icon: '🧩', base_type: 'div' })

async function fetchCustomDefs() {
  const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v2/mockups/component-defs`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.ok) { const d = await res.json(); customDefs.value = d.defs || [] }
}

async function addCustomDef() {
  if (!newDef.value.id || !newDef.value.name) return
  await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v2/mockups/component-defs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(newDef.value),
  })
  newDef.value = { id: '', name: '', category: 'Custom', icon: '🧩', base_type: 'div' }
  await fetchCustomDefs()
}

async function deleteCustomDef(id: string) {
  await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v2/mockups/component-defs/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  await fetchCustomDefs()
}

// Tree drag & drop (hierarchy change)
const treeDragOver = ref('')
let treeDragId = ''

function onTreeDragStart(e: DragEvent, id: string) {
  treeDragId = id
  e.dataTransfer?.setData('tree-comp-id', id)
}

function onTreeDragOver(e: DragEvent, target: CanvasComponent) {
  if (treeDragId === target.id) return
  if (getComponentDef(target.componentType)?.allowChildren) {
    treeDragOver.value = target.id
  }
}

function onTreeDrop(e: DragEvent, target: CanvasComponent) {
  treeDragOver.value = ''
  const sourceId = e.dataTransfer?.getData('tree-comp-id') || treeDragId
  if (!sourceId || sourceId === target.id) return
  if (!getComponentDef(target.componentType)?.allowChildren) return

  saveUndo()
  const comp = findComponent(components.value, sourceId)
  if (!comp) return
  // Remove from source
  components.value = removeComponent(components.value, sourceId)
  // Add to target children
  const parent = findComponent(components.value, target.id)
  if (parent) parent.children.push(comp)
  treeDragId = ''
}

function onTreeDropToRoot(e: DragEvent, childId?: string) {
  treeDragOver.value = ''
  const sourceId = childId || e.dataTransfer?.getData('tree-comp-id') || treeDragId
  if (!sourceId) return

  saveUndo()
  const comp = findComponent(components.value, sourceId)
  if (!comp) return
  components.value = removeComponent(components.value, sourceId)
  components.value.push(comp)
  treeDragId = ''
}

// Layer z-index operations
function bringToFront(id: string) {
  const maxZ = Math.max(0, ...components.value.map(c => (c.props.zIndex as number) || 0))
  const comp = findComponent(components.value, id)
  if (comp) comp.props.zIndex = maxZ + 1
}

function sendToBack(id: string) {
  const minZ = Math.min(0, ...components.value.map(c => (c.props.zIndex as number) || 0))
  const comp = findComponent(components.value, id)
  if (comp) comp.props.zIndex = minZ - 1
}

function bringForward(id: string) {
  const comp = findComponent(components.value, id)
  if (comp) comp.props.zIndex = ((comp.props.zIndex as number) || 0) + 1
}

function sendBackward(id: string) {
  const comp = findComponent(components.value, id)
  if (comp) comp.props.zIndex = ((comp.props.zIndex as number) || 0) - 1
}

// Multi-select alignment
function alignSelected(axis: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV') {
  if (selectedIds.value.length < 2) return
  saveUndo()
  const comps = selectedIds.value.map(id => findComponent(components.value, id)).filter(Boolean) as CanvasComponent[]
  const xs = comps.map(c => (c.props.x as number) || 0)
  const ys = comps.map(c => (c.props.y as number) || 0)
  const ws = comps.map(c => (c.props.w as number) || 200)
  const hs = comps.map(c => (c.props.h as number) || 40)

  if (axis === 'left') { const min = Math.min(...xs); comps.forEach(c => c.props.x = min) }
  if (axis === 'right') { const max = Math.max(...xs.map((x, i) => x + ws[i])); comps.forEach((c, i) => c.props.x = max - ((c.props.w as number) || 200)) }
  if (axis === 'top') { const min = Math.min(...ys); comps.forEach(c => c.props.y = min) }
  if (axis === 'bottom') { const max = Math.max(...ys.map((y, i) => y + hs[i])); comps.forEach((c, i) => c.props.y = max - ((c.props.h as number) || 40)) }
  if (axis === 'centerH') { const avg = xs.reduce((a, x, i) => a + x + ws[i] / 2, 0) / comps.length; comps.forEach((c, i) => c.props.x = Math.round(avg - ((c.props.w as number) || 200) / 2)) }
  if (axis === 'centerV') { const avg = ys.reduce((a, y, i) => a + y + hs[i] / 2, 0) / comps.length; comps.forEach((c, i) => c.props.y = Math.round(avg - ((c.props.h as number) || 40) / 2)) }
}

const selectedComponent = computed(() => {
  if (!selectedId.value) return null
  return findComponent(components.value, selectedId.value)
})

function findComponent(list: CanvasComponent[], id: string): CanvasComponent | null {
  for (const c of list) {
    if (c.id === id) return c
    const found = findComponent(c.children, id)
    if (found) return found
  }
  return null
}

function onEditorKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') { e.preventDefault(); redo(); return }
  if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo() }
  if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); redo() }
  if ((e.metaKey || e.ctrlKey) && e.key === 'c') { e.preventDefault(); onCopy() }
  if ((e.metaKey || e.ctrlKey) && e.key === 'v') { e.preventDefault(); onPaste() }
  if (e.key === 'Delete' && selectedIds.value.length > 1) { e.preventDefault(); onDeleteMulti() }
  if ((e.metaKey || e.ctrlKey) && e.key === '0') { e.preventDefault(); zoom.value = 100 }
  if ((e.metaKey || e.ctrlKey) && e.key === '1') { e.preventDefault(); zoom.value = 100 }
}

// Auto-save (2s debounce)
watch(components, () => {
  hasChanges.value = true
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => { save() }, 2000)
}, { deep: true })

onMounted(async () => {
  document.addEventListener('keydown', onEditorKeydown)
  fetchScenarios()
  fetchCustomDefs()
  if (slug.value && slug.value !== 'new') {
    const { data } = await apiGet(`/api/v2/mockups/${slug.value}`)
    if (data?.page) {
      pageTitle.value = (data.page as any).title || ''
      viewport.value = (data.page as any).viewport === 'mobile' ? 'mobile' : 'desktop'
    }
    if (data?.components) {
      // flat -> tree conversion
      const flat = data.components as any[]
      components.value = buildTree(flat)
    }
  }
})

function buildTree(flat: any[]): CanvasComponent[] {
  const map = new Map<number, CanvasComponent>()
  const roots: CanvasComponent[] = []
  for (const f of flat) {
    const comp: CanvasComponent = {
      id: `c-${f.id}`,
      componentType: f.component_type,
      props: JSON.parse(f.props || '{}'),
      children: [],
    }
    map.set(f.id, comp)
    idCounter = Math.max(idCounter, f.id + 1)
  }
  for (const f of flat) {
    const comp = map.get(f.id)!
    if (f.parent_id && map.has(f.parent_id)) {
      map.get(f.parent_id)!.children.push(comp)
    } else {
      roots.push(comp)
    }
  }
  return roots
}

function onAddComponent(def: ComponentDef) {
  components.value.push({
    id: `c-${++idCounter}`,
    componentType: def.id,
    props: { ...def.defaultProps },
    children: [],
  })
}

function onDrop(componentId: string, parentId?: string, x?: number, y?: number) {
  saveUndo()
  const def = getComponentDef(componentId)
  if (!def) return
  const newComp: CanvasComponent = {
    id: `c-${++idCounter}`,
    componentType: def.id,
    props: { ...def.defaultProps, x: x ?? 0, y: y ?? 0 },
    children: [],
  }
  if (parentId) {
    const parent = findComponent(components.value, parentId)
    if (parent && getComponentDef(parent.componentType)?.allowChildren) {
      parent.children.push(newComp)
      return
    }
  }
  components.value.push(newComp)
}

// Undo
const undoStack = ref<string[]>([])
const redoStack = ref<string[]>([])

function saveUndo() {
  undoStack.value.push(JSON.stringify(components.value))
  if (undoStack.value.length > 20) undoStack.value.shift()
  redoStack.value = []
}

function undo() {
  const prev = undoStack.value.pop()
  if (prev) {
    redoStack.value.push(JSON.stringify(components.value))
    components.value = JSON.parse(prev)
  }
}

function redo() {
  const next = redoStack.value.pop()
  if (next) {
    undoStack.value.push(JSON.stringify(components.value))
    components.value = JSON.parse(next)
  }
}

function onDelete(id: string) {
  if (!confirm('Are you sure you want to delete this?')) return
  saveUndo()
  components.value = removeComponent(components.value, id)
  if (selectedId.value === id) selectedId.value = null
}

function onReorder(id: string, direction: 'up' | 'down') {
  saveUndo()
  const idx = components.value.findIndex(c => c.id === id)
  if (idx < 0) return
  const newIdx = direction === 'up' ? idx - 1 : idx + 1
  if (newIdx < 0 || newIdx >= components.value.length) return
  const temp = components.value[idx]
  components.value[idx] = components.value[newIdx]
  components.value[newIdx] = temp
  components.value = [...components.value]
}

function removeComponent(list: CanvasComponent[], id: string): CanvasComponent[] {
  return list.filter(c => {
    if (c.id === id) return false
    c.children = removeComponent(c.children, id)
    return true
  })
}

function onUpdateProp(key: string, value: unknown) {
  const comp = selectedComponent.value
  if (comp) comp.props[key] = value
}

function onUpdateSpec(desc: string) {
  const comp = selectedComponent.value
  if (comp) comp.props.specDescription = desc
}

// Save
async function save() {
  saving.value = true
  const flatComps = flattenTree(components.value, null, 0)
  await apiPut(`/api/v2/mockups/${slug.value}`, {
    title: pageTitle.value,
    components: flatComps,
  })
  saving.value = false
  hasChanges.value = false
  saveToast.value = true
  setTimeout(() => { saveToast.value = false }, 2000)
}

function flattenTree(list: CanvasComponent[], parentIdx: number | null, startOrder: number): any[] {
  const result: any[] = []
  let order = startOrder
  for (const c of list) {
    const idx = result.length
    result.push({
      componentType: c.componentType,
      props: c.props,
      parentId: parentIdx,
      specDescription: c.props.specDescription || null,
      sortOrder: order++,
    })
    if (c.children.length) {
      result.push(...flattenTree(c.children, idx, order))
      order += c.children.length
    }
  }
  return result
}

onUnmounted(() => document.removeEventListener("keydown", onEditorKeydown))
</script>

<template>
  <div class="mobile-notice">The mockup editor is only supported on desktop.</div>
  <div class="editor-layout">
    <!-- Left: palette + tree -->
    <div class="editor-left">
      <div class="palette-header">
        <span class="palette-title">Components</span>
        <button class="palette-manage-btn" @click="showCompModal = true; fetchCustomDefs()">Manage</button>
      </div>
      <ComponentPalette @add="onAddComponent" />
      <div class="tree-view">
        <div class="tree-title">Layers</div>
        <div v-for="c in components" :key="c.id"
          class="tree-node" :class="{ 'tree-selected': selectedId === c.id, 'tree-drop-target': treeDragOver === c.id }"
          draggable="true"
          @click="selectedId = c.id"
          @dragstart="onTreeDragStart($event, c.id)"
          @dragover.prevent="onTreeDragOver($event, c)"
          @dragleave="treeDragOver = ''"
          @drop.prevent="onTreeDrop($event, c)">
          {{ getComponentDef(c.componentType)?.icon }} {{ getComponentDef(c.componentType)?.name }}
          <span class="layer-z">z:{{ c.props.zIndex || 0 }}</span>
          <button class="layer-btn" @click.stop="c.props.locked = !c.props.locked" :title="c.props.locked ? 'Unlock' : 'Lock'">{{ c.props.locked ? '<Icon name="unlock" :size="14" />' : '<Icon name="lock" :size="14" />' }}</button>
          <div v-if="selectedId === c.id" class="layer-controls">
            <button class="layer-btn" @click.stop="bringToFront(c.id)" title="Bring to front">⬆⬆</button>
            <button class="layer-btn" @click.stop="bringForward(c.id)" title="Bring forward">⬆</button>
            <button class="layer-btn" @click.stop="sendBackward(c.id)" title="Send backward">⬇</button>
            <button class="layer-btn" @click.stop="sendToBack(c.id)" title="Send to back">⬇⬇</button>
          </div>
          <div v-for="child in c.children" :key="child.id"
            class="tree-child" :class="{ 'tree-selected': selectedId === child.id }"
            draggable="true"
            @click.stop="selectedId = child.id"
            @dragstart.stop="onTreeDragStart($event, child.id)"
            @dragover.prevent.stop
            @drop.prevent.stop="onTreeDrop($event, c)">
            └ {{ getComponentDef(child.componentType)?.icon }} {{ getComponentDef(child.componentType)?.name }}
          </div>
        </div>
        <!-- Root drop zone -->
        <div class="tree-root-drop" @dragover.prevent @drop.prevent="onTreeDropToRoot($event)">Move to root</div>
      </div>
    </div>

    <!-- Center canvas -->
    <div class="editor-center">
      <!-- Scenario tabs -->
      <div class="scenario-bar">
        <button class="scenario-tab" :class="{ active: !activeScenarioId }" @click="selectScenario(null)">Default</button>
        <button v-for="s in scenarios" :key="s.id" class="scenario-tab" :class="{ active: activeScenarioId === s.id }" @click="selectScenario(s.id)">
          {{ s.name }}
          <span class="scenario-del" @click.stop="deleteScenario(s.id)">✕</span>
        </button>
        <button v-if="!showScenarioInput" class="scenario-add" @click="showScenarioInput = true">+</button>
        <input v-else v-model="newScenarioName" class="scenario-input" placeholder="Scenario name" @keyup.enter="addScenario" @blur="showScenarioInput = false" autofocus />
      </div>
      <div class="editor-toolbar">
        <input v-model="pageTitle" class="toolbar-title" placeholder="Mockup title" />
        <select v-model="viewport" class="toolbar-select">
          <option value="desktop">Desktop</option>
          <option value="mobile">Mobile</option>
        </select>
        <span class="save-indicator" :class="{ changed: hasChanges }">{{ saving ? 'Saving...' : hasChanges ? 'Unsaved changes' : 'Saved' }}</span>
        <button class="styled-btn styled-btn--primary" :disabled="saving" @click="save">{{ saving ? 'Saving...' : 'Save' }}</button>
        <button class="styled-btn styled-btn--ghost" @click="$router.push(`/mockup-viewer/${slug}`)">Preview</button>
        <template v-if="selectedIds.length > 1">
          <button class="align-btn" @click="alignSelected('left')" title="Align left">⬅</button>
          <button class="align-btn" @click="alignSelected('centerH')" title="Center horizontally">↔</button>
          <button class="align-btn" @click="alignSelected('right')" title="Align right">➡</button>
          <button class="align-btn" @click="alignSelected('top')" title="Align top">⬆</button>
          <button class="align-btn" @click="alignSelected('centerV')" title="Center vertically">↕</button>
          <button class="align-btn" @click="alignSelected('bottom')" title="Align bottom">⬇</button>
        </template>
        <button class="styled-btn styled-btn--ghost" @click="showGrid = !showGrid">{{ showGrid ? 'Grid off' : 'Grid' }}</button>
        <span class="zoom-info">{{ zoom }}%</span>
        <input type="range" min="25" max="400" step="25" v-model.number="zoom" class="zoom-slider" />
      </div>
      <div :class="{ 'canvas-grid': showGrid }" :style="{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }" @wheel="onWheel">
      <MockupCanvas
        :components="components"
        :selected-id="selectedId"
        :selected-ids="selectedIds"
        :viewport="viewport"
        @select="(id: string, ev: MouseEvent) => onSelect(id, ev)"
        @drop="onDrop"
        @delete="onDelete"
        @reorder="onReorder"
      />
      </div>
    </div>

    <!-- Right: property panel -->
    <PropertyPanel
      :selected="selectedComponent"
      :page-title="pageTitle"
      :page-description="pageDescription"
      @update-prop="onUpdateProp"
      @update-spec="onUpdateSpec"
      @update-page-title="pageTitle = $event"
      @update-page-desc="pageDescription = $event"
    />
    <!-- Status bar -->
    <div class="editor-statusbar">
      <span>Components: {{ components.length }}</span>
      <span v-if="selectedIds.length > 1">Selected: {{ selectedIds.length }}</span>
    </div>
    <!-- Save toast -->
    <div v-if="saveToast" class="save-toast">Saved</div>

    <!-- Custom component management modal -->
    <div v-if="showCompModal" class="modal-overlay" @click.self="showCompModal = false">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Manage Components</h3>
          <button class="modal-close" @click="showCompModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div v-for="d in customDefs" :key="d.id" class="custom-def-row">
            <span>{{ d.icon }} {{ d.name }} ({{ d.category }})</span>
            <button v-if="!d.is_builtin" class="css-remove" @click="deleteCustomDef(d.id)">Delete</button>
          </div>
          <div class="custom-def-form">
            <input v-model="newDef.id" placeholder="ID (alphanumeric)" class="prop-input" />
            <input v-model="newDef.name" placeholder="Name" class="prop-input" />
            <input v-model="newDef.icon" placeholder="Icon" class="prop-input" style="width:40px" />
            <input v-model="newDef.category" placeholder="Category" class="prop-input" />
            <button class="css-add-btn" @click="addCustomDef">Add</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-layout { display: flex; height: calc(100vh - 60px); }
.editor-center { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.editor-toolbar { display: flex; gap: 8px; padding: 8px 16px; border-bottom: 1px solid var(--border, #e5e7eb); align-items: center; }
.toolbar-title { flex: 1; border: none; font-size: 16px; font-weight: 600; outline: none; }
.toolbar-select { border: 1px solid #d1d5db; border-radius: 6px; padding: 4px 8px; font-size: 12px; }
.styled-btn { border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.styled-btn--primary { background: #3b82f6; color: #fff; }
.styled-btn--primary:hover { background: #2563eb; }
.styled-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
.editor-left { display: flex; flex-direction: column; width: 220px; border-right: 1px solid var(--border, #e5e7eb); }
.tree-view { padding: 8px 12px; border-top: 1px solid var(--border, #e5e7eb); overflow-y: auto; }
.tree-title { font-size: 11px; font-weight: 700; color: #9ca3af; margin-bottom: 4px; }
.tree-node { font-size: 12px; padding: 3px 4px; border-radius: 4px; cursor: pointer; }
.tree-node:hover { background: #f3f4f6; }
.tree-child { padding-left: 12px; font-size: 11px; color: #6b7280; }
.tree-selected { background: #eff6ff; color: #3b82f6; }
.tree-drop-target { background: #dbeafe; border: 1px dashed #3b82f6; }
.layer-z { font-size: 9px; color: #9ca3af; margin-left: auto; }
.layer-controls { display: flex; gap: 2px; margin-top: 2px; }
.layer-btn { border: none; background: #f3f4f6; border-radius: 3px; padding: 1px 4px; font-size: 10px; cursor: pointer; }
.layer-btn:hover { background: #e5e7eb; }
.align-btn { border: none; background: #f3f4f6; border-radius: 4px; padding: 2px 6px; font-size: 12px; cursor: pointer; }
.align-btn:hover { background: #e5e7eb; }
.save-indicator { font-size: 11px; color: #9ca3af; }
.save-indicator.changed { color: #f59e0b; }
.editor-statusbar { display: flex; gap: 16px; padding: 4px 16px; border-top: 1px solid var(--border, #e5e7eb); font-size: 11px; color: #9ca3af; }
.zoom-info { font-size: 11px; color: #6b7280; }
.zoom-slider { width: 80px; }
.canvas-grid { background-image: radial-gradient(circle, #d1d5db 1px, transparent 1px); background-size: 10px 10px; }
.tree-root-drop { padding: 6px 4px; margin-top: 4px; text-align: center; font-size: 10px; color: #9ca3af; border: 1px dashed #d1d5db; border-radius: 4px; }
.save-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #22c55e; color: #fff; padding: 8px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; z-index: 9999; }
.mobile-notice { display: none; }
.scenario-bar { display: flex; gap: 4px; padding: 4px 16px; border-bottom: 1px solid var(--border, #e5e7eb); overflow-x: auto; align-items: center; }
.scenario-tab { border: none; background: none; padding: 4px 10px; font-size: 12px; color: #6b7280; cursor: pointer; border-radius: 4px; white-space: nowrap; display: flex; align-items: center; gap: 4px; }
.scenario-tab.active { background: #3b82f6; color: #fff; }
.scenario-tab:hover:not(.active) { background: #f3f4f6; }
.scenario-del { font-size: 10px; opacity: 0.5; }
.scenario-del:hover { opacity: 1; }
.scenario-add { border: 1px dashed #d1d5db; background: none; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; font-size: 14px; color: #9ca3af; }
.scenario-input { border: 1px solid #3b82f6; border-radius: 4px; padding: 2px 6px; font-size: 12px; width: 100px; }
.palette-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; }
.palette-title { font-size: 12px; font-weight: 700; color: #374151; }
.palette-manage-btn { border: 1px solid #d1d5db; background: #fff; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; color: #6b7280; }
.palette-manage-btn:hover { background: #f3f4f6; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 9999; display: flex; align-items: center; justify-content: center; }
.modal-box { background: #fff; border-radius: 12px; width: 400px; max-height: 80vh; overflow-y: auto; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #e5e7eb; }
.modal-header h3 { font-size: 16px; font-weight: 700; margin: 0; }
.modal-close { border: none; background: none; font-size: 18px; cursor: pointer; color: #6b7280; }
.modal-body { padding: 16px; }
.custom-def-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
.custom-def-form { display: flex; gap: 4px; margin-top: 12px; flex-wrap: wrap; }
.custom-def-form .prop-input { flex: 1; min-width: 60px; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 6px; font-size: 12px; }
.css-add-btn { border: none; background: #3b82f6; color: #fff; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer; }
.css-remove { border: none; background: none; color: #ef4444; font-size: 12px; cursor: pointer; }
@media (max-width: 768px) { .editor-layout { display: none !important; } .mobile-notice { display: block; text-align: center; padding: 40px; color: #6b7280; } }
</style>
