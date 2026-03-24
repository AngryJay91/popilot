/**
 * Dashboard composable — aggregates data from multiple dashboard APIs.
 *
 * In static mode, returns empty state gracefully.
 */
import { ref } from 'vue'
import { apiGet, isStaticMode } from '@/api/client'

export interface UnreadMemo {
  id: number
  content: string
  memoType: string
  createdBy: string
  createdAt: string
  reviewRequired: number
  pageId: string
  replyCount: number
  title: string | null
  supersedesId: number | null
}

export interface SprintProgress {
  sprint: string
  total: number
  done: number
  progressPercent: number
  byStatus: Record<string, number>
}

export interface StandupStatus {
  date: string
  written: string[]
  count: number
}

export interface MyRequest {
  id: number
  title: string | null
  content: string
  memoType: string
  assignedTo: string | null
  status: string
  createdAt: string
  supersedesId: number | null
}

export interface Decision {
  id: number
  title: string | null
  content: string
  createdBy: string
  assignedTo: string | null
  createdAt: string
  supersedesId: number | null
}

export interface NudgeLogItem {
  id: number
  ruleId: string
  title: string
  body: string
  createdAt: string
}

export interface TeamInitiative {
  id: number
  title: string | null
  content: string
  memoType: string
  createdBy: string
  createdAt: string
}

export function useDashboard() {
  const unreadMemos = ref<UnreadMemo[]>([])
  const pendingReviews = ref<UnreadMemo[]>([])
  const myRequests = ref<MyRequest[]>([])
  const activeDecisions = ref<Decision[]>([])
  const sprintProgress = ref<SprintProgress | null>(null)
  const mySprintProgress = ref<SprintProgress | null>(null)
  const standupStatus = ref<StandupStatus | null>(null)
  const loading = ref(false)
  const errors = ref<string[]>([])
  const nudgeLog = ref<NudgeLogItem[]>([])
  const teamInitiatives = ref<TeamInitiative[]>([])

  function todayStr(): string {
    return new Date().toISOString().split('T')[0]
  }

  async function loadAll(sprint: string, userName?: string) {
    if (isStaticMode()) { loading.value = false; return }
    loading.value = true
    errors.value = []

    const fetches = [
      apiGet<{ unreadMemos: Array<Record<string, unknown>> }>('/api/v2/dashboard/unread-memos'),
      apiGet<{ unreadMemos: Array<Record<string, unknown>> }>('/api/v2/dashboard/unread-memos', { review_required: '1' }),
      apiGet<{ sprint: string; total: number; done: number; progressPercent: number; byStatus: Record<string, number> }>('/api/v2/dashboard/sprint-progress', { sprint }),
      apiGet<{ date: string; written: string[]; count: number }>('/api/v2/dashboard/standup-status', { sprint, date: todayStr() }),
      apiGet<{ myRequests: Array<Record<string, unknown>> }>('/api/v2/dashboard/my-requests'),
      apiGet<{ decisions: Array<Record<string, unknown>> }>('/api/v2/dashboard/active-decisions'),
    ]

    if (userName) {
      fetches.push(
        apiGet<SprintProgress>('/api/v2/dashboard/sprint-progress', { sprint, user: userName }),
      )
    }

    const results = await Promise.all(fetches)

    if (results[0].error) errors.value.push(results[0].error)
    else if (results[0].data) unreadMemos.value = ((results[0].data as any).unreadMemos ?? []).map(mapMemo)

    if (results[1].error) errors.value.push(results[1].error)
    else if (results[1].data) pendingReviews.value = ((results[1].data as any).unreadMemos ?? []).map(mapMemo)

    if (results[2].error) errors.value.push(results[2].error)
    else if (results[2].data) sprintProgress.value = results[2].data as SprintProgress

    if (results[3].error) errors.value.push(results[3].error)
    else if (results[3].data) standupStatus.value = results[3].data as StandupStatus

    if (results[4].error) errors.value.push(results[4].error)
    else if (results[4].data) myRequests.value = ((results[4].data as any).myRequests ?? []).map(mapRequest)

    if (results[5].error) errors.value.push(results[5].error)
    else if (results[5].data) activeDecisions.value = ((results[5].data as any).decisions ?? []).map(mapDecision)

    if (userName && results[6]) {
      if (results[6].error) errors.value.push(results[6].error)
      else if (results[6].data) mySprintProgress.value = results[6].data as SprintProgress
    }

    loading.value = false
  }

  async function loadNudgeLog() {
    if (isStaticMode()) return
    const { data } = await apiGet<{ nudges: Array<Record<string, unknown>> }>(
      '/api/v2/dashboard/nudge-log', { limit: '10' },
    )
    if (data?.nudges) {
      nudgeLog.value = (data.nudges as Array<Record<string, unknown>>).map(r => ({
        id: r.id as number,
        ruleId: (r.rule_id as string) ?? '',
        title: (r.title as string) ?? '',
        body: (r.body as string) ?? '',
        createdAt: (r.created_at as string) ?? '',
      }))
    }
  }

  async function loadTeamInitiatives() {
    if (isStaticMode()) return
    const { data } = await apiGet<{ initiatives: Array<Record<string, unknown>> }>(
      '/api/v2/initiatives', { limit: '20' },
    )
    if (data?.initiatives) {
      teamInitiatives.value = (data.initiatives as Array<Record<string, unknown>>).map(r => ({
        id: r.id as number,
        title: (r.title as string) ?? null,
        content: (r.content as string) ?? '',
        memoType: (r.status as string) ?? 'pending',
        createdBy: (r.author as string) ?? '',
        createdAt: (r.created_at as string) ?? '',
      }))
    } else {
      // Fallback: memo-based (when initiatives table is unavailable)
      const { data: memoData } = await apiGet<{ memos: Array<Record<string, unknown>> }>(
        '/api/v2/memos/all', { limit: '10', status: 'open' },
      )
      if (memoData?.memos) {
        teamInitiatives.value = (memoData.memos as Array<Record<string, unknown>>)
          .filter(r => r.memo_type === 'feature_request')
          .map(r => ({
            id: r.id as number,
            title: (r.title as string) ?? null,
            content: (r.content as string) ?? '',
            memoType: (r.memo_type as string) ?? '',
            createdBy: (r.created_by as string) ?? '',
            createdAt: (r.created_at as string) ?? '',
          }))
      }
    }
  }

  return {
    unreadMemos, pendingReviews, myRequests, activeDecisions,
    sprintProgress, mySprintProgress, standupStatus, nudgeLog, teamInitiatives,
    loading, errors, loadAll, loadNudgeLog, loadTeamInitiatives,
  }
}

