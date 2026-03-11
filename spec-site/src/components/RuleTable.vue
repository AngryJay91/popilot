<script setup lang="ts">
import type { Rule } from '@/data/types'

defineProps<{
  rules: Rule[]
}>()

function severityClass(sev: string) {
  const map: Record<string, string> = {
    danger: 'sev-r',
    warning: 'sev-y',
    good: 'sev-g',
    info: 'sev-b',
    opportunity: 'sev-b',
  }
  return map[sev] ?? 'sev-b'
}

function implClass(status: string) {
  const map: Record<string, string> = {
    done: 'impl-done',
    'data-ready': 'impl-ready',
    'logic-needed': 'impl-logic',
    'new-data': 'impl-new',
  }
  return map[status] ?? ''
}
</script>

<template>
  <table class="sb-rules">
    <thead>
      <tr>
        <th>ID</th>
        <th>Condition</th>
        <th>Sev</th>
        <th>Message</th>
        <th>Impl</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="rule in rules" :key="rule.id">
        <td class="rid">{{ rule.id }}</td>
        <td>{{ rule.condition }}</td>
        <td><span class="sev" :class="severityClass(rule.severity)" /></td>
        <td class="msg">{{ rule.homeMessage }}</td>
        <td><span class="impl" :class="implClass(rule.implStatus)">{{ rule.implStatus }}</span></td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.sb-rules {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  line-height: 1.5;
}
.sb-rules th {
  text-align: left;
  padding: 6px 8px;
  background: #f8fafc;
  border-bottom: 2px solid var(--border);
  font-weight: 700;
  color: var(--text-secondary);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.sb-rules td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--border-light);
  vertical-align: top;
}
.rid { font-family: var(--font-num); font-weight: 600; white-space: nowrap; color: var(--primary); }
.msg { color: var(--text-secondary); max-width: 200px; }
.sev {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.sev-r { background: var(--red); }
.sev-y { background: var(--yellow); }
.sev-g { background: var(--green); }
.sev-b { background: var(--blue); }
.impl {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
}
.impl-done { background: var(--green-bg); color: var(--green); }
.impl-ready { background: var(--blue-bg); color: var(--blue); }
.impl-logic { background: var(--yellow-bg); color: var(--yellow); }
.impl-new { background: var(--red-bg); color: var(--red); }
</style>
