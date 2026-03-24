/**
 * PM Store — Type definitions, DB row mappers, and constants
 */

// ── Domain types ──

export type StoryStatus = 'draft' | 'backlog' | 'ready' | 'in-progress' | 'review' | 'qa' | 'done'
export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type EpicStatus = 'active' | 'completed' | 'archived'

export interface PmEpic {
  id: number
  title: string
  description: string | null
  status: EpicStatus
  owner: string | null
  createdAt: string
  updatedAt: string
}

export interface PmStory {
  id: number
  epicId: number | null
  sprint: string
  title: string
  description: string | null
  acceptanceCriteria: string | null
  assignee: string | null
  status: StoryStatus
  priority: Priority
  area: string
  storyPoints: number | null
  startDate: string | null
  dueDate: string | null
  figmaUrl: string | null
  relatedPrs: Array<{ prNumber: number; prUrl: string; prTitle: string; status: string }>
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface PmTask {
  id: number
  storyId: number
  title: string
  assignee: string | null
  status: TaskStatus
  description: string | null
  storyPoints: number | null
  dueDate: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// ── Row mappers ──

import type { PmEpicRow, PmStoryRow, PmTaskRow } from '@/api/types'

export function mapEpic(r: PmEpicRow): PmEpic {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    status: (r.status ?? 'active') as EpicStatus,
    owner: r.owner,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function mapStory(r: PmStoryRow): PmStory {
  return {
    id: r.id,
    epicId: r.epic_id,
    sprint: r.sprint ?? '',
    title: r.title,
    description: r.description,
    acceptanceCriteria: r.acceptance_criteria,
    assignee: r.assignee,
    status: r.status as StoryStatus,
    priority: (r.priority ?? 'medium') as Priority,
    area: r.area ?? 'FE',
    storyPoints: r.story_points,
    startDate: r.start_date ?? null,
    dueDate: r.due_date ?? null,
    figmaUrl: r.figma_url ?? null,
    relatedPrs: r.related_prs ? JSON.parse(r.related_prs) : [],
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function mapTask(r: PmTaskRow): PmTask {
  return {
    id: r.id,
    storyId: r.story_id,
    title: r.title,
    assignee: r.assignee,
    status: r.status as TaskStatus,
    description: r.description,
    storyPoints: r.story_points ?? null,
    dueDate: r.due_date ?? null,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

// ── Status constants ──

export const STORY_STATUSES: StoryStatus[] = ['draft', 'backlog', 'ready', 'in-progress', 'review', 'qa', 'done']
export const TASK_STATUSES: TaskStatus[] = ['todo', 'in-progress', 'done']
export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical']
export const AREAS = ['FE', 'BE', 'Design', 'Data', 'Infra', 'PO'] as const
export const EPIC_STATUSES: EpicStatus[] = ['active', 'completed', 'archived']

export const STORY_STATUS_LABELS: Record<StoryStatus, string> = {
  'draft': 'Draft',
  'backlog': 'Backlog',
  'ready': 'Ready',
  'in-progress': 'In Progress',
  'review': 'Review',
  'qa': 'QA',
  'done': 'Done',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'done': 'Done',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  'low': 'Low',
  'medium': 'Medium',
  'high': 'High',
  'critical': 'Critical',
}

export const EPIC_STATUS_LABELS: Record<EpicStatus, string> = {
  'active': 'Active',
  'completed': 'Completed',
  'archived': 'Archived',
}
