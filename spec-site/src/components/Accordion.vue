<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  icon: string
  title: string
  badge?: string
  badgeVariant?: 'red' | 'yellow' | 'green' | 'blue'
  summary?: string
  defaultOpen?: boolean
}>()

const isOpen = ref(props.defaultOpen ?? false)

function toggle() {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div class="accordion" :class="{ open: isOpen }">
    <button class="accordion-trigger" @click="toggle">
      <div class="trigger-left">
        <span class="trigger-icon">{{ icon }}</span>
        <span>{{ title }}</span>
        <span v-if="badge" class="trigger-badge" :class="`badge-${badgeVariant ?? 'blue'}`">
          {{ badge }}
        </span>
        <span v-if="summary" class="trigger-summary">{{ summary }}</span>
      </div>
      <div class="trigger-right">
        <span class="chevron">&#9660;</span>
      </div>
    </button>
    <div class="divider" />
    <div class="accordion-body">
      <div class="accordion-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.accordion {
  background: var(--card-bg);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  border: 1px solid var(--border-light);
}
.accordion-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  text-align: left;
  transition: background 0.15s;
}
.accordion-trigger:hover { background: #fafafa; }
.trigger-left { display: flex; align-items: center; gap: 10px; }
.trigger-icon { font-size: 18px; }
.trigger-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 4px;
}
.badge-red { background: var(--red-bg); color: var(--red); border: 1px solid var(--red-border); }
.badge-yellow { background: var(--yellow-bg); color: var(--yellow); border: 1px solid var(--yellow-border); }
.badge-green { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); }
.badge-blue { background: var(--blue-bg); color: var(--blue); border: 1px solid var(--blue-border); }
.trigger-summary {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-left: 8px;
}
.trigger-right { display: flex; align-items: center; gap: 8px; }
.chevron {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  color: var(--text-muted);
  font-size: 12px;
}
.accordion.open .chevron { transform: rotate(180deg); }
.accordion-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
}
.accordion.open .accordion-body { max-height: 4000px; }
.accordion-content { padding: 0 20px 20px; }
.divider { height: 1px; background: var(--border-light); margin: 0 20px; }
</style>
