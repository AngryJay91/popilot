<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost, apiDelete } from '@/composables/useTurso'
import { useConfirm } from '@/composables/useConfirm'

const { showConfirm } = useConfirm()

interface Relation { id: number; source_memo_id: number; target_memo_id: number; relation_type: string; created_by: string }

const props = defineProps<{ memoId: number }>()
const router = useRouter()

const relations = ref<Relation[]>([])
const showModal = ref(false)
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const selectedRelType = ref('related')
let searchTimer: ReturnType<typeof setTimeout> | null = null

async function loadRelations() {
  const { data } = await apiGet<{ relations: Relation[] }>(`/api/v2/memos/${props.memoId}/relations`)
  relations.value = data?.relations || []
}

async function searchMemos() {
  if (searchTimer) clearTimeout(searchTimer)
  if (!searchQuery.value.trim()) { searchResults.value = []; return }
  searchTimer = setTimeout(async () => {
    const { data } = await apiGet<{ results: any[] }>(`/api/v2/search?q=${encodeURIComponent(searchQuery.value)}&type=memo`)
    searchResults.value = (data?.results || []).filter((r: any) => r.id !== props.memoId)
  }, 300)
}

async function addRelation(targetId: number) {
  await apiPost(`/api/v2/memos/${props.memoId}/relations`, { targetMemoId: targetId, relationType: selectedRelType.value })
  showModal.value = false; searchQuery.value = ''; searchResults.value = []
  await loadRelations()
}

async function removeRelation(relId: number) {
  if (!await showConfirm('Delete this relation?')) return
  await apiDelete(`/api/v2/memos/relations/${relId}`)
  await loadRelations()
}

function getLinkedMemoId(r: Relation): number {
  return r.source_memo_id === props.memoId ? r.target_memo_id : r.source_memo_id
}

const typeLabels: Record<string, string> = { related: 'Related', blocks: 'Blocks', duplicate: 'Duplicate' }

onMounted(loadRelations)
</script>

<template>
  <div class="memo-relations">
    <div class="rel-header">
      <span class="rel-title">Related Memos ({{ relations.length }})</span>
      <button class="btn btn--xs btn--ghost" @click="showModal = true">+ Link</button>
    </div>
    <div v-for="r in relations" :key="r.id" class="rel-item">
      <span class="rel-type-badge">{{ typeLabels[r.relation_type] || r.relation_type }}</span>
      <span class="rel-link" @click="router.push({ query: { memo: String(getLinkedMemoId(r)) } })">#{{ getLinkedMemoId(r) }}</span>
      <button class="rel-remove" @click="removeRelation(r.id)">✕</button>
    </div>

    <!-- Link modal -->
    <div v-if="showModal" class="rel-modal-overlay" @click.self="showModal = false">
      <div class="rel-modal">
        <h4>Link Memo</h4>
        <select v-model="selectedRelType" class="rel-type-select">
          <option value="related">Related</option>
          <option value="blocks">Blocks</option>
          <option value="duplicate">Duplicate</option>
        </select>
        <input v-model="searchQuery" class="rel-search" placeholder="Search memos..." @input="searchMemos" autofocus />
        <div v-for="m in searchResults" :key="m.id" class="rel-search-item" @click="addRelation(m.id)">
          #{{ m.id }} {{ m.title || m.preview }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.memo-relations { margin: 16px 0; padding: 12px; background: #fafafa; border-radius: 8px; }
.rel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.rel-title { font-size: 13px; font-weight: 600; }
.rel-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13px; }
.rel-type-badge { font-size: 10px; padding: 1px 6px; border-radius: 4px; background: #e5e7eb; }
.rel-link { color: #3b82f6; cursor: pointer; }
.rel-link:hover { text-decoration: underline; }
.rel-remove { border: none; background: none; color: #9ca3af; cursor: pointer; font-size: 12px; }
.rel-remove:hover { color: #ef4444; }
.rel-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 9999; display: flex; align-items: center; justify-content: center; }
.rel-modal { background: #fff; border-radius: 12px; padding: 20px; width: 360px; max-height: 400px; overflow-y: auto; }
.rel-modal h4 { margin: 0 0 12px; }
.rel-type-select { width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 6px; font-size: 13px; margin-bottom: 8px; }
.rel-search { width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; font-size: 13px; box-sizing: border-box; margin-bottom: 8px; }
.rel-search-item { padding: 8px; cursor: pointer; border-radius: 6px; font-size: 13px; }
.rel-search-item:hover { background: #eff6ff; }
@media (max-width: 767px) { .btn { min-height: 44px; } input, select { min-height: 44px; font-size: 16px; } }
</style>
