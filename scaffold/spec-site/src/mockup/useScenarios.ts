import { ref } from 'vue'

const API = import.meta.env.VITE_API_URL || ''

interface Scenario {
  id: number
  name: string
  description: string
}

interface ScenarioOverride {
  component_id: number
  override_props: string
}

export function useScenarios(slug: string, token: string) {
  const scenarios = ref<Scenario[]>([])
  const activeScenarioId = ref<number | null>(null)
  const overrides = ref<Record<number, Record<string, unknown>>>({})

  async function fetchScenarios() {
    const res = await fetch(`${API}/api/v2/mockups/${slug}/scenarios`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      scenarios.value = data.scenarios || []
    }
  }

  async function selectScenario(id: number | null) {
    activeScenarioId.value = id
    if (!id) { overrides.value = {}; return }

    const res = await fetch(`${API}/api/v2/mockups/${slug}/scenarios/${id}/data`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const data = await res.json()
      const map: Record<number, Record<string, unknown>> = {}
      for (const ov of (data.overrides || []) as ScenarioOverride[]) {
        map[ov.component_id] = JSON.parse(ov.override_props)
      }
      overrides.value = map
    }
  }

  async function createScenario(name: string, description = '') {
    await fetch(`${API}/api/v2/mockups/${slug}/scenarios`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })
    await fetchScenarios()
  }

  async function deleteScenario(id: number) {
    await fetch(`${API}/api/v2/mockups/${slug}/scenarios/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (activeScenarioId.value === id) { activeScenarioId.value = null; overrides.value = {} }
    await fetchScenarios()
  }

  return { scenarios, activeScenarioId, overrides, fetchScenarios, selectScenario, createScenario, deleteScenario }
}
