<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  pmEpics, pmLoaded, loadEpics, loadPmData, stories,
  getStoriesForSprint, getBacklogStories, getEpicById,
  updateStoryStatus, updateStory, moveToSprint, loadBacklog,
  STORY_STATUSES, STORY_STATUS_LABELS,
  type PmStory, type PmEpic, type StoryStatus,
} from '@/composables/usePmStore'
import { getActiveSprint } from '@/composables/useNavStore'
import BoardEpicSection from './BoardEpicSection.vue'
import BoardStoryCard from './BoardStoryCard.vue'
import StoryDetailPanel from './StoryDetailPanel.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const loadError = ref('')
const selectedStory = ref<PmStory | null>(null)

const sprint = computed(() => (route.params.sprint as string) || (route.path === '/board/backlog' ? 'backlog' : getActiveSprint().id))

// Sync viewMode with URL query
const viewMode = computed<'epic' | 'kanban' | 'timeline' | 'roadmap'>({
  get: () => {
    const v = route.query.view as string
    if (v === 'kanban') return 'kanban'
    if (v === 'timeline') return 'timeline'
    if (v === 'roadmap') return 'roadmap'
    return 'epic'
  },
  set: (v) => {
    router.replace({ query: v === 'epic' ? {} : { view: v } })
  },
})

// Reload data on sprint change
watch(() => route.params.sprint, async (newSprint, oldSprint) => {
  if (newSprint && newSprint !== oldSprint) {
    loading.value = true
    loadError.value = ''
    try {
      await refresh()
    } catch (e) {
      loadError.value = 'Failed to load data'
    }
    loading.value = false
  }
})

const isBacklog = computed(() => sprint.value === 'backlog')

// Timeline view
const timelineStories = computed(() =>
  sprintStories.value.filter(s => s.startDate || s.dueDate)
)

const sprintRange = computed(() => {
  const dates = timelineStories.value.flatMap(s => [s.startDate, s.dueDate].filter(Boolean) as string[])
  if (!dates.length) return { start: new Date(), end: new Date() }
  const sorted = dates.sort()
  return { start: new Date(sorted[0]), end: new Date(sorted[sorted.length - 1]) }
})

const tlChartRef = ref<HTMLElement | null>(null)

const timelineDates = computed(() => {
  const activeSprint = getActiveSprint()
  const spStart = activeSprint.startDate ? new Date(activeSprint.startDate) : sprintRange.value.start
  const spEnd = activeSprint.endDate ? new Date(activeSprint.endDate) : sprintRange.value.end
  const dates: Array<{ key: string; label: string; isWeekend: boolean; isToday: boolean }> = []
  const d = new Date(spStart)
  d.setDate(d.getDate() - 1)
  const endDate = new Date(spEnd)
  endDate.setDate(endDate.getDate() + 1)
  const todayStr = new Date().toISOString().split('T')[0]
  while (d <= endDate) {
    const key = d.toISOString().split('T')[0]
    const day = d.getDay()
    dates.push({
      key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      isWeekend: day === 0 || day === 6,
      isToday: key === todayStr,
    })
    d.setDate(d.getDate() + 1)
  }
  return dates
})

const cellWidth = 40 // px per day

function timelineBarStyle(story: PmStory) {
  if (!timelineDates.value.length) return {}
  const firstDate = timelineDates.value[0].key
  const sDate = story.startDate ?? firstDate
  const eDate = story.dueDate ?? sDate
  const startIdx = timelineDates.value.findIndex(d => d.key >= sDate)
  const endIdx = timelineDates.value.findIndex(d => d.key > eDate)
  const left = (startIdx >= 0 ? startIdx : 0) * cellWidth
  const width = Math.max(cellWidth, ((endIdx >= 0 ? endIdx : timelineDates.value.length) - (startIdx >= 0 ? startIdx : 0)) * cellWidth)
  return { left: `${left}px`, width: `${width}px` }
}

const tlGroupBy = ref<'none' | 'assignee' | 'epic'>('none')

