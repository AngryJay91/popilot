<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiGet, apiPost, apiPatch, isStaticMode } from '@/api/client'

interface Reward {
  id: number; member_name: string; type: 'reward' | 'penalty'
  amount: number; reason: string; status: string; issued_by: string
  tx_hash: string | null; paid_at: string | null; created_at: string
}
interface Summary {
  member_name: string; total_rewards: number; total_penalties: number
  balance: number; pending_balance: number
}
interface Member {
  id: number; display_name: string; wallet_address: string | null
}

const rewards = ref<Reward[]>([])
const summary = ref<Summary[]>([])
const members = ref<Member[]>([])
const loading = ref(true)
const filterMember = ref('')
const activeTab = ref<'pending' | 'all'>('pending')

// Create form
const showForm = ref(false)
const formMember = ref('')
const formType = ref<'reward' | 'penalty'>('reward')
const formAmount = ref(0)
const formReason = ref('')

// Wallet editing
const editingWallet = ref<number | null>(null)
const walletInput = ref('')

// Payment
const selectedIds = ref<Set<number>>(new Set())
const txHashInput = ref('')

const pendingRewards = computed(() => rewards.value.filter(r => r.status === 'pending'))

const filteredRewards = computed(() => {
  let list = activeTab.value === 'pending' ? pendingRewards.value : rewards.value
  if (filterMember.value) list = list.filter(r => r.member_name === filterMember.value)
  return list
})

async function loadData() {
  if (isStaticMode()) { loading.value = false; return }
  loading.value = true
  const [rewardsRes, summaryRes, membersRes] = await Promise.all([
    apiGet('/api/v2/rewards'),
    apiGet('/api/v2/rewards/summary'),
    apiGet('/api/v2/admin/members'),
  ])
  if (rewardsRes.data?.rewards) rewards.value = rewardsRes.data.rewards as Reward[]
  if (summaryRes.data?.summary) summary.value = summaryRes.data.summary as Summary[]
  if (membersRes.data?.members) members.value = (membersRes.data.members as Member[]).filter((m: any) => m.is_active)
  loading.value = false
}

async function addReward() {
  if (!formMember.value || !formAmount.value || !formReason.value) return
  await apiPost('/api/v2/rewards', { memberName: formMember.value, type: formType.value, amount: formAmount.value, reason: formReason.value })
  showForm.value = false; formMember.value = ''; formAmount.value = 0; formReason.value = ''
  await loadData()
}

async function paySelected() {
  for (const id of selectedIds.value) {
    await apiPatch(`/api/v2/rewards/${id}/pay`, { txHash: txHashInput.value || null })
  }
  selectedIds.value.clear(); txHashInput.value = ''
  await loadData()
}

async function batchPay(memberName: string) {
  await apiPatch('/api/v2/rewards/batch-pay', { memberName, txHash: txHashInput.value || null })
  txHashInput.value = ''
  await loadData()
}

function startEditWallet(m: Member) {
  editingWallet.value = m.id; walletInput.value = m.wallet_address || ''
}

async function saveWallet(memberId: number) {
  await apiPatch(`/api/v2/admin/members/${memberId}`, { wallet_address: walletInput.value })
  editingWallet.value = null
  await loadData()
}

function toggleSelect(id: number) {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  else selectedIds.value.add(id)
}

