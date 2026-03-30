<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet } from '@/composables/useTurso'

interface Memo { id: number; content: string; status: string; created_by: string }
interface Relation { id: number; source_memo_id: number; target_memo_id: number; relation_type: string }

const props = defineProps<{ memos: Memo[] }>()
const router = useRouter()

const allRelations = ref<Relation[]>([])

async function loadAllRelations() {
  // Batch-load relations for recent 20 memos
  const recent = props.memos.slice(0, 20)
  const results: Relation[] = []
  for (const m of recent) {
    const { data } = await apiGet<{ relations: Relation[] }>(`/api/v2/memos/${m.id}/relations`)
    if (data?.relations) results.push(...data.relations)
  }
  // Deduplicate
  const seen = new Set<number>()
  allRelations.value = results.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true })
}

const nodes = computed(() => {
  const ids = new Set<number>()
  for (const r of allRelations.value) { ids.add(r.source_memo_id); ids.add(r.target_memo_id) }
  return props.memos.filter(m => ids.has(m.id)).map((m, i) => ({
    ...m,
    x: 80 + (i % 5) * 140,
    y: 60 + Math.floor(i / 5) * 100,
    title: m.content.split('\n')[0].slice(0, 30),
  }))
})

const edges = computed(() => {
  return allRelations.value.map(r => {
    const s = nodes.value.find(n => n.id === r.source_memo_id)
    const t = nodes.value.find(n => n.id === r.target_memo_id)
    if (!s || !t) return null
    return { id: r.id, x1: s.x + 60, y1: s.y + 20, x2: t.x + 60, y2: t.y + 20, type: r.relation_type }
  }).filter(Boolean) as { id: number; x1: number; y1: number; x2: number; y2: number; type: string }[]
})

const svgWidth = computed(() => Math.max(700, ...nodes.value.map(n => n.x + 140)))
const svgHeight = computed(() => Math.max(300, ...nodes.value.map(n => n.y + 80)))

const statusColors: Record<string, string> = { open: '#3b82f6', resolved: '#22c55e', 'request-changes': '#f59e0b' }

onMounted(loadAllRelations)
</script>

<template>
  <div class="memo-graph">
    <svg :width="svgWidth" :height="svgHeight">
      <!-- edges -->
      <line v-for="e in edges" :key="e.id" :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2" stroke="#d1d5db" stroke-width="2" />
      <!-- nodes -->
      <g v-for="n in nodes" :key="n.id" @click="router.push({ query: { memo: String(n.id) } })" style="cursor:pointer">
        <rect :x="n.x" :y="n.y" width="120" height="40" rx="8" :fill="statusColors[n.status] || '#e5e7eb'" opacity="0.15" stroke="#d1d5db" />
        <text :x="n.x + 60" :y="n.y + 16" text-anchor="middle" font-size="11" font-weight="600" fill="#374151">#{{ n.id }}</text>
        <text :x="n.x + 60" :y="n.y + 30" text-anchor="middle" font-size="9" fill="#6b7280">{{ n.title }}</text>
      </g>
    </svg>
    <div v-if="!nodes.length" class="graph-empty">No connected memos found.</div>
  </div>
</template>

<style scoped>
.memo-graph { overflow-x: auto; padding: 12px; background: #fafafa; border-radius: 8px; margin: 12px 0; }
.graph-empty { color: #9ca3af; text-align: center; padding: 24px; font-size: 13px; }
@media (max-width: 767px) { .btn { min-height: 44px; } input, select { min-height: 44px; font-size: 16px; } }
</style>