const tlDisplayStories = computed(() => {
  const items = timelineStories.value
  if (tlGroupBy.value === 'none') return items

  if (tlGroupBy.value === 'assignee') {
    const groups = new Map<string, PmStory[]>()
    for (const s of items) {
      const key = s.assignee ?? 'Unassigned'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(s)
    }
    return [...groups.values()].flat()
  }

  if (tlGroupBy.value === 'epic') {
    const groups = new Map<number | null, PmStory[]>()
    for (const s of items) {
      if (!groups.has(s.epicId)) groups.set(s.epicId, [])
      groups.get(s.epicId)!.push(s)
    }
    return [...groups.values()].flat()
  }

  return items
})

// Roadmap view
const roadmapStatusFilter = ref('')
const expandedEpics = ref(new Set<number>())

const filteredEpics = computed(() => {
  const epics = pmEpics.value
  if (!roadmapStatusFilter.value) return epics
  return epics.filter(e => e.status === roadmapStatusFilter.value)
})

function toggleEpicExpand(id: number) {
  if (expandedEpics.value.has(id)) expandedEpics.value.delete(id)
  else expandedEpics.value.add(id)
}

function epicStories(epicId: number) {
  return sprintStories.value.filter(s => s.epicId === epicId)
}
function epicDoneCount(epicId: number) { return epicStories(epicId).filter(s => s.status === 'done').length }
function epicTotalCount(epicId: number) { return epicStories(epicId).length }
function epicDoneSP(epicId: number) { return epicStories(epicId).filter(s => s.status === 'done').reduce((sum, s) => sum + (s.storyPoints ?? 0), 0) }
function epicTotalSP(epicId: number) { return epicStories(epicId).reduce((sum, s) => sum + (s.storyPoints ?? 0), 0) }
function epicProgress(epicId: number) {
  const total = epicTotalCount(epicId)
  return total ? Math.round((epicDoneCount(epicId) / total) * 100) : 0
}

// Backlog drawer
const backlogOpen = ref(false)
const backlogStoryList = computed(() => getBacklogStories())

async function assignToCurrentSprint(storyId: number) {
  await updateStory(storyId, { sprint: getActiveSprint().id } as any)
  await refresh()
  await loadBacklog()
}

// Sprint stories grouped by epicId
const sprintStories = computed(() =>
  isBacklog.value ? getBacklogStories() : getStoriesForSprint(sprint.value),
)

const epicGroups = computed(() => {
  const groups = new Map<number | null, PmStory[]>()
  for (const s of sprintStories.value) {
    const key = s.epicId
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(s)
  }
  return groups
})

const sortedEpicKeys = computed(() => {
  const keys = [...epicGroups.value.keys()]
  return keys.sort((a, b) => {
    if (a === null) return 1
    if (b === null) return -1
    return a - b
  })
})

// Kanban: group by status
const kanbanColumns = computed(() => {
  const cols: { status: StoryStatus; label: string; stories: PmStory[] }[] = []
  for (const status of STORY_STATUSES) {
    cols.push({
      status,
      label: STORY_STATUS_LABELS[status],
      stories: sprintStories.value.filter(s => s.status === status),
    })
  }
  return cols
})

// Summary stats
const statsSummary = computed(() => {
  const all = sprintStories.value
  return {
    total: all.length,
    done: all.filter(s => s.status === 'done').length,
    inProgress: all.filter(s => s.status === 'in-progress').length,
    review: all.filter(s => s.status === 'review').length,
  }
})

async function refresh() {
  await loadPmData(isBacklog.value ? 'backlog' : sprint.value)
  if (selectedStory.value) {
    const fresh = stories.value.find(s => s.id === selectedStory.value!.id)
    if (fresh) selectedStory.value = fresh
  }
}

async function handleMoveToSprint(story: PmStory) {
  const active = getActiveSprint()
  if (!active) return
  await moveToSprint(story.id, active.id)
  await refresh()
}

async function handleMoveToBacklog(story: PmStory) {
  await moveToSprint(story.id, null)
  await refresh()
}

function openDetail(story: PmStory) {
  selectedStory.value = story
}

function onPanelUpdated() {
  refresh()
}

// Drag and drop
const dragStoryId = ref<number | null>(null)
const dragOverCol = ref<string | null>(null)

function onDragStart(e: DragEvent, story: PmStory) {
  dragStoryId.value = story.id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(story.id))
  }
}

