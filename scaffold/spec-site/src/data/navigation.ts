import type { PageVersion } from './types'

export interface SprintConfig {
  id: string
  label: string
  theme: string
  active: boolean
}

export interface FeaturePage {
  id: string
  label: string
  icon: string
  epicMap: Record<string, string>  // sprint -> epicId (policy fallback)
}

export interface PageConfig {
  id: string
  label: string
  badge?: string
  category: string
  sprint: string
  description?: string
  /** Relative path from spec-site/src/ to the markdown file */
  mdPath?: string
}

/** Sprint definitions -- TODO: Replace with your sprints */
export const sprints: SprintConfig[] = [
  { id: 's1', label: 'S1', theme: '', active: true },
]

/** Feature pages for the sidebar navigation -- TODO: Add your feature pages */
export const featurePages: FeaturePage[] = []

export function isValidFeaturePage(id: string): boolean {
  return featurePages.some(p => p.id === id)
}

// -- Policy pages (epic specs per sprint) -- TODO: Add your policy pages
export const pages: PageConfig[] = []

export function getPagesByCategory(sprint: string, category: string): PageConfig[] {
  return pages.filter(p => p.sprint === sprint && p.category === category)
}

export function getActiveSprint(): SprintConfig {
  return sprints.find(s => s.active) ?? sprints[0]
}

/** All navigable pages (features + extras like retro) */
export const allPages = [...featurePages]

/** Epic spec file mapping: sprint -> epic files -- TODO: Add your epic spec files */
const epicSpecFiles: Record<string, Record<string, string>> = {}

export function getEpicSpecFileName(sprint: string, epicId: string): string | null {
  return epicSpecFiles[sprint]?.[epicId] ?? null
}
