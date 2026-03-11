/**
 * Scenario store — CRUD for custom scenarios (API-backed or localStorage)
 */

import { ref } from 'vue'
import { apiGet, apiPost, apiDelete, isStaticMode } from '@/api/client'
import type { Scenario } from '@/data/types'

function localKey(pageId: string, sprint: string) {
  return `scenarios_${pageId}_${sprint}`
}

function loadLocal(pageId: string, sprint: string): Scenario<any>[] {
  try {
    const raw = localStorage.getItem(localKey(pageId, sprint))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveLocal(pageId: string, sprint: string, list: Scenario<any>[]) {
  localStorage.setItem(localKey(pageId, sprint), JSON.stringify(list))
}

export function useScenarioStore(pageId: string, sprint: string) {
  const customScenarios = ref<Scenario<any>[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadCustomScenarios(): Promise<Scenario<any>[]> {
    loading.value = true
    error.value = null

    if (isStaticMode()) {
      customScenarios.value = loadLocal(pageId, sprint)
      loading.value = false
      return customScenarios.value
    }

    const { data, error: apiError } = await apiGet<{
      scenarios: Array<{ scenario_id: string; label: string; data_json: string }>
    }>(`/api/v2/scenarios`, { pageId, sprint })

    loading.value = false

    if (apiError || !data) {
      error.value = apiError ?? 'Unknown error'
      customScenarios.value = loadLocal(pageId, sprint) // fallback
      return customScenarios.value
    }

    const list = data.scenarios
      .map((row) => {
        try {
          return {
            id: String(row.scenario_id),
            label: String(row.label),
            data: JSON.parse(String(row.data_json)),
          } as Scenario<any>
        } catch {
          return null
        }
      })
      .filter((s): s is Scenario<any> => s !== null)

    customScenarios.value = list
    return list
  }

  async function saveScenario(scenario: Scenario<any>, author: string): Promise<boolean> {
    error.value = null

    if (isStaticMode()) {
      const existing = customScenarios.value.findIndex(s => s.id === scenario.id)
      if (existing >= 0) {
        customScenarios.value[existing] = scenario
      } else {
        customScenarios.value.push(scenario)
      }
      saveLocal(pageId, sprint, customScenarios.value)
      return true
    }

    const { error: apiError } = await apiPost('/api/v2/scenarios', {
      pageId, sprint,
      scenarioId: scenario.id,
      label: scenario.label,
      dataJson: JSON.stringify(scenario.data),
      author,
    })

    if (apiError) {
      error.value = apiError
      return false
    }
    await loadCustomScenarios()
    return true
  }

  async function deleteScenario(scenarioId: string): Promise<boolean> {
    error.value = null

    if (isStaticMode()) {
      customScenarios.value = customScenarios.value.filter(s => s.id !== scenarioId)
      saveLocal(pageId, sprint, customScenarios.value)
      return true
    }

    const { error: apiError } = await apiDelete(`/api/v2/scenarios/${scenarioId}`, {
      pageId, sprint,
    })

    if (apiError) {
      error.value = apiError
      return false
    }
    await loadCustomScenarios()
    return true
  }

  async function duplicateScenario(
    source: Scenario<any>,
    newLabel: string,
    author: string,
  ): Promise<string> {
    error.value = null
    const newId = `custom-${Date.now()}`
    const newScenario: Scenario<any> = {
      id: newId,
      label: newLabel,
      data: structuredClone(source.data),
    }
    const ok = await saveScenario(newScenario, author)
    if (!ok) return ''
    return newId
  }

  return {
    customScenarios,
    loading,
    error,
    loadCustomScenarios,
    saveScenario,
    deleteScenario,
    duplicateScenario,
  }
}