function onDragOver(e: DragEvent, status: string) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dragOverCol.value = status
}

function onDragLeave(status: string) {
  if (dragOverCol.value === status) dragOverCol.value = null
}

async function onDrop(e: DragEvent, targetStatus: StoryStatus) {
  e.preventDefault()
  dragOverCol.value = null
  const storyId = dragStoryId.value
  dragStoryId.value = null
  if (!storyId) return

  const story = stories.value.find(s => s.id === storyId)
  if (!story || story.status === targetStatus) return

  // optimistic update
  const prevStatus = story.status
  story.status = targetStatus

  try {
    await updateStoryStatus(storyId, targetStatus)
  } catch {
    // rollback
    story.status = prevStatus
    alert('Status update failed. Reverted to previous status.')
  }
}

function onDragEnd() {
  dragStoryId.value = null
  dragOverCol.value = null
}

onMounted(async () => {
  await loadEpics()
  await refresh()
  loading.value = false
})
</script>

<template>
  <div class="board-scroll">
    <div class="board-page" :class="{ 'board-page--kanban': viewMode === 'kanban' }">
      <div class="board-header">
        <div class="board-title-row">
          <h1>{{ isBacklog ? 'Backlog' : sprint.toUpperCase() + ' Board' }}</h1>
          <div class="board-title-actions">
            <div class="view-toggle">
              <button
                class="view-btn"
                :class="{ active: viewMode === 'epic' }"
                @click="viewMode = 'epic'"
              >Epic</button>
              <button
                class="view-btn"
                :class="{ active: viewMode === 'kanban' }"
                @click="viewMode = 'kanban'"
              >Kanban</button>
              <button
                class="view-btn"
                :class="{ active: viewMode === 'timeline' }"
                @click="viewMode = 'timeline'"
              >Timeline</button>
              <button
                class="view-btn"
                :class="{ active: viewMode === 'roadmap' }"
                @click="viewMode = 'roadmap'"
              >Roadmap</button>
            </div>
            <button class="btn btn--sm" @click="router.push('/admin/board')">Admin</button>
          </div>
        </div>
        <div class="board-stats">
          <span class="stat">
            <span class="stat-num">{{ statsSummary.total }}</span> stories
          </span>
          <span class="stat stat--done">
            <span class="stat-num">{{ statsSummary.done }}</span> done
          </span>
          <span class="stat stat--progress">
            <span class="stat-num">{{ statsSummary.inProgress }}</span> in progress
          </span>
          <span class="stat stat--review">
            <span class="stat-num">{{ statsSummary.review }}</span> review
          </span>
        </div>
        <!-- Progress bar -->
        <div v-if="statsSummary.total > 0" class="progress-bar-wrap">
          <div class="progress-bar">
            <div
              class="progress-seg progress-seg--done"
              :style="{ width: (statsSummary.done / statsSummary.total * 100) + '%' }"
            ></div>
            <div
              class="progress-seg progress-seg--review"
              :style="{ width: (statsSummary.review / statsSummary.total * 100) + '%' }"
            ></div>
            <div
              class="progress-seg progress-seg--progress"
              :style="{ width: (statsSummary.inProgress / statsSummary.total * 100) + '%' }"
            ></div>
          </div>
          <span class="progress-pct">{{ Math.round(statsSummary.done / statsSummary.total * 100) }}%</span>
        </div>
      </div>

      <div v-if="loading" class="loading">Loading...</div>

      <div v-else-if="loadError" class="error-banner">
        <p>{{ loadError }}</p>
        <button class="btn btn--sm" @click="refresh">Retry</button>
      </div>

      <div
        v-else-if="sprintStories.length === 0"
        class="empty"
      >
        <h2>{{ isBacklog ? 'Backlog is empty' : 'No stories' }}</h2>
        <p>{{ isBacklog ? 'Add new stories to the backlog' : 'No stories registered for this sprint' }}</p>
      </div>

      <!-- Epic View -->
      <div v-else-if="viewMode === 'epic'" class="epic-list">
        <BoardEpicSection
          v-for="epicId in sortedEpicKeys"
          :key="epicId ?? 'unassigned'"
          :epic="epicId !== null ? getEpicById(epicId) ?? null : null"
          :stories="epicGroups.get(epicId) ?? []"
          @updated="refresh"
          @select-story="openDetail"
        />

        <!-- Backlog view hint -->
        <div v-if="isBacklog && sprintStories.length > 0" class="backlog-hint-bar">
          Click a story to open the detail panel and assign it to a sprint.
        </div>
      </div>

      <!-- Kanban View -->
      <div v-else-if="viewMode === 'kanban'" class="kanban-board">
        <div
          v-for="col in kanbanColumns"
          :key="col.status"
          class="kanban-col"
          :class="{ 'kanban-col--dragover': dragOverCol === col.status }"
          @dragover="onDragOver($event, col.status)"
          @dragleave="onDragLeave(col.status)"
          @drop="onDrop($event, col.status)"
        >
          <div class="kanban-col-header">
            <span class="kanban-col-dot" :data-status="col.status"></span>
            <span class="kanban-col-label">{{ col.label }}</span>
            <span class="kanban-col-count">{{ col.stories.length }}</span>
          </div>
          <div class="kanban-col-body">
            <div
              v-for="story in col.stories"
              :key="story.id"
              class="kanban-card-wrap"
              :class="{ 'kanban-card--dragging': dragStoryId === story.id }"
              draggable="true"
              @dragstart="onDragStart($event, story)"
              @dragend="onDragEnd"
            >
              <BoardStoryCard
                :story="story"
                @select="openDetail"
                @updated="refresh"
              />
            </div>
            <div v-if="col.stories.length === 0" class="kanban-empty">Drag to move</div>
          </div>
        </div>
      </div>

      <!-- Timeline View -->
      <div v-else-if="viewMode === 'timeline'" class="timeline-view">
        <div class="tl-filter">
          <button class="tl-filter-btn" :class="{ active: tlGroupBy === 'none' }" @click="tlGroupBy = 'none'">All</button>
          <button class="tl-filter-btn" :class="{ active: tlGroupBy === 'assignee' }" @click="tlGroupBy = 'assignee'">By Assignee</button>
          <button class="tl-filter-btn" :class="{ active: tlGroupBy === 'epic' }" @click="tlGroupBy = 'epic'">By Epic</button>
        </div>
        <div v-if="tlDisplayStories.length === 0" class="timeline-empty">No stories with dates set</div>
        <template v-else>
          <div class="tl-container">
            <div class="tl-labels">
              <div class="tl-label-header">Story</div>
              <div v-for="s in tlDisplayStories" :key="'l'+s.id" class="tl-label" @click="openDetail(s)">
                <span class="tl-label-title">{{ s.title }}</span>
                <span v-if="s.assignee" class="tl-label-assignee">{{ s.assignee }}</span>
              </div>
            </div>
            <div class="tl-chart" ref="tlChartRef">
              <!-- Date header -->
              <div class="tl-date-header">
                <div v-for="d in timelineDates" :key="d.key" class="tl-date-cell" :class="{ 'tl-weekend': d.isWeekend, 'tl-today': d.isToday }">
                  {{ d.label }}
                </div>
              </div>
              <!-- Story bars -->
              <div v-for="s in tlDisplayStories" :key="'b'+s.id" class="tl-bar-row">
                <div class="tl-grid">
                  <div v-for="d in timelineDates" :key="d.key" class="tl-grid-cell" :class="{ 'tl-weekend': d.isWeekend, 'tl-today': d.isToday }" />
                </div>
                <div class="tl-bar" :style="timelineBarStyle(s)" :title="`${s.title} (${s.storyPoints ?? 0} SP)`">
                  {{ s.storyPoints ?? '' }} SP
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Backlog drawer -->
    <div v-if="!isBacklog" class="backlog-drawer" :class="{ 'backlog-drawer--open': backlogOpen }">
      <button class="backlog-toggle" @click="backlogOpen = !backlogOpen">
        {{ backlogOpen ? '&#9660;' : '&#9654;' }} Backlog ({{ backlogStoryList.length }})
      </button>
      <div v-if="backlogOpen" class="backlog-content">
        <div v-if="backlogStoryList.length === 0" class="backlog-empty">No stories in backlog</div>
        <div v-for="s in backlogStoryList" :key="s.id" class="backlog-story-row" @click="openDetail(s)">
          <span class="backlog-story-title">{{ s.title }}</span>
          <span class="backlog-story-sp">{{ s.storyPoints ?? '-' }} SP</span>
          <button class="backlog-assign-btn" @click.stop="assignToCurrentSprint(s.id)" title="Assign to current sprint">+</button>
        </div>
      </div>
    </div>

    <!-- Roadmap View -->
    <div v-if="viewMode === 'roadmap'" class="roadmap-view">
      <div class="roadmap-filters">
        <select v-model="roadmapStatusFilter" class="filter-select">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div v-for="epic in filteredEpics" :key="epic.id" class="roadmap-card" @click="toggleEpicExpand(epic.id)">
        <div class="roadmap-card-header">
          <div class="roadmap-epic-info">
            <span class="roadmap-epic-title">{{ epic.title }}</span>
            <span class="roadmap-epic-status" :class="'es--' + epic.status">{{ epic.status }}</span>
          </div>
          <div class="roadmap-progress">
            <div class="roadmap-progress-bar">
              <div class="roadmap-progress-fill" :style="{ width: epicProgress(epic.id) + '%' }" />
            </div>
            <span class="roadmap-progress-text">{{ epicDoneCount(epic.id) }}/{{ epicTotalCount(epic.id) }} ({{ epicProgress(epic.id) }}%)</span>
          </div>
          <span class="roadmap-sp">{{ epicDoneSP(epic.id) }}/{{ epicTotalSP(epic.id) }} SP</span>
        </div>
        <!-- Story accordion -->
        <div v-if="expandedEpics.has(epic.id)" class="roadmap-stories">
          <div v-for="s in epicStories(epic.id)" :key="s.id" class="roadmap-story" :class="'rs--' + s.status" @click.stop="openDetail(s)">
            <span class="roadmap-story-title">S{{ s.id }}: {{ s.title }}</span>
            <span class="roadmap-story-sp">{{ s.storyPoints ?? '-' }}SP</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Story detail slide panel -->
    <Teleport to="body">
      <StoryDetailPanel
        v-if="selectedStory"
        :story="selectedStory"
        @close="selectedStory = null"
        @updated="onPanelUpdated"
      />
    </Teleport>
  </div>
