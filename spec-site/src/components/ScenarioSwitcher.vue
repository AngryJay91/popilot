<script setup lang="ts">
import type { Scenario } from '@/data/types'

const props = defineProps<{
  scenarios: Scenario<any>[]
  activeId: string
}>()

const emit = defineEmits<{
  change: [id: string]
  duplicate: [id: string]
  deleteCustom: [id: string]
}>()

function isCustom(id: string) {
  return id.startsWith('custom-')
}
</script>

<template>
  <div class="variant-bar">
    <span>Scenario:</span>
    <div
      v-for="s in scenarios"
      :key="s.id"
      class="variant-item"
    >
      <button
        class="variant-btn"
        :class="{ active: activeId === s.id }"
        @click="emit('change', s.id)"
      >
        {{ s.label }}
      </button>
      <button
        v-if="activeId === s.id && !isCustom(s.id)"
        class="action-btn duplicate-btn"
        title="Duplicate scenario"
        @click.stop="emit('duplicate', s.id)"
      >+</button>
      <button
        v-if="isCustom(s.id)"
        class="action-btn delete-btn"
        title="Delete custom scenario"
        @click.stop="emit('deleteCustom', s.id)"
      >&times;</button>
    </div>
  </div>
</template>

<style scoped>
.variant-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #1f2123;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 13px;
  flex-wrap: wrap;
}
.variant-bar > span { opacity: 0.6; }
.variant-item {
  display: flex;
  align-items: center;
  gap: 2px;
}
.variant-btn {
  padding: 5px 14px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.2);
  background: transparent;
  color: #fff;
  font-size: 12px;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.15s;
}
.variant-btn:hover { background: rgba(255,255,255,0.1); }
.variant-btn.active { background: var(--primary); border-color: var(--primary); }
.action-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.3);
  background: transparent;
  color: #fff;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.action-btn:hover { background: rgba(255,255,255,0.15); }
.delete-btn { border-color: rgba(255,100,100,0.5); color: #ff8a8a; }
.delete-btn:hover { background: rgba(255,100,100,0.2); }
</style>
