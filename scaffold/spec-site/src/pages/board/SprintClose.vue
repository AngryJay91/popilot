<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet, apiPost } from '@/api/client'

const route = useRoute()
const router = useRouter()
const sprintId = computed(() => route.params.sprintId as string)

const loading = ref(false)
const error = ref('')
const planData = ref<{
  sprint: { status: string; velocity: number | null }
  summary: { completedCount: number; incompleteCount: number; totalStories: number; doneSP: number; totalSP?: number }
  incompleteStories: Array<{ id: number; title: string; story_points: number | null; status: string; assignee: string | null }>
  velocity?: Array<{ assignee: string; doneSP: number; totalSP: number }>
} | null>(null)

const result = ref<{
  summary: {
    completedCount: number; incompleteCount: number; totalStories: number
    doneSP: number; totalSP: number; completionRate: number
    movedToBacklog: Array<{ id: number; title: string }>
  }
} | null>(null)

const incomplete = computed(() => planData.value?.incompleteStories ?? [])
const doneSP = computed(() => planData.value?.summary?.doneSP ?? 0)
const totalSP = computed(() => planData.value?.summary?.totalSP ?? 0)
const completionRate = computed(() => {
  const total = planData.value?.summary?.totalStories ?? 0
  const completed = planData.value?.summary?.completedCount ?? 0
  return total > 0 ? Math.round((completed / total) * 100) : 0
})

async function closeSprint() {
  loading.value = true
  error.value = ''
  const { data, error: e } = await apiPost(`/api/v2/kickoff/${sprintId.value}/close`, {})
  loading.value = false
  if (e) { error.value = e; return }
  result.value = data as typeof result.value
}

onMounted(async () => {
  const { data } = await apiGet<typeof planData.value>(`/api/v2/kickoff/${sprintId.value}/close-preview`)
  if (data) planData.value = data
  if (data?.sprint?.status !== 'active') {
    error.value = `${sprintId.value} is not in active status (current: ${data?.sprint?.status})`
  }
})
</script>

<template>
  <div class="close-page">
    <!-- Close complete -->
    <div v-if="result" class="close-result">
      <h1>{{ sprintId }} Closed</h1>
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-value">{{ result.summary.completedCount }}</div>
          <div class="summary-label">Completed Stories</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">{{ result.summary.doneSP }}</div>
          <div class="summary-label">Completed SP</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">{{ result.summary.completionRate }}%</div>
          <div class="summary-label">Completion Rate</div>
        </div>
      </div>
      <div v-if="result.summary.movedToBacklog.length" class="backlog-list">
        <h3>Stories Moved to Backlog ({{ result.summary.incompleteCount }})</h3>
        <div v-for="s in result.summary.movedToBacklog" :key="s.id" class="backlog-item">
          S{{ s.id }}: {{ s.title }}
        </div>
      </div>
      <div class="close-actions">
        <button class="btn btn--primary" @click="router.push(`/retro/${sprintId}`)">Start Retrospective &rarr;</button>
        <button class="btn" @click="router.push('/')">Dashboard</button>
      </div>
    </div>

    <!-- Close confirmation -->
    <div v-else>
      <h1>Close {{ sprintId }}</h1>
      <p v-if="error" class="error-msg">{{ error }}</p>

      <div v-if="planData && !error" class="close-preview">
        <div class="summary-cards">
          <div class="summary-card">
            <div class="summary-value">{{ planData?.summary?.completedCount ?? 0 }} / {{ planData?.summary?.totalStories ?? 0 }}</div>
            <div class="summary-label">Completed Stories</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">{{ doneSP }} / {{ totalSP }}</div>
            <div class="summary-label">Story Points</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">{{ completionRate }}%</div>
            <div class="summary-label">Completion Rate</div>
          </div>
        </div>

        <!-- Per-member velocity -->
        <div v-if="planData?.velocity" class="velocity-section">
          <h3>Team Member Performance</h3>
          <div v-for="v in (planData as any).velocity" :key="v.assignee" class="velocity-row">
            <span class="velocity-name">{{ v.assignee }}</span>
            <span class="velocity-sp">{{ v.doneSP }} / {{ v.totalSP }} SP</span>
          </div>
        </div>

        <div v-if="incomplete.length" class="incomplete-section">
          <h3>Incomplete Stories ({{ incomplete.length }}) — will be moved to backlog</h3>
          <div v-for="s in incomplete" :key="s.id" class="incomplete-item">
            <span class="status-dot" />
            S{{ s.id }}: {{ s.title }}
            <span class="sp-badge">{{ s.story_points ?? '-' }} SP</span>
          </div>
        </div>

        <button class="btn btn--danger btn--lg" :disabled="loading" @click="closeSprint">
          {{ loading ? 'Closing...' : `Close ${sprintId}` }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.close-page { max-width: 720px; margin: 0 auto; padding: 32px 24px; }
.close-page h1 { font-size: 24px; font-weight: 700; margin-bottom: 20px; }
.summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
.summary-card { background: #fff; border-radius: 12px; padding: 16px; text-align: center; }
.summary-value { font-size: 28px; font-weight: 800; color: var(--text-primary); }
.summary-label { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.velocity-section { margin-bottom: 20px; }
.velocity-section h3 { font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; }
.velocity-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
.velocity-name { font-weight: 500; }
.velocity-sp { color: var(--text-secondary); }
.incomplete-section { margin-bottom: 24px; }
.incomplete-section h3 { font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; }
.incomplete-item { padding: 6px 0; font-size: 13px; display: flex; align-items: center; gap: 6px; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; flex-shrink: 0; }
.sp-badge { font-size: 11px; color: var(--text-muted); margin-left: auto; }
.backlog-list { margin: 20px 0; }
.backlog-list h3 { font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; }
.backlog-item { padding: 4px 0; font-size: 13px; color: var(--text-secondary); }
.close-actions { display: flex; gap: 12px; justify-content: center; margin-top: 24px; }
.close-result { text-align: center; }
.close-result h1 { margin-bottom: 24px; }
.btn { padding: 10px 20px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.06); background: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn--primary { background: var(--primary); color: #fff; border: none; }
.btn--danger { background: #ef4444; color: #fff; border: none; }
.btn--lg { width: 100%; padding: 14px; font-size: 16px; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.error-msg { color: #ef4444; background: rgba(239,68,68,0.08); padding: 8px 12px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; }
@media (max-width: 640px) {
  .close-page { padding: 16px; }
  .summary-cards { grid-template-columns: 1fr; }
  .summary-value { font-size: 22px; }
  .close-page h1 { font-size: 20px; }
}
</style>
