<script setup lang="ts">
const props = defineProps<{ name: string; size?: number }>()

function hashColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']
  return colors[Math.abs(hash) % colors.length]
}

const initial = props.name ? (props.name.length <= 3 ? props.name : props.name.slice(0, 3)) : '?'
const bg = hashColor(props.name || '')
const sz = props.size || 24
</script>

<template>
  <span class="user-avatar" :style="{ width: sz + 'px', height: sz + 'px', background: bg }" :title="name">
    {{ initial }}
  </span>
</template>

<style scoped>
.user-avatar { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; color: #fff; font-size: 9px; font-weight: 700; cursor: default; flex-shrink: 0; letter-spacing: -0.5px; }
</style>
