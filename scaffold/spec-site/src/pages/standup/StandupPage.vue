<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStandup, type StandupFeedback } from '@/composables/useStandup'
import { useUser, TEAM_MEMBERS } from '@/composables/useUser'
import { loadPmData, loadEpics, stories, tasks, addTask } from '@/composables/usePmStore'
import StandupEntryCard from './StandupEntryCard.vue'

const route = useRoute()
const { currentUser, dynamicMembers, loadMembers } = useUser()

const sprint = computed(() => route.params.sprint as string)
const { entries, loading, error, feedback, loadEntries, saveEntry, getEntryForUser, loadFeedback, submitFeedback, startPolling, stopPolling } = useStandup()

// Track feedback per entry
const feedbackByEntry = ref<Record<number, StandupFeedback[]>>({})

async function loadAllFeedback() {
  const { apiGet } = await import('@/api/client')
  const results = await Promise.all(entries.value.map(async (entry) => {
    const { data } = await apiGet<{ feedback: Array<{
      id: number; standup_entry_id: number; sprint: string; target_user: string
      feedback_by: string; feedback_text: string; review_type: string; created_at: string
    }> }>('/api/v2/standup/feedback', { standup_entry_id: String(entry.id) })
    const items: StandupFeedback[] = (data?.feedback ?? []).map(r => ({
      id: r.id, standupEntryId: r.standup_entry_id, sprint: r.sprint,
      targetUser: r.target_user, feedbackBy: r.feedback_by,
      feedbackText: r.feedback_text,
      reviewType: (r.review_type as StandupFeedback['reviewType']) || 'comment',
      createdAt: r.created_at,
    }))
    return { id: entry.id, items }
  }))
  const map: Record<number, StandupFeedback[]> = {}
  for (const r of results) map[r.id] = r.items
  feedbackByEntry.value = map
}

function getFeedbackForEntry(entryId: number | undefined): StandupFeedback[] {
  if (!entryId) return []
  return feedbackByEntry.value[entryId] ?? []
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

const selectedDate = ref(todayStr())

const members = computed(() => {
  return dynamicMembers.value.length > 0 ? dynamicMembers.value : [...TEAM_MEMBERS]
})

// PM data — sprint scoped (for story picker in edit mode)
const sprintStories = computed(() => stories.value.filter(s => s.sprint === sprint.value))
const sprintTasks = computed(() => {
  const storyIds = new Set(sprintStories.value.map(s => s.id))
  return tasks.value.filter(t => storyIds.has(t.storyId))
})

async function onDateChange() {
  await loadEntries(selectedDate.value)
  await loadAllFeedback()
  stopPolling()
  startPolling(selectedDate.value)
}

async function handleSave(userName: string, data: { doneText: string | null; planText: string | null; planStoryIds: number[]; blockers: string | null }) {
  await saveEntry(userName, selectedDate.value, sprint.value, data)
}

async function handleCreateTask(userName: string, data: { storyId: number; title: string }) {
  await addTask({ storyId: data.storyId, title: data.title, assignee: userName })
}

async function handleSubmitFeedback(userName: string, data: { feedbackText: string; reviewType: string }) {
  const entry = getEntryForUser(userName, selectedDate.value)
  if (!entry) return
  if (!currentUser.value) return
  await submitFeedback(entry.id, sprint.value, userName, currentUser.value, data.feedbackText, data.reviewType)
  await loadAllFeedback()
}

function changeDate(delta: number) {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() + delta)
  selectedDate.value = d.toISOString().split('T')[0]
}

watch(selectedDate, () => onDateChange())

onMounted(async () => {
  await loadMembers()
  await Promise.all([
    loadEntries(selectedDate.value),
    loadEpics(),
    loadPmData(sprint.value),
  ])
  await loadAllFeedback()
  startPolling(selectedDate.value)
})
</script>

<template>
  <div class="standup-page">
    <div class="standup-header">
      <h1>Daily Standup</h1>
      <div class="date-nav">
        <button class="date-btn" @click="changeDate(-1)">&larr;</button>
        <input
          type="date"
          v-model="selectedDate"
          class="date-input"
        />
        <button class="date-btn" @click="changeDate(1)">&rarr;</button>
        <button class="date-btn date-btn--today" @click="selectedDate = todayStr()">Today</button>
      </div>
    </div>

    <div v-if="error" class="error-msg">{{ error }}</div>
    <div v-if="loading" class="loading">Loading...</div>

    <div v-else class="entries-grid">
      <StandupEntryCard
        v-for="member in members"
        :key="member"
        :entry="getEntryForUser(member, selectedDate)"
        :user-name="member"
        :editable="currentUser === member"
        :current-user="currentUser ?? ''"
        :sprint-stories="sprintStories"
        :sprint-tasks="sprintTasks"
        :feedback="getFeedbackForEntry(getEntryForUser(member, selectedDate)?.id)"
        @save="(data) => handleSave(member, data)"
        @create-task="(data) => handleCreateTask(member, data)"
        @submit-feedback="(data) => handleSubmitFeedback(member, data)"
      />
    </div>
  </div>
</template>

<style scoped>
.standup-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  height: 100%;
  overflow-y: auto;
}

.standup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.date-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.date-btn {
  padding: 6px 10px;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 6px;
  background: rgba(255,255,255,0.25);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.1s;
}
.date-btn:hover { background: rgba(255,255,255,0.4); }
.date-btn--today {
  color: #3b82f6;
  border-color: #bfdbfe;
}

.date-input {
  padding: 6px 10px;
  border: 1px solid rgba(0,0,0,0.06);
  background: rgba(255,255,255,0.25);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}
.date-input:focus { outline: none; border-color: #3b82f6; }

.entries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.loading, .error-msg {
  text-align: center;
  padding: 40px;
  font-size: 14px;
}
.loading { color: var(--text-muted); }
.error-msg { color: var(--red); }

@media (max-width: 767px) {
  .standup-page { padding: 12px; }
  .standup-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .standup-header h1 { font-size: 18px; }
  .entries-grid { grid-template-columns: 1fr; gap: 8px; }
  .date-nav { flex-wrap: wrap; }
  .date-input { font-size: 12px; }
}
</style>
