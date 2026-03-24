<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiGet, apiPost } from '@/api/client'
import { useUser } from '@/composables/useUser'

const route = useRoute()
const router = useRouter()
const { dynamicMembers, loadMembers } = useUser()

const sprintId = computed(() => route.params.sprintId as string)

// ── State ──
const step = ref<'create' | 'checkin' | 'plan' | 'done'>('create')
const loading = ref(false)
const error = ref('')
const retroActions = ref<Array<{ id: number; content: string; assignee: string | null }>>([])

// Step 1: Create
const newSprint = ref({ id: '', label: '', theme: '', startDate: '', endDate: '' })
const totalWorkingDays = ref(0)

// Step 2: Checkin
interface MemberInfo { id: number; display_name: string; checked: boolean }
const allMembers = ref<MemberInfo[]>([])
const absences = ref<Record<number, string[]>>({})
const absenceInput = ref<Record<number, string>>({})

// Step 3: Plan
const planData = ref<{
  sprint: { velocity: number | null; start_date: string; end_date: string; status: string }
  members: Array<{ member_id: number; display_name: string; working_days: number }>
  absences: Array<{ member_id: number; absence_date: string; reason: string | null }>
  stories: Array<{ id: number; title: string; story_points: number | null; assignee: string | null }>
  totalSP: number
  velocity: number
  totalWorkingDays: number
} | null>(null)

// Backlog stories for selection
const backlogStories = ref<Array<{ id: number; title: string; story_points: number | null }>>([])
const selectedStoryIds = ref<Set<number>>(new Set())

const selectedSP = computed(() => {
  return backlogStories.value
    .filter(s => selectedStoryIds.value.has(s.id))
    .reduce((sum, s) => sum + (s.story_points ?? 0), 0)
})

// ── Actions ──
async function createSprint() {
  if (!newSprint.value.id || !newSprint.value.startDate || !newSprint.value.endDate) {
    error.value = 'ID, start date, and end date are required'; return
  }
  loading.value = true; error.value = ''
  const { data, error: e } = await apiPost('/api/v2/kickoff/create', newSprint.value)
  loading.value = false
  if (e) { error.value = e; return }
  totalWorkingDays.value = (data as { totalWorkingDays: number }).totalWorkingDays
  step.value = 'checkin'
}

async function loadMemberList() {
  const { data } = await apiGet<{ members: Array<{ id: number; display_name: string }> }>('/api/v2/admin/members')
  if (data?.members) {
    allMembers.value = data.members.map(m => ({ ...m, checked: false }))
  }
}

async function addAbsence(memberId: number) {
  const date = absenceInput.value[memberId]
  if (!date) return
  loading.value = true
  await apiPost(`/api/v2/kickoff/${newSprint.value.id || sprintId.value}/absence`, {
    memberId, dates: [date]
  })
  if (!absences.value[memberId]) absences.value[memberId] = []
  absences.value[memberId].push(date)
  absenceInput.value[memberId] = ''
  loading.value = false
}

async function submitCheckin() {
  const checkedIds = allMembers.value.filter(m => m.checked).map(m => m.id)
  if (!checkedIds.length) { error.value = 'Please select participants'; return }
  loading.value = true; error.value = ''
  const sid = newSprint.value.id || sprintId.value
  const { error: e } = await apiPost(`/api/v2/kickoff/${sid}/checkin`, { memberIds: checkedIds })
  loading.value = false
  if (e) { error.value = e; return }
  await loadPlan()
  step.value = 'plan'
}

async function loadPlan() {
  const sid = newSprint.value.id || sprintId.value
  const { data } = await apiGet<typeof planData.value>(`/api/v2/kickoff/${sid}/plan`)
  if (data) planData.value = data

  // Load backlog stories
  const { data: blData } = await apiGet<{ stories: Array<{ id: number; title: string; story_points: number | null }> }>('/api/v2/pm/data?sprint=backlog')
  if (blData?.stories) backlogStories.value = blData.stories
}

function toggleStory(id: number) {
  if (selectedStoryIds.value.has(id)) selectedStoryIds.value.delete(id)
  else selectedStoryIds.value.add(id)
}

