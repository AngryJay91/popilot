/**
 * Navigation — Feature page definitions for static mode.
 *
 * In API mode, sprints/epics come from useNavStore.
 * This file defines feature pages (wireframe pages) which are
 * always statically configured regardless of mode.
 */

export interface FeaturePage {
  id: string
  label: string
  icon: string
  epicMap: Record<string, string>  // sprint -> epicId (policy fallback)
}

/** Feature pages for the sidebar navigation -- TODO: Add your feature pages */
export const featurePages: FeaturePage[] = []

export function isValidFeaturePage(id: string): boolean {
  return featurePages.some(p => p.id === id)
}

/** All navigable pages (features + extras like retro) */
export const allPages = [...featurePages]
