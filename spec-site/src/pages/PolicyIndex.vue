<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sprints, getPagesByCategory } from '../composables/useNavStore'

const route = useRoute()
const router = useRouter()

const sprintId = computed(() => (route.params.sprint as string) || sprints.value[0]?.id || '')
const sprintConfig = computed(() => sprints.value.find(s => s.id === sprintId.value))
const epicList = computed(() => getPagesByCategory(sprintId.value, 'policy'))
</script>

<template>
  <div class="policy-index">
    <div class="policy-header">
      <h1>{{ sprintConfig?.label }} Policy</h1>
      <p class="policy-subtitle">{{ sprintConfig?.theme }} · {{ epicList.length }} epic specs</p>
    </div>

    <div class="epic-grid" v-if="epicList.length > 0">
      <div
        v-for="epic in epicList"
        :key="epic.id"
        class="epic-card"
        @click="router.push(`/policy/${sprintId}/${epic.id}`)"
      >
        <div class="epic-card-header">
          <span class="epic-id">{{ epic.id }}</span>
          <span v-if="epic.badge" class="epic-badge" :class="badgeClass(epic.badge)">{{ epic.badge }}</span>
        </div>
        <div class="epic-title">{{ epic.label }}</div>
        <div v-if="epic.description" class="epic-desc">{{ epic.description }}</div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">📋</div>
      <h2>No epic specs yet</h2>
      <p>Add epic specs in <code>.context/sprints/{{ sprintId }}/epic-specs/</code> or via the API.</p>
    </div>
  </div>
</template>

<script lang="ts">
function badgeClass(badge: string): string {
  if (badge === 'P0') return 'badge-red'
  if (badge === 'P1') return 'badge-yellow'
  if (badge === 'out') return 'badge-muted'
  return 'badge-blue'
}
</script>

<style scoped>
.policy-index { padding: 48px 40px; max-width: 960px; margin: 0 auto; }
.policy-header { margin-bottom: 32px; }
h1 { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
.policy-subtitle { font-size: 13px; color: var(--text-secondary); }

.epic-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.epic-card {
  padding: 20px;
  background: var(--card-bg);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.15s;
}
.epic-card:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
.epic-card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.epic-id { font-size: 11px; font-weight: 700; color: var(--primary); padding: 2px 6px; background: var(--primary-light); border-radius: 4px; }
.epic-badge { font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 3px; text-transform: uppercase; margin-left: auto; }
.badge-red { background: var(--red-bg); color: var(--red); }
.badge-yellow { background: var(--yellow-bg); color: var(--yellow); }
.badge-blue { background: var(--blue-bg); color: var(--blue); }
.badge-muted { background: var(--border-light); color: var(--text-muted); }
.epic-title { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
.epic-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 40px; text-align: center; color: var(--text-muted);
}
.empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.3; }
.empty-state h2 { font-size: 24px; color: var(--text-primary); margin-bottom: 8px; }
.empty-state p { font-size: 14px; line-height: 1.6; max-width: 480px; }
.empty-state code { background: var(--border-light); padding: 2px 6px; border-radius: 4px; font-size: 12px; }
</style>