</template>

<style scoped>
.board-scroll {
  height: 100%;
  overflow-y: auto;
}

.board-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  background: var(--bg);
  min-height: 100vh;
}
.board-page--kanban {
  max-width: 100%;
}

.board-header { margin-bottom: 20px; }

.board-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.board-title-row h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.board-title-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-toggle {
  display: flex;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 6px;
  overflow: hidden;
}
.view-btn {
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  border: none;
  background: rgba(255,255,255,0.25);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.view-btn:not(:last-child) { border-right: 1px solid rgba(0,0,0,0.06); }
.view-btn.active {
  background: var(--text-primary);
  color: var(--text-on-primary);
}
.view-btn:hover:not(.active) { background: rgba(0,0,0,0.04); }

.board-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-secondary);
}
.stat-num { font-weight: 700; }
.stat--done .stat-num { color: #22c55e; }
.stat--progress .stat-num { color: #f59e0b; }
.stat--review .stat-num { color: #8b5cf6; }

/* Progress bar */
.progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}
.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(0,0,0,0.06);
  border-radius: 3px;
  overflow: hidden;
  display: flex;
}
.progress-seg {
  height: 100%;
  transition: width 0.3s ease;
}
.progress-seg--done { background: #22c55e; }
.progress-seg--review { background: #8b5cf6; }
.progress-seg--progress { background: #f59e0b; }
.progress-pct {
  font-size: 12px;
  font-weight: 700;
  color: #22c55e;
  min-width: 36px;
  text-align: right;
}

.epic-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.epic-list > * {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(40px) saturate(1.8);
  -webkit-backdrop-filter: blur(40px) saturate(1.8);
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 16px;
  box-shadow:
    0 2px 12px rgba(0, 0, 0, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 -0.5px 0 rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

/* Kanban board */
.kanban-board {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 16px;
}

.kanban-col {
  min-width: 200px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.kanban-col-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.30);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.40);
  border-radius: 12px 12px 0 0;
  border-bottom: none;
}

.kanban-col-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
  flex-shrink: 0;
}
.kanban-col-dot[data-status="draft"] { background: #94a3b8; }
.kanban-col-dot[data-status="backlog"] { background: #a78bfa; }
.kanban-col-dot[data-status="ready"] { background: #3b82f6; }
.kanban-col-dot[data-status="ready-for-dev"] { background: #3b82f6; }
.kanban-col-dot[data-status="in-progress"] { background: #f59e0b; }
.kanban-col-dot[data-status="review"] { background: #8b5cf6; }
.kanban-col-dot[data-status="qa"] { background: #ec4899; }
.kanban-col-dot[data-status="done"] { background: #22c55e; }

.kanban-col-count {
  margin-left: auto;
  background: rgba(0,0,0,0.06);
  color: var(--text-secondary);
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kanban-col-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 0 0 8px 8px;
  background: rgba(0,0,0,0.02);
  min-height: 100px;
}

.kanban-empty {
  text-align: center;
  padding: 20px 0;
  color: var(--text-muted);
  font-size: 13px;
}

/* Drag and drop */
.kanban-card-wrap {
  cursor: grab;
  transition: opacity 0.15s, transform 0.15s;
}
.kanban-card-wrap:active { cursor: grabbing; }
.kanban-card--dragging {
  opacity: 0.3;
  transform: scale(0.95);
}
.kanban-col--dragover .kanban-col-body {
  background: rgba(59,130,246,0.06);
  border-color: rgba(59,130,246,0.3);
  border-style: dashed;
}

/* Timeline view */
.timeline-view { margin-top: 12px; }
.tl-filter { display: flex; gap: 4px; margin-bottom: 12px; }
.tl-filter-btn { border: none; background: rgba(0,0,0,0.04); border-radius: 6px; padding: 4px 12px; font-size: 12px; cursor: pointer; color: var(--text-secondary); }
.tl-filter-btn.active { background: var(--primary); color: #fff; }
.timeline-empty { color: var(--text-muted); font-size: 13px; padding: 20px; text-align: center; }
.tl-container { display: flex; overflow: hidden; }
.tl-labels { width: 200px; flex-shrink: 0; border-right: 1px solid rgba(0,0,0,0.06); }
.tl-label-header { height: 32px; font-size: 11px; font-weight: 600; color: var(--text-muted); padding: 8px; }
.tl-label { height: 32px; display: flex; flex-direction: column; justify-content: center; padding: 0 8px; border-top: 1px solid rgba(0,0,0,0.03); cursor: pointer; }
.tl-label:hover { background: rgba(0,0,0,0.02); }
.tl-label-title { font-size: 11px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tl-label-assignee { font-size: 9px; color: var(--text-muted); }
.tl-chart { flex: 1; overflow-x: auto; position: relative; }
.tl-date-header { display: flex; height: 32px; }
.tl-date-cell { width: 40px; flex-shrink: 0; font-size: 9px; text-align: center; color: var(--text-muted); padding-top: 8px; border-left: 1px solid rgba(0,0,0,0.03); }
.tl-date-cell.tl-weekend { background: rgba(239,68,68,0.06); color: #ef4444; }
.tl-date-cell.tl-today { background: rgba(59,130,246,0.12); color: #2563EB; font-weight: 700; }
.tl-bar-row { position: relative; height: 32px; border-top: 1px solid rgba(0,0,0,0.03); }
.tl-grid { display: flex; position: absolute; inset: 0; }
.tl-grid-cell { width: 40px; flex-shrink: 0; border-left: 1px solid rgba(0,0,0,0.03); }
.tl-grid-cell.tl-weekend { background: rgba(239,68,68,0.04); }
.tl-grid-cell.tl-today { background: rgba(59,130,246,0.08); }
.tl-bar {
  position: absolute; top: 4px; height: 24px; border-radius: 6px;
  background: #3B82F6; color: #fff; font-size: 10px; font-weight: 600;
  display: flex; align-items: center; padding: 0 8px; white-space: nowrap;
  z-index: 1; opacity: 0.9; overflow: hidden; text-overflow: ellipsis; min-width: 32px;
}
.tl-bar:hover { opacity: 1; }

/* Backlog drawer */
.backlog-drawer { margin-top: 24px; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 8px; }
.backlog-toggle { background: none; border: none; font-size: 14px; font-weight: 600; color: var(--text-secondary); cursor: pointer; padding: 8px 0; }
.backlog-toggle:hover { color: var(--text-primary); }
.backlog-content { margin-top: 8px; }
.backlog-empty { color: var(--text-muted); font-size: 13px; padding: 12px 0; }
.backlog-story-row {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  background: rgba(255,255,255,0.25); backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.35); border-radius: 10px;
  margin-bottom: 4px; cursor: pointer; font-size: 13px;
}
.backlog-story-row:hover { background: rgba(255,255,255,0.40); }
.backlog-story-title { flex: 1; }
.backlog-story-sp { color: var(--text-muted); font-size: 11px; }
.backlog-assign-btn {
  border: none; background: rgba(59,130,246,0.12); color: #2563EB;
  border-radius: 6px; width: 24px; height: 24px; font-size: 16px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.backlog-assign-btn:hover { background: rgba(59,130,246,0.25); }

.backlog-hint-bar {
  text-align: center;
  padding: 10px 16px;
  background: rgba(59,130,246,0.06);
  border: 1px dashed rgba(59,130,246,0.3);
  border-radius: 8px;
  color: #3b82f6;
  font-size: 13px;
}

/* Roadmap */
.roadmap-view { padding: 16px 0; }
.roadmap-filters { margin-bottom: 16px; }
.filter-select { padding: 4px 8px; border: 1px solid rgba(0,0,0,0.06); border-radius: 6px; font-size: 13px; background: rgba(255,255,255,0.25); }
.roadmap-card { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); cursor: pointer; transition: all 0.2s; }
.roadmap-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.roadmap-card-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.roadmap-epic-info { flex: 1; min-width: 0; }
.roadmap-epic-title { font-size: 15px; font-weight: 600; }
.roadmap-epic-status { font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; margin-left: 8px; }
.es--active { background: #dcfce7; color: #16a34a; }
.es--completed { background: #e0e7ff; color: #4338ca; }
.es--archived { background: #f3f4f6; color: #6b7280; }
.roadmap-progress { width: 120px; }
.roadmap-progress-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
.roadmap-progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #22c55e); border-radius: 3px; }
.roadmap-progress-text { font-size: 11px; color: #888; }
.roadmap-sp { font-size: 12px; color: #6b7280; white-space: nowrap; }
.roadmap-stories { margin-top: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0; }
.roadmap-story { display: flex; justify-content: space-between; padding: 4px 8px; font-size: 13px; border-radius: 4px; cursor: pointer; }
.roadmap-story:hover { background: #f8f9fa; }
.rs--done { color: #16a34a; } .rs--in-progress { color: #3b82f6; } .rs--backlog { color: #9ca3af; }
.roadmap-story-sp { font-size: 11px; color: #888; }

.error-banner {
  text-align: center;
  padding: 20px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  border-radius: 8px;
  color: #dc2626;
}

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
  font-size: 14px;
}
.empty h2 { font-size: 18px; color: var(--text-primary); margin-bottom: 8px; }

.btn {
  padding: 6px 14px;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  background: rgba(255,255,255,0.25);
  color: var(--text-secondary);
  white-space: nowrap;
  transition: all 0.15s;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
.btn:hover { background: rgba(255,255,255,0.4); }
.btn--sm { padding: 4px 10px; font-size: 11px; }

@media (max-width: 767px) {
  .board-page { padding: 12px; max-width: 100%; }
  .board-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .board-header h1 { font-size: 18px; }
  .board-stats { flex-wrap: wrap; gap: 6px; }
  .board-stats .stat-item { font-size: 11px; padding: 3px 8px; }
  .kanban-board { gap: 6px; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 8px; }
  .kanban-col { min-width: 200px; flex-shrink: 0; }
  .kanban-col-header { font-size: 12px; padding: 6px 8px; }
}
</style>
