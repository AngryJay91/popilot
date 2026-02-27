<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  severity: 'red' | 'yellow' | 'green'
  severityLabel: string
  title: string
  action: string
  effect: string
  buttons: { label: string; variant: 'primary' | 'outline' }[]
}>()

const checked = ref(false)

function toggleCheck() {
  checked.value = !checked.value
}
</script>

<template>
  <div class="coaching-card" :class="[`severity-${severity}`, { done: checked }]">
    <div class="coaching-card-top">
      <div class="coaching-severity" :class="severity">
        ● {{ severityLabel }}
      </div>
      <div
        class="coaching-check"
        :class="{ checked }"
        @click.stop="toggleCheck"
      />
    </div>
    <div class="coaching-title">{{ title }}</div>
    <div class="coaching-action" v-html="action" />
    <div class="coaching-effect">{{ effect }}</div>
    <div class="coaching-buttons">
      <button
        v-for="(btn, i) in buttons"
        :key="i"
        class="btn"
        :class="`btn-${btn.variant}`"
        @click.stop="btn.variant === 'primary' ? toggleCheck() : undefined"
      >
        {{ btn.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.coaching-card {
  border-radius: var(--radius-sm);
  padding: 16px;
  border: 1px solid;
  position: relative;
  transition: opacity 0.2s;
}
.coaching-card.severity-red { background: var(--red-bg); border-color: var(--red-border); }
.coaching-card.severity-yellow { background: var(--yellow-bg); border-color: var(--yellow-border); }
.coaching-card.severity-green { background: var(--green-bg); border-color: var(--green-border); }
.coaching-card.done { opacity: 0.5; }
.coaching-card.done .coaching-title { text-decoration: line-through; }
.coaching-card-top { display: flex; justify-content: space-between; align-items: center; }
.coaching-severity {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.coaching-severity.red { color: var(--red); }
.coaching-severity.yellow { color: #92400e; }
.coaching-severity.green { color: var(--green); }
.coaching-title { font-size: 14px; font-weight: 600; margin-bottom: 6px; line-height: 1.4; }
.coaching-action { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 4px; }
.coaching-action :deep(strong) { color: var(--text-primary); font-weight: 600; }
.coaching-effect { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
.coaching-check {
  width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid var(--border);
  cursor: pointer; flex-shrink: 0;
  transition: all 0.2s;
}
.coaching-check:hover { border-color: var(--primary); background: var(--primary-light); }
.coaching-check.checked {
  border-color: var(--green); background: var(--green);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E");
  background-size: 14px; background-position: center; background-repeat: no-repeat;
}
.coaching-buttons { display: flex; gap: 8px; justify-content: flex-end; }
.btn {
  padding: 7px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-family: var(--font-kr);
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}
.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-dark); }
.btn-outline { background: #fff; border: 1px solid var(--border); color: var(--text-primary); }
.btn-outline:hover { background: #f9fafb; }
</style>