async function doKickoff() {
  const sid = newSprint.value.id || sprintId.value
  loading.value = true; error.value = ''
  const { error: e } = await apiPost(`/api/v2/nav/sprints/${sid}/kickoff`, {
    storyIds: [...selectedStoryIds.value],
    velocity: planData.value?.velocity,
  })
  loading.value = false
  if (e) { error.value = e; return }
  step.value = 'done'
}

onMounted(async () => {
  await loadMembers()
  await loadMemberList()

  // Load retro action items from the most recently closed sprint
  try {
    const { data: navData } = await apiGet<{ sprints: Array<{ id: string; status: string }> }>('/api/v2/nav')
    const lastClosed = navData?.sprints?.filter((s: { status: string }) => s.status === 'closed')?.[0]
    if (lastClosed) {
      const { data: actData } = await apiGet<{ actions: Array<{ id: number; content: string; assignee: string | null }> }>(`/api/v2/retro/${lastClosed.id}/actions`)
      if (actData?.actions) retroActions.value = actData.actions
    }
  } catch (_) { /* ignore if no retro data */ }

  // If sprintId in URL, check existing sprint status
  if (sprintId.value && sprintId.value !== 'new') {
    newSprint.value.id = sprintId.value
    const { data } = await apiGet<{ sprint: { status: string } }>(`/api/v2/kickoff/${sprintId.value}/plan`)
    if (data?.sprint) {
      if (data.sprint.status === 'planning') {
        await loadPlan()
        step.value = 'plan'
      } else if (data.sprint.status === 'active') {
        error.value = `${sprintId.value} is already an active sprint. Navigate to /kickoff/new to create a new sprint.`
      } else {
        error.value = `${sprintId.value} is already a closed sprint.`
      }
    }
  }
})
</script>

