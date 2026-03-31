<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from '@/api/client'
import { useConfirm } from '@/composables/useConfirm'

const { showConfirm } = useConfirm()

interface MemberRow {
  id: number
  display_name: string
  email: string | null
  role: string
  is_active: number
  created_at: string
  updated_at: string
}

const members = ref<MemberRow[]>([])
const loading = ref(true)
const error = ref('')

// New member form
const newName = ref('')
const newEmail = ref('')
const newTtlDays = ref<number | null>(null)

// Status message
const statusMsg = ref('')

// LLM settings
const llmApiKey = ref('')
const llmProvider = ref('openai')
const llmModel = ref('')
const settingsSaved = ref(false)

async function loadSettings() {
  const { data } = await apiGet<{ settings: Record<string, string> }>('/api/v2/admin/settings')
  if (data?.settings) {
    llmApiKey.value = data.settings.llm_api_key ?? ''
    llmProvider.value = data.settings.llm_provider ?? 'openai'
    llmModel.value = data.settings.llm_model ?? ''
  }
}

async function saveSettings() {
  settingsSaved.value = false
  await apiPut('/api/v2/admin/settings/llm_api_key', { value: llmApiKey.value || null })
  await apiPut('/api/v2/admin/settings/llm_provider', { value: llmProvider.value || null })
  await apiPut('/api/v2/admin/settings/llm_model', { value: llmModel.value || null })
  settingsSaved.value = true
  setTimeout(() => { settingsSaved.value = false }, 3000)
}

async function clearApiKey() {
  await apiPut('/api/v2/admin/settings/llm_api_key', { value: null })
  llmApiKey.value = ''
  settingsSaved.value = true
  setTimeout(() => { settingsSaved.value = false }, 3000)
}

loadSettings()

async function loadMembers() {
  loading.value = true
  const { data, error: apiError } = await apiGet<{ members: MemberRow[] }>('/api/v2/admin/members')
  if (apiError) {
    error.value = apiError
  } else if (data) {
    members.value = data.members
  }
  loading.value = false
}

function generateToken(): string {
  return crypto.randomUUID()
}

async function addMember() {
  const name = newName.value.trim()
  if (!name) return
  const token = generateToken()
  const email = newEmail.value.trim() || null
  const ttl = newTtlDays.value
  const body: Record<string, unknown> = { token, userName: name, userEmail: email }
  if (ttl && Number.isInteger(ttl) && ttl > 0 && ttl <= 3650) body.ttlDays = ttl
  const { error: apiError } = await apiPost('/api/v2/admin/members', body)
  if (apiError) {
    statusMsg.value = `Error: ${apiError}`
  } else {
    statusMsg.value = `${name} added`
    newName.value = ''
    newEmail.value = ''
    newTtlDays.value = null
    await loadMembers()
  }
  clearStatus()
}

async function revokeToken(id: string, name: string) {
  if (!await showConfirm(`Revoke token for ${name}?`)) return
  const { error: apiError } = await apiPatch(`/api/v2/admin/members/${id}/revoke`, {})
  if (!apiError) { statusMsg.value = `${name} token revoked`; await loadMembers() }
  clearStatus()
}

async function reactivateToken(id: string, name: string) {
  const { error: apiError } = await apiPatch(`/api/v2/admin/members/${id}/activate`, {})
  if (!apiError) { statusMsg.value = `${name} token reactivated`; await loadMembers() }
  clearStatus()
}

async function regenerateToken(oldToken: string, name: string) {
  if (!await showConfirm(`Regenerate token for ${name}? The old token will be invalidated.`)) return
  const newToken = generateToken()
  const { error: apiError } = await apiPost(`/api/v2/admin/members/${oldToken}/regenerate`, { newToken })
  if (!apiError) { statusMsg.value = `${name} token regenerated`; await loadMembers() }
  clearStatus()
}

async function deleteMember(id: string, name: string) {
  if (!await showConfirm(`Permanently delete ${name}? This cannot be undone.`)) return
  const { error: apiError } = await apiDelete(`/api/v2/admin/members/${id}`)
  if (!apiError) { statusMsg.value = `${name} deleted`; await loadMembers() }
  clearStatus()
}

function clearStatus() {
  setTimeout(() => { statusMsg.value = '' }, 3000)
}

function formatDate(d: string | null): string {
  if (!d) return '-'
  return d.replace('T', ' ').substring(0, 16)
}

const activeCount = computed(() => members.value.filter(m => m.is_active).length)
const totalCount = computed(() => members.value.length)

onMounted(loadMembers)
</script>

