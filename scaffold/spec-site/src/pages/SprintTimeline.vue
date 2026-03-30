<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet } from '@/composables/useTurso'
import VelocityChart from '@/components/VelocityChart.vue'

const router = useRouter()

interface TimelineItem {
  id: string; label: string; theme: string
  status: 'planning' | 'active' | 'closed'
  startDate: string | null; endDate: string | null
  velocity: number | null; teamSize: number | null
  storyCount: number; doneCount: number
  totalSP: number; doneSP: number; completionRate: number
}

const timeline = ref<TimelineItem[]>([])

const chartData = computed(() => {
  return timeline.value
    .filter(s => s.status === 'closed' || s.status === 'active')
    .reverse()
    .map(s => ({
      label: s.label,
      planned: s.totalSP,
      actual: s.doneSP,
    }))
})

function statusLabel(s: string) {
  return { planning: 'Planning', active: 'Active', closed: 'Closed' }[s] ?? s
}

function statusClass(s: string) {
  return `status--${s}`
}

function duration(start: string | null, end: string | null): string {
  if (!start || !end) return '-'
  const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))
  return `${days} days`
}

onMounted(async () => {
  const { data } = await apiGet<{ timeline: TimelineItem[] }>('/api/v2/nav/sprints/timeline')
  if (data?.timeline) {
    // active -> planning -> closed
    const order = { active: 0, planning: 1, closed: 2 } as Record<string, number>
    timeline.value = data.timeline.sort((a: TimelineItem, b: TimelineItem) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
  }
})
</script>

<template>
  <div class="timeline-page">
    <h1>Sprint Timeline</h1>

    <!-- Velocity Trend Chart -->
    <div v-if="chartData.length >= 2" class="chart-card">
      <h2>Velocity Trend</h2>
      <VelocityChart :data="chartData" />
    </div>

    <div class="timeline">
      <div v-for="s in timeline" :key="s.id"
        class="timeline-card" :class="statusClass(s.status)"
        @click="router.push(`/board/${s.id}`)">

        <div class="card-header">
          <span class="card-label">{{ s.label }}</span>
          <span class="card-status">{{ statusLabel(s.status) }}</span>
        </div>

        <div class="card-theme">{{ s.theme || '-' }}</div>

        <div class="card-stats">
          <div class="stat">
            <span class="stat-value">{{ s.doneCount }}/{{ s.storyCount }}</span>
            <span class="stat-label">Stories</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ s.doneSP }}/{{ s.totalSP }}</span>
            <span class="stat-label">SP</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ s.completionRate }}%</span>
            <span class="stat-label">Completion</span>
          </div>
        </div>

        <div class="card-bar">
          <div class="bar-fill" :style="{ width: s.completionRate + '%' }" />
        </div>

        <div class="card-meta">
          <span v-if="s.startDate">{{ s.startDate }} ~ {{ s.endDate }} ({{ duration(s.startDate, s.endDate) }})</span>
          <span v-if="s.velocity">velocity: {{ s.velocity }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-page { max-width: 800px; margin: 0 auto; padding: 24px; background: var(--bg); min-height: 100vh; }
.timeline-page h1 { font-size: 22px; font-weight: 700; margin-bottom: 20px; }
.chart-card {
  background: rgba(255,255,255,0.25);
  backdrop-filter: blur(40px) saturate(1.8);
  border: 1px solid rgba(255,255,255,0.45);
  border-radius: 16px; padding: 20px; margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.5);
}
.chart-card h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }

.timeline { display: flex; flex-direction: column; gap: 12px; }

.timeline-card {
  background: rgba(255,255,255,0.25);
  backdrop-filter: blur(40px) saturate(1.8);
  -webkit-backdrop-filter: blur(40px) saturate(1.8);
  border: 1px solid rgba(255,255,255,0.45);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.5);
}
.timeline-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.05); }

.timeline-card.status--active { border-left: 4px solid #3B82F6; }
.timeline-card.status--planning { border-left: 4px solid #F59E0B; }
.timeline-card.status--closed { border-left: 4px solid #94A3B8; opacity: 0.8; }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.card-label { font-size: 18px; font-weight: 700; }
.card-status { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 6px; }
.status--active .card-status { background: rgba(59,130,246,0.12); color: #2563EB; }
.status--planning .card-status { background: rgba(245,158,11,0.12); color: #D97706; }
.status--closed .card-status { background: rgba(148,163,184,0.12); color: #64748B; }

.card-theme { font-size: 14px; color: var(--text-secondary); margin-bottom: 12px; }

.card-stats { display: flex; gap: 24px; margin-bottom: 8px; }
.stat { display: flex; flex-direction: column; }
.stat-value { font-size: 16px; font-weight: 700; }
.stat-label { font-size: 11px; color: var(--text-muted); }

.card-bar { height: 6px; background: rgba(0,0,0,0.06); border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
.bar-fill { height: 100%; background: #3B82F6; border-radius: 3px; transition: width 0.3s; }

.card-meta { font-size: 11px; color: var(--text-muted); display: flex; gap: 12px; }
@media (max-width: 640px) {
  .timeline-page { padding: 16px; }
  .card-stats { gap: 12px; flex-wrap: wrap; }
  .card-meta { flex-direction: column; }
}
</style>