<template>
  <div class="kickoff">
    <!-- Step indicator -->
    <div class="steps">
      <div class="step-item" :class="{ active: step === 'create', done: step !== 'create' }">
        <span class="step-num">1</span> Create Sprint
      </div>
      <div class="step-line" />
      <div class="step-item" :class="{ active: step === 'checkin', done: step === 'plan' || step === 'done' }">
        <span class="step-num">2</span> Team Check-in
      </div>
      <div class="step-line" />
      <div class="step-item" :class="{ active: step === 'plan', done: step === 'done' }">
        <span class="step-num">3</span> Story Selection + Kickoff
      </div>
    </div>

    <p v-if="error" class="error-msg">{{ error }}</p>

    <!-- Previous retro action items -->
    <div v-if="retroActions.length && step === 'create'" class="retro-actions-info">
      <h3>Previous Retro Action Items (added to backlog)</h3>
      <div v-for="a in retroActions" :key="a.id" class="retro-action-item">
        {{ a.content }}
        <span v-if="a.assignee" class="retro-assignee">{{ a.assignee }}</span>
      </div>
    </div>

    <!-- Step 1: Create Sprint -->
    <section v-if="step === 'create' && !error" class="kickoff-section">
      <h2>Create Sprint</h2>
      <div class="form-grid">
        <div class="form-field">
          <label>Sprint ID</label>
          <input v-model="newSprint.id" class="input" placeholder="s56" />
        </div>
        <div class="form-field">
          <label>Label</label>
          <input v-model="newSprint.label" class="input" placeholder="S56" />
        </div>
        <div class="form-field full">
          <label>Theme</label>
          <input v-model="newSprint.theme" class="input" placeholder="Sprint goal / theme" />
        </div>
        <div class="form-field">
          <label>Start Date</label>
          <input v-model="newSprint.startDate" type="date" class="input" />
        </div>
        <div class="form-field">
          <label>End Date</label>
          <input v-model="newSprint.endDate" type="date" class="input" />
        </div>
      </div>
      <button class="btn btn--primary" :disabled="loading" @click="createSprint">
        Next &rarr;
      </button>
    </section>

    <!-- Step 2: Team Check-in -->
    <section v-if="step === 'checkin'" class="kickoff-section">
      <h2>Team Check-in</h2>
      <p class="section-desc">Select team members participating in this sprint and enter any planned absences.</p>
      <p class="info-badge">Total working days: <strong>{{ totalWorkingDays }}</strong></p>

      <div class="member-list">
        <div v-for="m in allMembers" :key="m.id" class="member-card" :class="{ checked: m.checked }">
          <div class="member-header">
            <label class="member-check">
              <input type="checkbox" v-model="m.checked" />
              <span class="member-name">{{ m.display_name }}</span>
            </label>
          </div>
          <!-- Absence input (checked members only) -->
          <div v-if="m.checked" class="absence-section">
            <div class="absence-tags">
              <span v-for="(d, i) in (absences[m.id] || [])" :key="i" class="absence-tag">
                {{ d }} &times;
              </span>
            </div>
            <div class="absence-input-row">
              <input v-model="absenceInput[m.id]" type="date" class="input input--sm" placeholder="Absence date" />
              <button class="btn btn--sm" :disabled="!absenceInput[m.id]" @click="addAbsence(m.id)">Add</button>
            </div>
          </div>
        </div>
      </div>

      <button class="btn btn--primary" :disabled="loading || !allMembers.some(m => m.checked)" @click="submitCheckin">
        Next &rarr;
      </button>
    </section>

    <!-- Step 3: Plan + Kickoff -->
    <section v-if="step === 'plan' && planData" class="kickoff-section">
      <h2>Story Selection + Kickoff</h2>

      <!-- Velocity summary -->
      <div class="velocity-summary">
        <div class="velocity-card">
          <div class="velocity-label">Team Velocity</div>
          <div class="velocity-value">{{ planData.velocity }} WD</div>
          <div class="velocity-sub">{{ planData.members.length }} members &times; {{ planData.totalWorkingDays }} working days</div>
        </div>
        <div class="velocity-card">
          <div class="velocity-label">Selected SP</div>
          <div class="velocity-value" :class="{ over: selectedSP > planData.velocity }">{{ selectedSP }}</div>
          <div v-if="selectedSP > planData.velocity" class="velocity-warn">Exceeds velocity!</div>
        </div>
      </div>

      <!-- Per-member working days -->
      <div class="wd-grid">
        <div v-for="m in planData.members" :key="m.member_id" class="wd-chip">
          {{ m.display_name }}: <strong>{{ m.working_days }} days</strong>
        </div>
      </div>

      <!-- Backlog story selection -->
      <h3>Select from Backlog</h3>
      <div v-if="!backlogStories.length" class="empty">Backlog is empty</div>
      <div v-else class="story-list">
        <div v-for="s in backlogStories" :key="s.id"
          class="story-card" :class="{ selected: selectedStoryIds.has(s.id) }"
          @click="toggleStory(s.id)">
          <input type="checkbox" :checked="selectedStoryIds.has(s.id)" @click.stop="toggleStory(s.id)" />
          <span class="story-title">{{ s.title }}</span>
          <span class="story-sp">{{ s.story_points ?? '-' }} SP</span>
        </div>
      </div>

      <!-- Already assigned stories -->
      <div v-if="planData.stories.length" class="assigned-stories">
        <h3>Already Assigned ({{ planData.stories.length }} stories, {{ planData.totalSP }} SP)</h3>
        <div v-for="s in planData.stories" :key="s.id" class="story-card assigned">
          <span class="story-title">{{ s.title }}</span>
          <span class="story-sp">{{ s.story_points ?? '-' }} SP</span>
        </div>
      </div>

      <button class="btn btn--primary btn--lg" :disabled="loading" @click="doKickoff">
        Kickoff! ({{ selectedSP + planData.totalSP }} SP)
      </button>
    </section>

    <!-- Step 4: Done -->
    <section v-if="step === 'done'" class="kickoff-section done-section">
      <h2>Kickoff Complete!</h2>
      <p>The sprint is now active.</p>
      <button class="btn btn--primary" @click="router.push('/board/' + (newSprint.id || sprintId))">Go to Board &rarr;</button>
    </section>
  </div>
</template>

<style scoped>
.kickoff { max-width: 720px; margin: 0 auto; padding: 24px; }

