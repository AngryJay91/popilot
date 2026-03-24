<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  stories, tasks, pmLoaded, loadPmData,
  getMyStories, getMyTasks,
  updateStoryStatus, updateTaskStatus,
  STORY_STATUSES, TASK_STATUSES,
  STORY_STATUS_LABELS, TASK_STATUS_LABELS,
  type PmStory, type PmTask,
} from '@/composables/usePmStore'
import { useUser } from '@/composables/useUser'
import StatusBadge from './StatusBadge.vue'

const route = useRoute()
const { currentUser } = useUser()
const loading = ref(true)

const sprint = computed(() => route.params.sprint as string)

const myStories = computed(() => {
  if (!currentUser.value) return []
  return getMyStories(currentUser.value).filter(s => s.sprint === sprint.value)
})

const myTasks = computed(() => {
  if (!currentUser.value) return []
  return getMyTasks(currentUser.value).filter(t => {
    const story = stories.value.find(s => s.id === t.storyId)
    return story && story.sprint === sprint.value
  })
})

async function cycleStoryStatus(story: PmStory) {
  const idx = STORY_STATUSES.indexOf(story.status)
  const next = STORY_STATUSES[(idx + 1) % STORY_STATUSES.length]
  await updateStoryStatus(story.id, next)
}

async function cycleTaskStatus(task: PmTask) {
  const idx = TASK_STATUSES.indexOf(task.status)
  const next = TASK_STATUSES[(idx + 1) % TASK_STATUSES.length]
  await updateTaskStatus(task.id, next)
}

function getStoryTitle(storyId: number): string {
  return stories.value.find(s => s.id === storyId)?.title ?? '?'
}

onMounted(async () => {
  await loadPmData(sprint.value)
  loading.value = false
})
</script>

<template>
  <div class="my-tasks-page">
    <h1>My Tasks — {{ sprint.toUpperCase() }}</h1>

    <div v-if="!currentUser" class="empty">
      User setup required. Please select your name on the retrospective page.
    </div>

    <div v-else-if="loading" class="loading">Loading...</div>

    <template v-else>
      <p class="user-label">{{ currentUser }}</p>

      <!-- My stories -->
      <section class="section">
        <h2>Assigned Stories <span class="count">{{ myStories.length }}</span></h2>
        <div v-if="myStories.length === 0" class="empty-section">No assigned stories</div>
        <div v-else class="item-list">
          <div
            v-for="s in myStories"
            :key="s.id"
            class="item-row"
            @click="cycleStoryStatus(s)"
          >
            <StatusBadge :label="STORY_STATUS_LABELS[s.status]" type="status" :value="s.status" />
            <span class="item-title">{{ s.title }}</span>
            <span v-if="s.storyPoints" class="item-points">{{ s.storyPoints }}pt</span>
          </div>
        </div>
      </section>

      <!-- My tasks -->
      <section class="section">
        <h2>Assigned Tasks <span class="count">{{ myTasks.length }}</span></h2>
        <div v-if="myTasks.length === 0" class="empty-section">No assigned tasks</div>
        <div v-else class="item-list">
          <div
            v-for="t in myTasks"
            :key="t.id"
            class="item-row"
            @click="cycleTaskStatus(t)"
          >
            <StatusBadge :label="TASK_STATUS_LABELS[t.status]" type="status" :value="t.status" />
            <span class="item-title">{{ t.title }}</span>
            <span class="item-story">{{ getStoryTitle(t.storyId) }}</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.my-tasks-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

h1 {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.user-label {
  font-size: 14px;
  color: #3b82f6;
  font-weight: 600;
  margin-bottom: 20px;
}

.section {
  margin-bottom: 24px;
}
.section h2 {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}
.count {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 400;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.1s;
}
.item-row:hover { background: #f8fafc; }

.item-title {
  flex: 1;
  font-size: 13px;
  color: #334155;
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-points {
  font-size: 11px;
  color: #3b82f6;
  font-weight: 600;
}

.item-story {
  font-size: 11px;
  color: #94a3b8;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  font-size: 14px;
}

.empty-section {
  padding: 16px;
  text-align: center;
  color: #cbd5e1;
  font-size: 13px;
}
</style>
