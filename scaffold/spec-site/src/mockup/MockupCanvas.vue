<script setup lang="ts">
import { ref, computed } from 'vue'
import { getComponentDef, type ComponentDef } from './componentCatalog'

export interface CanvasComponent {
  id: string
  componentType: string
  props: Record<string, unknown>
  children: CanvasComponent[]
}

const props = defineProps<{
  components: CanvasComponent[]
  selectedId: string | null
  viewport: 'mobile' | 'desktop'
  viewMode?: boolean
}>()

const emit = defineEmits<{
  select: [id: string, event: MouseEvent]
  drop: [componentId: string, parentId?: string, x?: number, y?: number]
  delete: [id: string]
  reorder: [id: string, direction: 'up' | 'down']
}>()

// Auto-expand canvas based on component positions
const canvasMinWidth = computed(() => {
  let maxX = 0
  for (const c of props.components) {
    const x = (c.props.x as number) || 0
    const w = (c.props.w as number) || 200
    maxX = Math.max(maxX, x + w + 40)
  }
  return maxX > 0 ? `${maxX}px` : 'auto'
})

const canvasMinHeight = computed(() => {
  let maxY = 0
  for (const c of props.components) {
    const y = (c.props.y as number) || 0
    const h = (c.props.h as number) || 40
    maxY = Math.max(maxY, y + h + 40)
  }
  return maxY > 400 ? `${maxY}px` : '400px'
})

const canvasWidth = computed(() => props.viewport === 'mobile' ? '375px' : '100%')

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
}

function onDrop(e: DragEvent, parentId?: string) {
  e.preventDefault()
  e.stopPropagation()
  const compId = e.dataTransfer?.getData('component-id')
  if (compId) {
    // Drop position X/Y
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = Math.round(e.clientX - rect.left)
    const y = Math.round(e.clientY - rect.top)
    emit('drop', compId, parentId, x, y)
  }
}

// Internal drag (reorder)
const dragInsert = ref('')
let internalDragId = ''

function onInternalDragStart(e: DragEvent, id: string) {
  internalDragId = id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('internal-comp-id', id)
  }
}

function onInternalDragOver(e: DragEvent, targetId: string) {
  e.preventDefault()
  if (!internalDragId || internalDragId === targetId) return
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const midY = rect.top + rect.height / 2
  dragInsert.value = e.clientY < midY ? targetId + '-top' : targetId + '-bottom'
}

function onInternalDrop(e: DragEvent, targetId: string) {
  e.preventDefault()
  const sourceId = e.dataTransfer?.getData('internal-comp-id') || internalDragId
  if (!sourceId || sourceId === targetId) { dragInsert.value = ''; return }

  // Drop from palette
  const paletteCompId = e.dataTransfer?.getData('component-id')
  if (paletteCompId) {
    emit('drop', paletteCompId, getComponentDef(targetId)?.allowChildren ? targetId : undefined)
    dragInsert.value = ''
    return
  }

  // Internal reorder
  const isTop = dragInsert.value.endsWith('-top')
  emit('reorder', sourceId, isTop ? 'up' : 'down')
  dragInsert.value = ''
  internalDragId = ''
}

// Snap guidelines
const snapLines = ref<{ type: 'h' | 'v'; pos: number }[]>([])
const SNAP_THRESHOLD = 5

function getSnapTargets(excludeId: string): { x: number; y: number; cx: number; cy: number; r: number; b: number }[] {
  return props.components
    .filter(c => c.id !== excludeId && typeof c.props.x === 'number')
    .map(c => {
      const x = c.props.x as number
      const y = c.props.y as number
      const w = (c.props.w as number) || 200
      const h = (c.props.h as number) || 40
      return { x, y, cx: x + w / 2, cy: y + h / 2, r: x + w, b: y + h }
    })
}

