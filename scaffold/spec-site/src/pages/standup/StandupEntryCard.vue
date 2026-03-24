<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { StandupEntry, StandupFeedback } from '@/composables/useStandup'
import type { PmStory, PmTask } from '@/composables/usePmStore'

const props = defineProps<{
  entry?: StandupEntry
  userName: string
  editable: boolean
  sprintStories: PmStory[]
  sprintTasks: PmTask[]
  feedback: StandupFeedback[]
  currentUser: string
}>()

const emit = defineEmits<{
  save: [data: { doneText: string | null; planText: string | null; planStoryIds: number[]; blockers: string | null }]
  createTask: [data: { storyId: number; title: string }]
  submitFeedback: [data: { feedbackText: string; reviewType: string }]
}>()

const doneText = ref(props.entry?.doneText ?? '')
const planText = ref(props.entry?.planText ?? '')
const blockers = ref(props.entry?.blockers ?? '')
const selectedStoryIds = ref<number[]>([...(props.entry?.planStoryIds ?? [])])
const editing = ref(false)

// Task creation state
const creatingTask = ref(false)
const newTaskTitle = ref('')
const newTaskStoryId = ref<number | null>(null)

watch(() => props.entry, (e) => {
  if (e && !editing.value) {
    doneText.value = e.doneText ?? ''
    planText.value = e.planText ?? ''
    blockers.value = e.blockers ?? ''
    selectedStoryIds.value = [...(e.planStoryIds ?? [])]
  }
})

const myStories = computed(() =>
  props.sprintStories.filter(s => s.assignee === props.userName && s.status !== 'done'),
)

interface LinkedStoryInfo {
  story: PmStory
  totalTasks: number
  doneTasks: number
  progress: number
}

const viewLinkedStories = computed<LinkedStoryInfo[]>(() => {
  const ids = props.entry?.planStoryIds ?? []
  return ids.map(id => {
    const story = props.sprintStories.find(s => s.id === id)
    if (!story) return null
    const storyTasks = props.sprintTasks.filter(t => t.storyId === id)
    const doneTasks = storyTasks.filter(t => t.status === 'done').length
    return {
      story,
      totalTasks: storyTasks.length,
      doneTasks,
      progress: storyTasks.length > 0 ? doneTasks / storyTasks.length : 0,
    }
  }).filter((x): x is LinkedStoryInfo => x !== null)
})

function getStoryProgress(storyId: number): string {
  const storyTasks = props.sprintTasks.filter(t => t.storyId === storyId)
  const done = storyTasks.filter(t => t.status === 'done').length
  return storyTasks.length > 0 ? `${done}/${storyTasks.length}` : '-'
}

function startEdit() {
  selectedStoryIds.value = [...(props.entry?.planStoryIds ?? [])]
  editing.value = true
}

function save() {
  emit('save', {
    doneText: doneText.value.trim() || null,
    planText: planText.value.trim() || null,
    planStoryIds: [...selectedStoryIds.value],
    blockers: blockers.value.trim() || null,
  })
  editing.value = false
}

function cancel() {
  doneText.value = props.entry?.doneText ?? ''
  planText.value = props.entry?.planText ?? ''
  blockers.value = props.entry?.blockers ?? ''
  selectedStoryIds.value = [...(props.entry?.planStoryIds ?? [])]
  editing.value = false
}

function startCreateTask() {
  newTaskTitle.value = props.entry?.planText ?? ''
  newTaskStoryId.value = myStories.value.length > 0 ? myStories.value[0].id : null
  creatingTask.value = true
}

function onCreateTask() {
  if (!newTaskStoryId.value || !newTaskTitle.value.trim()) return
  emit('createTask', { storyId: newTaskStoryId.value, title: newTaskTitle.value.trim() })
  creatingTask.value = false
  newTaskTitle.value = ''
  newTaskStoryId.value = null
}

// Feedback
const showFeedbackForm = ref(false)
const feedbackText = ref('')
const feedbackType = ref<'comment' | 'approve' | 'request_changes'>('comment')

function onSubmitFeedback() {
  if (!feedbackText.value.trim()) return
  emit('submitFeedback', { feedbackText: feedbackText.value.trim(), reviewType: feedbackType.value })
  feedbackText.value = ''
  feedbackType.value = 'comment'
  showFeedbackForm.value = false
}

function feedbackIcon(type: string): string {
  if (type === 'approve') return '&#10003;'
  if (type === 'request_changes') return '&#8634;'
  return '&#128172;'
}
</script>

