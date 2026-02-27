import type { Component } from 'vue'
import type { Scenario, SpecArea, PageVersion } from './types'

export interface WireframePageConfig {
  id: string
  mockup: Component
  specPanel: Component
  scenarios: Scenario<any>[]
  defaultScenarioId: string
  specAreas: SpecArea[]
  version: PageVersion
  specTitle: string
  routeTitle: string
}

/** Wireframe page registry: pageId -> sprint -> config */
export const wireframePages: Record<string, Record<string, WireframePageConfig>> = {}

export function getWireframe(pageId: string, sprint: string): WireframePageConfig | null {
  return wireframePages[pageId]?.[sprint] ?? null
}

export function getAvailableSprints(pageId: string): string[] {
  return Object.keys(wireframePages[pageId] ?? {})
}