function snapPosition(x: number, y: number, w: number, h: number, excludeId: string): { x: number; y: number } {
  const targets = getSnapTargets(excludeId)
  const lines: { type: 'h' | 'v'; pos: number }[] = []
  let sx = x, sy = y
  const cx = x + w / 2, r = x + w
  const cy = y + h / 2, b = y + h

  for (const t of targets) {
    // Vertical snap (X axis)
    if (Math.abs(x - t.x) < SNAP_THRESHOLD) { sx = t.x; lines.push({ type: 'v', pos: t.x }) }
    else if (Math.abs(r - t.r) < SNAP_THRESHOLD) { sx = t.r - w; lines.push({ type: 'v', pos: t.r }) }
    else if (Math.abs(cx - t.cx) < SNAP_THRESHOLD) { sx = t.cx - w / 2; lines.push({ type: 'v', pos: t.cx }) }
    else if (Math.abs(x - t.r) < SNAP_THRESHOLD) { sx = t.r; lines.push({ type: 'v', pos: t.r }) }
    else if (Math.abs(r - t.x) < SNAP_THRESHOLD) { sx = t.x - w; lines.push({ type: 'v', pos: t.x }) }

    // Horizontal snap (Y axis)
    if (Math.abs(y - t.y) < SNAP_THRESHOLD) { sy = t.y; lines.push({ type: 'h', pos: t.y }) }
    else if (Math.abs(b - t.b) < SNAP_THRESHOLD) { sy = t.b - h; lines.push({ type: 'h', pos: t.b }) }
    else if (Math.abs(cy - t.cy) < SNAP_THRESHOLD) { sy = t.cy - h / 2; lines.push({ type: 'h', pos: t.cy }) }
    else if (Math.abs(y - t.b) < SNAP_THRESHOLD) { sy = t.b; lines.push({ type: 'h', pos: t.b }) }
    else if (Math.abs(b - t.y) < SNAP_THRESHOLD) { sy = t.y - h; lines.push({ type: 'h', pos: t.y }) }
  }
  snapLines.value = lines
  return { x: sx, y: sy }
}

// Mouse drag movement
let dragMoveComp: any = null
let dragStartX = 0
let dragStartY = 0
let origX = 0
let origY = 0

function startDragMove(e: MouseEvent, comp: any) {
  if (props.viewMode) return
  // Initialize default values if x/y/w/h are missing
  if (typeof comp.props.x !== 'number') comp.props.x = 0
  if (typeof comp.props.y !== 'number') comp.props.y = 0
  if (typeof comp.props.w !== 'number') comp.props.w = 200
  if (typeof comp.props.h !== 'number') comp.props.h = 40
  dragMoveComp = comp
  dragStartX = e.clientX
  dragStartY = e.clientY
  origX = comp.props.x as number
  origY = comp.props.y as number
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragMoveEnd)
}

function onDragMove(e: MouseEvent) {
  if (!dragMoveComp) return
  const rawX = origX + (e.clientX - dragStartX)
  const rawY = origY + (e.clientY - dragStartY)
  const w = (dragMoveComp.props.w as number) || 200
  const h = (dragMoveComp.props.h as number) || 40
  const snapped = snapPosition(rawX, rawY, w, h, dragMoveComp.id)
  dragMoveComp.props.x = snapped.x
  dragMoveComp.props.y = snapped.y
}

function onDragMoveEnd() {
  dragMoveComp = null
  snapLines.value = []
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragMoveEnd)
}

// Resize
let resizeComp: any = null
let resizeDir = ''
let resizeStartX = 0
let resizeStartY = 0
let resizeOrigW = 0
let resizeOrigH = 0
let resizeOrigX = 0
let resizeOrigY = 0

function startResize(e: MouseEvent, comp: any, dir: string) {
  resizeComp = comp
  resizeDir = dir
  resizeStartX = e.clientX
  resizeStartY = e.clientY
  resizeOrigW = (comp.props.w as number) || 200
  resizeOrigH = (comp.props.h as number) || 40
  resizeOrigX = (comp.props.x as number) || 0
  resizeOrigY = (comp.props.y as number) || 0
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', onResizeEnd)
}