<template>
  <div class="admin">
    <div class="admin-header">
      <div class="admin-header-row">
        <div>
          <h1>Team Token Management</h1>
          <p class="admin-subtitle">This page is accessible only to administrators</p>
        </div>
      </div>
    </div>

    <!-- Status -->
    <Transition name="fade">
      <div v-if="statusMsg" class="admin-status">{{ statusMsg }}</div>
    </Transition>

    <!-- Stats -->
    <div class="admin-stats">
      <div class="stat">
        <span class="stat-num">{{ activeCount }}</span>
        <span class="stat-label">Active</span>
      </div>
      <div class="stat">
        <span class="stat-num">{{ totalCount }}</span>
        <span class="stat-label">Total</span>
      </div>
    </div>

    <!-- Add Member -->
    <div class="admin-card">
      <h2>Add Member</h2>
      <div class="add-form">
        <input v-model="newName" class="input" placeholder="Name" />
        <input v-model="newEmail" class="input" placeholder="Email (optional)" />
        <input v-model.number="newTtlDays" class="input input--sm" type="number" placeholder="TTL (days)" min="1" />
        <button class="btn btn--primary" @click="addMember" :disabled="!newName.trim()">Add</button>
      </div>
      <p class="add-hint">Leave TTL empty for unlimited</p>
    </div>

    <!-- Members Table -->
    <div class="admin-card">
      <h2>Members</h2>
      <div v-if="loading" class="admin-loading">Loading...</div>
      <div v-else-if="error" class="admin-error">{{ error }}</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in members" :key="String(m.id)" :class="{ inactive: !m.is_active }">
              <td>
                <span class="badge" :class="m.is_active ? 'badge--active' : 'badge--revoked'">
                  {{ m.is_active ? 'active' : 'revoked' }}
                </span>
              </td>
              <td class="td-name">{{ m.display_name }}</td>
              <td class="td-email">{{ m.email || '-' }}</td>
              <td>{{ m.role }}</td>
              <td class="td-date">{{ formatDate(m.created_at) }}</td>
              <td class="td-actions">
                <button v-if="m.is_active" class="btn btn--sm btn--warn" @click="revokeToken(String(m.id), m.display_name)">Revoke</button>
                <button v-else class="btn btn--sm btn--ok" @click="reactivateToken(String(m.id), m.display_name)">Activate</button>
                <button class="btn btn--sm" @click="regenerateToken(String(m.id), m.display_name)">Regen</button>
                <button class="btn btn--sm btn--danger" @click="deleteMember(String(m.id), m.display_name)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- AI Settings -->
    <div class="admin-section">
      <h2>AI Settings (BYOM)</h2>
      <div class="setting-row">
        <label>API Key</label>
        <input v-model="llmApiKey" type="password" class="setting-input" placeholder="sk-..." />
      </div>
      <div class="setting-row">
        <label>Provider</label>
        <select v-model="llmProvider" class="setting-input">
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="gemini">Gemini</option>
        </select>
      </div>
      <div class="setting-row">
        <label>Model</label>
        <input v-model="llmModel" class="setting-input" placeholder="gpt-4o-mini" />
      </div>
      <div class="setting-actions">
        <button class="btn btn--primary" @click="saveSettings">Save</button>
        <button class="btn btn--danger" @click="clearApiKey">Clear API Key</button>
        <span v-if="settingsSaved" class="save-ok">Saved</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin { max-width: 1000px; margin: 0 auto; padding: 32px 24px; }
.admin-header { margin-bottom: 24px; }
.admin-header-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.admin-header h1 { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.admin-subtitle { font-size: 13px; color: #94a3b8; }
.admin-status { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; margin-bottom: 16px; }
.admin-stats { display: flex; gap: 16px; margin-bottom: 24px; }
.stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 24px; display: flex; flex-direction: column; align-items: center; min-width: 80px; }
.stat-num { font-size: 28px; font-weight: 700; color: #1e293b; }
.stat-label { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.admin-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; }
.admin-card h2 { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
.add-form { display: flex; gap: 8px; flex-wrap: wrap; }
.input { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; flex: 1; min-width: 120px; }
.input--sm { max-width: 100px; flex: none; }
.input:focus { outline: none; border-color: #3b82f6; }
.add-hint { font-size: 11px; color: #94a3b8; margin-top: 8px; }
.btn { padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; background: #fff; color: #475569; white-space: nowrap; transition: all 0.15s; }
.btn:hover { background: #f1f5f9; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary { background: #1e293b; color: #fff; border-color: #1e293b; }
.btn--primary:hover { background: #334155; }
.btn--sm { padding: 4px 10px; font-size: 11px; }
.btn--warn { color: #f59e0b; border-color: #fcd34d; }
.btn--ok { color: #22c55e; border-color: #86efac; }
.btn--danger { color: #ef4444; border-color: #fca5a5; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
td { padding: 10px; border-bottom: 1px solid #f1f5f9; color: #475569; vertical-align: middle; }
tr.inactive td { opacity: 0.5; }
tr:hover td { background: #f8fafc; }
.td-name { font-weight: 600; color: #1e293b; }
.td-email { font-size: 12px; }
.td-date { font-size: 11px; color: #94a3b8; white-space: nowrap; }
.td-actions { display: flex; gap: 4px; flex-wrap: nowrap; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
.badge--active { background: #ecfdf5; color: #059669; }
.badge--revoked { background: #fef2f2; color: #dc2626; }
.admin-loading, .admin-error { padding: 20px; text-align: center; color: #94a3b8; font-size: 14px; }
.admin-error { color: #ef4444; }
.admin-section { margin-top: 32px; padding: 20px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; }
.admin-section h2 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
.setting-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.setting-row label { width: 100px; font-size: 13px; font-weight: 500; color: #64748b; flex-shrink: 0; }
.setting-input { flex: 1; padding: 8px 12px; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; font-size: 13px; }
.setting-actions { display: flex; gap: 8px; align-items: center; }
.save-ok { font-size: 12px; color: #16a34a; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@media (max-width: 767px) { .admin { padding: 16px; } .add-form { flex-direction: column; } .td-actions { flex-wrap: wrap; } }
</style>
