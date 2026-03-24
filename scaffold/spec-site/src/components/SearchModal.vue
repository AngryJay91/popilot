<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet } from '@/api/client'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ close: [] }>()
const router = useRouter()

const query = ref('')
const results = ref<any[]>([])
const loading = ref(false)
let debounceTimer: ReturnType<typeof setTimeout>

watch(query, (q) => {
  clearTimeout(debounceTimer)
  if (q.length < 2) { results.value = []; return }
  debounceTimer = setTimeout(() => search(q), 300)
})

async function search(q: string) {
  loading.value = true
  const { data } = await apiGet(`/api/v2/search?q=${encodeURIComponent(q)}`)
  if (data?.results) results.value = data.results as any[]
  loading.value = false
}

function navigate(r: any) {
  router.push(r.url)
  emit('close')
}

function typeIcon(t: string) {
  return { story: '📋', memo: '💬', doc: '📄', meeting: '🎙️' }[t] || '📌'
}

function typeLabel(t: string) {
  return { story: 'Story', memo: 'Memo', doc: 'Document', meeting: 'Meeting' }[t] || t
}

const grouped = ref<Record<string, any[]>>({})
watch(results, (r) => {
  const g: Record<string, any[]> = {}
  for (const item of r) {
    if (!g[item.type]) g[item.type] = []
    g[item.type].push(item)
  }
  grouped.value = g
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="search-overlay" @click.self="emit('close')">
      <div class="search-modal">
        <input
          v-model="query"
          class="search-input"
          placeholder="Search stories, memos, documents... (Esc to close)"
          autofocus
        />
        <div v-if="loading" class="search-loading">Searching...</div>
        <div v-else-if="query.length >= 2 && !results.length" class="search-empty">No results</div>
        <div v-else class="search-results">
          <template v-for="(items, type) in grouped" :key="type">
            <div class="search-group-title">{{ typeIcon(type) }} {{ typeLabel(type) }}</div>
            <div
              v-for="r in items"
              :key="r.type + r.id"
              class="search-item"
              @click="navigate(r)"
            >
              <div class="search-item-title">{{ r.title || r.id }}</div>
              <div v-if="r.preview" class="search-item-preview">{{ r.preview }}</div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.search-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9999; display: flex; justify-content: center; padding-top: 120px; }
.search-modal { background: #fff; border-radius: 12px; width: 560px; max-height: 480px; overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,0.2); display: flex; flex-direction: column; }
.search-input { border: none; padding: 16px 20px; font-size: 16px; outline: none; border-bottom: 1px solid #e5e7eb; }
.search-results { overflow-y: auto; padding: 8px; flex: 1; }
.search-group-title { font-size: 12px; font-weight: 600; color: #9ca3af; padding: 8px 12px 4px; }
.search-item { padding: 8px 12px; border-radius: 6px; cursor: pointer; }
.search-item:hover { background: #f3f4f6; }
.search-item-title { font-size: 14px; font-weight: 500; }
.search-item-preview { font-size: 12px; color: #6b7280; margin-top: 2px; }
.search-loading, .search-empty { padding: 24px; text-align: center; color: #9ca3af; font-size: 14px; }
@media (max-width: 640px) { .search-modal { width: 95%; margin: 0 auto; } }
</style>
