<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost, apiDelete } from '@/composables/useTurso'

const router = useRouter()

interface MockupPage {
  id: number; slug: string; title: string; category: string
  viewport: string; version: number; created_by: string; updated_at: string
}

const mockups = ref<MockupPage[]>([])
const searchQuery = ref('')
const filteredMockups = computed(() => {
  if (!searchQuery.value) return mockups.value
  const q = searchQuery.value.toLowerCase()
  return mockups.value.filter(m => m.title.toLowerCase().includes(q) || m.category.toLowerCase().includes(q))
})
const loading = ref(true)

async function deleteMockup(slug: string) {
  if (!confirm('Are you sure you want to delete this?')) return
  await apiDelete(`/api/v2/mockups/${slug}`)
  await loadMockups()
}
const showCreate = ref(false)
const newSlug = ref('')
const newTitle = ref('')
const newViewport = ref('desktop')

async function loadMockups() {
  loading.value = true
  const { data } = await apiGet('/api/v2/mockups')
  if (data?.mockups) mockups.value = data.mockups as MockupPage[]
  loading.value = false
}

async function createMockup() {
  if (!newSlug.value || !newTitle.value) return
  const targetSlug = newSlug.value
  await apiPost('/api/v2/mockups', { slug: targetSlug, title: newTitle.value, viewport: newViewport.value })
  newSlug.value = ''; newTitle.value = ''; showCreate.value = false
  router.push(`/mockup-editor/${targetSlug}`)
}

function formatDate(d: string) {
  if (!d) return ''
  const date = new Date(d.endsWith('Z') ? d : d + 'Z')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

onMounted(loadMockups)
</script>

<template>
  <div class="mockup-list-page">
    <div class="list-header">
      <h1>Mockups</h1>
      <button class="btn-new" @click="showCreate = !showCreate">{{ showCreate ? 'Cancel' : '+ New Mockup' }}</button>
    </div>

    <!-- Create form -->
    <div v-if="showCreate" class="create-form">
      <input v-model="newTitle" class="input" placeholder="Mockup title" />
      <input v-model="newSlug" class="input" placeholder="Path (slug)" />
      <select v-model="newViewport" class="input">
        <option value="desktop">Desktop</option>
        <option value="mobile">Mobile</option>
      </select>
      <button class="btn btn--primary" @click="createMockup" :disabled="!newSlug || !newTitle">Create</button>
    </div>

    <input v-if="mockups.length" v-model="searchQuery" class="search-input" placeholder="Search by title or category..." />

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="!mockups.length" class="empty">No mockups yet. Create a new mockup to get started.</div>

    <div v-else class="mockup-grid">
      <div v-for="m in filteredMockups" :key="m.id" class="mockup-card" @click="router.push(`/mockup-viewer/${m.slug}`)">
        <div class="card-viewport">{{ m.viewport === 'mobile' ? '📱' : '<Icon name="monitor" :size="14" />' }}</div>
        <div class="card-info">
          <h3>{{ m.title }}</h3>
          <div class="card-meta">
            <span>{{ m.category }}</span>
            <span>v{{ m.version }}</span>
            <span>{{ formatDate(m.updated_at) }}</span>
          </div>
        </div>
        <button class="card-edit" @click.stop="router.push(`/mockup-editor/${m.slug}`)">Edit</button>
        <button class="card-delete" @click.stop="deleteMockup(m.slug)"><Icon name="trash" :size="14" /></button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mockup-list-page { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
.search-input { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 12px; font-size: 14px; margin-bottom: 12px; box-sizing: border-box; }
.list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.list-header h1 { font-size: 20px; font-weight: 700; }
.btn-new { background: #3b82f6; color: #fff; border: none; border-radius: 10px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }

.create-form { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.input { border: 1px solid rgba(0,0,0,0.15); border-radius: 8px; padding: 8px 12px; font-size: 13px; }

.mockup-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.mockup-card { display: flex; align-items: center; gap: 12px; background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); cursor: pointer; transition: all 0.2s; }
.mockup-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.card-delete { border: none; background: none; font-size: 16px; cursor: pointer; opacity: 0.4; transition: opacity 0.15s; padding: 4px; }
.card-delete:hover { opacity: 1; }
.card-viewport { font-size: 28px; }
.card-info { flex: 1; }
.card-info h3 { font-size: 15px; font-weight: 600; }
.card-meta { display: flex; gap: 8px; font-size: 11px; color: #888; margin-top: 4px; }
.card-edit { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer; }

.loading, .empty { text-align: center; color: #888; padding: 40px; }
@media (max-width: 640px) { .mockup-grid { grid-template-columns: 1fr; } .create-form { flex-direction: column; } }
</style>
