<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { sprints, loaded, loadNavData } from '@/composables/useNavStore'
import {
  pmEpics, stories, tasks, pmLoaded, loadEpics, loadPmData,
  addEpic as addPmEpic, updateEpic as updatePmEpic, deleteEpic as deletePmEpic,
  addStory, updateStory, deleteStory,
  addTask, updateTask, deleteTask,
  getStoriesForSprint, getStoriesForEpic, getTasksForStory, getEpicById,
  STORY_STATUSES, TASK_STATUSES, PRIORITIES, AREAS, EPIC_STATUSES,
  STORY_STATUS_LABELS, TASK_STATUS_LABELS, PRIORITY_LABELS, EPIC_STATUS_LABELS,
  type PmEpic, type PmStory, type PmTask, type StoryStatus, type TaskStatus, type Priority, type EpicStatus,
} from '@/composables/usePmStore'

const router = useRouter()
const loading = ref(true)
const statusMsg = ref('')
const selectedSprint = ref('')
const activeTab = ref<'stories' | 'epics'>('stories')

function clearStatus() { setTimeout(() => { statusMsg.value = '' }, 3000) }

// Epic management
const epicForm = ref({ title: '', description: '', status: 'active' as EpicStatus, owner: '' })
const showEpicForm = ref(false)
const editingEpic = ref<number | null>(null)
const editEpicData = ref({ title: '', description: '', status: 'active' as EpicStatus, owner: '' })

async function handleAddEpic() {
  if (!epicForm.value.title.trim()) return
  const f = epicForm.value
  const r = await addPmEpic({ title: f.title.trim(), description: f.description.trim() || null, status: f.status, owner: f.owner || null })
  if (r.error) { statusMsg.value = `Error: ${r.error}` }
  else { statusMsg.value = 'Epic added'; showEpicForm.value = false; epicForm.value = { title: '', description: '', status: 'active', owner: '' } }
  clearStatus()
}

function startEditEpic(e: PmEpic) {
  editingEpic.value = e.id
  editEpicData.value = { title: e.title, description: e.description ?? '', status: e.status, owner: e.owner ?? '' }
}

async function saveEditEpic(id: number) {
  const d = editEpicData.value
  const r = await updatePmEpic(id, { title: d.title, description: d.description || null, status: d.status, owner: d.owner || null })
  if (r.error) { statusMsg.value = `Error: ${r.error}` }
  else { statusMsg.value = 'Epic updated'; editingEpic.value = null }
  clearStatus()
}

async function handleDeleteEpic(id: number, title: string) {
  if (!confirm(`Delete "${title}" epic? Child stories will become unassigned.`)) return
  const r = await deletePmEpic(id)
  if (r.error) { statusMsg.value = `Error: ${r.error}` }
  else { statusMsg.value = 'Epic deleted' }
  clearStatus()
}

function epicStoryCount(epicId: number): { total: number; done: number } {
  const s = stories.value.filter(st => st.epicId === epicId)
  return { total: s.length, done: s.filter(st => st.status === 'done').length }
}

// Sprint stories
const sprintStories = computed(() => getStoriesForSprint(selectedSprint.value))

const epicGroupedStories = computed(() => {
  const groups = new Map<number | null, PmStory[]>()
  for (const s of sprintStories.value) {
    if (!groups.has(s.epicId)) groups.set(s.epicId, [])
    groups.get(s.epicId)!.push(s)
  }
  return [...groups.entries()].sort(([a], [b]) => { if (a === null) return 1; if (b === null) return -1; return a - b })
})

// Story form
const storyFormEpicId = ref<number | null | 'show'>(null)
const storyForm = ref({
  title: '', description: '', acceptanceCriteria: '',
  assignee: '', status: 'draft' as StoryStatus, priority: 'medium' as Priority,
  area: 'FE', storyPoints: '' as string, epicId: null as number | null,
})

function showStoryForm() {
  storyFormEpicId.value = 'show'
  storyForm.value = { title: '', description: '', acceptanceCriteria: '', assignee: '', status: 'draft', priority: 'medium', area: 'FE', storyPoints: '', epicId: null }
}

async function handleAddStory() {
  if (!storyForm.value.title.trim()) return
  const f = storyForm.value
  const r = await addStory({ epicId: f.epicId, sprint: selectedSprint.value, title: f.title.trim(), description: f.description.trim() || null, acceptanceCriteria: f.acceptanceCriteria.trim() || null, assignee: f.assignee || null, status: f.status, priority: f.priority, area: f.area, storyPoints: f.storyPoints ? Number(f.storyPoints) : null })
  if (r.error) { statusMsg.value = `Error: ${r.error}` }
  else { statusMsg.value = 'Story added'; storyFormEpicId.value = null }
  clearStatus()
}