<template>
  <div class="standup-card" :class="{ 'has-blockers': blockers.trim() }">
    <div class="card-header">
      <div class="card-header-left">
        <span class="card-user">{{ userName }}</span>
        <span v-if="entry?.sprint" class="sprint-badge">{{ entry.sprint }}</span>
      </div>
      <button v-if="editable && !editing" class="btn btn--sm" @click="startEdit">Edit</button>
    </div>

    <template v-if="editing">
      <!-- Done -->
      <div class="section">
        <label class="section-label done-label">Done (completed yesterday)</label>
        <textarea v-model="doneText" class="textarea" rows="3" placeholder="Work completed yesterday..." />
      </div>

      <!-- Plan: story linking + free text -->
      <div class="section">
        <label class="section-label plan-label">Plan (today's work)</label>

        <div v-if="myStories.length > 0" class="story-picker">
          <div class="picker-header">My Stories</div>
          <label v-for="s in myStories" :key="s.id" class="story-check">
            <input type="checkbox" :value="s.id" v-model="selectedStoryIds" />
            <span class="story-check-title">{{ s.title }}</span>
            <span class="story-check-progress">{{ getStoryProgress(s.id) }}</span>
          </label>
        </div>

        <textarea v-model="planText" class="textarea" rows="3" placeholder="Other plans..." />
      </div>

      <!-- Blockers -->
      <div class="section">
        <label class="section-label blocker-label">Blockers</label>
        <textarea v-model="blockers" class="textarea" rows="2" placeholder="Blocking issues (leave empty if none)" />
      </div>

      <div class="card-actions">
        <button class="btn btn--sm btn--primary" @click="save">Save</button>
        <button class="btn btn--sm" @click="cancel">Cancel</button>
      </div>
    </template>

    <template v-else>
      <!-- Done view -->
      <div class="section" v-if="doneText">
        <div class="section-label done-label">Done</div>
        <div class="section-text">{{ doneText }}</div>
      </div>

      <!-- Plan view: linked stories + free text -->
      <div class="section" v-if="viewLinkedStories.length > 0 || planText">
        <div class="section-label plan-label">Plan</div>

        <div v-for="ls in viewLinkedStories" :key="ls.story.id" class="linked-story">
          <div class="linked-story-title">{{ ls.story.title }}</div>
          <div class="progress-row">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (ls.progress * 100) + '%' }" />
            </div>
            <span class="progress-text">{{ ls.doneTasks }}/{{ ls.totalTasks }}</span>
          </div>
        </div>

        <div v-if="planText" class="section-text" :class="{ 'has-linked': viewLinkedStories.length > 0 }">{{ planText }}</div>

        <!-- Task creation prompt -->
        <div v-if="editable && planText && !creatingTask" class="create-task-cta">
          <button class="btn btn--xs" @click="startCreateTask">+ Create as task</button>
        </div>

        <div v-if="creatingTask" class="create-task-form">
          <input v-model="newTaskTitle" class="task-input" placeholder="Task title" />
          <select v-model="newTaskStoryId" class="story-select">
            <option :value="null" disabled>Select story...</option>
            <option v-for="s in myStories" :key="s.id" :value="s.id">{{ s.title }}</option>
          </select>
          <div class="create-task-actions">
            <button class="btn btn--xs btn--primary" @click="onCreateTask" :disabled="!newTaskStoryId || !newTaskTitle.trim()">Create</button>
            <button class="btn btn--xs" @click="creatingTask = false">Cancel</button>
          </div>
        </div>
      </div>

      <!-- Blockers view -->
      <div class="section" v-if="blockers">
        <div class="section-label blocker-label">Blockers</div>
        <div class="section-text blocker-text">{{ blockers }}</div>
      </div>

      <!-- Empty -->
      <div v-if="!doneText && !planText && viewLinkedStories.length === 0 && !blockers" class="empty-entry">
        <span v-if="editable" @click="startEdit" class="empty-cta">Click to write</span>
        <span v-else>Not submitted yet</span>
      </div>

      <!-- Feedback Section -->
      <div v-if="entry && (feedback.length > 0 || !editable)" class="feedback-section">
        <div class="section-label feedback-label">Feedback ({{ feedback.length }})</div>

        <div v-for="fb in feedback" :key="fb.id" class="feedback-item" :class="'feedback--' + fb.reviewType.replace('_', '-')">
          <div class="feedback-header">
            <span class="feedback-icon" v-html="feedbackIcon(fb.reviewType)"></span>
            <span class="feedback-author">{{ fb.feedbackBy }}</span>
            <span class="feedback-type-badge">{{ fb.reviewType }}</span>
          </div>
          <div class="feedback-text">{{ fb.feedbackText }}</div>
          <div class="feedback-time">{{ fb.createdAt }}</div>
        </div>

        <!-- Feedback Form (visible to non-owners) -->
        <div v-if="entry && !editable">
          <button v-if="!showFeedbackForm" class="btn btn--xs feedback-btn" @click="showFeedbackForm = true">+ Write feedback</button>

          <div v-if="showFeedbackForm" class="feedback-form">
            <div class="feedback-type-select">
              <label class="type-option" :class="{ active: feedbackType === 'comment' }">
                <input type="radio" v-model="feedbackType" value="comment" /> Comment
              </label>
              <label class="type-option" :class="{ active: feedbackType === 'approve' }">
                <input type="radio" v-model="feedbackType" value="approve" /> Approve
              </label>
              <label class="type-option" :class="{ active: feedbackType === 'request_changes' }">
                <input type="radio" v-model="feedbackType" value="request_changes" /> Request Changes
              </label>
            </div>
            <textarea v-model="feedbackText" class="textarea" rows="2" placeholder="Enter your feedback..." />
            <div class="card-actions">
              <button class="btn btn--xs btn--primary" @click="onSubmitFeedback" :disabled="!feedbackText.trim()">Submit</button>
              <button class="btn btn--xs" @click="showFeedbackForm = false">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.standup-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 16px;
  transition: box-shadow 0.15s;
}
.standup-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.standup-card.has-blockers { border-left: 3px solid #ef4444; }

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-user {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.sprint-badge {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.section { margin-bottom: 8px; }

.section-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
.done-label { color: #22c55e; }
.plan-label { color: #3b82f6; }
.blocker-label { color: #ef4444; }

.section-text {
  font-size: 13px;
  color: #334155;
  line-height: 1.5;
  white-space: pre-wrap;
}
.section-text.has-linked { margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0; }
.blocker-text { color: #dc2626; }

.textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  resize: vertical;
  min-height: 40px;
}
.textarea:focus { outline: none; border-color: #3b82f6; }

.card-actions { display: flex; gap: 6px; margin-top: 8px; }

/* Story Picker (edit mode) */
.story-picker {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 6px;
  background: #f8fafc;
}
.picker-header {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 6px;
}
.story-check {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 12px;
  color: #334155;
  cursor: pointer;
}
.story-check input[type="checkbox"] {
  flex-shrink: 0;
  accent-color: #3b82f6;
}
.story-check-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.story-check-progress {
  flex-shrink: 0;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
}

/* Linked stories (view mode) */
.linked-story {
  padding: 6px 0;
}
.linked-story + .linked-story {
  border-top: 1px solid #f1f5f9;
}
.linked-story-title {
  font-size: 12px;
  color: #334155;
  font-weight: 500;
  margin-bottom: 4px;
}
.progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.progress-bar {
  flex: 1;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #22c55e;
  border-radius: 2px;
  transition: width 0.3s;
}
.progress-text {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  flex-shrink: 0;
}

/* Task creation */
.create-task-cta {
  margin-top: 6px;
}
.create-task-form {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.task-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
}
.task-input:focus { outline: none; border-color: #3b82f6; }
.story-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 12px;
  background: #fff;
}
.create-task-actions { display: flex; gap: 4px; }

/* Empty state */
.empty-entry {
  text-align: center;
  padding: 12px;
  color: #cbd5e1;
  font-size: 13px;
}
.empty-cta {
  cursor: pointer;
  color: #3b82f6;
  text-decoration: underline;
}

/* Buttons */
.btn {
  padding: 6px 14px; border: 1px solid #e2e8f0; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer; background: #fff; color: #475569;
  transition: all 0.15s;
}
.btn:hover { background: #f1f5f9; }
.btn--sm { padding: 4px 10px; font-size: 11px; }
.btn--xs { padding: 3px 8px; font-size: 10px; }
.btn--primary { background: #1e293b; color: #fff; border-color: #1e293b; }
.btn--primary:hover { background: #334155; }
.btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* Feedback */
.feedback-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
}
.feedback-label { color: #8b5cf6; }

.feedback-item {
  padding: 8px;
  margin-bottom: 6px;
  border-radius: 6px;
  background: #f8fafc;
  border-left: 3px solid #cbd5e1;
}
.feedback--approve { border-left-color: #22c55e; background: #f0fdf4; }
.feedback--request-changes { border-left-color: #f59e0b; background: #fffbeb; }
.feedback--comment { border-left-color: #3b82f6; background: #eff6ff; }

.feedback-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.feedback-icon { font-size: 14px; }
.feedback-author { font-size: 12px; font-weight: 600; color: #334155; }
.feedback-type-badge {
  font-size: 9px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 3px;
  background: #e2e8f0;
  color: #64748b;
  text-transform: uppercase;
}
.feedback-text { font-size: 12px; color: #475569; line-height: 1.5; }
.feedback-time { font-size: 10px; color: #94a3b8; margin-top: 4px; }

.feedback-btn { margin-top: 6px; color: #8b5cf6; border-color: #c4b5fd; }
.feedback-btn:hover { background: #f5f3ff; }

.feedback-form { margin-top: 8px; }
.feedback-type-select {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.type-option {
  font-size: 11px;
  padding: 3px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.1s;
}
.type-option input[type="radio"] {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.type-option.active { border-color: #8b5cf6; background: #f5f3ff; color: #7c3aed; font-weight: 600; }
</style>
