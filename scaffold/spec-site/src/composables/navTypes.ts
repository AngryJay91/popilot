/**
 * Navigation Store — Type definitions and fallback data
 *
 * Fallback data ensures the UI works synchronously before API loads.
 * Replace with your project's sprints/epics or leave empty for API-only mode.
 */

// ── Domain types ──

export interface SprintConfig {
  id: string
  label: string
  theme: string
  active: boolean
  startDate?: string | null
  endDate?: string | null
  sortOrder: number
}

export interface PageConfig {
  id: string
  label: string
  badge?: string
  category: string
  sprint: string
  description?: string
  sortOrder: number
  uid?: string
  originSprint?: string
}

// ── Fallback data (ensures sync access before API loads) ──
// TODO: Replace with your project's initial sprints and epics

export const FALLBACK_SPRINTS: SprintConfig[] = [
  { id: 's1', label: 'S1', theme: '', active: true, sortOrder: 0 },
]

export const FALLBACK_EPICS: PageConfig[] = []
