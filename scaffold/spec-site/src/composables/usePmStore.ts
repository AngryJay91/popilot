/**
 * PM Store — API-backed epics, stories & tasks
 *
 * Singleton pattern: refs are module-level, shared across all consumers.
 * In static mode, all data is empty and CRUD operations are disabled.
 */

import { ref } from 'vue'
import { apiGet, apiPost, apiPatch, apiDelete, isStaticMode } from '@/api/client'
import {
  type PmEpic, type PmStory, type PmTask,
  type StoryStatus, type TaskStatus, type Priority, type EpicStatus,
  mapEpic, mapStory, mapTask,
} from './pmTypes'
import type { PmEpicRow, PmStoryRow, PmTaskRow } from '@/api/types'

export type { StoryStatus, TaskStatus, Priority, EpicStatus, PmEpic, PmStory, PmTask } from './pmTypes'
export {
  STORY_STATUSES, TASK_STATUSES, PRIORITIES, AREAS, EPIC_STATUSES,
  STORY_STATUS_LABELS, TASK_STATUS_LABELS, PRIORITY_LABELS, EPIC_STATUS_LABELS,
} from './pmTypes'

// ── Singleton state ──

export const pmEpics = ref<PmEpic[]>([])
export const stories = ref<PmStory[]>([])
export const tasks = ref<PmTask[]>([])
export const pmLoaded = ref(false)

// ── Load ──

export async function loadEpics(): Promise<void> {
  if (isStaticMode()) return
  const { data, error } = await apiGet<{ epics: PmEpicRow[] }>('/api/v2/pm/epics')
  if (!error && data) {
    pmEpics.value = data.epics.map(mapEpic)
  }
}

export async function loadPmData(sprint?: string): Promise<void> {
  if (isStaticMode()) { pmLoaded.value = true; return }
  const params: Record<string, string> = {}
  if (sprint) params.sprint = sprint

  const { data, error } = await apiGet<{ stories: PmStoryRow[]; tasks: PmTaskRow[] }>(
    '/api/v2/pm/data', params,
  )

  if (!error && data) {
    stories.value = data.stories.map(mapStory)
    tasks.value = data.tasks.map(mapTask)
  }

  pmLoaded.value = true
}

// ── Epic CRUD ──

export async function addEpic(data: {
  title: string
  description?: string | null
  status?: EpicStatus
  owner?: string | null
}): Promise<{ id?: number; error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const { data: resp, error } = await apiPost<{ id?: number }>('/api/v2/pm/epics', {
    title: data.title,
    description: data.description ?? null,
    status: data.status ?? 'active',
    owner: data.owner ?? null,
  })
  if (error) return { error }
  await loadEpics()
  return { id: resp?.id }
}

export async function updateEpic(id: number, data: {
  title?: string
  description?: string | null
  status?: EpicStatus
  owner?: string | null
}): Promise<{ error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const { error } = await apiPatch(`/api/v2/pm/epics/${id}`, data as Record<string, unknown>)
  if (error) return { error }
  await loadEpics()
  return {}
}

export async function deleteEpic(id: number): Promise<{ error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const { error } = await apiDelete(`/api/v2/pm/epics/${id}`)
  if (error) return { error }
  await loadEpics()
  return {}
}

// ── Story CRUD ──

export async function addStory(data: {
  epicId: number | null
  sprint: string
  title: string
  description?: string | null
  acceptanceCriteria?: string | null
  assignee?: string | null
  status?: StoryStatus
  priority?: Priority
  area?: string
  storyPoints?: number | null
}): Promise<{ id?: number; error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const maxOrder = stories.value
    .filter(s => s.sprint === data.sprint)
    .reduce((max, s) => Math.max(max, s.sortOrder), -1)

  const { data: resp, error } = await apiPost<{ id?: number }>('/api/v2/pm/stories', {
    epicId: data.epicId,
    sprint: data.sprint,
    title: data.title,
    description: data.description ?? null,
    acceptanceCriteria: data.acceptanceCriteria ?? null,
    assignee: data.assignee ?? null,
    status: data.status ?? 'draft',
    priority: data.priority ?? 'medium',
    area: data.area ?? 'FE',
    storyPoints: data.storyPoints ?? null,
    sortOrder: maxOrder + 1,
  })
  if (error) return { error }
  await loadPmData(data.sprint)
  return { id: resp?.id }
}

