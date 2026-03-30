<script setup lang="ts">
import { computed, ref } from 'vue'
import { getComponentDef } from './componentCatalog'
interface CanvasComponent { id: string; componentType: string; props: Record<string, unknown>; children: CanvasComponent[] }

const props = defineProps<{
  selected: CanvasComponent | null
  pageTitle: string
  pageDescription: string
}>()

const emit = defineEmits<{
  'update-prop': [key: string, value: unknown]
  'update-spec': [desc: string]
  'update-page-title': [title: string]
  'update-page-desc': [desc: string]
}>()

const CSS_WHITELIST = [
  'backgroundColor', 'color', 'fontSize', 'fontWeight',
  'borderRadius', 'border', 'borderColor',
  'padding', 'margin', 'gap', 'opacity', 'boxShadow',
  'width', 'height', 'minWidth', 'minHeight', 'maxWidth',
  'textAlign', 'display', 'flexDirection', 'justifyContent', 'alignItems', 'overflow',
]

const LAYOUT_CSS = ['display', 'flexDirection', 'justifyContent', 'alignItems', 'gap', 'overflow']
const TEXT_CSS = ['textAlign', 'fontSize', 'fontWeight', 'color']

function getRelevantCss(): string[] {
  const type = props.selected?.componentType || ''
  const def = getComponentDef(type)
  if (def?.allowChildren) return CSS_WHITELIST // Container: all properties
  if (['button', 'text', 'page-title', 'label'].includes(type)) return [...TEXT_CSS, 'backgroundColor', 'borderRadius', 'border', 'borderColor', 'padding', 'margin', 'opacity', 'boxShadow', 'width', 'height', 'minWidth', 'minHeight', 'maxWidth']
  return CSS_WHITELIST.filter(k => !LAYOUT_CSS.includes(k)) // Default: exclude layout
}

// Show only currently active CSS properties
const activeCssProps = computed(() => {
  const css = (props.selected?.props.css as Record<string, string>) || {}
  return Object.keys(css).filter(k => CSS_WHITELIST.includes(k))
})

const availableCssProps = computed(() => {
  const active = new Set(activeCssProps.value)
  return getRelevantCss().filter(k => !active.has(k))
})

const addCssPropKey = ref('')

function addCssProp() {
  if (!addCssPropKey.value) return
  setCssProp(addCssPropKey.value, '')
  addCssPropKey.value = ''
}

function removeCssProp(key: string) {
  const css = { ...((props.selected?.props.css as Record<string, string>) || {}) }
  delete css[key]
  emit('update-prop', 'css', css)
}

function getCssProp(key: string): string {
  const css = (props.selected?.props.css as Record<string, string>) || {}
  return css[key] || ''
}

function setCssProp(key: string, value: string) {
  const css = { ...((props.selected?.props.css as Record<string, string>) || {}), [key]: value }
  if (value === undefined) delete css[key]
  emit('update-prop', 'css', css)
}

function updateMenuItem(idx: number, field: string, value: string) {
  const items = [...((props.selected?.props.menuItems as any[]) || [])]
  items[idx] = { ...items[idx], [field]: value }
  emit('update-prop', 'menuItems', items)
}

function removeMenuItem(idx: number) {
  const items = [...((props.selected?.props.menuItems as any[]) || [])]
  items.splice(idx, 1)
  emit('update-prop', 'menuItems', items)
}

function addMenuItem() {
  const items = [...((props.selected?.props.menuItems as any[]) || []), { text: '', icon: '📄', link: '' }]
  emit('update-prop', 'menuItems', items)
}

const compDef = computed(() => props.selected ? getComponentDef(props.selected.componentType) : null)

const SYSTEM_KEYS = ['css', 'menuItems', 'x', 'y', 'w', 'h', 'locked', 'specDescription', 'zIndex', 'onClick']

const editableProps = computed(() => {
  if (!props.selected) return []
  const p = props.selected.props
  return Object.entries(p).filter(([key]) => !SYSTEM_KEYS.includes(key)).map(([key, val]) => ({
    key,
    value: val,
    type: typeof val === 'boolean' ? 'boolean'
      : typeof val === 'number' ? 'number'
      : Array.isArray(val) ? 'array'
      : key.includes('color') ? 'color'
      : key.includes('variant') || key.includes('type') || key.includes('level') ? 'select'
      : 'text',
  }))
})

function getSelectOptions(key: string): string[] {
  if (key === 'variant') return ['primary', 'secondary', 'danger', 'ghost']
  if (key === 'type') return ['info', 'warning', 'error', 'success']
  if (key === 'level') return ['h1', 'h2', 'h3']
  if (key === 'direction') return ['column', 'row']
  if (key === 'position') return ['left', 'right']
  if (key === 'size') return ['sm', 'md', 'lg']
  return []
}
</script>