/* Steps */
.steps { display: flex; align-items: center; gap: 0; margin-bottom: 32px; }
.step-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); font-weight: 500; }
.step-item.active { color: #3b82f6; font-weight: 700; }
.step-item.done { color: #16a34a; }
.step-num { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; background: rgba(0,0,0,0.06); color: var(--text-secondary); }
.step-item.active .step-num { background: #3b82f6; color: white; }
.step-item.done .step-num { background: #16a34a; color: white; }
.step-line { flex: 1; height: 2px; background: rgba(0,0,0,0.06); margin: 0 8px; }

.kickoff-section { margin-bottom: 32px; }
.kickoff-section h2 { margin-bottom: 12px; font-size: 18px; }
.section-desc { color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; }
.info-badge { background: #eff6ff; color: #2563eb; padding: 8px 12px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; display: inline-block; }

/* Form */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.form-field { display: flex; flex-direction: column; gap: 4px; }
.form-field.full { grid-column: 1 / -1; }
.form-field label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
.input { padding: 8px 12px; border: 1px solid rgba(0,0,0,0.06); border-radius: 6px; font-size: 14px; background: rgba(255,255,255,0.25); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
.input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
.input--sm { padding: 4px 8px; font-size: 12px; }

/* Members */
.member-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.member-card { border: 1px solid rgba(0,0,0,0.06); border-radius: 8px; padding: 12px; background: rgba(255,255,255,0.25); backdrop-filter: blur(40px) saturate(1.8); -webkit-backdrop-filter: blur(40px) saturate(1.8); }
.member-card.checked { border-color: #3b82f6; background: rgba(59,130,246,0.06); }
.member-header { display: flex; align-items: center; }
.member-check { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; font-weight: 500; }
.absence-section { margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.04); }
.absence-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.absence-tag { background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
.absence-input-row { display: flex; gap: 6px; align-items: center; }

/* Velocity */
.velocity-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.velocity-card { background: rgba(255,255,255,0.25); backdrop-filter: blur(40px) saturate(1.8); -webkit-backdrop-filter: blur(40px) saturate(1.8); border: 1px solid rgba(255,255,255,0.45); box-shadow: 0 2px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.7); border-radius: 8px; padding: 16px; text-align: center; }
.velocity-label { font-size: 12px; color: var(--text-secondary); font-weight: 600; }
.velocity-value { font-size: 28px; font-weight: 800; color: var(--text-primary); margin: 4px 0; }
.velocity-value.over { color: #dc2626; }
.velocity-sub { font-size: 11px; color: var(--text-muted); }
.velocity-warn { font-size: 12px; color: #dc2626; font-weight: 600; }

.wd-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
.wd-chip { background: rgba(0,0,0,0.04); padding: 4px 10px; border-radius: 4px; font-size: 12px; }

/* Stories */
.story-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 20px; }
.story-card { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid rgba(0,0,0,0.06); border-radius: 6px; cursor: pointer; font-size: 13px; background: rgba(255,255,255,0.25); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
.story-card.selected { background: rgba(59,130,246,0.08); border-color: #3b82f6; }
.story-card.assigned { background: rgba(34,197,94,0.06); border-color: rgba(34,197,94,0.2); cursor: default; }
.story-title { flex: 1; }
.story-sp { font-weight: 600; min-width: 4rem; text-align: right; }

.assigned-stories { margin-bottom: 20px; }
.assigned-stories h3 { font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; }

/* Buttons */
.btn { padding: 8px 16px; border-radius: 6px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn--sm { padding: 4px 8px; font-size: 12px; }
.btn--lg { padding: 12px 24px; font-size: 16px; width: 100%; }
.btn--primary { background: #3b82f6; color: white; }
.btn--primary:hover { background: #2563eb; }
.btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }

.done-section { text-align: center; padding: 48px 0; }
.error-msg { color: #dc2626; background: #fef2f2; padding: 8px 12px; border-radius: 6px; font-size: 13px; margin-bottom: 16px; }
.empty { color: var(--text-muted); padding: 16px; text-align: center; }
.retro-actions-info { background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.15); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
.retro-actions-info h3 { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }
.retro-action-item { font-size: 13px; padding: 4px 0; display: flex; justify-content: space-between; }
.retro-assignee { font-size: 11px; color: var(--text-muted); }

@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .velocity-summary { grid-template-columns: 1fr; }
  .steps { flex-wrap: wrap; gap: 4px; }
}
</style>
