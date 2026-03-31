<script setup lang="ts">
import { computed, ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import type { PmStory, StoryStatus } from '@/composables/usePmStore'
import { getActiveSprint } from '@/composables/useNavStore'
import {
  getTasksForStory, getEpicById, updateStoryStatus, updateStory, addTask,
  STORY_STATUSES, STORY_STATUS_LABELS, PRIORITY_LABELS,
} from '@/composables/usePmStore'
import { useAuth } from '@/composables/useAuth'
import { useConfirm } from '@/composables/useConfirm'
import StatusBadge from './StatusBadge.vue'
import BoardTaskItem from './BoardTaskItem.vue'

const props = defineProps<{ story: PmStory }>()
const emit = defineEmits<{ close: []; updated: [] }>()

const { authUser } = useAuth()
const { showConfirm } = useConfirm()

// Inline task add
const showAddTask = ref(false)
const newTaskTitle = ref('')
const addingTask = ref(false)
const taskInput = ref<HTMLInputElement | null>(null)

async function openAddTask() {
  showAddTask.value = true
  await nextTick()
  taskInput.value?.focus()
}

async function handleAddTask() {
  const title = newTaskTitle.value.trim()
  if (!title || addingTask.value) return
  addingTask.value = true
  await addTask({ storyId: props.story.id, title })
  newTaskTitle.value = ''
  addingTask.value = false
  emit('updated')
  await nextTick()
  taskInput.value?.focus()
}

function cancelAddTask() {
  showAddTask.value = false
  newTaskTitle.value = ''
}

const storyTasks = computed(() => getTasksForStory(props.story.id))
const doneCount = computed(() => storyTasks.value.filter(t => t.status === 'done').length)
const epicTitle = computed(() => props.story.epicId ? getEpicById(props.story.epicId)?.title ?? null : null)

// AC check-off
interface AcItem { text: string; checked: boolean }

function parseAcItems(raw: string | null): AcItem[] {
  if (!raw) return []
  const lines = raw.includes('\n')
    ? raw.split('\n').map(l => l.trim()).filter(Boolean)
    : [raw.trim()]
  return lines.map(line => {
    if (line.startsWith('[x] ') || line.startsWith('[X] ')) return { text: line.slice(4), checked: true }
    if (line.startsWith('[ ] ')) return { text: line.slice(4), checked: false }
    return { text: line, checked: false }
  })
}

function serializeAc(items: AcItem[]): string {
  return items.map(i => `${i.checked ? '[x]' : '[ ]'} ${i.text}`).join('\n')
}

const acItems = computed(() => parseAcItems(props.story.acceptanceCriteria))
const acDoneCount = computed(() => acItems.value.filter(i => i.checked).length)

async function handleMergeOk() {
  if (!await showConfirm('Mark as Merge OK? Story status will change to done.')) return
  await updateStory(props.story.id, { status: 'done' } as any)
  emit('updated')
}

async function toggleAc(idx: number) {
  const items = [...acItems.value]
  items[idx] = { ...items[idx], checked: !items[idx].checked }
  await updateStory(props.story.id, { acceptanceCriteria: serializeAc(items) })
  emit('updated')
}

// DoR checklist (gate for ready-for-dev)
const showDorModal = ref(false)
const dorChecks = ref({ specDone: false, acExists: false, mockupReady: false })
const pendingStatus = ref<StoryStatus | null>(null)

function resetDor() { dorChecks.value = { specDone: false, acExists: false, mockupReady: false } }

const dorAllChecked = computed(() =>
  dorChecks.value.specDone && dorChecks.value.acExists && dorChecks.value.mockupReady
)

async function confirmDor() {
  if (!dorAllChecked.value || !pendingStatus.value) return
  await updateStoryStatus(props.story.id, pendingStatus.value)
  showDorModal.value = false
  pendingStatus.value = null
  resetDor()
  emit('updated')
}

// Status dropdown
const statusDropOpen = ref(false)
const statusTrigger = ref<HTMLElement | null>(null)
const STATUS_COLORS: Record<string, string> = {
  draft: '#94a3b8', backlog: '#a78bfa', ready: '#3b82f6',
  'in-progress': '#f59e0b', review: '#8b5cf6', done: '#22c55e',
}

async function selectStatus(status: StoryStatus) {
  statusDropOpen.value = false
  if (status === props.story.status) return
  if (status === 'ready' && props.story.status !== 'ready') {
    pendingStatus.value = status
    resetDor()
    showDorModal.value = true
    return
  }
  await updateStoryStatus(props.story.id, status)
  emit('updated')
}

// Assignee multi-select
const assigneeDropOpen = ref(false)
const assigneeTrigger = ref<HTMLElement | null>(null)

const assigneeList = computed(() =>
  props.story.assignee ? props.story.assignee.split(',').map(s => s.trim()).filter(Boolean) : []
)

const assigneeDisplay = computed(() =>
  assigneeList.value.length === 0 ? 'Unassigned' : assigneeList.value.join(', ')
)

async function toggleAssignee(name: string) {
  const current = new Set(assigneeList.value)
  if (current.has(name)) current.delete(name)
  else current.add(name)
  const value = current.size > 0 ? [...current].join(',') : null
  await updateStory(props.story.id, { assignee: value })
  emit('updated')
}

// Dropdown position
function menuStyle(trigger: HTMLElement | null): Record<string, string> {
  if (!trigger) return {}
  const rect = trigger.getBoundingClientRect()
  return { position: 'fixed', top: `${rect.bottom + 4}px`, left: `${rect.left}px`, width: `${rect.width}px`, zIndex: '9999' }
}

// Figma link editing
const editingFigma = ref(false)
const figmaUrlDraft = ref('')
const figmaInput = ref<HTMLInputElement | null>(null)

const figmaLabel = computed(() => {
  if (!props.story.figmaUrl) return ''
  try {
    const url = new URL(props.story.figmaUrl)
    const parts = url.pathname.split('/')
    return parts[parts.length - 1]?.replace(/-/g, ' ') || 'Figma'
  } catch { return 'Figma' }
})

async function startEditFigma() {
  figmaUrlDraft.value = props.story.figmaUrl ?? ''
  editingFigma.value = true
  await nextTick()
  figmaInput.value?.focus()
}

async function saveFigma() {
  const url = figmaUrlDraft.value.trim() || null
  editingFigma.value = false
  if (url === props.story.figmaUrl) return
  await updateStory(props.story.id, { figmaUrl: url })
  emit('updated')
}

// Close dropdown on outside click
function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.field-dropdown') && !target.closest('.field-menu-portal')) {
    statusDropOpen.value = false
    assigneeDropOpen.value = false
  }
}
const panelBodyRef = ref<HTMLElement | null>(null)

