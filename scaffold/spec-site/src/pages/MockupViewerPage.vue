<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet } from '@/composables/useTurso'
import SplitPaneLayout from '@/layouts/SplitPaneLayout.vue'
import MockupShell from '@/components/MockupShell.vue'
import MockupCanvas from '@/mockup/MockupCanvas.vue'
import { provideViewport } from '@/composables/useViewport'
import { provideActiveSection } from '@/composables/useActiveSection'
import { renderMarkdown } from '@/utils/markdown'
import { getComponentDef } from '@/mockup/componentCatalog'
import { useScenarios } from '@/mockup/useScenarios'

const { setMode } = provideViewport()
const { activeSection } = provideActiveSection()

const route = useRoute()
const router = useRouter()
const slug = computed(() => route.params.slug as string)

interface CanvasComponent {
  id: string; componentType: string; props: Record<string, unknown>; children: CanvasComponent[]
}

const components = ref<CanvasComponent[]>([])
const pageTitle = ref('')
const viewport = ref<'mobile' | 'desktop'>('desktop')
const loading = ref(true)
const selectedId = ref<string | null>(null)

// Scenarios
const token = localStorage.getItem('spec-auth-token') || ''
const { scenarios, activeScenarioId, overrides, fetchScenarios, selectScenario } = useScenarios(slug.value, token)

// Section tabs
const sections = computed(() => {
  const cats = new Set<string>()
  cats.add('All')
  for (const c of components.value) {
    const def = getComponentDef(c.componentType)
    if (def?.category) cats.add(def.category)
  }
  return Array.from(cats)
})

const activeTab = ref('All')

const filteredComponents = computed(() => {
  if (activeTab.value === 'All') return components.value
  return components.value.filter(c => {
    const def = getComponentDef(c.componentType)
    return def?.category === activeTab.value
  })
})

// Selected component spec
const selectedComp = computed(() => {
  if (!selectedId.value) return null
  return findComponent(components.value, selectedId.value)
})

const specTitle = computed(() => {
  if (!selectedComp.value) return ''
  const def = getComponentDef(selectedComp.value.componentType)
  return `${def?.icon || ''} ${def?.name || selectedComp.value.componentType}`
})

const specDescription = computed(() => {
  if (!selectedComp.value) return ''
  return (selectedComp.value.props.specDescription as string) || ''
})

function findComponent(list: CanvasComponent[], id: string): CanvasComponent | null {
  for (const c of list) {
    if (c.id === id) return c
    const found = findComponent(c.children || [], id)
    if (found) return found
  }
  return null
}

function onSelect(id: string) {
  selectedId.value = id
}

function copySpec() {
  if (specDescription.value) {
    navigator.clipboard.writeText(specDescription.value)
    alert('Spec copied')
  }
}

onMounted(async () => {
  fetchScenarios()
  const { data } = await apiGet(`/api/v2/mockups/${slug.value}`)
  if (data?.page) {
    pageTitle.value = (data.page as any).title || slug.value
    viewport.value = (data.page as any).viewport === 'mobile' ? 'mobile' : 'desktop'
  }
  if (data?.components) {
    components.value = buildTree(data.components as any[])
  }
  loading.value = false
  if (viewport.value === 'mobile') setMode('mobile')
})

function buildTree(flat: any[]): CanvasComponent[] {
  const map = new Map<number, CanvasComponent>()
  const roots: CanvasComponent[] = []
  for (const f of flat) {
    map.set(f.id, { id: `c-${f.id}`, componentType: f.component_type, props: JSON.parse(f.props || '{}'), children: [] })
  }
  for (const f of flat) {
    const comp = map.get(f.id)!
    if (f.parent_id && map.has(f.parent_id)) map.get(f.parent_id)!.children.push(comp)
    else roots.push(comp)
  }
  return roots
}
</script>

