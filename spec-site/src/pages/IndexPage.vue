<script setup lang="ts">
import { useRouter } from 'vue-router'
import { featurePages } from '@/data/navigation'

const router = useRouter()
</script>

<template>
  <div class="index-page">
    <div class="index-header">
      <!-- TODO: Replace with your project name and description -->
      <h1>Spec Site</h1>
      <p class="index-subtitle">Interactive mockups + detailed specs</p>
    </div>

    <div class="feature-grid" v-if="featurePages.length > 0">
      <div
        v-for="feat in featurePages"
        :key="feat.id"
        class="feature-card"
        @click="router.push(`/${feat.id}`)"
      >
        <div class="feature-card-header">
          <span class="feature-icon">{{ feat.icon }}</span>
        </div>
        <div class="feature-title">{{ feat.label }}</div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">📋</div>
      <h2>No feature pages yet</h2>
      <p>Add feature pages in <code>src/data/navigation.ts</code> and register wireframes in <code>src/data/wireframeRegistry.ts</code>.</p>
    </div>
  </div>
</template>

<style scoped>
.index-page { padding: 48px 40px; max-width: 900px; margin: 0 auto; }
.index-header { margin-bottom: 40px; }
h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
.index-subtitle { font-size: 14px; color: var(--text-secondary); }
.feature-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.feature-card {
  padding: 24px;
  background: var(--card-bg);
  border-radius: var(--radius);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.15s;
}
.feature-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.feature-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.feature-icon { font-size: 28px; }
.feature-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 40px; text-align: center; color: var(--text-muted);
}
.empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.3; }
.empty-state h2 { font-size: 24px; color: var(--text-primary); margin-bottom: 8px; }
.empty-state p { font-size: 14px; line-height: 1.6; max-width: 480px; }
.empty-state code { background: var(--border-light); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
</style>