// Story edit
const editingStory = ref<number | null>(null)
const editStoryData = ref({ title: '', description: '', acceptanceCriteria: '', assignee: '', status: 'draft' as StoryStatus, priority: 'medium' as Priority, area: 'FE', storyPoints: '' as string, epicId: null as number | null, sprint: '' as string | undefined })

function startEditStory(s: PmStory) {
  editingStory.value = s.id
  editStoryData.value = { title: s.title, description: s.description ?? '', acceptanceCriteria: s.acceptanceCriteria ?? '', assignee: s.assignee ?? '', status: s.status, priority: s.priority, area: s.area, storyPoints: s.storyPoints?.toString() ?? '', epicId: s.epicId, sprint: s.sprint }
}

async function saveEditStory(id: number) {
  const d = editStoryData.value
  const r = await updateStory(id, { title: d.title, description: d.description || null, acceptanceCriteria: d.acceptanceCriteria || null, assignee: d.assignee || null, status: d.status, priority: d.priority, area: d.area, storyPoints: d.storyPoints ? Number(d.storyPoints) : null, epicId: d.epicId, sprint: d.sprint })
  if (r.error) { statusMsg.value = `Error: ${r.error}` }
  else { statusMsg.value = 'Story updated'; editingStory.value = null; await loadPmData(selectedSprint.value) }
  clearStatus()
}

async function handleDeleteStory(id: number, title: string) {
  if (!confirm(`Delete "${title}" story and all its tasks?`)) return
  const r = await deleteStory(id)
  if (r.error) { statusMsg.value = `Error: ${r.error}` }
  else { statusMsg.value = 'Story deleted'; await loadPmData(selectedSprint.value) }
  clearStatus()
}

// Task form
const taskFormStoryId = ref<number | null>(null)
const taskForm = ref({ title: '', assignee: '', description: '' })

function showTaskForm(storyId: number) { taskFormStoryId.value = storyId; taskForm.value = { title: '', assignee: '', description: '' } }

async function handleAddTask() {
  if (!taskFormStoryId.value || !taskForm.value.title.trim()) return
  const f = taskForm.value
  const r = await addTask({ storyId: taskFormStoryId.value, title: f.title.trim(), assignee: f.assignee || null, description: f.description.trim() || null })
  if (r.error) { statusMsg.value = `Error: ${r.error}` }
  else { statusMsg.value = 'Task added'; taskFormStoryId.value = null }
  clearStatus()
}

// Task edit
const editingTask = ref<number | null>(null)
const editTaskData = ref({ title: '', assignee: '', description: '', status: 'todo' as TaskStatus })

function startEditTask(t: PmTask) {
  editingTask.value = t.id
  editTaskData.value = { title: t.title, assignee: t.assignee ?? '', description: t.description ?? '', status: t.status }
}

async function saveEditTask(id: number) {
  const d = editTaskData.value
  const r = await updateTask(id, { title: d.title, assignee: d.assignee || null, description: d.description || null, status: d.status })
  if (r.error) { statusMsg.value = `Error: ${r.error}` }
  else { statusMsg.value = 'Task updated'; editingTask.value = null }
  clearStatus()
}

async function handleDeleteTask(id: number) {
  if (!confirm('Delete this task?')) return
  const r = await deleteTask(id)
  if (r.error) { statusMsg.value = `Error: ${r.error}` }
  else { statusMsg.value = 'Task deleted' }
  clearStatus()
}

async function onSprintChange() { await loadPmData(selectedSprint.value) }

onMounted(async () => {
  if (!loaded.value) await loadNavData()
  await loadEpics()
  const active = sprints.value.find(s => s.active)
  selectedSprint.value = active?.id ?? sprints.value[0]?.id ?? ''
  await loadPmData(selectedSprint.value)
  loading.value = false
})
</script>