function mapMemo(r: Record<string, unknown>): UnreadMemo {
  return {
    id: r.id as number, content: (r.content as string) ?? '', memoType: (r.memo_type as string) ?? 'memo',
    createdBy: (r.created_by as string) ?? '', createdAt: (r.created_at as string) ?? '',
    reviewRequired: (r.review_required as number) ?? 0, pageId: (r.page_id as string) ?? '',
    replyCount: (r.reply_count as number) ?? 0, title: (r.title as string) ?? null,
    supersedesId: (r.supersedes_id as number) ?? null,
  }
}

function mapRequest(r: Record<string, unknown>): MyRequest {
  return {
    id: r.id as number, title: (r.title as string) ?? null, content: (r.content as string) ?? '',
    memoType: (r.memo_type as string) ?? '', assignedTo: (r.assigned_to as string) ?? null,
    status: (r.status as string) ?? 'open', createdAt: (r.created_at as string) ?? '',
    supersedesId: (r.supersedes_id as number) ?? null,
  }
}

function mapDecision(r: Record<string, unknown>): Decision {
  return {
    id: r.id as number, title: (r.title as string) ?? null, content: (r.content as string) ?? '',
    createdBy: (r.created_by as string) ?? '', assignedTo: (r.assigned_to as string) ?? null,
    createdAt: (r.created_at as string) ?? '', supersedesId: (r.supersedes_id as number) ?? null,
  }
}
