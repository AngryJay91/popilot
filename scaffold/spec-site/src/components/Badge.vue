<script setup lang="ts">
defineProps<{
  variant: 'red' | 'yellow' | 'green' | 'blue'
  label: string
}>()
</script>

<template>
  <span class="badge" :class="`badge-${variant}`">{{ label }}</span>
</template>

<style scoped>
.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
}
.badge-red { background: var(--red-bg); color: var(--red); border: 1px solid var(--red-border); }
.badge-yellow { background: var(--yellow-bg); color: var(--yellow); border: 1px solid var(--yellow-border); }
.badge-green { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-border); }
.badge-blue { background: var(--blue-bg); color: var(--blue); border: 1px solid var(--blue-border); }
</style>
