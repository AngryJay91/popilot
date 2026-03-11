/**
 * usePageContent — Load page content (rules, scenarios, specAreas, versions, meta)
 *
 * Stale-while-revalidate pattern:
 * - localStorage cache for instant render + background API fetch
 * - API failure gracefully falls back to cache
 *
 * In static mode, returns empty content (pages use local data files instead).
 */

import { ref, type Ref } from 'vue'
import { apiGet, isStaticMode } from '@/api/client'
import type { PageContentApiResponse } from '@/api/types'
import type { Rule, Scenario, SpecArea, PageVersion, VersionChange } from '@/data/types'

// ── Row → Domain mappers ──

function rowToRule(row: PageContentApiResponse['rules'][number]): Rule {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    condition: row.condition,
    severity: row.severity,
    homeMessage: row.home_message,
    action: row.action,
    dataSource: row.data_source,
    implStatus: row.impl_status,
    implNote: row.impl_note ?? undefined,
    actionRoute: row.action_route ?? undefined,
  }
}

// ── Cache helpers ──

function cacheKey(pageId: string, sprint: string) {
  return `spec_content_${pageId}_${sprint}`
}

interface CachedContent {
  rules: Record<string, Rule[]>
  scenarios: Scenario<any>[]
  specAreas: SpecArea[]
  version: PageVersion | null
  wireframeMeta: { specTitle: string; routeTitle: string; defaultScenarioId: string } | null
  ts: number
}

function loadCache(pageId: string, sprint: string): CachedContent | null {
  try {
    const raw = localStorage.getItem(cacheKey(pageId, sprint))
    if (!raw) return null
    return JSON.parse(raw) as CachedContent
  } catch {
    return null
  }
}

function saveCache(pageId: string, sprint: string, content: CachedContent) {
  try {
    localStorage.setItem(cacheKey(pageId, sprint), JSON.stringify(content))
  } catch {
    // localStorage full — silently fail
  }
}

// ── Public API ──

export interface PageContent {
  rules: Ref<Record<string, Rule[]>>
  scenarios: Ref<Scenario<any>[]>
  specAreas: Ref<SpecArea[]>
  version: Ref<PageVersion | null>
  wireframeMeta: Ref<{ specTitle: string; routeTitle: string; defaultScenarioId: string } | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  load: () => Promise<void>
  getRuleGroup: (group: string) => Rule[]
}

export function usePageContent(pageId: string, sprint: string): PageContent {
  const rules = ref<Record<string, Rule[]>>({})
  const scenarios = ref<Scenario<any>[]>([])
  const specAreas = ref<SpecArea[]>([])
  const version = ref<PageVersion | null>(null)
  const wireframeMeta = ref<{ specTitle: string; routeTitle: string; defaultScenarioId: string } | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  function applyContent(content: CachedContent) {
    rules.value = content.rules
    scenarios.value = content.scenarios
    specAreas.value = content.specAreas
    version.value = content.version
    wireframeMeta.value = content.wireframeMeta
  }

  function transformResponse(data: PageContentApiResponse): CachedContent {
    // Transform rules: group by rule_group
    const rulesByGroup: Record<string, Rule[]> = {}
    for (const row of data.rules) {
      const group = row.rule_group
      if (!rulesByGroup[group]) rulesByGroup[group] = []
      rulesByGroup[group].push(rowToRule(row))
    }

    // Transform scenarios
    const scenarioList: Scenario<any>[] = data.scenarios.map(row => ({
      id: row.scenario_id,
      label: row.label,
      data: JSON.parse(row.data_json),
    }))

    // Transform spec areas
    const areaList: SpecArea[] = data.areas.map(row => ({
      id: row.area_id,
      label: row.label,
      shortLabel: row.short_label,
      ruleCount: row.rule_count,
    }))

    // Transform version
    const vRow = data.versions[0]
    const pageVersion: PageVersion | null = vRow
      ? {
        page: vRow.page_id,
        version: vRow.version,
        lastUpdated: vRow.last_updated,
        sprint: vRow.sprint,
        status: vRow.status as PageVersion['status'],
        changelog: JSON.parse(vRow.changelog) as VersionChange[],
      }
      : null

    // Transform wireframe meta
    const mRow = data.meta[0]
    const meta = mRow
      ? {
        specTitle: mRow.spec_title,
        routeTitle: mRow.route_title,
        defaultScenarioId: mRow.default_scenario_id,
      }
      : null

    return {
      rules: rulesByGroup,
      scenarios: scenarioList,
      specAreas: areaList,
      version: pageVersion,
      wireframeMeta: meta,
      ts: Date.now(),
    }
  }

  async function load() {
    if (isStaticMode()) {
      loading.value = false
      return
    }

    loading.value = true
    error.value = null

    // 1. Try cache first (stale-while-revalidate)
    const cached = loadCache(pageId, sprint)
    if (cached) {
      applyContent(cached)
      loading.value = false
    }

    // 2. Fetch from API (background if cache existed)
    try {
      const { data, error: apiError } = await apiGet<PageContentApiResponse>(
        `/api/v2/page-content/${encodeURIComponent(pageId)}/${encodeURIComponent(sprint)}`,
      )
      if (apiError || !data) throw new Error(apiError ?? 'Unknown error')

      const fresh = transformResponse(data)
      applyContent(fresh)
      saveCache(pageId, sprint, fresh)
      error.value = null
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      if (!cached) {
        error.value = msg
      }
      console.warn(`[usePageContent] API fetch failed for ${pageId}/${sprint}: ${msg}`)
    } finally {
      loading.value = false
    }
  }

  function getRuleGroup(group: string): Rule[] {
    return rules.value[group] ?? []
  }

  return {
    rules,
    scenarios,
    specAreas,
    version,
    wireframeMeta,
    loading,
    error,
    load,
    getRuleGroup,
  }
}
