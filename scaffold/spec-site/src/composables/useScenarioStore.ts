import { ref } from 'vue'
import { query, execute } from './useTurso'
import type { Scenario } from '@/data/types'

export function useScenarioStore(pageId: string, sprint: string) {
  const customScenarios = ref<Scenario<any>[]>([])
  const loading = ref(false)

  async function loadCustomScenarios(): Promise<Scenario<any>[]> {
    loading.value = true
    const r = await query<{
      scenario_id: string
      label: string
      data_json: string
    }>(
      'SELECT scenario_id, label, data_json FROM scenario_data WHERE page_id = ? AND sprint = ? ORDER BY created_at ASC',
      [pageId, sprint],
    )
    loading.value = false
    if (r.error) return []
    const list = r.rows
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

  async function saveScenario(scenario: Scenario<any>, author: string) {
    const dataJson = JSON.stringify(scenario.data)
    await execute(
      `INSERT INTO scenario_data (page_id, sprint, scenario_id, label, data_json, author)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(page_id, sprint, scenario_id)
       DO UPDATE SET label = ?, data_json = ?, author = ?, updated_at = datetime('now')`,
      [pageId, sprint, scenario.id, scenario.label, dataJson, author, scenario.label, dataJson, author],
    )
    await loadCustomScenarios()
  }

  async function deleteScenario(scenarioId: string) {
    await execute(
      'DELETE FROM scenario_data WHERE page_id = ? AND sprint = ? AND scenario_id = ?',
      [pageId, sprint, scenarioId],
    )
    await loadCustomScenarios()
  }

  async function duplicateScenario(
    source: Scenario<any>,
    newLabel: string,
    author: string,
  ): Promise<string> {
    const newId = `custom-${Date.now()}`
    const newScenario: Scenario<any> = {
      id: newId,
      label: newLabel,
      data: structuredClone(source.data),
    }
    await saveScenario(newScenario, author)
    return newId
  }

  return {
    customScenarios,
    loading,
    loadCustomScenarios,
    saveScenario,
    deleteScenario,
    duplicateScenario,
  }
}