<template>
  <div v-if="loading" style="text-align:center; padding:60px; color:#888;">Loading...</div>

  <SplitPaneLayout v-else :spec-areas="[]">
    <template #mockup>
      <div class="viewer-toolbar">
        <h2>{{ pageTitle }}</h2>
        <button class="styled-btn styled-btn--secondary" @click="router.push(`/mockup-editor/${slug}`)">Edit</button>
        <select v-if="scenarios.length" class="scenario-select" :value="activeScenarioId || ''" @change="selectScenario(($event.target as HTMLSelectElement).value ? Number(($event.target as HTMLSelectElement).value) : null)">
          <option value="">Default</option>
          <option v-for="s in scenarios" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <button class="styled-btn styled-btn--ghost" @click="router.push('/mockups')">List</button>
      </div>
      <div class="section-tabs">
        <button v-for="sec in sections" :key="sec" class="tab-btn" :class="{ active: activeTab === sec }" @click="activeTab = sec">{{ sec }}</button>
      </div>
      <MockupShell>
        <MockupCanvas
          :components="filteredComponents"
          :selected-id="selectedId"
          :viewport="viewport"
          :view-mode="true"
          @select="onSelect"
        />
      </MockupShell>
    </template>

    <template #spec>
      <div class="spec-panel-v2">
        <template v-if="selectedComp">
          <div class="spec-header">
            <span class="spec-comp-name">{{ specTitle }}</span>
            <span class="spec-comp-type">{{ selectedComp.componentType }}</span>
          </div>
          <div v-if="specDescription" class="spec-body" v-html="renderMarkdown(specDescription)"></div>
          <div v-else class="spec-empty">No spec description. Add one in the editor.</div>
          <div class="spec-actions">
            <button v-if="specDescription" class="styled-btn styled-btn--ghost" @click="copySpec">Copy</button>
          </div>
        </template>
        <div v-else class="spec-guide">
          <p>Click a component to view its spec.</p>
        </div>
      </div>
    </template>
  </SplitPaneLayout>
</template>

<style scoped>
.viewer-toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-bottom: 1px solid var(--border, #e5e7eb); }
.viewer-toolbar h2 { font-size: 16px; font-weight: 600; flex: 1; }
.styled-btn { border: none; border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
.styled-btn--secondary { background: #f3f4f6; color: #374151; }
.styled-btn--secondary:hover { background: #e5e7eb; }
.styled-btn--ghost { background: none; color: #6b7280; }
.styled-btn--ghost:hover { background: #f9fafb; }

.section-tabs { display: flex; gap: 4px; padding: 4px 16px; border-bottom: 1px solid var(--border, #e5e7eb); overflow-x: auto; }
.tab-btn { border: none; background: none; padding: 6px 12px; font-size: 13px; color: #6b7280; cursor: pointer; border-radius: 6px; white-space: nowrap; }
.tab-btn.active { background: #3b82f6; color: #fff; }
.tab-btn:hover:not(.active) { background: #f3f4f6; }

.scenario-select { border: 1px solid #d1d5db; border-radius: 6px; padding: 4px 8px; font-size: 12px; }
.search-input { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 14px; margin-bottom: 12px; box-sizing: border-box; }
.spec-panel-v2 { padding: 20px; height: 100%; overflow-y: auto; }
.spec-header { margin-bottom: 16px; }
.spec-comp-name { font-size: 16px; font-weight: 700; display: block; }
.spec-comp-type { font-size: 12px; color: #9ca3af; }
.spec-body { font-size: 14px; line-height: 1.7; color: var(--text-primary, #1c1c1e); }
.spec-body :deep(h1) { font-size: 18px; font-weight: 700; margin: 16px 0 8px; }
.spec-body :deep(h2) { font-size: 16px; font-weight: 600; margin: 12px 0 6px; }
.spec-body :deep(code) { background: #f1f3f5; padding: 1px 4px; border-radius: 3px; font-size: 12px; }
.spec-body :deep(ul) { padding-left: 16px; }
.spec-empty { color: #9ca3af; font-size: 13px; font-style: italic; }
.spec-actions { margin-top: 16px; }
.spec-guide { display: flex; align-items: center; justify-content: center; height: 100%; color: #9ca3af; font-size: 14px; }
</style>