<template>
  <div class="admin">
    <div class="admin-header">
      <h1>Story &amp; Task Admin</h1>
      <p class="admin-subtitle">Epic management + per-sprint story CRUD</p>
    </div>

    <Transition name="fade">
      <div v-if="statusMsg" class="admin-status">{{ statusMsg }}</div>
    </Transition>

    <!-- Tab toggle -->
    <div class="tab-bar">
      <button class="tab-btn" :class="{ active: activeTab === 'stories' }" @click="activeTab = 'stories'">Stories/Tasks</button>
      <button class="tab-btn" :class="{ active: activeTab === 'epics' }" @click="activeTab = 'epics'">Epic Admin</button>
      <div class="tab-spacer" />
      <button class="btn" @click="router.push(`/board/${selectedSprint}`)">Board</button>
    </div>

    <div v-if="loading" class="admin-loading">Loading...</div>

    <!-- Epics tab -->
    <div v-else-if="activeTab === 'epics'" class="epics-tab">
      <div class="top-actions">
        <button class="btn btn--primary" @click="showEpicForm = !showEpicForm">{{ showEpicForm ? 'Cancel' : '+ New Epic' }}</button>
      </div>

      <div v-if="showEpicForm" class="admin-card">
        <h2>New Epic</h2>
        <div class="epic-add-form">
          <input v-model="epicForm.title" class="input" placeholder="Epic title" />
          <textarea v-model="epicForm.description" class="input" rows="2" placeholder="Description" />
          <div class="edit-form-row">
            <select v-model="epicForm.status" class="input input--xs">
              <option v-for="st in EPIC_STATUSES" :key="st" :value="st">{{ EPIC_STATUS_LABELS[st] }}</option>
            </select>
            <button class="btn btn--primary" @click="handleAddEpic" :disabled="!epicForm.title.trim()">Add</button>
          </div>
        </div>
      </div>

      <div class="epic-list">
        <div v-for="e in pmEpics" :key="e.id" class="epic-card">
          <template v-if="editingEpic === e.id">
            <div class="epic-edit-form">
              <input v-model="editEpicData.title" class="input" placeholder="Title" />
              <textarea v-model="editEpicData.description" class="input" rows="2" placeholder="Description" />
              <div class="edit-form-row">
                <select v-model="editEpicData.status" class="input input--xs">
                  <option v-for="st in EPIC_STATUSES" :key="st" :value="st">{{ EPIC_STATUS_LABELS[st] }}</option>
                </select>
                <button class="btn btn--sm btn--primary" @click="saveEditEpic(e.id)">Save</button>
                <button class="btn btn--sm" @click="editingEpic = null">Cancel</button>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="epic-card-header">
              <span class="epic-title">{{ e.title }}</span>
              <span class="epic-status-badge" :class="e.status">{{ EPIC_STATUS_LABELS[e.status] }}</span>
              <span v-if="e.owner" class="epic-owner">{{ e.owner }}</span>
              <span class="epic-progress">{{ epicStoryCount(e.id).done }}/{{ epicStoryCount(e.id).total }} stories</span>
              <div class="epic-actions">
                <button class="btn btn--sm" @click="startEditEpic(e)">Edit</button>
                <button class="btn btn--sm btn--danger" @click="handleDeleteEpic(e.id, e.title)">Delete</button>
              </div>
            </div>
            <div v-if="e.description" class="epic-desc">{{ e.description }}</div>
          </template>
        </div>
      </div>
    </div>

    <!-- Stories/Tasks tab -->
    <div v-else class="stories-tab">
      <div class="top-actions">
        <select v-model="selectedSprint" class="input" @change="onSprintChange">
          <option v-for="s in sprints" :key="s.id" :value="s.id">{{ s.label }} -- {{ s.theme }}</option>
        </select>
        <button class="btn btn--primary btn--sm" @click="showStoryForm">+ Add Story</button>
      </div>

      <div v-if="storyFormEpicId === 'show'" class="add-story-form admin-card">
        <h2>New Story</h2>
        <input v-model="storyForm.title" class="input" placeholder="Story title" />
        <div class="edit-form-row">
          <select v-model="storyForm.epicId" class="input input--sm"><option :value="null">No epic</option><option v-for="e in pmEpics" :key="e.id" :value="e.id">{{ e.title }}</option></select>
          <select v-model="storyForm.status" class="input input--xs"><option v-for="st in STORY_STATUSES" :key="st" :value="st">{{ STORY_STATUS_LABELS[st] }}</option></select>
          <select v-model="storyForm.priority" class="input input--xs"><option v-for="p in PRIORITIES" :key="p" :value="p">{{ PRIORITY_LABELS[p] }}</option></select>
          <select v-model="storyForm.area" class="input input--xs"><option v-for="a in AREAS" :key="a" :value="a">{{ a }}</option></select>
          <input v-model="storyForm.storyPoints" class="input input--xs" type="number" placeholder="SP" />
        </div>
        <textarea v-model="storyForm.description" class="input" rows="2" placeholder="Description" />
        <textarea v-model="storyForm.acceptanceCriteria" class="input" rows="2" placeholder="Acceptance criteria" />
        <div class="edit-form-row">
          <button class="btn btn--sm btn--primary" @click="handleAddStory" :disabled="!storyForm.title.trim()">Add</button>
          <button class="btn btn--sm" @click="storyFormEpicId = null">Cancel</button>
        </div>
      </div>

      <!-- Epic > Story > Task tree -->
      <div class="epic-list">
        <div v-for="[epicId, groupStories] in epicGroupedStories" :key="epicId ?? 'unassigned'" class="epic-card">
          <div class="epic-card-header">
            <span class="epic-label">{{ epicId !== null ? (getEpicById(epicId)?.title ?? `Epic #${epicId}`) : 'Unassigned' }}</span>
          </div>
          <div class="story-section">
            <div v-for="s in groupStories" :key="s.id" class="story-block">
              <div class="story-row">
                <template v-if="editingStory === s.id">
                  <div class="edit-form">
                    <input v-model="editStoryData.title" class="input" placeholder="Title" />
                    <div class="edit-form-row">
                      <select v-model="editStoryData.epicId" class="input input--sm"><option :value="null">No epic</option><option v-for="e in pmEpics" :key="e.id" :value="e.id">{{ e.title }}</option></select>
                      <select v-model="editStoryData.sprint" class="input input--xs"><option v-for="sp in sprints" :key="sp.id" :value="sp.id">{{ sp.label }}</option></select>
                      <select v-model="editStoryData.status" class="input input--xs"><option v-for="st in STORY_STATUSES" :key="st" :value="st">{{ STORY_STATUS_LABELS[st] }}</option></select>
                      <select v-model="editStoryData.priority" class="input input--xs"><option v-for="p in PRIORITIES" :key="p" :value="p">{{ PRIORITY_LABELS[p] }}</option></select>
                      <select v-model="editStoryData.area" class="input input--xs"><option v-for="a in AREAS" :key="a" :value="a">{{ a }}</option></select>
                      <input v-model="editStoryData.storyPoints" class="input input--xs" type="number" placeholder="SP" />
                    </div>
                    <textarea v-model="editStoryData.description" class="input" rows="2" placeholder="Description" />
                    <textarea v-model="editStoryData.acceptanceCriteria" class="input" rows="2" placeholder="Acceptance criteria" />
                    <div class="edit-form-row">
                      <button class="btn btn--sm btn--primary" @click="saveEditStory(s.id)">Save</button>
                      <button class="btn btn--sm" @click="editingStory = null">Cancel</button>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="story-info">
                    <span class="story-status-dot" :class="s.status" />
                    <span class="story-title">{{ s.title }}</span>
                    <span v-if="s.assignee" class="story-assignee">{{ s.assignee }}</span>
                    <span class="story-meta">{{ s.area }} / {{ PRIORITY_LABELS[s.priority] }}</span>
                  </div>
                  <div class="story-actions">
                    <button class="btn btn--sm" @click="startEditStory(s)">Edit</button>
                    <button class="btn btn--sm btn--danger" @click="handleDeleteStory(s.id, s.title)">Delete</button>
                    <button class="btn btn--sm" @click="showTaskForm(s.id)">+ Task</button>
                  </div>
                </template>
              </div>
              <div class="task-list">
                <div v-for="t in getTasksForStory(s.id)" :key="t.id" class="task-row">
                  <template v-if="editingTask === t.id">
                    <div class="edit-form edit-form--inline">
                      <input v-model="editTaskData.title" class="input input--sm" placeholder="Title" />
                      <select v-model="editTaskData.status" class="input input--xs"><option v-for="st in TASK_STATUSES" :key="st" :value="st">{{ TASK_STATUS_LABELS[st] }}</option></select>
                      <button class="btn btn--sm btn--primary" @click="saveEditTask(t.id)">Save</button>
                      <button class="btn btn--sm" @click="editingTask = null">Cancel</button>
                    </div>
                  </template>
                  <template v-else>
                    <span class="task-status-dot" :class="t.status" />
                    <span class="task-title">{{ t.title }}</span>
                    <span v-if="t.assignee" class="task-assignee">{{ t.assignee }}</span>
                    <div class="task-actions">
                      <button class="btn btn--sm" @click="startEditTask(t)">Edit</button>
                      <button class="btn btn--sm btn--danger" @click="handleDeleteTask(t.id)">Delete</button>
                    </div>
                  </template>
                </div>
                <div v-if="taskFormStoryId === s.id" class="add-form">
                  <input v-model="taskForm.title" class="input input--sm" placeholder="Task title" />
                  <button class="btn btn--sm btn--primary" @click="handleAddTask" :disabled="!taskForm.title.trim()">Add</button>
                  <button class="btn btn--sm" @click="taskFormStoryId = null">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin { max-width: 1100px; margin: 0 auto; padding: 32px 24px; }