function onResize(e: MouseEvent) {
  if (!resizeComp) return
  const dx = e.clientX - resizeStartX
  const dy = e.clientY - resizeStartY

  if (resizeDir.includes('e')) resizeComp.props.w = Math.max(20, resizeOrigW + dx)
  if (resizeDir.includes('w')) { resizeComp.props.w = Math.max(20, resizeOrigW - dx); resizeComp.props.x = resizeOrigX + dx }
  if (resizeDir.includes('s')) resizeComp.props.h = Math.max(20, resizeOrigH + dy)
  if (resizeDir.includes('n')) { resizeComp.props.h = Math.max(20, resizeOrigH - dy); resizeComp.props.y = resizeOrigY + dy }
}

function onResizeEnd() {
  resizeComp = null
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', onResizeEnd)
}

function onInlineEdit(comp: any, key: string, e: Event) {
  const text = (e.target as HTMLElement).textContent || ''
  if (comp.props[key] !== text) comp.props[key] = text
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Delete' && props.selectedId) {
    emit('delete', props.selectedId)
  }
}

function renderStyle(comp: CanvasComponent): Record<string, string> {
  const p = comp.props
  const style: Record<string, string> = {}

  // Absolute positioning (when x/y are set)
  if (typeof p.x === 'number' && typeof p.y === 'number') {
    style.position = 'absolute'
    style.left = `${p.x}px`
    style.top = `${p.y}px`
  }
  if (typeof p.w === 'number' && p.w > 0) style.width = `${p.w}px`
  if (typeof p.h === 'number' && p.h > 0) style.height = `${p.h}px`

  if (p.padding) style.padding = `${p.padding}px`
  if (p.gap) style.gap = `${p.gap}px`
  if (p.direction === 'row') style.flexDirection = 'row'
  if (p.direction === 'column') style.flexDirection = 'column'
  if (p.height && typeof p.x !== 'number') style.height = `${p.height}px`
  if (p.width && typeof p.width === 'number' && typeof p.x !== 'number') style.width = `${p.width}px`
  if (p.maxWidth) style.maxWidth = `${p.maxWidth}px`
  if (p.borderRadius) style.borderRadius = `${p.borderRadius}px`
  if (p.margin) style.margin = `${p.margin}px 0`
  if (typeof p.zIndex === 'number') style.zIndex = String(p.zIndex)

  // CSS whitelist application
  if (p.css && typeof p.css === 'object') {
    const css = p.css as Record<string, string>
    for (const [k, v] of Object.entries(css)) {
      if (v) style[k] = v
    }
  }

  return style
}
</script>

