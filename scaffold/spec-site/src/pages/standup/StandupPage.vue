<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { apiGet, apiPost, isStaticMode } from '@/api/client'
import { useUser } from '@/composables/useUser'
import { getActiveSprint } from '@/composables/useNavStore'
import StandupForm from './StandupForm.vue'
import StandupList from './StandupList.vue'

const route = useRoute()
const { currentUser } = useUser()
const sprint = computed(() => (route.params.sprint as string) || getActiveSprint().id)

interface StandupEntry {
  id: number; userName: string; date: string; sprint: string
  doneText: string | null; planText: string | null; blockers: string | null; createdAt: string
}

const entries = ref<StandupEntry[]>([])
const loading = ref(true)
const error = ref('')

function todayStr(): string { return new Date().toISOString().split('T')[0] }
const selectedDate = ref(todayStr())

async function loadEntries(date: string) {
  if (isStaticMode()) { loading.value = false; return }
  loading.value = true; error.value = ''
  const { data, error: apiError } = await apiGet<{ entries: Array<Record<string, unknown>> }>(
    '/api/v2/standup/entries', { date, sprint: sprint.value },
  )
  if (apiError) { error.value = apiError }
  else if (data?.entries) {
    entries.value = (data.entries as Array<Record<string, unknown>>).map(r => ({
      id: r.id as number, userName: (r.user_name as string) ?? '', date: (r.date as string) ?? date,
      sprint: (r.sprint as string) ?? sprint.value, doneText: (r.done_text as string) ?? null,
      planText: (r.plan_text as string) ?? null, blockers: (r.blockers as string) ?? null,
      createdAt: (r.created_at as string) ?? '',
    }))
  }
  loading.value = false
}

async function handleSave(data: { doneText: string | null; planText: string | null; blockers: string | null }) {
  const user = currentUser.value
  if (!user) return
  await apiPost('/api/v2/standup/save', { userName: user, date: selectedDate.value, sprint: sprint.value, ...data })
  await loadEntries(selectedDate.value)
}

function changeDate(delta: number) {
  const d = new Date(selectedDate.value); d.setDate(d.getDate() + delta)
  selectedDate.value = d.toISOString().split('T')[0]
}

watch(selectedDate, (newDate) => loadEntries(newDate))
onMounted(async () => { await loadEntries(selectedDate.value) })
</script>

<template>
  <div class="standup-page">
    <div class="standup-header">
      <h1>Daily Standup</h1>
      <div class="date-nav">
        <button class="date-btn" @click="changeDate(-1)">&larr;</button>
        <input type="date" v-model="selectedDate" class="date-input" />
        <button class="date-btn" @click="changeDate(1)">&rarr;</button>
        <button class="date-btn date-btn--today" @click="selectedDate = todayStr()">Today</button>
      </div>
    </div>
    <div v-if="error" class="error-msg">{{ error }}</div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else>
      <StandupForm v-if="selectedDate === todayStr() && currentUser" :existing="entries.find(e => e.userName === currentUser)" @save="handleSave" />
      <StandupList :entries="entries" :current-user="currentUser ?? ''" />
    </div>
  </div>
</template>

<style scoped>
.standup-page { max-width: 900px; margin: 0 auto; padding: 24px; height: 100%; overflow-y: auto; }
.standup-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
h1 { font-size: 22px; font-weight: 700; color: var(--text-primary); }
.date-nav { display: flex; align-items: center; gap: 4px; }
.date-btn { padding: 6px 10px; border: 1px solid rgba(0,0,0,0.06); border-radius: 6px; background: var(--card-bg, #fff); color: var(--text-secondary); cursor: pointer; font-size: 13px; transition: all 0.1s; }
.date-btn:hover { background: #f1f5f9; }
.date-btn--today { color: #3b82f6; border-color: #bfdbfe; }
.date-input { padding: 6px 10px; border: 1px solid rgba(0,0,0,0.06); background: var(--card-bg, #fff); border-radius: 6px; font-size: 13px; color: var(--text-primary); font-weight: 600; }
.date-input:focus { outline: none; border-color: #3b82f6; }
.loading, .error-msg { text-align: center; padding: 40px; font-size: 14px; }
.loading { color: var(--text-muted); }
.error-msg { color: #ef4444; }
@media (max-width: 767px) { .standup-page { padding: 12px; } .standup-header { flex-direction: column; align-items: flex-start; gap: 8px; } }
</style>
