/**
 * Navigation store — API-backed sprints & epics
 *
 * Singleton pattern: refs are module-level, shared across all consumers.
 * Initialized with fallback data so router/AppHeader work synchronously.
 *
 * In static mode, uses fallback data only (no API calls).
 * In API mode, fetches from backend and overwrites refs.
 */

import { ref } from 'vue'
import { apiGet, apiPost, apiPatch, apiDelete, isStaticMode } from '@/api/client'
import type { NavApiResponse } from '@/api/types'
import {
  type SprintConfig, type PageConfig,
  FALLBACK_SPRINTS, FALLBACK_EPICS,
} from './navTypes'

export type { SprintConfig, PageConfig } from './navTypes'

// ── Singleton state ──

export const sprints = ref<SprintConfig[]>([...FALLBACK_SPRINTS])
export const epics = ref<PageConfig[]>([...FALLBACK_EPICS])
export const loaded = ref(false)

// ── Read helpers (synchronous, use current ref values) ──

export function getActiveSprint(): SprintConfig {
  return sprints.value.find(s => s.active) ?? sprints.value[0]
}

export function getPagesByCategory(sprint: string, category: string): PageConfig[] {
  return epics.value.filter(p => p.sprint === sprint && p.category === category)
}

// ── API loading ──

export async function loadNavData(): Promise<void> {
  if (isStaticMode()) {
    loaded.value = true
    return
  }

  const { data, error } = await apiGet<NavApiResponse>('/api/v2/nav')
  if (error || !data) return

  if (data.sprints.length > 0) {
    sprints.value = data.sprints.map(r => ({
      id: r.id,
      label: r.label,
      theme: r.theme,
      active: r.active === 1,
      startDate: r.start_date,
      endDate: r.end_date,
      sortOrder: r.sort_order,
    }))
  }

  if (data.epics.length > 0) {
    epics.value = data.epics.map(r => ({
      id: r.epic_id,
      label: r.label,
      badge: r.badge ?? undefined,
      category: r.category,
      sprint: r.sprint,
      description: r.description ?? undefined,
      sortOrder: r.sort_order,
      uid: r.uid ?? `${r.sprint}:${r.epic_id}`,
      originSprint: r.origin_sprint ?? r.sprint,
    }))
  }

  loaded.value = true
}

// ── CRUD: Sprints ──

export async function addSprint(data: {
  id: string
  label: string
  theme: string
  startDate?: string | null
  endDate?: string | null
}): Promise<{ error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const maxOrder = sprints.value.reduce((max, s) => Math.max(max, s.sortOrder), -1)
  const { error } = await apiPost('/api/v2/nav/sprints', {
    id: data.id, label: data.label, theme: data.theme,
    startDate: data.startDate ?? null, endDate: data.endDate ?? null,
    sortOrder: maxOrder + 1,
  })
  if (error) return { error }
  await loadNavData()
  return {}
}

export async function updateSprint(id: string, data: {
  label?: string
  theme?: string
  startDate?: string | null
  endDate?: string | null
}): Promise<{ error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const { error } = await apiPatch(`/api/v2/nav/sprints/${id}`, data as Record<string, unknown>)
  if (error) return { error }
  await loadNavData()
  return {}
}

export async function deleteSprint(id: string): Promise<{ error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const { error } = await apiDelete(`/api/v2/nav/sprints/${id}`)
  if (error) return { error }
  await loadNavData()
  return {}
}

export async function setActiveSprint(id: string): Promise<{ error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const { error } = await apiPost(`/api/v2/nav/sprints/${id}/activate`, {})
  if (error) return { error }
  await loadNavData()
  return {}
}

// ── CRUD: Epics ──

export async function addEpic(sprint: string, data: {
  epicId: string
  label: string
  badge?: string | null
  category?: string
  description?: string | null
}): Promise<{ error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const currentEpics = epics.value.filter(e => e.sprint === sprint)
  const maxOrder = currentEpics.reduce((max, e) => Math.max(max, e.sortOrder), -1)
  const uid = `${sprint}:${data.epicId}`
  const { error } = await apiPost('/api/v2/nav/epics', {
    sprint, epicId: data.epicId, label: data.label,
    badge: data.badge ?? null, category: data.category ?? 'policy',
    description: data.description ?? null, sortOrder: maxOrder + 1,
    uid, originSprint: sprint,
  })
  if (error) return { error }
  await loadNavData()
  return {}
}

export async function updateEpic(sprint: string, epicId: string, data: {
  label?: string
  badge?: string | null
  category?: string
  description?: string | null
}): Promise<{ error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const { error } = await apiPatch(`/api/v2/nav/epics/${sprint}/${epicId}`, data as Record<string, unknown>)
  if (error) return { error }
  await loadNavData()
  return {}
}

export async function deleteEpic(sprint: string, epicId: string): Promise<{ error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const { error } = await apiDelete(`/api/v2/nav/epics/${sprint}/${epicId}`)
  if (error) return { error }
  await loadNavData()
  return {}
}

export async function carryOverEpic(
  uid: string,
  targetSprint: string,
  newEpicId: string,
  newLabel?: string,
  newBadge?: string,
): Promise<{ error?: string }> {
  if (isStaticMode()) return { error: 'CRUD not available in static mode' }
  const epic = epics.value.find(e => e.uid === uid)
  if (!epic) return { error: `Epic not found: ${uid}` }

  const targetEpics = epics.value.filter(e => e.sprint === targetSprint)
  const maxOrder = targetEpics.reduce((max, e) => Math.max(max, e.sortOrder), -1)

  const { error } = await apiPost('/api/v2/nav/epics/carry-over', {
    sprint: targetSprint,
    epicId: newEpicId,
    label: newLabel ?? epic.label,
    badge: newBadge ?? epic.badge ?? null,
    category: epic.category,
    description: epic.description ?? null,
    sortOrder: maxOrder + 1,
    uid,
    originSprint: epic.originSprint ?? epic.sprint,
    oldSprint: epic.sprint,
    oldEpicId: epic.id,
  })
  if (error) return { error }
  await loadNavData()
  return {}
}
