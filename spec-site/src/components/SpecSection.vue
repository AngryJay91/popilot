<script setup lang="ts">
defineProps<{
  areaId: string
  title: string
  ruleCount?: number
}>()
</script>

<template>
  <div class="spec-section" :id="`spec-section-${areaId}`">
    <div class="sb-area">
      <div class="sb-area-head">
        <div class="a-id">{{ areaId }}</div>
        <div class="a-title">{{ title }}</div>
        <div v-if="ruleCount" class="a-badge">{{ ruleCount }} rules</div>
      </div>
      <div class="sb-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.spec-section {
  border-bottom: 1px solid var(--border);
}
.sb-area-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border-light);
}
.a-id {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.a-title { font-size: 14px; font-weight: 700; flex: 1; }
.a-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--blue-bg);
  color: var(--blue);
  border: 1px solid var(--blue-border);
}
.sb-body { padding: 16px; }
</style>
