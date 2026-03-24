<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  data: Array<{ label: string; planned: number; actual: number }>
}>()

const maxValue = computed(() => {
  const vals = props.data.flatMap(d => [d.planned, d.actual])
  return Math.max(...vals, 1)
})

const chartWidth = 600
const chartHeight = 200
const padding = { top: 20, right: 20, bottom: 40, left: 50 }
const innerW = chartWidth - padding.left - padding.right
const innerH = chartHeight - padding.top - padding.bottom

function x(i: number): number {
  return padding.left + (i / Math.max(props.data.length - 1, 1)) * innerW
}

function y(val: number): number {
  return padding.top + innerH - (val / maxValue.value) * innerH
}

const plannedPath = computed(() => {
  return props.data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.planned)}`).join(' ')
})

const actualPath = computed(() => {
  return props.data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.actual)}`).join(' ')
})

const yTicks = computed(() => {
  const max = maxValue.value
  const step = Math.ceil(max / 4)
  return [0, step, step * 2, step * 3, step * 4].filter(v => v <= max + step)
})
</script>

<template>
  <div class="velocity-chart">
    <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="xMidYMid meet">
      <line v-for="tick in yTicks" :key="tick"
        :x1="padding.left" :x2="chartWidth - padding.right"
        :y1="y(tick)" :y2="y(tick)"
        stroke="rgba(0,0,0,0.06)" stroke-dasharray="4,4" />
      <text v-for="tick in yTicks" :key="'t'+tick"
        :x="padding.left - 8" :y="y(tick) + 4"
        text-anchor="end" font-size="10" fill="var(--text-muted)">{{ tick }}</text>
      <text v-for="(d, i) in data" :key="'x'+i"
        :x="x(i)" :y="chartHeight - 8"
        text-anchor="middle" font-size="10" fill="var(--text-muted)">{{ d.label }}</text>
      <path :d="plannedPath" fill="none" stroke="rgba(148,163,184,0.5)" stroke-width="2" stroke-dasharray="6,4" />
      <path :d="actualPath" fill="none" stroke="#3B82F6" stroke-width="2.5" />
      <circle v-for="(d, i) in data" :key="'d'+i"
        :cx="x(i)" :cy="y(d.actual)" r="4" fill="#3B82F6" stroke="#fff" stroke-width="2" />
      <circle v-for="(d, i) in data" :key="'p'+i"
        :cx="x(i)" :cy="y(d.planned)" r="3" fill="rgba(148,163,184,0.6)" />
    </svg>
    <div class="chart-legend">
      <span class="legend-item"><span class="legend-line legend--actual"></span> Actual</span>
      <span class="legend-item"><span class="legend-line legend--planned"></span> Planned</span>
    </div>
  </div>
</template>

<style scoped>
.velocity-chart { width: 100%; }
.velocity-chart svg { width: 100%; height: auto; }
.chart-legend { display: flex; gap: 16px; justify-content: center; margin-top: 8px; font-size: 12px; color: var(--text-secondary); }
.legend-item { display: flex; align-items: center; gap: 4px; }
.legend-line { width: 16px; height: 2px; display: inline-block; }
.legend--actual { background: #3B82F6; }
.legend--planned { background: rgba(148,163,184,0.5); border-top: 2px dashed rgba(148,163,184,0.5); height: 0; }
</style>