async function updateDate(field: 'startDate' | 'dueDate', value: string) {
  await updateStory(props.story.id, { [field]: value || null } as any)
  emit('updated')
}

async function assignToSprint() {
  const activeSprint = getActiveSprint().id
  await updateStory(props.story.id, { sprint: activeSprint })
  emit('updated')
}

async function unassignFromSprint() {
  await updateStory(props.story.id, { sprint: null } as any)
  emit('updated')
}

onMounted(async () => {
  document.addEventListener('click', onDocClick)
  const { pmEpics, loadEpics } = await import('@/composables/usePmStore')
  if (!pmEpics.value.length) await loadEpics()
  nextTick(() => { if (panelBodyRef.value) panelBodyRef.value.scrollTop = 0 })
})
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div class="panel-overlay" @click.self="emit('close')">
    <div class="panel">
      <div class="panel-header">
        <div class="panel-header-top">
          <div class="panel-badges">
            <StatusBadge :label="PRIORITY_LABELS[story.priority]" type="priority" :value="story.priority" />
            <span class="panel-area">{{ story.area }}</span>
            <span v-if="story.storyPoints" class="panel-points">{{ story.storyPoints }} SP</span>
          </div>
          <button class="close-btn" @click="emit('close')">&times;</button>
        </div>
        <h2 class="panel-title">{{ story.title }}</h2>
      </div>

      <div ref="panelBodyRef" class="panel-body">
        <!-- Property fields -->
        <div class="field-grid">
          <!-- Status dropdown -->
          <div class="field-row">
            <span class="field-label">Status</span>
            <div ref="statusTrigger" class="field-dropdown" @click.stop="statusDropOpen = !statusDropOpen; assigneeDropOpen = false">
              <button class="field-value field-value--clickable">
                <span class="status-dot" :style="{ background: STATUS_COLORS[story.status] }"></span>
                {{ STORY_STATUS_LABELS[story.status] }}
                <span class="field-chevron">&#9662;</span>
              </button>
            </div>
          </div>
          <!-- Assignee -->
          <div class="field-row">
            <span class="field-label">Assign</span>
            <div ref="assigneeTrigger" class="field-dropdown" @click.stop="assigneeDropOpen = !assigneeDropOpen; statusDropOpen = false">
              <button class="field-value field-value--clickable">
                {{ assigneeDisplay }}
                <span class="field-chevron">&#9662;</span>
              </button>
            </div>
          </div>
          <!-- Epic -->
          <div v-if="epicTitle" class="field-row">
            <span class="field-label">Epic</span>
            <span class="field-value">{{ epicTitle }}</span>
          </div>
          <!-- Dates -->
          <div class="field-row">
            <span class="field-label">Start</span>
            <input type="date" class="field-date-input" :value="story.startDate ?? ''" @change="updateDate('startDate', ($event.target as HTMLInputElement).value)" />
          </div>
          <div class="field-row">
            <span class="field-label">Due</span>
            <input type="date" class="field-date-input" :value="story.dueDate ?? ''" @change="updateDate('dueDate', ($event.target as HTMLInputElement).value)" />
          </div>
          <!-- Sprint assignment -->
          <div class="field-row">
            <span class="field-label">Sprint</span>
            <div class="field-value sprint-assign">
              <span v-if="story.sprint">{{ story.sprint }}</span>
              <span v-else class="field-placeholder">Backlog</span>
              <button v-if="story.sprint" class="sprint-btn sprint-btn--remove" @click.stop="unassignFromSprint" title="Remove from sprint">Remove</button>
              <button v-else class="sprint-btn sprint-btn--assign" @click.stop="assignToSprint" title="Assign to current sprint">Assign</button>
            </div>
          </div>
          <!-- Figma link -->
          <div class="field-row">
            <span class="field-label">Figma</span>
            <div v-if="!editingFigma" class="field-value field-value--clickable" @click="startEditFigma">
              <a v-if="story.figmaUrl" :href="story.figmaUrl" target="_blank" rel="noopener" class="figma-link" @click.stop>{{ figmaLabel }}</a>
              <span v-else class="field-placeholder">+ Add link</span>
            </div>
            <div v-else class="figma-edit">
              <input ref="figmaInput" v-model="figmaUrlDraft" class="figma-input" placeholder="https://www.figma.com/..." @keydown.enter="saveFigma" @keydown.escape="editingFigma = false" />
              <button class="figma-save" @click="saveFigma">Save</button>
              <button class="figma-cancel" @click="editingFigma = false">&times;</button>
            </div>
          </div>
        </div>

        <!-- Dropdown menus (Teleport to body) -->
        <Teleport to="body">
          <div v-if="statusDropOpen" class="field-menu-portal" :style="menuStyle(statusTrigger)" @click.stop>
            <div class="field-menu">
              <div v-for="s in STORY_STATUSES" :key="s" class="field-menu-item" :class="{ active: s === story.status }" @click="selectStatus(s)">
                <span class="status-dot" :style="{ background: STATUS_COLORS[s] }"></span>
                {{ STORY_STATUS_LABELS[s] }}
              </div>
            </div>
          </div>
          <div v-if="assigneeDropOpen" class="field-menu-portal" :style="menuStyle(assigneeTrigger)" @click.stop>
            <div class="field-menu">
              <div class="field-menu-item" style="color:#94a3b8;" @click="toggleAssignee('')">
                (Use admin member list for options)
              </div>
            </div>
          </div>
        </Teleport>

        <!-- Description -->
        <section v-if="story.description" class="panel-section">
          <h3>Description</h3>
          <div class="desc-text">{{ story.description }}</div>
        </section>

        <!-- Acceptance Criteria -->
        <section v-if="acItems.length > 0" class="panel-section">
          <h3>Acceptance Criteria <span class="task-counter">{{ acDoneCount }}/{{ acItems.length }}</span></h3>
          <div class="ac-list">
            <label v-for="(ac, i) in acItems" :key="i" class="ac-item" :class="{ 'ac-item--done': ac.checked }">
              <input type="checkbox" :checked="ac.checked" class="ac-check" @change="toggleAc(i)" />
              <span class="ac-text">{{ ac.text }}</span>
            </label>
          </div>
          <button
            v-if="(story.status === 'review' || story.status === 'qa') && acItems.length > 0"
            class="btn merge-ok-btn"
            :class="{ 'merge-ok-active': acDoneCount === acItems.length }"
            :disabled="acDoneCount !== acItems.length"
            @click="handleMergeOk"
          >
            {{ acDoneCount === acItems.length ? 'Merge OK -- All AC passed' : `AC ${acDoneCount}/${acItems.length} passed` }}
          </button>
        </section>

        <!-- No AC free-form QA -->
        <section v-if="acItems.length === 0 && (story.status === 'review' || story.status === 'qa')" class="panel-section">
          <h3>QA Checklist</h3>
          <p class="qa-note">No acceptance criteria defined. Verify manually before merging.</p>
          <button class="btn merge-ok-btn merge-ok-active" @click="handleMergeOk">Merge OK</button>
        </section>

        <!-- Tasks -->
        <section class="panel-section">
          <div class="task-header">
            <h3>Tasks <span v-if="storyTasks.length > 0" class="task-counter">{{ doneCount }}/{{ storyTasks.length }}</span></h3>
            <button v-if="!showAddTask" class="add-task-btn" @click="openAddTask">+ Add</button>
          </div>
          <!-- Related PRs -->
          <div v-if="story.relatedPrs?.length" class="panel-prs">
            <div class="panel-section-title">Linked PRs</div>
            <div v-for="pr in story.relatedPrs" :key="pr.prNumber" class="pr-item">
              <a :href="pr.prUrl" target="_blank" class="pr-link">#{{ pr.prNumber }}</a>
              <span class="pr-title-text">{{ pr.prTitle }}</span>
              <span class="pr-status" :class="'pr--' + pr.status">{{ pr.status }}</span>
            </div>
          </div>
          <div v-if="storyTasks.length === 0 && !showAddTask" class="panel-empty">No tasks</div>
          <div v-if="storyTasks.length > 0" class="panel-tasks">
            <BoardTaskItem v-for="t in storyTasks" :key="t.id" :task="t" @updated="emit('updated')" />
          </div>
          <!-- Inline task add -->
          <div v-if="showAddTask" class="add-task-form">
            <input ref="taskInput" v-model="newTaskTitle" class="add-task-input" placeholder="Task title (Enter to add)" @keydown.enter.prevent="handleAddTask" @keydown.escape="cancelAddTask" :disabled="addingTask" />
            <div class="add-task-actions">
              <button class="add-task-submit" @click="handleAddTask" :disabled="!newTaskTitle.trim() || addingTask">Add</button>
              <button class="add-task-cancel" @click="cancelAddTask">Cancel</button>
            </div>
          </div>
        </section>

        <!-- Meta -->
        <div class="panel-meta">
          <span>Created: {{ story.createdAt?.split('T')[0] ?? '-' }}</span>
          <span>Updated: {{ story.updatedAt?.split('T')[0] ?? '-' }}</span>
        </div>
      </div>
    </div>

    <!-- DoR Checklist Modal -->
    <div v-if="showDorModal" class="dor-overlay" @click.self="showDorModal = false">
      <div class="dor-modal">
        <h3 class="dor-title">Definition of Ready</h3>
        <p class="dor-desc">Confirm the following before marking as ready.</p>
        <div class="dor-checks">
          <label class="dor-check"><input type="checkbox" v-model="dorChecks.specDone" /><span>Epic spec is finalized?</span></label>
          <label class="dor-check"><input type="checkbox" v-model="dorChecks.acExists" /><span>Acceptance criteria defined?</span></label>
          <label class="dor-check"><input type="checkbox" v-model="dorChecks.mockupReady" /><span>Mockup / screen spec ready?</span></label>
        </div>
        <div class="dor-actions">
          <button class="dor-confirm" :disabled="!dorAllChecked" @click="confirmDor">Mark as Ready</button>
          <button class="dor-cancel" @click="showDorModal = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 900; display: flex; justify-content: flex-end; }