<template>
  <div class="canvas-wrap" tabindex="0" @keydown="onKeydown">
    <div class="canvas-scroll-wrapper">
    <div class="canvas" :style="{ maxWidth: canvasWidth, minWidth: canvasMinWidth, minHeight: canvasMinHeight }" @dragover="onDragOver" @drop="onDrop($event)">
      <div v-if="!components.length && !viewMode" class="canvas-empty">Drag components from the palette on the left<br/><small>Shift/Cmd+click for multi-select | Right-click for menu</small></div>
      <div v-if="!components.length" class="canvas-empty" @dragover="onDragOver" @drop="onDrop($event)">
        Drag and drop components to place them
      </div>

      <template v-for="comp in components" :key="comp.id">
        <div
          class="canvas-comp"
          :class="{ selected: selectedId === comp.id && !viewMode, 'has-children': getComponentDef(comp.componentType)?.allowChildren, 'view-mode': viewMode, 'drag-over-top': dragInsert === comp.id + '-top', 'drag-over-bottom': dragInsert === comp.id + '-bottom' }"
          :style="renderStyle(comp)"
          :draggable="!viewMode"
          @click.stop="emit('select', comp.id, $event)"
          @mousedown.stop="!comp.props.locked && !$event.shiftKey && !$event.metaKey && !$event.ctrlKey && startDragMove($event, comp)"
          @dragstart.stop="onInternalDragStart($event, comp.id)"
          @dragover.stop="onInternalDragOver($event, comp.id)"
          @dragleave.stop="dragInsert = ''"
          @drop.stop="onInternalDrop($event, comp.id)"
        >
          <div v-if="!viewMode" class="comp-label">{{ getComponentDef(comp.componentType)?.icon }} {{ getComponentDef(comp.componentType)?.name }}</div>

          <!-- Component rendering -->
          <div v-if="comp.componentType === 'page-title'" class="render-title" :contenteditable="!viewMode && selectedId === comp.id" @blur="onInlineEdit(comp, 'text', $event)">{{ comp.props.text }}</div>
          <div v-else-if="comp.componentType === 'text'" class="render-text" :style="{ fontSize: comp.props.size + 'px', color: comp.props.color as string }" :contenteditable="!viewMode && selectedId === comp.id" @blur="onInlineEdit(comp, 'text', $event)">{{ comp.props.text }}</div>
          <div v-else-if="comp.componentType === 'button'" class="render-button" :class="'btn--' + comp.props.variant" :style="{ cursor: comp.props.onClick ? 'pointer' : 'default' }" @click.stop="comp.props.onClick && viewMode && $router?.push(comp.props.onClick as string)">{{ comp.props.text }}</div>
          <input v-else-if="comp.componentType === 'text-field'" class="render-input" :placeholder="comp.props.placeholder as string" disabled />
          <div v-else-if="comp.componentType === 'data-grid'" class="render-grid">
            <div class="grid-header"><span v-for="col in (comp.props.columns as string[])" :key="col">{{ col }}</span></div>
            <div v-for="i in (comp.props.rows as number)" :key="i" class="grid-row"><span v-for="col in (comp.props.columns as string[])" :key="col">—</span></div>
          </div>
          <div v-else-if="comp.componentType === 'chart'" class="render-chart">📊 {{ comp.props.title }}</div>
          <div v-else-if="comp.componentType === 'alert'" class="render-alert" :class="'alert--' + comp.props.type">{{ comp.props.message }}</div>
          <div v-else-if="comp.componentType === 'divider'" class="render-divider" />
          <div v-else-if="comp.componentType === 'spacer'" :style="{ height: comp.props.height + 'px' }" />
          <div v-else-if="comp.componentType === 'label'" class="render-label">{{ comp.props.text }}</div>
          <label v-else-if="comp.componentType === 'checkbox'" class="render-check">
            <input type="checkbox" :checked="comp.props.checked as boolean" disabled /> {{ comp.props.label }}
          </label>
          <div v-else-if="comp.componentType === 'date-picker'" class="render-datepicker">
            <span class="dp-label">{{ comp.props.label }}</span>
            <input type="date" class="dp-input" disabled />
          </div>
          <div v-else-if="comp.componentType === 'pagination'" class="render-pagination">
            <button class="pg-btn" disabled>&lt;</button>
            <button v-for="p in Math.min(comp.props.totalPages as number || 5, 7)" :key="p" class="pg-btn" :class="{ 'pg-active': p === (comp.props.current as number || 1) }" disabled>{{ p }}</button>
            <button class="pg-btn" disabled>&gt;</button>
          </div>
          <div v-else-if="comp.componentType === 'switch'" class="render-switch">
            <span>{{ comp.props.label }}</span>
            <span class="switch-track" :class="{ 'switch-on': comp.props.checked }"><span class="switch-thumb" /></span>
          </div>
          <div v-else-if="comp.componentType === 'card'" class="render-card">
            <img v-if="comp.props.imageUrl" :src="comp.props.imageUrl as string" class="card-image" />
            <div class="card-title">{{ comp.props.title }}</div>
            <div class="card-content">{{ comp.props.content }}</div>
          </div>
          <div v-else-if="comp.componentType === 'sidebar'" class="render-sidebar">
            <div v-for="(item, idx) in (comp.props.menuItems as any[] || [])" :key="idx" class="sidebar-item" @click.stop="item.link && $router?.push(item.link)">
              <span class="sidebar-icon">{{ item.icon }}</span>
              <span class="sidebar-text">{{ item.text }}</span>
            </div>
          </div>
          <div v-else class="render-placeholder">{{ comp.props.text || comp.props.title || comp.componentType }}</div>

          <!-- Children -->
          <template v-if="comp.children?.length">
            <MockupCanvas
              :components="comp.children"
              :selected-id="selectedId"
              :viewport="viewport"
              :view-mode="viewMode"
              @select="(id: string, ev: MouseEvent) => emit('select', id, ev)"
              @drop="emit('drop', $event, comp.id)"
              @delete="emit('delete', $event)"
            />
          </template>

          <!-- Lock indicator -->
          <div v-if="comp.props.locked && !viewMode" class="lock-indicator">🔒</div>
          <!-- Resize handles + delete -->
          <template v-if="selectedId === comp.id && !viewMode && !comp.props.locked">
            <div class="resize-handle rh-n" @mousedown.stop.prevent="startResize($event, comp, 'n')" />
            <div class="resize-handle rh-s" @mousedown.stop.prevent="startResize($event, comp, 's')" />
            <div class="resize-handle rh-e" @mousedown.stop.prevent="startResize($event, comp, 'e')" />
            <div class="resize-handle rh-w" @mousedown.stop.prevent="startResize($event, comp, 'w')" />
            <div class="resize-handle rh-ne" @mousedown.stop.prevent="startResize($event, comp, 'ne')" />
            <div class="resize-handle rh-nw" @mousedown.stop.prevent="startResize($event, comp, 'nw')" />
            <div class="resize-handle rh-se" @mousedown.stop.prevent="startResize($event, comp, 'se')" />
            <div class="resize-handle rh-sw" @mousedown.stop.prevent="startResize($event, comp, 'sw')" />
          </template>
          <div v-if="selectedId === comp.id && !viewMode" class="comp-controls">
            <button class="comp-delete" @click.stop="emit('delete', comp.id)">✕</button>
          </div>
        </div>
      </template>
    <!-- Snap lines -->
    <div v-for="(line, idx) in snapLines" :key="idx" class="snap-line" :class="line.type === 'h' ? 'snap-h' : 'snap-v'" :style="line.type === 'h' ? { top: line.pos + 'px' } : { left: line.pos + 'px' }" />
    </div>
    </div>
  </div>
