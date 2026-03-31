<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  sprints, epics, loaded, loadNavData,
  addSprint, updateSprint, deleteSprint, setActiveSprint,
  addEpic, updateEpic, deleteEpic, carryOverEpic,
  type SprintConfig, type PageConfig,
} from '@/composables/useNavStore'
import { useConfirm } from '@/composables/useConfirm'

const { showConfirm } = useConfirm()

const router = useRouter()
const statusMsg = ref('')
const loading = ref(true)

// -- Sprint form --
const showSprintForm = ref(false)
const sprintForm = ref({ id: '', label: '', theme: '', startDate: '', endDate: '' })

// -- Epic form (per sprint) --
const epicFormSprint = ref<string | null>(null)
const epicForm = ref({ epicId: '', label: '', badge: '', category: 'policy', description: '' })

// -- Inline edit --
const editingSprint = ref<string | null>(null)
const editSprintData = ref({ label: '', theme: '', startDate: '', endDate: '' })

const editingEpic = ref<string | null>(null) // "sprint:epicId"
const editEpicData = ref({ label: '', badge: '', category: 'policy', description: '' })

// -- Carryover form --
const carryoverEpic = ref<string | null>(null) // uid
const carryoverForm = ref({ targetSprint: '', newEpicId: '', newLabel: '', newBadge: '' })

function startCarryover(e: PageConfig) {
  const uid = e.uid ?? `${e.sprint}:${e.id}`
  carryoverEpic.value = uid
  carryoverForm.value = { targetSprint: '', newEpicId: '', newLabel: e.label, newBadge: e.badge ?? '' }
}

async function handleCarryover() {
  if (!carryoverEpic.value || !carryoverForm.value.targetSprint || !carryoverForm.value.newEpicId) return
  const f = carryoverForm.value
  const r = await carryOverEpic(
    carryoverEpic.value,
    f.targetSprint,
    f.newEpicId,
    f.newLabel || undefined,
    f.newBadge || undefined,
  )
  if (r.error) {
    statusMsg.value = `Error: ${r.error}`
  } else {
    statusMsg.value = `Carryover complete -> ${f.targetSprint}`
    carryoverEpic.value = null
  }
  clearStatus()
}

function clearStatus() {
  setTimeout(() => { statusMsg.value = '' }, 3000)
}