.admin-header { margin-bottom: 24px; }
.admin-header h1 { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
.admin-subtitle { font-size: 13px; color: #94a3b8; }
.admin-status { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; margin-bottom: 16px; }
.tab-bar { display: flex; gap: 4px; margin-bottom: 20px; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 0; }
.tab-btn { padding: 8px 16px; border: none; background: none; font-size: 13px; font-weight: 600; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.15s; }
.tab-btn:hover { color: #475569; }
.tab-btn.active { color: #1e293b; border-bottom-color: #1e293b; }
.tab-spacer { flex: 1; }
.top-actions { display: flex; gap: 8px; margin-bottom: 20px; align-items: center; }
.admin-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; }
.admin-card h2 { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
.epic-add-form, .epic-edit-form { display: flex; flex-direction: column; gap: 8px; padding: 12px 16px; }
.epic-list { display: flex; flex-direction: column; gap: 12px; }
.epic-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
.epic-card-header { padding: 12px 20px; background: #f8fafc; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.epic-title { font-size: 14px; font-weight: 700; color: #1e293b; }
.epic-label { font-size: 14px; font-weight: 600; color: #1e293b; }
.epic-status-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
.epic-status-badge.active { background: #ecfdf5; color: #059669; }
.epic-status-badge.completed { background: #eff6ff; color: #3b82f6; }
.epic-status-badge.archived { background: #f1f5f9; color: #94a3b8; }
.epic-owner { font-size: 11px; color: #64748b; background: #f1f5f9; padding: 1px 6px; border-radius: 3px; }
.epic-progress { font-size: 11px; color: #94a3b8; margin-left: auto; }
.epic-actions { display: flex; gap: 4px; }
.epic-desc { padding: 8px 20px 12px; font-size: 12px; color: #64748b; }
.story-section { padding: 12px 20px 16px; }
.story-block { border: 1px solid #f1f5f9; border-radius: 8px; margin-bottom: 8px; overflow: hidden; }
.story-row { padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.story-info { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.story-title { font-size: 13px; font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.story-assignee { font-size: 11px; color: #64748b; background: #f1f5f9; padding: 1px 6px; border-radius: 3px; flex-shrink: 0; }
.story-meta { font-size: 10px; color: #94a3b8; flex-shrink: 0; }
.story-status-dot, .task-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.story-status-dot.draft, .task-status-dot.todo { background: #94a3b8; }
.story-status-dot.backlog { background: #a78bfa; }
.story-status-dot.ready { background: #3b82f6; }
.story-status-dot.in-progress, .task-status-dot.in-progress { background: #f59e0b; }
.story-status-dot.review { background: #8b5cf6; }
.story-status-dot.done, .task-status-dot.done { background: #22c55e; }
.story-actions, .task-actions { display: flex; gap: 4px; flex-shrink: 0; }
.task-list { padding: 0 12px 8px; margin-left: 16px; border-left: 2px solid #f1f5f9; }
.task-row { display: flex; align-items: center; gap: 8px; padding: 4px 8px; font-size: 12px; }
.task-title { flex: 1; color: #475569; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.task-assignee { font-size: 10px; color: #94a3b8; background: #f8fafc; padding: 1px 4px; border-radius: 2px; }
.add-form, .add-story-form { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border-top: 1px solid #f1f5f9; margin-top: 4px; }
.add-form { flex-direction: row; flex-wrap: wrap; align-items: center; }
.edit-form { display: flex; flex-direction: column; gap: 6px; width: 100%; }
.edit-form--inline { flex-direction: row; flex-wrap: wrap; align-items: center; width: 100%; }
.edit-form-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.input { padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; flex: 1; min-width: 80px; }
.input--sm { max-width: 200px; }
.input--xs { max-width: 100px; flex: none; }
.input:focus { outline: none; border-color: #3b82f6; }
select.input { cursor: pointer; }
textarea.input { resize: vertical; min-height: 36px; }
.btn { padding: 6px 14px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; background: #fff; color: #475569; white-space: nowrap; transition: all 0.15s; }
.btn:hover { background: #f1f5f9; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary { background: #1e293b; color: #fff; border-color: #1e293b; }
.btn--primary:hover { background: #334155; }
.btn--sm { padding: 4px 10px; font-size: 11px; }
.btn--danger { color: #ef4444; border-color: #fca5a5; }
.btn--danger:hover { background: #fef2f2; }
.admin-loading { padding: 40px; text-align: center; color: #94a3b8; font-size: 14px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@media (max-width: 767px) { .admin { padding: 16px; } .story-row { flex-direction: column; align-items: flex-start; } .story-actions { margin-top: 4px; } }
</style>
