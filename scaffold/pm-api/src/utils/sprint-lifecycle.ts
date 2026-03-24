/**
 * Sprint Lifecycle — pure domain logic
 * No DB dependency. Fully testable.
 */

export interface StoryRow {
  id: number
  title: string
  sprint: string | null
  status: string
  story_points: number | null
  assignee: string | null
}

export interface SprintStatus {
  id: string
  status: 'planning' | 'active' | 'closed'
}

export interface VelocityRecord {
  sprintId: string
  assignee: string
  doneSP: number
  totalSP: number
}

export interface CloseSummary {
  sprintId: string
  completedCount: number
  incompleteCount: number
  totalStories: number
  doneSP: number
  totalSP: number
  completionRate: number
}

/** Check whether the sprint can be closed */
export function canClose(sprint: SprintStatus): { ok: boolean; error?: string } {
  if (sprint.status !== 'active') {
    return { ok: false, error: `Can only close sprints in active state (current: ${sprint.status})` }
  }
  return { ok: true }
}

/** Filter incomplete stories */
export function getIncompleteStories(stories: StoryRow[]): StoryRow[] {
  return stories.filter(s => s.status !== 'done')
}

/** Filter completed stories */
export function getCompletedStories(stories: StoryRow[]): StoryRow[] {
  return stories.filter(s => s.status === 'done')
}

/** Move incomplete stories to backlog (pure function — returns new array) */
export function moveToBacklog(stories: StoryRow[]): StoryRow[] {
  return stories.map(s => ({ ...s, sprint: null }))
}

/** Aggregate completed SP per team member */
export function aggregateVelocity(sprintId: string, stories: StoryRow[]): VelocityRecord[] {
  const map = new Map<string, { done: number; total: number }>()

  for (const s of stories) {
    const assignee = s.assignee ?? 'Unassigned'
    if (!map.has(assignee)) map.set(assignee, { done: 0, total: 0 })
    const entry = map.get(assignee)!
    entry.total += s.story_points ?? 0
    if (s.status === 'done') entry.done += s.story_points ?? 0
  }

  return [...map.entries()].map(([assignee, { done, total }]) => ({
    sprintId,
    assignee,
    doneSP: done,
    totalSP: total,
  }))
}

/** Generate close summary */
export function generateCloseSummary(sprintId: string, stories: StoryRow[]): CloseSummary {
  const completed = getCompletedStories(stories)
  const incomplete = getIncompleteStories(stories)
  const totalDoneSP = completed.reduce((sum, s) => sum + (s.story_points ?? 0), 0)
  const totalSP = stories.reduce((sum, s) => sum + (s.story_points ?? 0), 0)

  return {
    sprintId,
    completedCount: completed.length,
    incompleteCount: incomplete.length,
    totalStories: stories.length,
    doneSP: totalDoneSP,
    totalSP,
    completionRate: totalSP > 0 ? Math.round((totalDoneSP / totalSP) * 100) : 0,
  }
}
