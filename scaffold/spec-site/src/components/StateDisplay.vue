<script setup lang="ts">
defineProps<{
  type: 'loading' | 'empty' | 'error'
  message?: string
  ctaLabel?: string
  ctaTo?: string
}>()

const emit = defineEmits<{ cta: [] }>()
</script>

<template>
  <div class="state-display" :class="`state--${type}`">
    <template v-if="type === 'loading'">
      <div class="spinner" />
      <p>{{ message || 'Loading...' }}</p>
    </template>

    <template v-if="type === 'empty'">
      <div class="empty-icon">📭</div>
      <p>{{ message || 'No data available' }}</p>
      <router-link v-if="ctaTo" :to="ctaTo" class="cta-btn">{{ ctaLabel || 'Get started' }}</router-link>
      <button v-else-if="ctaLabel" class="cta-btn" @click="emit('cta')">{{ ctaLabel }}</button>
    </template>

    <template v-if="type === 'error'">
      <div class="error-icon">⚠️</div>
      <p>{{ message || 'Something went wrong' }}</p>
      <button class="cta-btn" @click="emit('cta')">{{ ctaLabel || 'Retry' }}</button>
    </template>
  </div>
</template>

<style scoped>
.state-display {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 48px 24px; text-align: center; gap: 12px;
}
.state-display p { color: var(--text-secondary); font-size: 14px; }
.spinner {
  width: 32px; height: 32px; border: 3px solid rgba(0,0,0,0.06);
  border-top-color: var(--primary); border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon, .error-icon { font-size: 40px; }
.cta-btn {
  margin-top: 8px; padding: 8px 20px; border-radius: 10px;
  background: var(--primary); color: #fff; border: none;
  font-size: 14px; font-weight: 500; cursor: pointer;
  text-decoration: none; display: inline-block;
}
.cta-btn:hover { opacity: 0.9; }
</style>
