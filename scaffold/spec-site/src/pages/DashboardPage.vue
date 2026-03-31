<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboard } from '@/composables/useDashboard'
import { apiPatch, apiPost, apiGet } from '@/api/client'
import { getActiveSprint } from '@/composables/useNavStore'
import { useUser, TEAM_MEMBERS } from '@/composables/useUser'
import { Bell, Rocket, BarChart3, Sun, Zap, FileText, ClipboardList, ScrollText } from 'lucide-vue-next'
import { useConfirm } from '@/composables/useConfirm'

const memoTypeComponentMap: Record<string, any> = {
  decision: Zap,
  feature_request: Rocket,
  policy_request: ScrollText,
  request: ClipboardList,
  memo: FileText
}

const router = useRouter()
const { currentUser, dynamicMembers, loadMembers } = useUser()
const { showConfirm, showAlert } = useConfirm()
const dashboard = useDashboard()

const sprint = computed(() => getActiveSprint().id)

const members = computed(() => {
  return dynamicMembers.value.length > 0 ? dynamicMembers.value : [...TEAM_MEMBERS]
})

const standupNotWritten = computed(() => {
  if (!dashboard.standupStatus.value) return []
  const written = new Set(dashboard.standupStatus.value.written)
  return members.value.filter((m: string) => !written.has(m))
})

function formatTime(ts: string): string {
  if (!ts) return ''
  const d = new Date(ts + (ts.includes('Z') ? '' : 'Z'))
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '...' : text
}

function nudgeRuleLabel(ruleId: string): string {
  const labels: Record<string, string> = {
    review_overdue: 'Review Overdue',
    sprint_deadline: 'Sprint Deadline',
    standup_missing: 'Standup Missing',
    task_stale: 'Task Stale',
    blocker_unresolved: 'Blocker Unresolved',
    daily_report: 'Daily Report',
  }
  return labels[ruleId] ?? ruleId
}

