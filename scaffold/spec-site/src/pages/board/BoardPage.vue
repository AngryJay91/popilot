<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  pmEpics, pmLoaded, loadEpics, loadPmData, stories,
  getStoriesForSprint, getEpicById,
  updateStory,
  STORY_STATUSES, STORY_STATUS_LABELS,
  type PmStory, type StoryStatus,
} from '@/composables/usePmStore'
import { getActiveSprint } from '@/composables/useNavStore'
import SprintColumn from './SprintColumn.vue'
import TaskCard from './TaskCard.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const selectedStory = ref<PmStory | null>(null)

const sprint = computed(() => (route.params.sprint as string) || getActiveSprint().id)

const viewMode = computed<'epic' | 'kanban'>({
  get: () => (route.query.view as string) === 'kanban' ? 'kanban' : 'epic',
  set: (v) => { router.replace({ query: v === 'epic' ? {} : { view: v } }) },
})

watch(() => route.params.sprint, async (newSprint, oldSprint) => {
  if (newSprint && newSprint !== oldSprint) {
    loading.value = true
    await refresh()
    loading.value = false
  }
})

const sprintStories = computed(() => getStoriesForSprint(sprint.value))

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

const kanbanColumns = computed(() => {
  const cols: { status: StoryStatus; label: string; stories: PmStory[] }[] = []
  for (const status of STORY_STATUSES) {
    cols.push({ status, label: STORY_STATUS_LABELS[status], stories: sprintStories.value.filter(s => s.status === status) })
  }
  return cols
})

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
  await loadPmData(sprint.value)
  if (selectedStory.value) {
    const fresh = stories.value.find(s => s.id === selectedStory.value!.id)
    if (fresh) selectedStory.value = fresh
  }
}

function openDetail(story: PmStory) { selectedStory.value = story }

const dragStoryId = ref<number | null>(null)
const dragOverCol = ref<string | null>(null)

function onDragStart(e: DragEvent, story: PmStory) {
  dragStoryId.value = story.id
  if (e.dataTransfer) { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(story.id)) }
}
function onDragOver(e: DragEvent, status: string) { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; dragOverCol.value = status }
function onDragLeave(status: string) { if (dragOverCol.value === status) dragOverCol.value = null }

async function onDrop(e: DragEvent, targetStatus: StoryStatus) {
  e.preventDefault(); dragOverCol.value = null
  const storyId = dragStoryId.value; dragStoryId.value = null
  if (!storyId) return
  const story = stories.value.find(s => s.id === storyId)
  if (!story || story.status === targetStatus) return
  const prevStatus = story.status; story.status = targetStatus
  try { await updateStory(storyId, { status: targetStatus }) } catch { story.status = prevStatus }
}

function onDragEnd() { dragStoryId.value = null; dragOverCol.value = null }

onMounted(async () => { await loadEpics(); await refresh(); loading.value = false })
</script>

