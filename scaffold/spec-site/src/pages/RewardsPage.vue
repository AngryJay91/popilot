<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiGet } from '@/api/client'

interface RewardEntry {
  id: number
  user: string
  type: 'reward' | 'penalty'
  amount: number
  reason: string
  created_at: string
}

interface RewardsData {
  balance: number
  entries: RewardEntry[]
}

const loading = ref(true)
const error = ref<string | null>(null)
const data = ref<RewardsData | null>(null)

onMounted(async () => {
  const { data: resp, error: err } = await apiGet<RewardsData>('/api/v2/rewards')
  if (err) {
    error.value = err
  } else if (resp) {
    data.value = resp
  }
  loading.value = false
})
</script>

<template>
  <div class="rewards-page">
    <h1>Rewards</h1>
    <p class="page-desc">Team rewards and penalties tracker.</p>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <span>Loading rewards...</span>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">&#9888;</div>
      <p>{{ error }}</p>
    </div>

    <template v-else-if="data">
      <!-- Balance -->
      <div class="balance-card">
        <div class="balance-label">Current Balance</div>
        <div class="balance-value" :class="{ negative: data.balance < 0 }">
          {{ data.balance >= 0 ? '+' : '' }}{{ data.balance }}
        </div>
      </div>

      <!-- Entries -->
      <div class="section">
        <h2>History</h2>
        <div v-if="!data.entries.length" class="empty-msg">No reward entries yet.</div>
        <div v-for="entry in data.entries" :key="entry.id" class="entry-item">
          <div class="entry-type" :class="entry.type">
            {{ entry.type === 'reward' ? '+' : '-' }}{{ Math.abs(entry.amount) }}
          </div>
          <div class="entry-info">
            <div class="entry-reason">{{ entry.reason }}</div>
            <div class="entry-meta">
              <span class="entry-user">{{ entry.user }}</span>
              <span class="entry-date">{{ entry.created_at }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.rewards-page { padding: 32px 40px; max-width: 720px; margin: 0 auto; }
h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
.page-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 24px; }

.loading-state, .error-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 80px 0; gap: 12px; color: var(--text-muted);
}
.loading-spinner {
  width: 28px; height: 28px; border: 3px solid var(--border);
  border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.error-icon { font-size: 32px; }
.error-state p { color: var(--red); font-size: 14px; }

.balance-card {
  padding: 24px; background: var(--card-bg); border: 1px solid var(--border-light);
  border-radius: var(--radius); text-align: center; margin-bottom: 32px;
}
.balance-label { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
.balance-value { font-size: 36px; font-weight: 700; color: var(--green, #22c55e); }
.balance-value.negative { color: var(--red, #ef4444); }

.section { margin-bottom: 32px; }
.section h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
.empty-msg { font-size: 13px; color: var(--text-muted); }

.entry-item {
  display: flex; gap: 12px; padding: 12px 16px;
  border: 1px solid var(--border-light); border-radius: var(--radius);
  margin-bottom: 8px; background: var(--card-bg); align-items: flex-start;
}
.entry-type {
  flex-shrink: 0; font-size: 14px; font-weight: 700; min-width: 48px; text-align: center;
  padding: 4px 8px; border-radius: 6px;
}
.entry-type.reward { background: rgba(34,197,94,0.1); color: #22c55e; }
.entry-type.penalty { background: rgba(239,68,68,0.1); color: #ef4444; }
.entry-info { flex: 1; min-width: 0; }
.entry-reason { font-size: 14px; font-weight: 500; margin-bottom: 4px; }
.entry-meta { display: flex; gap: 12px; font-size: 12px; color: var(--text-muted); }
</style>