export async function updateStory(id: number, data: {
  title?: string
  description?: string | null
  acceptanceCriteria?: string | null
  assignee?: string | null
  status?: StoryStatus
  priority?: Priority
  area?: string
  storyPoints?: number | null
  epicId?: number | null
  sprint?: string | null
  figmaUrl?: string | null
}): Promise<{ error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const { error } = await apiPatch(`/api/v2/pm/stories/${id}`, data as Record<string, unknown>)
  if (error) return { error }
  await loadPmData()
  return {}
}

export async function deleteStory(id: number): Promise<{ error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const { error } = await apiDelete(`/api/v2/pm/stories/${id}`)
  if (error) return { error }
  await loadPmData()
  return {}
}

// ── Task CRUD ──

export async function addTask(data: {
  storyId: number
  title: string
  assignee?: string | null
  description?: string | null
}): Promise<{ id?: number; error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const maxOrder = tasks.value
    .filter(t => t.storyId === data.storyId)
    .reduce((max, t) => Math.max(max, t.sortOrder), -1)

  const { data: resp, error } = await apiPost<{ id?: number }>('/api/v2/pm/tasks', {
    storyId: data.storyId,
    title: data.title,
    assignee: data.assignee ?? null,
    description: data.description ?? null,
    sortOrder: maxOrder + 1,
  })
  if (error) return { error }
  await loadPmData()
  return { id: resp?.id }
}

export async function updateTask(id: number, data: {
  title?: string
  assignee?: string | null
  status?: TaskStatus
  description?: string | null
}): Promise<{ error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const { error } = await apiPatch(`/api/v2/pm/tasks/${id}`, data as Record<string, unknown>)
  if (error) return { error }
  await loadPmData()
  return {}
}

export async function deleteTask(id: number): Promise<{ error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const { error } = await apiDelete(`/api/v2/pm/tasks/${id}`)
  if (error) return { error }
  await loadPmData()
  return {}
}

// ── Helpers ──

export function getStoriesForEpic(epicId: number): PmStory[] {
  return stories.value.filter(s => s.epicId === epicId)
}

export function getStoriesForSprint(sprint: string): PmStory[] {
  return stories.value.filter(s => s.sprint === sprint)
}

export function getEpicById(id: number): PmEpic | undefined {
  return pmEpics.value.find(e => e.id === id)
}

export function getTasksForStory(storyId: number): PmTask[] {
  return tasks.value.filter(t => t.storyId === storyId)
}

export function getBacklogStories(): PmStory[] {
  return stories.value.filter(s => s.status === 'backlog')
}

export function getMyStories(user: string): PmStory[] {
  return stories.value.filter(s => s.assignee === user)
}

export function getMyTasks(user: string): PmTask[] {
  return tasks.value.filter(t => t.assignee === user)
}

export async function updateStoryStatus(id: number, status: StoryStatus): Promise<{ error?: string }> {
  return updateStory(id, { status })
}

export async function updateTaskStatus(id: number, status: TaskStatus): Promise<{ error?: string }> {
  return updateTask(id, { status })
}

export async function moveToSprint(storyId: number, sprint: string | null): Promise<{ error?: string }> {
  return updateStory(storyId, { sprint })
}

export async function loadBacklog(): Promise<void> {
  if (isStaticMode()) return
  const { data, error } = await apiGet<{ stories: PmStoryRow[]; tasks: PmTaskRow[] }>(
    '/api/v2/pm/data', { status: 'backlog' },
  )
  if (!error && data) {
    // Merge backlog stories into existing list (avoid duplicates)
    const existingIds = new Set(stories.value.map(s => s.id))
    for (const row of data.stories) {
      if (!existingIds.has(row.id)) {
        stories.value.push(mapStory(row))
      }
    }
    const existingTaskIds = new Set(tasks.value.map(t => t.id))
    for (const row of data.tasks) {
      if (!existingTaskIds.has(row.id)) {
        tasks.value.push(mapTask(row))
      }
    }
  }
}