</template>

<style scoped>
.canvas-wrap { flex: 1; overflow: auto; padding: 16px; background: #f8f9fa; min-height: 300px; }
.canvas-scroll-wrapper { overflow: auto; flex: 1; }
.canvas-empty { display: flex; align-items: center; justify-content: center; height: 200px; color: #9ca3af; font-size: 14px; }
.snap-line { position: absolute; z-index: 9999; pointer-events: none; }
.snap-h { left: 0; right: 0; height: 1px; background: #f43f5e; }
.snap-v { top: 0; bottom: 0; width: 1px; background: #f43f5e; }
.canvas { margin: 0 auto; min-height: 400px; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); padding: 16px; display: flex; flex-direction: column; gap: 4px; position: relative; }
.canvas-empty { display: flex; align-items: center; justify-content: center; height: 200px; color: #9ca3af; font-size: 14px; border: 2px dashed #d1d5db; border-radius: 8px; }
.canvas-comp { position: relative; border: 1px solid transparent; border-radius: 4px; padding: 0; transition: all 0.1s; display: flex; flex-direction: column; box-sizing: border-box; }
.canvas-comp > * { flex: 1; }
.lock-indicator { position: absolute; top: 2px; left: 2px; font-size: 12px; opacity: 0.5; z-index: 5; pointer-events: none; }
.render-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
.card-image { width: 100%; height: 120px; object-fit: cover; }
.card-title { font-size: 14px; font-weight: 700; padding: 8px 12px 4px; }
.card-content { font-size: 12px; color: #6b7280; padding: 0 12px 12px; line-height: 1.5; }
.render-sidebar { background: #1e293b; border-radius: 8px; padding: 8px 0; min-height: 200px; width: 100%; height: 100%; box-sizing: border-box; }
.sidebar-item { display: flex; align-items: center; gap: 8px; padding: 8px 16px; color: #cbd5e1; font-size: 13px; cursor: pointer; transition: background 0.15s; }
.sidebar-item:hover { background: rgba(255,255,255,0.1); color: #fff; }
.sidebar-icon { font-size: 16px; }
.sidebar-text { font-weight: 500; }
.canvas-comp:hover { border-color: #93c5fd; }
.canvas-comp.view-mode { border: none !important; padding: 2px 0; outline: none !important; }
.canvas-comp.view-mode:hover { border-color: transparent !important; box-shadow: none; }
.canvas-comp.view-mode { cursor: pointer; }
.canvas-comp.view-mode.selected { outline: 2px solid rgba(59,130,246,0.3) !important; border-radius: 4px; background: rgba(59,130,246,0.04); }
.canvas-comp.selected { border-color: #3b82f6; outline: 2px solid rgba(59,130,246,0.3); }
.canvas-comp.has-children { min-height: 40px; }
.comp-label { font-size: 10px; color: #9ca3af; margin-bottom: 2px; }
.canvas-comp.drag-over-top { border-top: 2px solid #3b82f6 !important; }
.canvas-comp.drag-over-bottom { border-bottom: 2px solid #3b82f6 !important; }
.resize-handle { position: absolute; width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; z-index: 10; }
.rh-n { top: -4px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
.rh-s { bottom: -4px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
.rh-e { right: -4px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
.rh-w { left: -4px; top: 50%; transform: translateY(-50%); cursor: w-resize; }
.rh-ne { top: -4px; right: -4px; cursor: ne-resize; }
.rh-nw { top: -4px; left: -4px; cursor: nw-resize; }
.rh-se { bottom: -4px; right: -4px; cursor: se-resize; }
.rh-sw { bottom: -4px; left: -4px; cursor: sw-resize; }
.comp-controls { position: absolute; top: -10px; right: -10px; display: flex; gap: 2px; }
.comp-delete { width: 20px; height: 20px; border-radius: 50%; background: #ef4444; color: #fff; border: none; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

/* Rendering */
.render-title { font-size: 24px; font-weight: 700; }
.render-text { line-height: 1.5; }
.render-button { display: inline-block; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; }
.btn--primary { background: #3b82f6; color: #fff; }
.btn--secondary { background: #e5e7eb; color: #333; }
.btn--danger { background: #ef4444; color: #fff; }
.btn--ghost { background: transparent; color: #3b82f6; border: 1px solid #3b82f6; }
.render-input { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; font-size: 13px; width: 100%; box-sizing: border-box; }
.render-grid { border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden; font-size: 12px; }
.grid-header { display: flex; background: #f8f9fa; font-weight: 600; }
.grid-header span, .grid-row span { flex: 1; padding: 6px 8px; border-right: 1px solid #e5e7eb; }
.grid-row { display: flex; border-top: 1px solid #e5e7eb; }
.render-chart { background: #f0f4ff; border-radius: 6px; padding: 24px; text-align: center; color: #6b7280; }
.render-alert { padding: 8px 12px; border-radius: 6px; font-size: 13px; }
.alert--info { background: #dbeafe; color: #1d4ed8; }
.alert--warning { background: #fef3c7; color: #d97706; }
.alert--error { background: #fef2f2; color: #dc2626; }
.alert--success { background: #dcfce7; color: #16a34a; }
.render-divider { height: 1px; background: #e5e7eb; margin: 8px 0; }
.render-label { font-size: 12px; color: #6b7280; font-weight: 500; }
.render-check { font-size: 13px; display: flex; align-items: center; gap: 6px; }
.render-datepicker { display: flex; flex-direction: column; gap: 4px; }
.dp-label { font-size: 12px; color: #6b7280; }
.dp-input { border: 1px solid #d1d5db; border-radius: 6px; padding: 6px 8px; font-size: 13px; }
.render-pagination { display: flex; gap: 4px; }
.pg-btn { width: 28px; height: 28px; border: 1px solid #d1d5db; border-radius: 4px; background: #fff; font-size: 12px; display: flex; align-items: center; justify-content: center; }
.pg-active { background: #3b82f6; color: #fff; border-color: #3b82f6; }
.render-switch { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.switch-track { width: 36px; height: 20px; background: #d1d5db; border-radius: 10px; position: relative; display: inline-block; }
.switch-on { background: #3b82f6; }
.switch-thumb { width: 16px; height: 16px; background: #fff; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: left 0.2s; }
.switch-on .switch-thumb { left: 18px; }
.render-placeholder { color: #9ca3af; font-size: 12px; padding: 8px; background: #f9fafb; border-radius: 4px; }
</style>
