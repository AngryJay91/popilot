/**
 * Standup composable — fetch and save daily standup entries.
 *
 * Singleton pattern for team entries; instance pattern for polling.
 * In static mode, returns empty state gracefully.
 */

import { ref, onUnmounted } from 'vue'
import { apiGet, apiPut, apiPost, isStaticMode } from '@/api/client'

export interface StandupEntry {
  id: number
  sprint: string
  userName: string
  entryDate: string
  doneText: string | null
  planText: string | null
  planStoryIds: number[]
  blockers: string | null
  createdAt: string
  updatedAt: string
}

interface StandupRow {
  id: number
  sprint: string
  user_name: string
  entry_date: string
  done_text: string | null
  plan_text: string | null
  plan_story_ids: string | null
  blockers: string | null
  created_at: string
  updated_at: string
}

export interface StandupFeedback {
  id: number
  standupEntryId: number
  sprint: string
  targetUser: string
  feedbackBy: string
  feedbackText: string
  reviewType: 'comment' | 'approve' | 'request_changes'
  createdAt: string
}

interface StandupFeedbackRow {
  id: number
  standup_entry_id: number
  sprint: string
  target_user: string
  feedback_by: string
  feedback_text: string
  review_type: string
  created_at: string
}

function mapEntry(r: StandupRow): StandupEntry {
  return {
    id: r.id,
    sprint: r.sprint,
    userName: r.user_name,
    entryDate: r.entry_date,
    doneText: r.done_text,
    planText: r.plan_text,
    planStoryIds: r.plan_story_ids ? JSON.parse(r.plan_story_ids) : [],
    blockers: r.blockers,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function mapFeedback(r: StandupFeedbackRow): StandupFeedback {
  return {
    id: r.id,
    standupEntryId: r.standup_entry_id,
    sprint: r.sprint,
    targetUser: r.target_user,
    feedbackBy: r.feedback_by,
    feedbackText: r.feedback_text,
    reviewType: r.review_type as StandupFeedback['reviewType'],
    createdAt: r.created_at,
  }
}

const POLL_INTERVAL_MS = 30_000

export function useStandup() {
  const entries = ref<StandupEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchEntries(date: string): Promise<void> {
    if (isStaticMode()) return
    const { data, error: apiError } = await apiGet<{ entries: StandupRow[] }>(
      '/api/v2/standup/entries', { date },
    )
    if (apiError) {
      error.value = apiError
    } else if (data) {
      entries.value = data.entries.map(mapEntry)
    }
  }

  async function loadEntries(date: string): Promise<void> {
    loading.value = true
    error.value = null
    await fetchEntries(date)
    loading.value = false
  }

  async function saveEntry(
    userName: string,
    date: string,
    sprint: string,
    data: { doneText?: string | null; planText?: string | null; planStoryIds?: number[]; blockers?: string | null },
  ): Promise<{ error?: string }> {
    if (isStaticMode()) return { error: 'Not available in static mode' }
    const { error: apiError } = await apiPut('/api/v2/standup/entries', {
      sprint,
      userName,
      date,
      doneText: data.doneText ?? null,
      planText: data.planText ?? null,
      planStoryIds: data.planStoryIds ?? null,
      blockers: data.blockers ?? null,
    })
    if (apiError) return { error: apiError }
    await fetchEntries(date)
    return {}
  }

  function getEntryForUser(userName: string, date: string): StandupEntry | undefined {
    return entries.value.find(e => e.userName === userName && e.entryDate === date)
  }

  // Polling
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let _pollDate = ''

  function startPolling(date: string) {
    _pollDate = date
    stopPolling()
    pollTimer = setInterval(() => fetchEntries(_pollDate), POLL_INTERVAL_MS)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  // Feedback
  const feedback = ref<StandupFeedback[]>([])

  async function loadFeedback(entryId: number): Promise<void> {
    if (isStaticMode()) return
    const { data } = await apiGet<{ feedback: StandupFeedbackRow[] }>(
      '/api/v2/standup/feedback', { standup_entry_id: String(entryId) },
    )
    if (data) {
      feedback.value = data.feedback.map(mapFeedback)
    }
  }

  async function submitFeedback(
    entryId: number, sprint: string, targetUser: string,
    feedbackBy: string, feedbackText: string, reviewType: string,
  ): Promise<{ error?: string }> {
    if (isStaticMode()) return { error: 'Not available in static mode' }
    const { error: apiError } = await apiPost('/api/v2/standup/feedback', {
      standupEntryId: entryId,
      sprint,
      targetUser,
      feedbackBy,
      feedbackText,
      reviewType,
    })
    if (apiError) return { error: apiError }
    await loadFeedback(entryId)
    return {}
  }

  onUnmounted(stopPolling)

  return {
    entries,
    loading,
    error,
    feedback,
    loadEntries,
    saveEntry,
    getEntryForUser,
    loadFeedback,
    submitFeedback,
    startPolling,
    stopPolling,
  }
}