function formatDate(d: string) {
  if (!d) return ''
  const date = new Date(d.endsWith('Z') ? d : d + 'Z')
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function getMemberWallet(name: string) {
  return members.value.find(m => m.display_name === name)?.wallet_address || ''
}

function copyAddr(addr: string | null) {
  if (!addr) return
  navigator.clipboard.writeText(addr)
}

onMounted(loadData)
</script>

<template>
  <div class="rewards-page">
    <div class="rewards-header">
      <h1>Rewards &amp; Penalties</h1>
      <button class="btn-add" @click="showForm = !showForm">{{ showForm ? 'Cancel' : '+ Add Entry' }}</button>
    </div>

    <!-- Create form -->
    <div v-if="showForm" class="form-card">
      <div class="form-row">
        <select v-model="formMember" class="input">
          <option value="">Select Member</option>
          <option v-for="m in members" :key="m.id" :value="m.display_name">{{ m.display_name }}</option>
        </select>
        <select v-model="formType" class="input">
          <option value="reward">Reward (+)</option>
          <option value="penalty">Penalty (-)</option>
        </select>
        <input v-model.number="formAmount" class="input" type="number" placeholder="Amount" />
      </div>
      <input v-model="formReason" class="input full" placeholder="Reason" @keydown.enter="addReward" />
      <button class="btn-submit" @click="addReward" :disabled="!formMember || !formAmount || !formReason">Submit</button>
    </div>

    <!-- Member balance cards -->
    <section class="summary-section">
      <h2>Balance by Member</h2>
      <div class="summary-grid">
        <div v-for="s in summary" :key="s.member_name" class="summary-card">
          <div class="summary-top">
            <div class="summary-name">{{ s.member_name }}</div>
            <div class="summary-balance" :class="{ negative: s.balance < 0 }">{{ s.balance.toLocaleString() }}</div>
          </div>
          <div class="summary-wallet">
            <template v-if="editingWallet === members.find(m => m.display_name === s.member_name)?.id">
              <input v-model="walletInput" class="wallet-input" placeholder="Wallet address" @keydown.enter="saveWallet(members.find(m => m.display_name === s.member_name)!.id)" />
              <button class="btn-sm" @click="saveWallet(members.find(m => m.display_name === s.member_name)!.id)">Save</button>
            </template>
            <template v-else>
              <span class="wallet-addr" @click="copyAddr(getMemberWallet(s.member_name))" :title="getMemberWallet(s.member_name)">{{ getMemberWallet(s.member_name)?.slice(0,12) || 'Not set' }}...</span>
              <button class="btn-edit" @click="startEditWallet(members.find(m => m.display_name === s.member_name)!)">Edit</button>
            </template>
          </div>
          <div class="summary-detail">
            <span class="reward-text">+{{ s.total_rewards.toLocaleString() }}</span>
            <span class="penalty-text">-{{ s.total_penalties.toLocaleString() }}</span>
            <span v-if="s.pending_balance" class="pending-text">Pending: {{ s.pending_balance.toLocaleString() }}</span>
          </div>
          <button v-if="s.pending_balance > 0" class="btn-batch-pay" @click="batchPay(s.member_name)">Pay All</button>
        </div>
      </div>
    </section>

    <!-- Tabs -->
    <div class="tab-row">
      <button :class="['tab-btn', { active: activeTab === 'pending' }]" @click="activeTab = 'pending'">Pending</button>
      <button :class="['tab-btn', { active: activeTab === 'all' }]" @click="activeTab = 'all'">All</button>
      <select v-model="filterMember" class="input filter-select">
        <option value="">All Members</option>
        <option v-for="s in summary" :key="s.member_name" :value="s.member_name">{{ s.member_name }}</option>
      </select>
    </div>

    <!-- Batch pay bar -->
    <div v-if="selectedIds.size > 0 && activeTab === 'pending'" class="pay-bar">
      <span>{{ selectedIds.size }} selected</span>
      <input v-model="txHashInput" class="input" placeholder="TX hash (optional)" />
      <button class="btn-pay" @click="paySelected">Pay Selected</button>
    </div>

    <!-- List -->
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="!filteredRewards.length" class="empty">No entries found.</div>
    <div v-else class="rewards-list">
      <div v-for="r in filteredRewards" :key="r.id" class="reward-item" :class="'type--' + r.type">
        <input v-if="activeTab === 'pending'" type="checkbox" :checked="selectedIds.has(r.id)" @change="toggleSelect(r.id)" class="reward-check" />
        <div class="reward-main">
          <span class="reward-type-badge">{{ r.type === 'reward' ? 'Reward' : 'Penalty' }}</span>
          <span class="reward-member">{{ r.member_name }}</span>
          <span class="reward-amount" :class="r.type">{{ r.type === 'reward' ? '+' : '-' }}{{ r.amount.toLocaleString() }}</span>
          <span class="reward-status" :class="'st--' + r.status">{{ r.status === 'paid' ? 'Paid' : 'Pending' }}</span>
        </div>
        <div class="reward-reason">{{ r.reason }}</div>
        <div class="reward-meta">
          <span>{{ r.issued_by }}</span>
          <span>{{ formatDate(r.created_at) }}</span>
          <a v-if="r.tx_hash" class="tx-hash" :href="`https://tronscan.org/#/transaction/${r.tx_hash}`" target="_blank">TX: {{ r.tx_hash.slice(0, 12) }}...</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rewards-page { max-width: 800px; margin: 0 auto; padding: 24px 16px; }
.rewards-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.rewards-header h1 { font-size: 20px; font-weight: 700; }
.btn-add { background: #3b82f6; color: #fff; border: none; border-radius: 10px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }

.form-card { background: var(--card-bg, #fff); border-radius: 16px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.form-row { display: flex; gap: 8px; margin-bottom: 8px; }
.input { border: 1px solid rgba(0,0,0,0.15); border-radius: 8px; padding: 8px 12px; font-size: 13px; }
.input.full { width: 100%; margin-bottom: 8px; box-sizing: border-box; }
.btn-submit { background: #22c55e; color: #fff; border: none; border-radius: 8px; padding: 8px 16px; font-size: 13px; cursor: pointer; }

.summary-section { margin-bottom: 24px; }
.summary-section h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.summary-card { background: var(--card-bg, #fff); border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.summary-top { display: flex; justify-content: space-between; align-items: center; }
.summary-name { font-size: 14px; font-weight: 600; }
.summary-balance { font-size: 18px; font-weight: 700; color: #22c55e; }
.summary-balance.negative { color: #ef4444; }
.summary-wallet { display: flex; align-items: center; gap: 4px; margin-top: 8px; font-size: 11px; color: var(--text-muted, #888); }
.wallet-input { flex: 1; font-size: 11px; padding: 4px 6px; border: 1px solid #ddd; border-radius: 4px; }
.wallet-addr { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; cursor: pointer; }
.wallet-addr:hover { color: #3b82f6; }
.btn-edit { background: none; border: none; color: #3b82f6; font-size: 11px; cursor: pointer; }
.btn-sm { background: #3b82f6; color: #fff; border: none; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer; }
.summary-detail { font-size: 11px; color: var(--text-muted, #888); margin-top: 4px; display: flex; gap: 8px; }
.reward-text { color: #22c55e; } .penalty-text { color: #ef4444; } .pending-text { color: #f59e0b; }
.btn-batch-pay { width: 100%; margin-top: 8px; background: #3b82f6; color: #fff; border: none; border-radius: 8px; padding: 6px; font-size: 12px; cursor: pointer; }

.tab-row { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; }
.tab-btn { background: #f3f4f6; border: none; border-radius: 8px; padding: 6px 14px; font-size: 13px; cursor: pointer; }
.tab-btn.active { background: #3b82f6; color: #fff; }
.filter-select { margin-left: auto; }

.pay-bar { display: flex; gap: 8px; align-items: center; background: #eff6ff; padding: 8px 12px; border-radius: 8px; margin-bottom: 12px; font-size: 13px; }
.btn-pay { background: #22c55e; color: #fff; border: none; border-radius: 6px; padding: 6px 12px; font-size: 12px; cursor: pointer; }

.rewards-list { display: flex; flex-direction: column; gap: 6px; }
.reward-item { display: flex; align-items: flex-start; gap: 8px; background: var(--card-bg, #fff); border-radius: 10px; padding: 10px 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); flex-wrap: wrap; }
.type--reward { border-left: 3px solid #22c55e; } .type--penalty { border-left: 3px solid #ef4444; }
.reward-check { margin-top: 4px; }
.reward-main { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; }
.reward-type-badge { font-size: 10px; font-weight: 600; padding: 1px 5px; border-radius: 4px; }
.type--reward .reward-type-badge { background: #dcfce7; color: #16a34a; }
.type--penalty .reward-type-badge { background: #fef2f2; color: #dc2626; }
.reward-member { font-weight: 600; font-size: 13px; }
.reward-amount { font-weight: 700; font-size: 14px; margin-left: auto; }
.reward-amount.reward { color: #22c55e; } .reward-amount.penalty { color: #ef4444; }
.reward-status { font-size: 10px; padding: 1px 5px; border-radius: 4px; }
.st--pending { background: #fef3c7; color: #d97706; } .st--paid { background: #dcfce7; color: #16a34a; }
.reward-reason { font-size: 12px; color: var(--text-secondary, #666); width: 100%; }
.reward-meta { display: flex; gap: 8px; font-size: 11px; color: var(--text-muted, #888); width: 100%; }
.tx-hash { font-family: monospace; font-size: 10px; color: #3b82f6; text-decoration: none; }
.tx-hash:hover { text-decoration: underline; }
.loading, .empty { text-align: center; color: var(--text-muted, #888); padding: 40px; }
@media (max-width: 640px) { .form-row { flex-direction: column; } .summary-grid { grid-template-columns: 1fr; } .tab-row { flex-wrap: wrap; } }
</style>