.panel { width: 480px; max-width: 100vw; height: 100vh; max-height: 100vh; background: #f8f8fb; box-shadow: -4px 0 24px rgba(0,0,0,0.08); overflow: hidden; padding: 0; display: flex; flex-direction: column; animation: slide-in 0.2s ease-out; }
.panel-header { background: #f8f8fb; padding: 20px 24px 16px; border-bottom: 1px solid rgba(0,0,0,0.06); flex-shrink: 0; position: relative; }
.panel-header-top { display: flex; justify-content: space-between; align-items: flex-start; }
.close-btn { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border: none; background: none; font-size: 22px; color: #94a3b8; cursor: pointer; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.close-btn:hover { background: rgba(0,0,0,0.04); color: var(--text-primary); }
.panel-header .panel-title { margin: 8px 32px 0 0; font-size: 16px; font-weight: 700; line-height: 1.4; word-break: break-word; }
.panel-body { flex: 1 1 0; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 12px 20px 32px; display: flex; flex-direction: column; gap: 4px; }
@keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
.panel-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.panel-area { font-size: 11px; font-weight: 600; color: var(--text-secondary); background: rgba(0,0,0,0.04); padding: 2px 8px; border-radius: 4px; }
.panel-points { font-size: 12px; font-weight: 700; color: #3b82f6; }
.field-grid { display: flex; flex-direction: column; gap: 1px; background: #fff; border-radius: 10px; padding: 4px 0; overflow: hidden; flex-shrink: 0; }
.field-row { display: flex; align-items: center; background: rgba(255,255,255,0.25); padding: 0; min-height: 38px; }
.field-label { width: 64px; flex-shrink: 0; padding: 8px 12px; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.3px; }
.field-value { flex: 1; padding: 8px 12px; font-size: 13px; color: var(--text-primary); font-weight: 500; border: none; background: none; text-align: left; font-family: inherit; }
.field-date-input { flex: 1; padding: 6px 10px; border: 1px solid rgba(0,0,0,0.08); border-radius: 6px; font-size: 13px; background: transparent; font-family: inherit; color: var(--text-primary); }
.sprint-assign { display: flex; align-items: center; gap: 8px; }
.sprint-btn { border: none; border-radius: 6px; padding: 2px 8px; font-size: 11px; cursor: pointer; font-weight: 500; }
.sprint-btn--assign { background: rgba(59,130,246,0.12); color: #2563EB; }
.sprint-btn--remove { background: rgba(239,68,68,0.12); color: #dc2626; }
.field-value--clickable { cursor: pointer; display: flex; align-items: center; gap: 6px; border-radius: 4px; transition: background 0.1s; }
.field-value--clickable:hover { background: rgba(0,0,0,0.02); }
.field-chevron { font-size: 10px; color: #94a3b8; margin-left: auto; }
.field-dropdown { position: relative; flex: 1; }
.field-menu { background: #fff; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); padding: 4px; max-height: 240px; overflow-y: auto; }
.field-menu-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; font-size: 13px; color: #475569; border-radius: 6px; cursor: pointer; transition: all 0.1s; }
.field-menu-item:hover { background: rgba(0,0,0,0.04); color: var(--text-primary); }
.field-menu-item.active { background: #eff6ff; color: #3b82f6; font-weight: 600; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.field-placeholder { color: #94a3b8; font-size: 12px; }
.figma-link { color: #a259ff; font-size: 13px; font-weight: 500; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.figma-link:hover { text-decoration: underline; }
.figma-edit { flex: 1; display: flex; align-items: center; gap: 4px; padding: 4px 8px; }
.figma-input { flex: 1; padding: 4px 8px; border: 1px solid rgba(0,0,0,0.06); border-radius: 4px; font-size: 12px; font-family: inherit; color: var(--text-primary); min-width: 0; }
.figma-input:focus { outline: none; border-color: #a259ff; }
.figma-save { padding: 3px 8px; background: var(--text-primary); color: #fff; border: none; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.figma-cancel { width: 24px; height: 24px; border: none; background: none; color: #94a3b8; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.panel-section { background: #fff; border-radius: 10px; padding: 14px 16px; flex-shrink: 0; }
.panel-section h3 { font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
.task-counter { font-weight: 400; color: #94a3b8; margin-left: 4px; }
.desc-text { font-size: 13px; color: #334155; line-height: 1.7; padding: 10px 12px; background: rgba(0,0,0,0.02); border-radius: 6px; border-left: 3px solid rgba(0,0,0,0.06); white-space: pre-wrap; }
.task-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.task-header h3 { margin-bottom: 0; }
.add-task-btn { padding: 3px 10px; border: 1px dashed #cbd5e1; border-radius: 4px; background: none; font-size: 11px; font-weight: 600; color: var(--text-secondary); cursor: pointer; transition: all 0.15s; }
.add-task-btn:hover { border-color: #3b82f6; color: #3b82f6; }
.add-task-form { margin-top: 6px; display: flex; flex-direction: column; gap: 6px; }
.add-task-input { width: 100%; padding: 6px 10px; border: 1px solid rgba(0,0,0,0.06); border-radius: 6px; font-size: 12px; font-family: inherit; color: var(--text-primary); box-sizing: border-box; }
.add-task-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
.add-task-actions { display: flex; gap: 6px; }
.add-task-submit { padding: 4px 12px; border: none; border-radius: 4px; background: var(--text-primary); color: #fff; font-size: 11px; font-weight: 600; cursor: pointer; }
.add-task-submit:disabled { background: #cbd5e1; cursor: not-allowed; }
.add-task-cancel { padding: 4px 12px; border: 1px solid rgba(0,0,0,0.06); border-radius: 4px; background: rgba(255,255,255,0.25); color: var(--text-secondary); font-size: 11px; cursor: pointer; }
.ac-list { display: flex; flex-direction: column; gap: 4px; }
.ac-item { display: flex; align-items: flex-start; gap: 8px; padding: 6px 10px; background: rgba(0,0,0,0.02); border-radius: 6px; border-left: 3px solid rgba(0,0,0,0.06); cursor: pointer; transition: all 0.15s; }
.ac-item:hover { background: rgba(0,0,0,0.04); }
.ac-item--done { border-left-color: #22c55e; }
.ac-item--done .ac-text { text-decoration: line-through; color: #94a3b8; }
.ac-check { margin-top: 2px; accent-color: #22c55e; cursor: pointer; flex-shrink: 0; }
.ac-text { font-size: 13px; color: #334155; line-height: 1.5; }
.panel-empty { font-size: 13px; color: #cbd5e1; padding: 8px 0; }
.panel-tasks { display: flex; flex-direction: column; gap: 2px; }
.panel-meta { margin-top: auto; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.04); display: flex; gap: 16px; font-size: 11px; color: #94a3b8; }
.panel-prs { margin-bottom: 16px; }
.panel-section-title { font-size: 12px; font-weight: 600; color: var(--text-muted, #888); margin-bottom: 8px; }
.pr-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13px; }
.pr-link { color: #3b82f6; font-weight: 600; text-decoration: none; }
.pr-link:hover { text-decoration: underline; }
.pr-title-text { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pr-status { font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px; }
.pr--open { background: #dcfce7; color: #16a34a; }
.pr--merged { background: #e0e7ff; color: #4338ca; }
.pr--closed { background: #f3f4f6; color: #6b7280; }
.merge-ok-btn { width: 100%; margin-top: 12px; padding: 8px; border-radius: 8px; font-size: 13px; font-weight: 600; background: #e5e7eb; color: #6b7280; border: none; cursor: not-allowed; }
.merge-ok-active { background: #22c55e; color: #fff; cursor: pointer; }
.merge-ok-active:hover { background: #16a34a; }
.qa-note { font-size: 12px; color: var(--text-muted, #888); margin-bottom: 12px; }
.dor-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.dor-modal { background: #fff; border-radius: 12px; padding: 24px; width: 400px; max-width: 92vw; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
.dor-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.dor-desc { font-size: 12px; color: var(--text-secondary); margin-bottom: 16px; }
.dor-checks { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.dor-check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #334155; cursor: pointer; }
.dor-check input { accent-color: #22c55e; cursor: pointer; }
.dor-actions { display: flex; gap: 8px; justify-content: flex-end; }
.dor-confirm { padding: 8px 16px; background: var(--text-primary); color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
.dor-confirm:disabled { background: #cbd5e1; cursor: not-allowed; }
.dor-cancel { padding: 8px 16px; background: rgba(255,255,255,0.25); color: var(--text-secondary); border: 1px solid rgba(0,0,0,0.06); border-radius: 6px; font-size: 13px; cursor: pointer; }
@media (max-width: 767px) { .panel { width: 100vw; } }
</style>
