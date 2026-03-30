<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { apiGet } from '@/composables/useTurso'

const props = defineProps<{ sprintId: string }>()

const data = ref<{ totalSP: number; dailyDone: any[]; startDate: string; endDate: string } | null>(null)

async function loadBurndown() {
  const { data: d } = await apiGet(`/api/v2/pm/sprints/${props.sprintId}/burndown`)
  data.value = d as any
}

onMounted(loadBurndown)
watch(() => props.sprintId, loadBurndown)

const chartData = computed(() => {
  if (!data.value) return { points: [], idealPoints: [], dates: [] }
  const { totalSP, dailyDone, startDate, endDate } = data.value
  if (!startDate || !endDate || !totalSP) return { points: [], idealPoints: [], dates: [] }

  // Date array
  const dates: string[] = []
  let d = new Date(startDate)
  const end = new Date(endDate)
  while (d <= end) { dates.push(d.toISOString().split('T')[0]); d.setDate(d.getDate() + 1) }

  // Daily done SP map
  const doneMap: Record<string, number> = {}
  for (const r of dailyDone) doneMap[r.date] = r.sp

  // Remaining
  let cumDone = 0
  const points = dates.map(dt => { cumDone += doneMap[dt] || 0; return totalSP - cumDone })

  // Ideal
  const idealPoints = dates.map((_, i) => Math.round(totalSP * (1 - i / (dates.length - 1))))

  return { points, idealPoints, dates }
})

const svgW = 400
const svgH = 200
const pad = 30

function x(i: number, total: number) { return pad + (i / Math.max(total - 1, 1)) * (svgW - pad * 2) }
function y(val: number, max: number) { return pad + (1 - val / Math.max(max, 1)) * (svgH - pad * 2) }

function polyline(points: number[], max: number): string {
  return points.map((p, i) => `${x(i, points.length)},${y(p, max)}`).join(' ')
}
</script>

<template>
  <div class="burndown-chart">
    <h3>Burndown Chart</h3>
    <svg v-if="chartData.points.length" :viewBox="`0 0 ${svgW} ${svgH}`" class="chart-svg">
      <!-- Ideal line -->
      <polyline :points="polyline(chartData.idealPoints, data?.totalSP || 1)" fill="none" stroke="#d1d5db" stroke-width="1.5" stroke-dasharray="4" />
      <!-- Actual line -->
      <polyline :points="polyline(chartData.points, data?.totalSP || 1)" fill="none" stroke="var(--primary)" stroke-width="2" />
      <!-- Axes -->
      <line :x1="pad" :y1="svgH - pad" :x2="svgW - pad" :y2="svgH - pad" stroke="#e5e7eb" />
      <line :x1="pad" :y1="pad" :x2="pad" :y2="svgH - pad" stroke="#e5e7eb" />
      <!-- Labels -->
      <text :x="pad" :y="pad - 5" font-size="10" fill="var(--text-muted)">{{ data?.totalSP }}SP</text>
      <text :x="svgW - pad" :y="svgH - pad + 15" font-size="9" fill="var(--text-muted)" text-anchor="end">{{ chartData.dates[chartData.dates.length - 1] }}</text>
    </svg>
    <div v-else class="chart-empty">No data</div>
  </div>
</template>

<style scoped>
.burndown-chart { background: var(--bg-card); border-radius: var(--radius-lg); padding: 16px; }
.burndown-chart h3 { font-size: 14px; font-weight: 700; margin: 0 0 12px; }
.chart-svg { width: 100%; max-width: 500px; }
.chart-empty { color: var(--text-muted); font-size: 13px; text-align: center; padding: 24px; }
</style>