function formatDate(ts: string): string {
  if (!ts) return ''
  const d = new Date(ts + (ts.includes('Z') ? '' : 'Z'))
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`
}

function initiativeStatusLabel(status: string): string {
  return { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', deferred: 'Deferred' }[status] ?? status
}

async function handleInitiative(id: number, status: 'approved' | 'rejected') {
  await apiPatch(`/api/v2/initiatives/${id}/status`, { status })
  await dashboard.loadTeamInitiatives()
}

async function convertToEpic(item: any) {
  const title = item.title || item.content?.split('\n')[0]?.slice(0, 100) || 'New Epic'
  if (!await showConfirm(`Create epic "${title}"?`)) return
  const { error } = await apiPost('/api/v2/pm/epics', { title, description: item.content })
  if (error) { await showAlert(error); return }
  await handleInitiative(item.id, 'approved' as any)
  await showAlert('Epic created')
}

async function convertToStory(item: any) {
  const title = item.title || item.content?.split('\n')[0]?.slice(0, 100) || 'New Story'
  if (!await showConfirm(`Create story "${title}"?`)) return
  const { error } = await apiPost('/api/v2/pm/stories', {
    title,
    description: item.content,
    status: 'backlog',
  })
  if (error) { await showAlert(error); return }
  await handleInitiative(item.id, 'approved' as any)
  await showAlert('Story created')
}

async function resolveFromNudge(nudge: { title: string; body: string }) {
  await dashboard.loadAll(sprint.value, currentUser.value ?? undefined)
  await dashboard.loadNudgeLog()
}

async function handleReview(memoId: number, action: 'approve' | 'reject') {
  const endpoint = action === 'approve' ? 'resolve' : 'reopen'
  await apiPatch(`/api/v2/memos/${memoId}/${endpoint}`, { userName: currentUser.value ?? '' })
  await dashboard.loadAll(sprint.value, currentUser.value ?? undefined)
}

const mySummary = ref<any>(null)
const activities = ref<any[]>([])

async function loadActivities() {
  const { data } = await apiGet('/api/v2/activity?limit=20')
  if (data?.activities) activities.value = data.activities as any[]
}

function formatActivityTime(d: string) {
  if (!d) return ''
  const date = new Date(d.endsWith('Z') ? d : d + 'Z')
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function activityIcon(type: string) {
  const map: Record<string, string> = {
    story_status_change: '🔄', pr_merged: '🔀', memo_created: '📝',
    memo_reply: '💬', initiative_created: '💡', standup_saved: '📋',
  }
  return map[type] || '📌'
}

function activityDesc(a: any) {
  const meta = a.metadata ? JSON.parse(a.metadata) : {}
  if (a.action_type === 'story_status_change') return `${a.target_title} → ${meta.status || ''}`
  if (a.action_type === 'pr_merged') return `PR merged: ${a.target_title}`
  if (a.action_type === 'memo_created') return `Memo: ${a.target_title?.slice(0, 40)}`
  return a.target_title || a.action_type
}

async function loadMySummary() {
  const user = currentUser.value
  if (!user) return
  const { data } = await apiGet(`/api/v2/dashboard/my-summary?user=${encodeURIComponent(user)}`)
  if (data) mySummary.value = data
}

const sprintSummary = ref<{ completedCount: number; totalStories: number; doneSP: number; totalSP: number; completionRate: number } | null>(null)
const velocityData = ref<Array<{ assignee: string; doneSP: number; totalSP: number }>>([])

const sprintHistory = ref<Array<{ id: string; label: string; doneSP: number; isActive?: boolean }>>([])
const maxHistorySP = computed(() => Math.max(...sprintHistory.value.map(s => s.doneSP), 1))

async function loadSprintHistory() {
  const { data: navData } = await apiGet('/api/v2/nav')
  if (!navData?.sprints) return
  const allSprints = (navData.sprints as any[]).sort((a: any, b: any) => (a.start_date ?? '').localeCompare(b.start_date ?? ''))
  const sprints = allSprints.slice(-5)
  const history: typeof sprintHistory.value = []
  for (const sp of sprints) {
    const { data: preview } = await apiGet(`/api/v2/kickoff/${sp.id}/close-preview`)
    history.push({
      id: sp.id,
      label: sp.label || sp.id,
      doneSP: (preview?.summary as any)?.doneSP ?? 0,
      isActive: sp.status === 'active' || sp.active === 1,
    })
  }
  sprintHistory.value = history
}

async function loadSprintStats() {
  const { data } = await apiGet(`/api/v2/kickoff/${sprint.value}/close-preview`)
  if (data?.summary) sprintSummary.value = data.summary as any
  if (data?.velocity) velocityData.value = data.velocity as any
}

onMounted(async () => {
  await loadMembers()
  await Promise.all([
    dashboard.loadAll(sprint.value, currentUser.value ?? undefined),
    dashboard.loadNudgeLog(),
    dashboard.loadTeamInitiatives(),
    loadSprintStats(),
    loadSprintHistory(),
    loadMySummary(),
    loadActivities(),
  ])
})
</script>

<template>
  <div class="dashboard-wrapper">
  <div class="dashboard">
    <div class="dashboard-header">
      <div class="header-top">
        <h1>Team Flow Monitor</h1>
        <span class="sprint-badge">{{ sprint }}</span>
      </div>
      <p class="header-subtitle">Team progress and key initiatives at a glance</p>
    </div>

    <div v-if="dashboard.loading.value" class="loading">Loading...</div>

    <!-- My Work -->
    <section v-if="mySummary" class="my-section">
      <h2>My Work</h2>
      <div class="my-cards">
        <div class="my-card" :class="{ warn: (mySummary.myStories || []).some((s: any) => s.daysInProgress >= 3) }" @click="$router.push('/board')">
          <div class="my-card-title">In Progress Stories</div>
          <div class="my-card-count">{{ (mySummary.myStories || []).length }}</div>
          <div v-for="s in (mySummary.myStories || []).slice(0, 3)" :key="s.id" class="my-story-item">
            <span>{{ s.title?.slice(0, 30) }}</span>
            <span v-if="s.daysInProgress >= 3" class="days-warn">{{ s.daysInProgress }}d</span>
          </div>
        </div>
        <div class="my-card" @click="$router.push('/board')">
          <div class="my-card-title">Pending Reviews</div>
          <div class="my-card-count">{{ (mySummary.myReviews || []).length }}</div>
        </div>
        <div class="my-card" @click="$router.push('/inbox')">
          <div class="my-card-title">Unread Mentions</div>
          <div class="my-card-count">{{ mySummary.unreadMentions || 0 }}</div>
        </div>
        <div class="my-card" @click="$router.push('/memos')">
          <div class="my-card-title">Unanswered Memos</div>
          <div class="my-card-count">{{ mySummary.unansweredMemos || 0 }}</div>
        </div>
      </div>
    </section>

    <!-- Sprint Progress -->
    <section v-if="sprintSummary" class="sprint-progress-card">
      <h2>Sprint Progress</h2>
      <div class="progress-stats">
        <div class="progress-stat">
          <span class="stat-value">{{ sprintSummary.completedCount }} / {{ sprintSummary.totalStories }}</span>
          <span class="stat-label">Stories</span>
        </div>
        <div class="progress-stat">
          <span class="stat-value">{{ sprintSummary.doneSP }} / {{ sprintSummary.totalSP }}</span>
          <span class="stat-label">SP</span>
        </div>
        <div class="progress-stat">
          <span class="stat-value">{{ sprintSummary.completionRate }}%</span>
          <span class="stat-label">Completion</span>
        </div>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" :style="{ width: sprintSummary.completionRate + '%' }" />
      </div>

      <div v-if="velocityData.length" class="velocity-chart">
        <h3>Team Velocity</h3>
        <div v-for="v in velocityData" :key="v.assignee" class="velocity-bar-row">
          <span class="velocity-label">{{ v.assignee }}</span>
          <div class="velocity-bar-bg">
            <div class="velocity-bar-done" :style="{ width: v.totalSP > 0 ? (v.doneSP / v.totalSP * 100) + '%' : '0%' }" />
          </div>
          <span class="velocity-sp">{{ v.doneSP }}/{{ v.totalSP }}</span>
        </div>
      </div>

      <div class="burndown-chart">
        <h3>Burndown Chart</h3>
        <svg viewBox="0 0 400 200" class="burndown-svg">
          <line x1="40" y1="20" x2="380" y2="180" stroke="#d1d5db" stroke-width="2" stroke-dasharray="6,4" />
          <text x="350" y="170" font-size="11" fill="#9ca3af" font-weight="600">Ideal</text>
          <line x1="40" y1="180" x2="380" y2="180" stroke="#9ca3af" stroke-width="1" />
          <line x1="40" y1="20" x2="40" y2="180" stroke="#9ca3af" stroke-width="1" />
          <circle
            :cx="40 + (sprintSummary.completionRate / 100) * 340"
            :cy="20 + ((1 - ((sprintSummary.totalSP - sprintSummary.doneSP) / (sprintSummary.totalSP || 1))) * 160)"
            r="6" fill="#3b82f6"
          />
          <line x1="40" y1="20"
            :x2="40 + (sprintSummary.completionRate / 100) * 340"
            :y2="20 + ((1 - ((sprintSummary.totalSP - sprintSummary.doneSP) / (sprintSummary.totalSP || 1))) * 160)"
            stroke="#3b82f6" stroke-width="2"
          />
          <text x="40" y="195" font-size="10" fill="#888">Start</text>
          <text x="360" y="195" font-size="10" fill="#888">End</text>
          <text x="5" y="25" font-size="10" fill="#888">{{ sprintSummary.totalSP }}SP</text>
          <text x="5" y="185" font-size="10" fill="#888">0</text>
        </svg>
        <p class="burndown-note">Remaining SP: {{ (sprintSummary.totalSP ?? 0) - (sprintSummary.doneSP ?? 0) }} / {{ sprintSummary.totalSP ?? 0 }}</p>
      </div>

      <div v-if="sprintHistory.length > 1" class="sprint-history-chart">
        <h3>Sprint Velocity Trend</h3>
        <div class="history-bars">
          <div v-for="sh in sprintHistory" :key="sh.id" class="history-bar-col">
            <div class="history-bar-bg">
              <div class="history-bar-fill" :style="{ height: maxHistorySP > 0 ? (sh.doneSP / maxHistorySP * 100) + '%' : '0%' }" />
            </div>
            <span class="history-bar-label">{{ sh.label }}</span>
            <span class="history-bar-sp">{{ sh.doneSP }}{{ sh.isActive ? ' (active)' : '' }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Activity Feed -->
    <section v-if="activities.length" class="activity-section">
      <h2>Recent Activity</h2>
      <div class="activity-list">
        <div v-for="a in activities.slice(0, 10)" :key="a.id" class="activity-item">
          <span class="activity-time">{{ formatActivityTime(a.created_at) }}</span>
          <span class="activity-icon">{{ activityIcon(a.action_type) }}</span>
          <span class="activity-actor">{{ a.actor }}</span>
          <span class="activity-desc">{{ activityDesc(a) }}</span>
        </div>
      </div>
    </section>

    <div v-if="!dashboard.loading.value" class="dashboard-grid">
      <div class="section-divider"><span>Team Flow</span></div>

      <!-- Nudge Log -->
      <section class="card card--nudge">
        <div class="card-title">
          <Bell :size="16" class="card-icon" />
          Recent Alerts (Nudge)
          <span v-if="dashboard.nudgeLog.value.length" class="count-badge count--amber">{{ dashboard.nudgeLog.value.length }}</span>
        </div>
        <div v-if="dashboard.nudgeLog.value.length === 0" class="card-empty">No alerts sent</div>
        <div v-else class="card-list">
          <div v-for="n in dashboard.nudgeLog.value" :key="n.id" class="nudge-row clickable" :class="'nudge--' + n.ruleId" @click="router.push(`/board/${sprint}`)">
            <span class="nudge-rule-badge" :class="'rule--' + n.ruleId">{{ nudgeRuleLabel(n.ruleId) }}</span>
            <div class="nudge-text">
              <span class="nudge-title">{{ n.title }}</span>
              <span v-if="n.body" class="nudge-body">{{ truncate(n.body, 80) }}</span>
            </div>
            <span class="memo-time">{{ formatDate(n.createdAt) }} {{ formatTime(n.createdAt) }}</span>
            <button v-if="n.ruleId === 'review_overdue'" class="btn-action btn--approve" @click.stop="resolveFromNudge(n)" title="Approve">✓</button>
          </div>
        </div>
      </section>

      <!-- Team Initiatives -->
      <section class="card card--initiatives">
        <div class="card-title">
          <Rocket :size="16" class="card-icon" />
          Team Initiatives
          <span v-if="dashboard.teamInitiatives.value.length" class="count-badge count--blue">{{ dashboard.teamInitiatives.value.length }}</span>
        </div>
        <div v-if="dashboard.teamInitiatives.value.length === 0" class="card-empty">No active initiatives</div>
        <div v-else class="card-list">
          <div v-for="item in dashboard.teamInitiatives.value" :key="item.id" class="memo-row initiative-row">
            <span class="initiative-status-badge" :class="'ist--' + item.memoType">{{ initiativeStatusLabel(item.memoType) }}</span>
            <span class="memo-content">{{ item.title || truncate(item.content, 50) }}</span>
            <span class="memo-author">{{ item.createdBy }}</span>
            <span class="memo-time">{{ formatDate(item.createdAt) }}</span>
            <div v-if="item.memoType === 'pending'" class="initiative-actions">
              <button class="btn-action btn--approve" @click.stop="handleInitiative(item.id, 'approved')" title="Approve">✓</button>
              <button class="btn-action btn--reject" @click.stop="handleInitiative(item.id, 'rejected')" title="Reject">✗</button>
            </div>
            <div v-if="item.memoType === 'approved'" class="initiative-actions">
              <button class="btn-action btn--convert-epic" @click.stop="convertToEpic(item)" title="Convert to Epic">Epic</button>
              <button class="btn-action btn--convert-story" @click.stop="convertToStory(item)" title="Convert to Story">Story</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Sprint Progress + Standup -->
      <section class="card card--progress">
        <div class="card-title">
          <BarChart3 :size="16" class="card-icon" />
          Sprint Progress
        </div>
        <div v-if="dashboard.sprintProgress.value" class="progress-content clickable" @click="router.push(`/board/${sprint}`)">
          <div class="progress-bar-container">
            <div class="progress-bar-fill" :style="{ width: dashboard.sprintProgress.value.progressPercent + '%' }" />
          </div>
          <div class="progress-stats">
            <span class="progress-percent">{{ dashboard.sprintProgress.value.progressPercent }}%</span>
            <span class="progress-detail">{{ dashboard.sprintProgress.value.done }} / {{ dashboard.sprintProgress.value.total }} stories</span>
          </div>
          <div class="status-breakdown">
            <span v-for="(cnt, status) in dashboard.sprintProgress.value.byStatus" :key="status" class="status-chip" :class="'status--' + status">
              {{ status }}: {{ cnt }}
            </span>
          </div>
        </div>
        <div v-else class="card-empty">No data</div>

        <div v-if="dashboard.mySprintProgress.value" class="my-progress">
          <div class="my-progress-label">My Stories</div>
          <div class="progress-bar-container" style="height: 6px;">
            <div class="progress-bar-fill" :style="{ width: dashboard.mySprintProgress.value.progressPercent + '%' }" />
          </div>
          <span class="progress-detail">{{ dashboard.mySprintProgress.value.done }} / {{ dashboard.mySprintProgress.value.total }}</span>
        </div>
      </section>

      <section class="card card--standup">
        <div class="card-title">
          <Sun :size="16" class="card-icon" />
          Today's Standup
        </div>
        <div v-if="dashboard.standupStatus.value" class="standup-content">
          <div class="standup-stat">
            <span class="standup-count">{{ dashboard.standupStatus.value.count }}</span>
            <span class="standup-label">/ {{ members.length }} written</span>
          </div>
          <div v-if="standupNotWritten.length > 0" class="standup-missing">
            <span class="missing-label">Not written:</span>
            <span v-for="name in standupNotWritten" :key="name" class="missing-name">{{ name }}</span>
          </div>
          <div v-else class="card-empty">All members completed</div>
          <button class="btn btn--sm" @click="router.push(`/standup/${sprint}`)">View Standup →</button>
        </div>
        <div v-else class="card-empty">No data</div>
      </section>

      <div class="section-divider"><span>My Work</span></div>

      <!-- Pending Approvals -->
      <section class="card card--pending">
        <div class="card-title">
          <Bell :size="16" class="card-icon" />
          Pending Approvals
          <span v-if="dashboard.pendingReviews.value.length" class="count-badge">{{ dashboard.pendingReviews.value.length }}</span>
        </div>
        <div v-if="dashboard.pendingReviews.value.length === 0" class="card-empty">None</div>
        <div v-else class="card-list">
          <div v-for="memo in dashboard.pendingReviews.value" :key="memo.id" class="memo-row review-row">
            <span class="memo-author">{{ memo.createdBy }}</span>
            <span class="memo-content">{{ truncate(memo.content, 60) }}</span>
            <span class="memo-time">{{ formatTime(memo.createdAt) }}</span>
            <div class="review-actions">
              <button class="btn-action btn--approve" @click.stop="handleReview(memo.id, 'approve')">✓</button>
              <button class="btn-action btn--reject" @click.stop="handleReview(memo.id, 'reject')">✗</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Unread Memos -->
      <section class="card card--memos">
        <div class="card-title">
          <FileText :size="16" class="card-icon" />
          Unread Memos
          <span v-if="dashboard.unreadMemos.value.length" class="count-badge">{{ dashboard.unreadMemos.value.length }}</span>
        </div>
        <div v-if="dashboard.unreadMemos.value.length === 0" class="card-empty">None</div>
        <div v-else class="card-list">
          <div v-for="memo in dashboard.unreadMemos.value" :key="memo.id" class="memo-row clickable" :class="{ 'review-required': memo.reviewRequired }" @click="router.push(`/board/${sprint}`)">
            <span class="memo-author">{{ memo.createdBy }}</span>
            <span class="memo-content">{{ truncate(memo.content, 60) }}</span>
            <span v-if="memo.reviewRequired" class="review-badge">Approval Required</span>
            <span class="memo-time">{{ formatTime(memo.createdAt) }}</span>
          </div>
        </div>
      </section>

      <!-- My Requests -->
      <section class="card card--requests">
        <div class="card-title">
          <Rocket :size="16" class="card-icon" />
          My Requests
          <span v-if="dashboard.myRequests.value.length" class="count-badge count--blue">{{ dashboard.myRequests.value.length }}</span>
        </div>
        <div v-if="dashboard.myRequests.value.length === 0" class="card-empty">None</div>
        <div v-else class="card-list">
          <div v-for="req in dashboard.myRequests.value" :key="req.id" class="memo-row">
            <component :is="memoTypeComponentMap[req.memoType] || FileText" :size="14" class="memo-type-icon" />
            <span class="memo-content">{{ req.title || truncate(req.content, 50) }}</span>
            <span class="status-chip" :class="'status--' + req.status">{{ req.status }}</span>
          </div>
        </div>
      </section>

      <!-- Active Decisions -->
      <section class="card card--decisions">
        <div class="card-title">
          <Zap :size="16" class="card-icon" />
          Active Decisions
          <span v-if="dashboard.activeDecisions.value.length" class="count-badge count--purple">{{ dashboard.activeDecisions.value.length }}</span>
        </div>
        <div v-if="dashboard.activeDecisions.value.length === 0" class="card-empty">None</div>
        <div v-else class="card-list">
          <div v-for="dec in dashboard.activeDecisions.value" :key="dec.id" class="memo-row decision-row">
            <span class="memo-content">{{ dec.title || truncate(dec.content, 50) }}</span>
            <span class="memo-author">{{ dec.createdBy }}</span>
            <span class="memo-time">{{ formatTime(dec.createdAt) }}</span>
          </div>
        </div>
      </section>
    </div>

    <div v-if="dashboard.errors.value.length" class="error-list">
      <div v-for="(err, i) in dashboard.errors.value" :key="i" class="error-msg">{{ err }}</div>
    </div>
  </div>
  </div>
</template>

<style scoped>
.dashboard { max-width: 1100px; margin: 0 auto; padding: 24px; min-height: 100vh; position: relative; }
.dashboard-wrapper { background: transparent; min-height: 100vh; position: relative; }
.dashboard > * { position: relative; z-index: 1; }
.dashboard-header { margin-bottom: 24px; }
.header-top { display: flex; align-items: center; gap: 10px; }
.dashboard-header h1 { font-size: 26px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; }
.header-subtitle { font-size: 14px; color: var(--text-secondary); margin: 4px 0 0; }
.sprint-badge { font-size: 12px; font-weight: 600; color: var(--text-primary); background: rgba(0,0,0,0.06); backdrop-filter: blur(10px); padding: 4px 10px; border-radius: 20px; text-transform: uppercase; }
.dashboard-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; overflow: hidden; }
.card { background: rgba(255,255,255,0.25); backdrop-filter: blur(40px) saturate(1.8); -webkit-backdrop-filter: blur(40px) saturate(1.8); border: 1px solid rgba(255,255,255,0.45); border-radius: 24px; padding: 22px; box-shadow: 0 2px 12px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.03); transition: all 0.3s cubic-bezier(0.25,0.1,0.25,1); overflow: visible; min-width: 0; position: relative; isolation: isolate; }
.card::before { content: ''; position: absolute; inset: -20%; background: radial-gradient(ellipse at 20% 50%, rgba(0,220,200,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, rgba(160,100,255,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(255,150,200,0.05) 0%, transparent 50%); filter: blur(30px); pointer-events: none; z-index: -1; border-radius: inherit; }
.card:hover { background: rgba(255,255,255,0.32); box-shadow: 0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(0,0,0,0.04); transform: translateY(-2px); }
.card-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
.card-icon { flex-shrink: 0; color: var(--text-secondary); }
.count-badge { font-size: 11px; font-weight: 700; color: #fff; background: #ef4444; padding: 1px 6px; border-radius: 10px; min-width: 18px; text-align: center; }
.card-empty { text-align: center; padding: 8px; color: var(--text-muted); font-size: 12px; }
.card-list { display: flex; flex-direction: column; gap: 6px; overflow: hidden; }
.memo-row { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; background: var(--inner-card-bg); font-size: 12px; overflow: hidden; min-width: 0; }
.memo-row.review-required { background: rgba(255,149,0,0.10); border-left: 3px solid #FF9500; }
.memo-row.clickable { cursor: pointer; transition: background 0.15s; }
.memo-row.clickable:hover { background: rgba(255,255,255,0.08); }
.review-row { flex-wrap: wrap; }
.review-actions { display: flex; gap: 4px; margin-left: auto; }
.btn-action { border: none; border-radius: 4px; width: 28px; height: 28px; cursor: pointer; font-size: 14px; font-weight: 700; }
.btn--approve { background: rgba(34,197,94,0.15); color: #16a34a; }
.btn--approve:hover { background: #bbf7d0; }
.btn--reject { background: rgba(255,59,48,0.15); color: #dc2626; }
.btn--reject:hover { background: #fecaca; }
.clickable { cursor: pointer; }
.memo-author { font-weight: 600; color: #334155; flex-shrink: 0; }
.memo-content { flex: 1; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.memo-time { flex-shrink: 0; color: var(--text-muted); font-size: 11px; }
.review-badge { font-size: 9px; font-weight: 600; padding: 1px 5px; border-radius: 3px; background: rgba(255,149,0,0.12); color: #d97706; flex-shrink: 0; }
.progress-content { display: flex; flex-direction: column; gap: 8px; }
.progress-bar-container { width: 100%; height: 8px; background: rgba(0,0,0,0.06); border-radius: 4px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, #3B82F6, #60A5FA); border-radius: 4px; transition: width 0.5s; }
.progress-stats { display: flex; align-items: baseline; gap: 8px; }
.progress-percent { font-size: 24px; font-weight: 700; color: var(--text-primary); }
.progress-detail { font-size: 12px; color: var(--text-secondary); }
.status-breakdown { display: flex; gap: 6px; flex-wrap: wrap; }
.status-chip { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: rgba(0,0,0,0.04); color: var(--text-secondary); font-weight: 600; border: 1px solid rgba(0,0,0,0.06); }
.status--done { background: rgba(34,197,94,0.22); color: #16a34a; border-color: rgba(34,197,94,0.20); }
.status--in-progress { background: rgba(59,130,246,0.12); color: #2563EB; border-color: rgba(59,130,246,0.20); }
.status--review { background: rgba(255,149,0,0.12); color: #d97706; border-color: rgba(255,149,0,0.20); }
.status--blocked { background: rgba(255,59,48,0.12); color: #dc2626; border-color: rgba(255,59,48,0.20); }
.status--backlog { background: rgba(100,116,139,0.10); color: #64748b; border-color: rgba(100,116,139,0.15); }
.status--open { background: rgba(59,130,246,0.15); color: #2563EB; border-color: rgba(59,130,246,0.25); }
.status--resolved { background: rgba(34,197,94,0.15); color: #16a34a; border-color: rgba(34,197,94,0.25); }
.standup-content { display: flex; flex-direction: column; gap: 8px; }
.standup-stat { display: flex; align-items: baseline; gap: 4px; }
.standup-count { font-size: 28px; font-weight: 700; color: var(--text-primary); }
.standup-label { font-size: 13px; color: var(--text-secondary); }
.standup-missing { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
.missing-label { font-size: 11px; color: #ef4444; font-weight: 600; }
.missing-name { font-size: 11px; padding: 1px 6px; border-radius: 3px; background: rgba(255,59,48,0.12); color: #dc2626; }
.btn { padding: 6px 14px; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; background: var(--inner-card-bg); color: var(--text-secondary); transition: all 0.15s; align-self: flex-start; }
.btn:hover { background: #f1f5f9; }
.btn--sm { padding: 4px 10px; font-size: 11px; }
.count--blue { background: #3b82f6; }
.count--purple { background: #8b5cf6; }
.count--amber { background: #f59e0b; }
.memo-type-icon { flex-shrink: 0; color: var(--text-secondary); }
.decision-row { border-left: 3px solid #8b5cf6; }
.my-progress { margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(0,0,0,0.08); display: flex; align-items: center; gap: 8px; }
.my-progress-label { font-size: 11px; font-weight: 600; color: var(--text-secondary); flex-shrink: 0; }
.my-progress .progress-bar-container { flex: 1; }
.section-divider { grid-column: 1 / -1; display: flex; align-items: center; gap: 12px; margin: 8px 0 0; }
.section-divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
.section-divider span { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.card--nudge { grid-column: 1 / -1; }
.nudge-row { display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; border-radius: 6px; background: var(--inner-card-bg); font-size: 12px; overflow: hidden; min-width: 0; }
.nudge--review_overdue { border-left: 3px solid #f59e0b; }
.nudge--sprint_deadline { border-left: 3px solid #ef4444; }
.nudge--standup_missing { border-left: 3px solid #3b82f6; }
.nudge--task_stale { border-left: 3px solid #8b5cf6; }
.nudge--blocker_unresolved { border-left: 3px solid #dc2626; }
.nudge--daily_report { border-left: 3px solid #22c55e; }
.nudge-rule-badge { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px; flex-shrink: 0; background: #f1f5f9; color: var(--text-secondary); white-space: nowrap; }
.rule--review_overdue { background: rgba(255,149,0,0.15); color: #FF9500; }
.rule--sprint_deadline { background: rgba(255,59,48,0.15); color: #dc2626; }
.rule--standup_missing { background: #dbeafe; color: #2563EB; }
.rule--task_stale { background: #ede9fe; color: #7c3aed; }
.rule--blocker_unresolved { background: rgba(255,59,48,0.15); color: #dc2626; }
.rule--daily_report { background: rgba(34,197,94,0.15); color: #16a34a; }
.nudge-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.nudge-title { color: #334155; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nudge-body { color: var(--text-muted); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card--initiatives { grid-column: 1 / -1; }
.initiative-row { border-left: 3px solid #3b82f6; flex-wrap: wrap; }
.initiative-status-badge { font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 4px; }
.btn--convert-epic { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; }
.btn--convert-story { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; }
.ist--pending { background: rgba(59,130,246,0.12); color: #2563EB; }
.ist--approved { background: rgba(34,197,94,0.12); color: #16a34a; }
.ist--rejected { background: rgba(239,68,68,0.12); color: #dc2626; }
.ist--deferred { background: rgba(148,163,184,0.12); color: #64748b; }
.initiative-actions { display: flex; gap: 4px; margin-left: auto; }
.loading { text-align: center; padding: 40px; color: var(--text-muted); font-size: 14px; }
.error-list { margin-top: 16px; }
.error-msg { font-size: 12px; color: #ef4444; padding: 4px 0; }
.activity-section { margin-bottom: 24px; }
.activity-section h2 { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
.activity-list { background: #fff; border-radius: 12px; padding: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
.activity-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid rgba(0,0,0,0.04); font-size: 13px; }
.activity-item:last-child { border-bottom: none; }
.activity-time { font-size: 11px; color: #9ca3af; min-width: 40px; }
.activity-icon { font-size: 14px; }
.activity-actor { font-weight: 600; color: #333; }
.activity-desc { color: #6b7280; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.my-section { margin-bottom: 24px; }
.my-section h2 { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
.my-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.my-card { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); cursor: pointer; transition: all 0.2s; }
.my-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.my-card.warn { background: #fef2f2; border-left: 3px solid #ef4444; }
.my-card-title { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
.my-card-count { font-size: 24px; font-weight: 700; color: #111; }
.my-story-item { font-size: 11px; color: #6b7280; margin-top: 4px; display: flex; justify-content: space-between; }
.days-warn { color: #ef4444; font-weight: 600; }
@media (max-width: 768px) { .my-cards { grid-template-columns: 1fr; } }
.sprint-progress-card { background: rgba(255,255,255,0.25); backdrop-filter: blur(40px) saturate(1.8); border: 1px solid rgba(255,255,255,0.45); border-radius: 24px; padding: 24px; margin-bottom: 24px; }
.sprint-progress-card h2 { font-size: 16px; margin-bottom: 16px; }
.sprint-progress-card .progress-stats { display: flex; gap: 24px; margin-bottom: 16px; }
.progress-stat { text-align: center; }
.stat-value { font-size: 20px; font-weight: 700; display: block; }
.stat-label { font-size: 12px; color: var(--text-muted, #888); }
.progress-bar-wrap { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin-bottom: 24px; }
.velocity-chart h3 { font-size: 14px; margin-bottom: 12px; }
.velocity-bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.velocity-label { width: 80px; font-size: 12px; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.velocity-bar-bg { flex: 1; height: 16px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
.velocity-bar-done { height: 100%; background: #3b82f6; border-radius: 4px; transition: width 0.3s; }
.velocity-sp { font-size: 11px; color: var(--text-muted, #888); min-width: 50px; }
.burndown-chart { margin-top: 24px; }
.burndown-chart h3 { font-size: 14px; margin-bottom: 8px; }
.burndown-svg { width: 100%; max-height: 200px; }
.burndown-note { font-size: 12px; color: var(--text-muted, #888); margin-top: 4px; }
.sprint-history-chart { margin-top: 24px; }
.sprint-history-chart h3 { font-size: 14px; margin-bottom: 12px; }
.history-bars { display: flex; gap: 12px; align-items: flex-end; height: 120px; }
.history-bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; }
.history-bar-bg { flex: 1; width: 100%; max-width: 40px; background: #e5e7eb; border-radius: 4px; display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden; }
.history-bar-fill { background: #3b82f6; border-radius: 4px; transition: height 0.3s; }
.history-bar-label { font-size: 10px; margin-top: 4px; color: var(--text-muted, #888); }
.history-bar-sp { font-size: 11px; font-weight: 600; }
@media (max-width: 767px) {
  .dashboard { padding: 10px; }
  .dashboard-header { margin-bottom: 12px; }
  .dashboard-header h1 { font-size: 17px; }
  .dashboard-grid { grid-template-columns: 1fr; gap: 8px; }
  .card { padding: 10px; border-radius: 8px; }
  .card-title { font-size: 12px; margin-bottom: 6px; }
  .card--nudge, .card--initiatives, .section-divider { grid-column: 1 !important; }
}
</style>
