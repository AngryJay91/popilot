<script setup lang="ts">
import { ref, computed } from 'vue'
import { COMPONENT_CATALOG, CATEGORIES, type ComponentDef } from './componentCatalog'

const emit = defineEmits<{ add: [comp: ComponentDef] }>()
const searchQuery = ref('')
const expandedCategory = ref<string | null>(CATEGORIES[0])

const filtered = computed(() => {
  if (!searchQuery.value) return COMPONENT_CATALOG
  const q = searchQuery.value.toLowerCase()
  return COMPONENT_CATALOG.filter(c => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
})

function groupedByCategory() {
  const groups: Record<string, ComponentDef[]> = {}
  for (const c of filtered.value) {
    if (!groups[c.category]) groups[c.category] = []
    groups[c.category].push(c)
  }
  return groups
}
</script>

<template>
  <div class="palette">
    <div class="palette-header">Components</div>
    <input v-model="searchQuery" class="palette-search" placeholder="Search..." />

    <div v-for="(comps, cat) in groupedByCategory()" :key="cat" class="palette-group">
      <div class="palette-category" @click="expandedCategory = expandedCategory === cat ? null : cat">
        {{ expandedCategory === cat ? '▾' : '▸' }} {{ cat }}
      </div>
      <div v-if="expandedCategory === cat || searchQuery" class="palette-items">
        <div
          v-for="c in comps"
          :key="c.id"
          class="palette-item"
          draggable="true"
          @dragstart="$event.dataTransfer?.setData('component-id', c.id)"
          @click="emit('add', c)"
        >
          <span class="palette-icon">{{ c.icon }}</span>
          <span class="palette-name">{{ c.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.palette { padding: 12px; overflow-y: auto; flex: 1; }
.palette-header { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
.palette-search { width: 100%; border: 1px solid rgba(0,0,0,0.1); border-radius: 6px; padding: 6px 8px; font-size: 12px; margin-bottom: 8px; box-sizing: border-box; }
.palette-category { font-size: 12px; font-weight: 600; color: #6b7280; padding: 4px 0; cursor: pointer; }
.palette-items { padding-left: 4px; }
.palette-item { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 6px; cursor: grab; font-size: 12px; transition: background 0.1s; }
.palette-item:hover { background: #f3f4f6; }
.palette-icon { font-size: 14px; }
.palette-name { color: #374151; }
</style>