<template>
  <div class="prop-panel">
    <!-- Component selected -->
    <template v-if="selected">
      <div class="panel-section">
        <div class="panel-title">{{ compDef?.icon }} {{ compDef?.name }}</div>

        <div v-for="p in editableProps" :key="p.key" class="prop-row">
          <label class="prop-label">{{ p.key }}</label>

          <input v-if="p.type === 'text'" class="prop-input" :value="p.value" @input="emit('update-prop', p.key, ($event.target as HTMLInputElement).value)" />
          <input v-else-if="p.type === 'number'" class="prop-input" type="number" :value="p.value" @input="emit('update-prop', p.key, Number(($event.target as HTMLInputElement).value))" />
          <input v-else-if="p.type === 'color'" class="prop-color" type="color" :value="p.value" @input="emit('update-prop', p.key, ($event.target as HTMLInputElement).value)" />
          <label v-else-if="p.type === 'boolean'" class="prop-toggle">
            <input type="checkbox" :checked="p.value as boolean" @change="emit('update-prop', p.key, ($event.target as HTMLInputElement).checked)" />
          </label>
          <select v-else-if="p.type === 'select'" class="prop-input" :value="p.value" @change="emit('update-prop', p.key, ($event.target as HTMLSelectElement).value)">
            <option v-for="opt in getSelectOptions(p.key)" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <div v-else-if="p.key === 'menuItems' && Array.isArray(p.value)" class="menu-editor">
            <div v-for="(item, idx) in (p.value as any[])" :key="idx" class="menu-item-row">
              <input class="prop-input menu-input" :value="item.icon" @input="updateMenuItem(idx, 'icon', ($event.target as HTMLInputElement).value)" style="width:30px" />
              <input class="prop-input menu-input" :value="item.text" @input="updateMenuItem(idx, 'text', ($event.target as HTMLInputElement).value)" placeholder="Name" />
              <input class="prop-input menu-input" :value="item.link" @input="updateMenuItem(idx, 'link', ($event.target as HTMLInputElement).value)" placeholder="Link" style="width:60px" />
              <button class="css-remove" @click="removeMenuItem(idx)">✕</button>
            </div>
            <button class="css-add-btn" @click="addMenuItem" style="margin-top:4px">+ Item</button>
          </div>
          <span v-else-if="p.type === 'array'" class="prop-muted">{{ (p.value as string[]).join(', ') }}</span>
        </div>
      </div>

      <!-- Spec description -->
      <div class="panel-section">
        <div class="panel-subtitle">Spec Description</div>
        <textarea class="spec-textarea" :value="selected.props.specDescription as string || ''" @input="emit('update-spec', ($event.target as HTMLTextAreaElement).value)" placeholder="Role/function of this component..." rows="4" />
      </div>

      <!-- CSS editing -->
      <div class="panel-section">
        <div class="panel-subtitle">CSS Styles</div>
        <div v-for="cssProp in activeCssProps" :key="cssProp" class="prop-row css-row">
          <label class="prop-label">{{ cssProp }}</label>
          <div class="css-input-wrap">
            <input class="prop-input css-val" :value="getCssProp(cssProp)" @input="setCssProp(cssProp, ($event.target as HTMLInputElement).value)" :type="cssProp.includes('color') || cssProp.includes('Color') ? 'color' : 'text'" />
            <button class="css-remove" @click="removeCssProp(cssProp)" title="Remove">✕</button>
          </div>
        </div>
        <div class="css-add-row">
          <select v-model="addCssPropKey" class="prop-input css-select">
            <option value="">+ Add property</option>
            <option v-for="k in availableCssProps" :key="k" :value="k">{{ k }}</option>
          </select>
          <button v-if="addCssPropKey" class="css-add-btn" @click="addCssProp">Add</button>
        </div>
      </div>
    </template>

    <!-- No selection -> page meta -->
    <template v-else>
      <div class="panel-section">
        <div class="panel-title">Page Settings</div>
        <div class="prop-row">
          <label class="prop-label">Title</label>
          <input class="prop-input" :value="pageTitle" @input="emit('update-page-title', ($event.target as HTMLInputElement).value)" />
        </div>
        <div class="prop-row">
          <label class="prop-label">Description</label>
          <textarea class="spec-textarea" :value="pageDescription" @input="emit('update-page-desc', ($event.target as HTMLTextAreaElement).value)" rows="4" placeholder="Overall page description..." />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.prop-panel { width: 260px; min-width: 260px; border-left: 1px solid var(--border, #e5e7eb); padding: 12px; overflow-y: auto; height: 100%; flex-shrink: 0; }
.panel-section { margin-bottom: 16px; }
.panel-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
.panel-subtitle { font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 8px; }
.prop-row { margin-bottom: 8px; }
.prop-label { display: block; font-size: 11px; font-weight: 500; color: #6b7280; margin-bottom: 2px; }
.prop-input { width: 100%; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 6px; font-size: 12px; box-sizing: border-box; }
.prop-color { width: 100%; height: 28px; border: 1px solid #d1d5db; border-radius: 4px; cursor: pointer; }
.prop-muted { font-size: 11px; color: #9ca3af; }
.spec-textarea { width: 100%; border: 1px solid #d1d5db; border-radius: 4px; padding: 6px; font-size: 12px; resize: vertical; box-sizing: border-box; }
.css-row { position: relative; }
.css-input-wrap { display: flex; gap: 4px; align-items: center; }
.css-val { flex: 1; }
.css-remove { border: none; background: none; color: #ef4444; font-size: 12px; cursor: pointer; padding: 2px; }
.css-add-row { display: flex; gap: 4px; margin-top: 4px; }
.css-select { flex: 1; }
.css-add-btn { border: none; background: #3b82f6; color: #fff; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer; }
.menu-editor { margin-top: 4px; }
.menu-item-row { display: flex; gap: 2px; align-items: center; margin-bottom: 3px; }
.menu-input { font-size: 11px; padding: 2px 4px; }
</style>