<template>
  <div class="board-scroll">
    <div class="board-page" :class="{ 'board-page--kanban': viewMode === 'kanban' }">
      <div class="board-header">
        <div class="board-title-row">
          <h1>{{ sprint.toUpperCase() }} Board</h1>
          <div class="board-title-actions">
            <div class="view-toggle">
              <button class="view-btn" :class="{ active: viewMode === 'epic' }" @click="viewMode = 'epic'">Epic</button>
              <button class="view-btn" :class="{ active: viewMode === 'kanban' }" @click="viewMode = 'kanban'">Kanban</button>
            </div>
          </div>
        </div>
        <div class="board-stats">
          <span class="stat"><span class="stat-num">{{ statsSummary.total }}</span> stories</span>
          <span class="stat stat--done"><span class="stat-num">{{ statsSummary.done }}</span> done</span>
          <span class="stat stat--progress"><span class="stat-num">{{ statsSummary.inProgress }}</span> in progress</span>
          <span class="stat stat--review"><span class="stat-num">{{ statsSummary.review }}</span> review</span>
        </div>
        <div v-if="statsSummary.total > 0" class="progress-bar-wrap">
          <div class="progress-bar">
            <div class="progress-seg progress-seg--done" :style="{ width: (statsSummary.done / statsSummary.total * 100) + '%' }" />
            <div class="progress-seg progress-seg--review" :style="{ width: (statsSummary.review / statsSummary.total * 100) + '%' }" />
            <div class="progress-seg progress-seg--progress" :style="{ width: (statsSummary.inProgress / statsSummary.total * 100) + '%' }" />
          </div>
          <span class="progress-pct">{{ Math.round(statsSummary.done / statsSummary.total * 100) }}%</span>
        </div>
      </div>

      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="sprintStories.length === 0" class="empty"><h2>No stories</h2><p>No stories registered for this sprint</p></div>

      <!-- Epic View -->
      <div v-else-if="viewMode === 'epic'" class="epic-list">
        <div v-for="epicId in sortedEpicKeys" :key="epicId ?? 'unassigned'" class="epic-section">
          <div class="epic-header">
            <h3 v-if="epicId !== null">{{ getEpicById(epicId)?.title ?? 'Epic #' + epicId }}</h3>
            <h3 v-else>Unassigned</h3>
            <span class="epic-count">{{ (epicGroups.get(epicId) ?? []).length }} stories</span>
          </div>
          <div class="epic-stories">
            <TaskCard v-for="story in epicGroups.get(epicId) ?? []" :key="story.id" :story="story" @click="openDetail(story)" />
          </div>
        </div>
      </div>

      <!-- Kanban View -->
      <div v-else-if="viewMode === 'kanban'" class="kanban-board">
        <SprintColumn v-for="col in kanbanColumns" :key="col.status" :status="col.status" :label="col.label" :stories="col.stories" :drag-over="dragOverCol === col.status"
          @drag-over="onDragOver($event, col.status)" @drag-leave="onDragLeave(col.status)" @drop="onDrop($event, col.status)"
          @drag-start="onDragStart" @drag-end="onDragEnd" @select="openDetail" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.board-scroll { height: 100%; overflow-y: auto; }
.board-page { max-width: 1100px; margin: 0 auto; padding: 24px; min-height: 100vh; }
.board-page--kanban { max-width: 100%; }
.board-header { margin-bottom: 20px; }
.board-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.board-title-row h1 { font-size: 22px; font-weight: 700; color: var(--text-primary); }
.board-title-actions { display: flex; align-items: center; gap: 8px; }
.view-toggle { display: flex; border: 1px solid rgba(0,0,0,0.06); border-radius: 6px; overflow: hidden; }
.view-btn { padding: 4px 12px; font-size: 11px; font-weight: 600; border: none; background: var(--card-bg, #fff); color: var(--text-secondary); cursor: pointer; transition: all 0.15s; }
.view-btn:not(:last-child) { border-right: 1px solid rgba(0,0,0,0.06); }
.view-btn.active { background: var(--text-primary, #1e293b); color: #fff; }
.board-stats { display: flex; gap: 16px; font-size: 13px; color: var(--text-secondary); }
.stat-num { font-weight: 700; }
.stat--done .stat-num { color: #22c55e; }
.stat--progress .stat-num { color: #f59e0b; }
.stat--review .stat-num { color: #8b5cf6; }
.progress-bar-wrap { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
.progress-bar { flex: 1; height: 6px; background: rgba(0,0,0,0.06); border-radius: 3px; overflow: hidden; display: flex; }
.progress-seg { height: 100%; transition: width 0.3s ease; }
.progress-seg--done { background: #22c55e; }
.progress-seg--review { background: #8b5cf6; }
.progress-seg--progress { background: #f59e0b; }
.progress-pct { font-size: 12px; font-weight: 700; color: #22c55e; min-width: 36px; text-align: right; }
.epic-list { display: flex; flex-direction: column; gap: 16px; }
.epic-section { background: var(--card-bg, #fff); border: 1px solid var(--border-light, #e2e8f0); border-radius: 16px; overflow: hidden; }
.epic-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-light, #e2e8f0); }
.epic-header h3 { font-size: 15px; font-weight: 600; }
.epic-count { font-size: 12px; color: var(--text-muted); }
.epic-stories { padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
.kanban-board { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 16px; }
.loading, .empty { text-align: center; padding: 60px 20px; color: var(--text-muted); font-size: 14px; }
.empty h2 { font-size: 18px; color: var(--text-primary); margin-bottom: 8px; }
@media (max-width: 767px) { .board-page { padding: 12px; } .board-stats { flex-wrap: wrap; gap: 6px; } }
</style>