function epicsForSprint(sprintId: string): PageConfig[] {
  return epics.value
    .filter(e => e.sprint === sprintId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

// -- Sprint CRUD --

async function handleAddSprint() {
  const { id, label, theme, startDate, endDate } = sprintForm.value
  if (!id.trim() || !label.trim() || !theme.trim()) return
  const r = await addSprint({
    id: id.trim(),
    label: label.trim(),
    theme: theme.trim(),
    startDate: startDate || null,
    endDate: endDate || null,
  })
  if (r.error) {
    statusMsg.value = `Error: ${r.error}`
  } else {
    statusMsg.value = `${label} added`
    sprintForm.value = { id: '', label: '', theme: '', startDate: '', endDate: '' }
    showSprintForm.value = false
  }
  clearStatus()
}

function startEditSprint(s: SprintConfig) {
  editingSprint.value = s.id
  editSprintData.value = {
    label: s.label,
    theme: s.theme,
    startDate: s.startDate ?? '',
    endDate: s.endDate ?? '',
  }
}

async function saveEditSprint(id: string) {
  const d = editSprintData.value
  const r = await updateSprint(id, {
    label: d.label,
    theme: d.theme,
    startDate: d.startDate || null,
    endDate: d.endDate || null,
  })
  if (r.error) {
    statusMsg.value = `Error: ${r.error}`
  } else {
    statusMsg.value = 'Sprint updated'
    editingSprint.value = null
  }
  clearStatus()
}

async function handleSetActive(id: string) {
  const r = await setActiveSprint(id)
  if (!r.error) statusMsg.value = `${id} activated`
  clearStatus()
}

async function handleDeleteSprint(id: string, label: string) {
  if (!await showConfirm(`Delete sprint "${label}" and all its epics? This cannot be undone.`)) return
  const r = await deleteSprint(id)
  if (r.error) {
    statusMsg.value = `Error: ${r.error}`
  } else {
    statusMsg.value = `${label} deleted`
  }
  clearStatus()
}

// -- Epic CRUD --

function showEpicForm(sprintId: string) {
  epicFormSprint.value = sprintId
  epicForm.value = { epicId: '', label: '', badge: '', category: 'policy', description: '' }
}

async function handleAddEpic() {
  if (!epicFormSprint.value) return
  const { epicId, label, badge, category, description } = epicForm.value
  if (!epicId.trim() || !label.trim()) return
  const r = await addEpic(epicFormSprint.value, {
    epicId: epicId.trim(),
    label: label.trim(),
    badge: badge.trim() || null,
    category,
    description: description.trim() || null,
  })
  if (r.error) {
    statusMsg.value = `Error: ${r.error}`
  } else {
    statusMsg.value = `${epicId} added`
    epicFormSprint.value = null
  }
  clearStatus()
}

function startEditEpic(e: PageConfig) {
  editingEpic.value = `${e.sprint}:${e.id}`
  editEpicData.value = {
    label: e.label,
    badge: e.badge ?? '',
    category: e.category,
    description: e.description ?? '',
  }
}

async function saveEditEpic(sprint: string, epicId: string) {
  const d = editEpicData.value
  const r = await updateEpic(sprint, epicId, {
    label: d.label,
    badge: d.badge || null,
    category: d.category,
    description: d.description || null,
  })
  if (r.error) {
    statusMsg.value = `Error: ${r.error}`
  } else {
    statusMsg.value = `${epicId} updated`
    editingEpic.value = null
  }
  clearStatus()
}

async function handleDeleteEpic(sprint: string, epicId: string) {
  if (!await showConfirm(`Delete ${epicId}? This cannot be undone.`)) return
  const r = await deleteEpic(sprint, epicId)
  if (r.error) {
    statusMsg.value = `Error: ${r.error}`
  } else {
    statusMsg.value = `${epicId} deleted`
  }
  clearStatus()
}

onMounted(async () => {
  if (!loaded.value) await loadNavData()
  loading.value = false
})
</script>

<template>
  <div class="admin">
    <div class="admin-header">
      <h1>Sprint & Epic Management</h1>
      <p class="admin-subtitle">Admin page — accessible only with the URL</p>
    </div>

    <!-- Status -->
    <Transition name="fade">
      <div v-if="statusMsg" class="admin-status">{{ statusMsg }}</div>
    </Transition>

    <!-- Top actions -->
    <div class="top-actions">
      <button class="btn btn--primary" @click="showSprintForm = !showSprintForm">
        {{ showSprintForm ? 'Cancel' : '+ New Sprint' }}
      </button>
      <button class="btn" @click="router.push('/admin/board')">Story Management</button>
      <button class="btn" @click="router.push('/admin')">Token Management</button>
    </div>

    <!-- Sprint add form -->
    <div v-if="showSprintForm" class="admin-card">
      <h2>Add New Sprint</h2>
      <div class="form-grid">
        <input v-model="sprintForm.id" class="input" placeholder="ID (e.g. s55)" />
        <input v-model="sprintForm.label" class="input" placeholder="Label (e.g. S55)" />
        <input v-model="sprintForm.theme" class="input input--wide" placeholder="Theme (e.g. Impact Feature Launch)" />
        <input v-model="sprintForm.startDate" class="input" type="date" placeholder="Start date" />
        <input v-model="sprintForm.endDate" class="input" type="date" placeholder="End date" />
        <button class="btn btn--primary" @click="handleAddSprint" :disabled="!sprintForm.id.trim() || !sprintForm.label.trim()">Add</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="admin-loading">Loading...</div>

    <!-- Sprint cards -->
    <div v-else class="sprint-list">
      <div v-for="s in sprints" :key="s.id" class="sprint-card">
        <!-- Sprint header -->
        <div class="sprint-card-header">
          <template v-if="editingSprint === s.id">
            <div class="edit-row">
              <input v-model="editSprintData.label" class="input input--sm" placeholder="Label" />
              <input v-model="editSprintData.theme" class="input" placeholder="Theme" />
              <input v-model="editSprintData.startDate" class="input input--sm" type="date" />
              <input v-model="editSprintData.endDate" class="input input--sm" type="date" />
              <button class="btn btn--sm btn--primary" @click="saveEditSprint(s.id)">Save</button>
              <button class="btn btn--sm" @click="editingSprint = null">Cancel</button>
            </div>
          </template>
          <template v-else>
            <div class="sprint-info">
              <span class="sprint-label">{{ s.label }}</span>
              <span class="sprint-theme-text">{{ s.theme }}</span>
              <span class="lifecycle-badge" :class="'lc--' + (s.status || (s.active ? 'active' : 'planning'))">
                {{ s.status === 'closed' ? 'Closed' : s.status === 'active' || s.active ? 'Active' : 'Planning' }}
              </span>
            </div>
            <div v-if="s.startDate || s.endDate" class="sprint-dates">
              {{ s.startDate ?? '?' }} ~ {{ s.endDate ?? '?' }}
            </div>
            <div class="sprint-actions">
              <button class="btn btn--sm" @click="startEditSprint(s)">Edit</button>
              <button v-if="!s.active" class="btn btn--sm btn--ok" @click="handleSetActive(s.id)">Activate</button>
              <button v-else class="btn btn--sm" disabled>Currently Active</button>
              <button class="btn btn--sm btn--danger" @click="handleDeleteSprint(s.id, s.label)">Delete</button>
            </div>
            <!-- Lifecycle actions -->
            <div class="sprint-lifecycle">
              <button
                v-if="s.status === 'planning' || (!s.status && !s.active)"
                class="btn btn--sm btn--lifecycle"
                @click="router.push(`/kickoff/${s.id}`)"
              >Kickoff</button>
              <button
                v-if="s.status === 'active' || s.active"
                class="btn btn--sm btn--lifecycle"
                @click="router.push(`/close/${s.id}`)"
              >Close</button>
              <button
                v-if="s.status === 'closed'"
                class="btn btn--sm btn--lifecycle"
                @click="router.push(`/retro/${s.id}`)"
              >Retro</button>
            </div>
          </template>
        </div>

        <!-- Epics table -->
        <div class="epic-section">
          <table class="epic-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Label</th>
                <th>Badge</th>
                <th>Category</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="e in epicsForSprint(s.id)" :key="e.id">
                <template v-if="editingEpic === `${s.id}:${e.id}`">
                  <td class="td-id">{{ e.id }}</td>
                  <td><input v-model="editEpicData.label" class="input input--sm" /></td>
                  <td><input v-model="editEpicData.badge" class="input input--xs" placeholder="-" /></td>
                  <td>
                    <select v-model="editEpicData.category" class="input input--xs">
                      <option value="policy">policy</option>
                      <option value="wireframe">wireframe</option>
                    </select>
                  </td>
                  <td><input v-model="editEpicData.description" class="input input--sm" /></td>
                  <td class="td-actions">
                    <button class="btn btn--sm btn--primary" @click="saveEditEpic(s.id, e.id)">Save</button>
                    <button class="btn btn--sm" @click="editingEpic = null">Cancel</button>
                  </td>
                </template>
                <template v-else>
                  <td class="td-id">{{ e.id }}</td>
                  <td class="td-label">{{ e.label }}</td>
                  <td><span v-if="e.badge" class="epic-badge">{{ e.badge }}</span></td>
                  <td class="td-cat">{{ e.category }}</td>
                  <td class="td-desc">{{ e.description }}</td>
                  <td class="td-actions">
                    <button class="btn btn--sm" @click="startEditEpic(e)">Edit</button>
                    <button class="btn btn--sm btn--ok" @click="startCarryover(e)">Carryover</button>
                    <button class="btn btn--sm btn--danger" @click="handleDeleteEpic(s.id, e.id)">Delete</button>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>

          <!-- Carryover form -->
          <div v-if="carryoverEpic && epicsForSprint(s.id).some(e => (e.uid ?? `${e.sprint}:${e.id}`) === carryoverEpic)" class="add-epic-form">
            <span class="carryover-label">Carryover:</span>
            <select v-model="carryoverForm.targetSprint" class="input input--sm">
              <option value="" disabled>Target sprint</option>
              <option v-for="sp in sprints.filter(x => x.id !== s.id)" :key="sp.id" :value="sp.id">{{ sp.label }}</option>
            </select>
            <input v-model="carryoverForm.newEpicId" class="input input--xs" placeholder="New ID (E-01)" />
            <input v-model="carryoverForm.newLabel" class="input input--sm" placeholder="Label" />
            <input v-model="carryoverForm.newBadge" class="input input--xs" placeholder="Badge" />
            <button class="btn btn--sm btn--primary" @click="handleCarryover" :disabled="!carryoverForm.targetSprint || !carryoverForm.newEpicId">Move</button>
            <button class="btn btn--sm" @click="carryoverEpic = null">Cancel</button>
          </div>

          <!-- Add epic form (inline) -->
          <div v-if="epicFormSprint === s.id" class="add-epic-form">
            <input v-model="epicForm.epicId" class="input input--xs" placeholder="ID (E-07)" />
            <input v-model="epicForm.label" class="input input--sm" placeholder="Label" />
            <input v-model="epicForm.badge" class="input input--xs" placeholder="Badge" />
            <select v-model="epicForm.category" class="input input--xs">
              <option value="policy">policy</option>
              <option value="wireframe">wireframe</option>
            </select>
            <input v-model="epicForm.description" class="input" placeholder="Description" />
            <button class="btn btn--sm btn--primary" @click="handleAddEpic" :disabled="!epicForm.epicId.trim() || !epicForm.label.trim()">Add</button>
            <button class="btn btn--sm" @click="epicFormSprint = null">Cancel</button>
          </div>
          <button v-else class="btn btn--sm add-epic-btn" @click="showEpicForm(s.id)">+ Add Epic</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px;
  font-family: system-ui, -apple-system, sans-serif;
}
.admin-header { margin-bottom: 24px; }
.admin-header h1 { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.admin-subtitle { font-size: 13px; color: #94a3b8; }

.admin-status {
  background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46;
  padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 500;
  margin-bottom: 16px;
}

.top-actions {
  display: flex; gap: 8px; margin-bottom: 20px;
}

.admin-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 20px 24px; margin-bottom: 20px;
}
.admin-card h2 { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }

.form-grid {
  display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
}

.sprint-list { display: flex; flex-direction: column; gap: 16px; }

.sprint-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  overflow: hidden;
}

.sprint-card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.sprint-info {
  display: flex; align-items: center; gap: 10px; margin-bottom: 4px;
}
.sprint-label { font-size: 16px; font-weight: 700; color: #1e293b; }
.sprint-theme-text { font-size: 13px; color: #64748b; }
.sprint-dates { font-size: 12px; color: #94a3b8; margin-bottom: 8px; }
.sprint-actions { display: flex; gap: 4px; }

.edit-row {
  display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
}

.epic-section { padding: 12px 20px 16px; }

.epic-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.epic-table th {
  text-align: left; padding: 6px 8px; font-size: 11px; font-weight: 600;
  color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;
  border-bottom: 2px solid #e2e8f0;
}
.epic-table td {
  padding: 8px; border-bottom: 1px solid #f1f5f9; color: #475569;
  vertical-align: middle;
}
.epic-table tr:hover td { background: #f8fafc; }

.td-id { font-weight: 700; color: #3b82f6; font-size: 12px; white-space: nowrap; }
.td-label { font-weight: 600; color: #1e293b; }
.td-cat { font-size: 11px; color: #94a3b8; }
.td-desc { font-size: 12px; color: #64748b; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-actions { display: flex; gap: 4px; flex-wrap: nowrap; }

.epic-badge {
  display: inline-block; padding: 1px 6px; border-radius: 3px;
  font-size: 10px; font-weight: 600; text-transform: uppercase;
  background: #eff6ff; color: #3b82f6;
}

.add-epic-form {
  display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
  margin-top: 8px; padding-top: 8px; border-top: 1px solid #f1f5f9;
}

.add-epic-btn { margin-top: 8px; }
.carryover-label { font-size: 12px; font-weight: 600; color: #f59e0b; white-space: nowrap; }

/* -- Shared -- */
.input {
  padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px;
  font-size: 13px; flex: 1; min-width: 80px;
}
.input--wide { flex: 2; }
.input--sm { max-width: 160px; flex: none; }
.input--xs { max-width: 80px; flex: none; }
.input:focus { outline: none; border-color: #3b82f6; }

select.input { cursor: pointer; }

.btn {
  padding: 6px 14px; border: 1px solid #e2e8f0; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer; background: #fff; color: #475569;
  white-space: nowrap; transition: all 0.15s;
}
.btn:hover { background: #f1f5f9; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary { background: #1e293b; color: #fff; border-color: #1e293b; }
.btn--primary:hover { background: #334155; }
.btn--sm { padding: 4px 10px; font-size: 11px; }
.btn--ok { color: #22c55e; border-color: #86efac; }
.btn--ok:hover { background: #f0fdf4; }
.btn--danger { color: #ef4444; border-color: #fca5a5; }
.btn--danger:hover { background: #fef2f2; }

.badge {
  display: inline-block; padding: 2px 8px; border-radius: 10px;
  font-size: 10px; font-weight: 600; text-transform: uppercase;
}
.badge--active { background: #ecfdf5; color: #059669; }

.admin-loading {
  padding: 40px; text-align: center; color: #94a3b8; font-size: 14px;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 767px) {
  .admin { padding: 16px; }
  .form-grid { flex-direction: column; }
  .input--sm, .input--xs { max-width: none; }
  .td-actions { flex-wrap: wrap; }
  .epic-table { display: block; overflow-x: auto; }
}
.sprint-lifecycle { display: flex; align-items: center; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.06); }
.lifecycle-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; }
.lc--planning { background: #e0e7ff; color: #4338ca; }
.lc--active { background: #dcfce7; color: #16a34a; }
.lc--closed { background: #f3f4f6; color: #6b7280; }
.btn--lifecycle { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.btn--lifecycle:hover { background: #dbeafe; }
</style>
