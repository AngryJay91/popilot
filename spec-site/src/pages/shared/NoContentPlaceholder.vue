<script setup lang="ts">
import { computed } from 'vue'
import { sprints } from '@/composables/useNavStore'

const props = defineProps<{
  pageId: string
  sprint: string
}>()

const sprintLabel = computed(() => sprints.value.find((s: { id: string }) => s.id === props.sprint)?.label ?? props.sprint)
</script>

<template>
  <div class="no-content">
    <div class="no-content-icon">📭</div>
    <h2>No spec available</h2>
    <p>No spec has been created for this feature in {{ sprintLabel }}.</p>
    <div class="no-content-badge">Sprint not available</div>
  </div>
</template>

<style scoped>
.no-content {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: calc(100vh - var(--header-height)); color: var(--text-muted); text-align: center; padding: 40px;
}
.no-content-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.3; }
h2 { font-size: 24px; color: var(--text-primary); margin-bottom: 8px; }
p { font-size: 14px; margin-bottom: 24px; }
.no-content-badge {
  padding: 8px 16px; border-radius: 6px;
  background: var(--border-light); color: var(--text-muted); font-size: 12px; font-weight: 600;
}
</style>
