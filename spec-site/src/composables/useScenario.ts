import { ref, provide, inject, computed } from 'vue'
import type { InjectionKey, Ref, ComputedRef } from 'vue'
import type { Scenario } from '@/data/types'

interface ScenarioCtx<T = any> {
  scenarios: Ref<Scenario<T>[]>
  activeScenarioId: Ref<string>
  activeScenario: ComputedRef<Scenario<T> | undefined>
  mockData: ComputedRef<T | undefined>
  setScenario: (id: string) => void
  updateScenarios: (newList: Scenario<any>[], defaultId?: string) => void
}

const ScenarioKey = '__scenario__' as unknown as InjectionKey<ScenarioCtx>

export function provideScenario<T>(scenarioList: Scenario<T>[], defaultId?: string) {
  const scenarios = ref(scenarioList) as Ref<Scenario<T>[]>
  const activeScenarioId = ref(defaultId ?? scenarioList[0]?.id ?? '')

  const activeScenario = computed(() =>
    scenarios.value.find(s => s.id === activeScenarioId.value)
  )

  const mockData = computed(() => activeScenario.value?.data)

  function setScenario(id: string) {
    activeScenarioId.value = id
  }

  function updateScenarios(newList: Scenario<any>[], defaultId?: string) {
    scenarios.value = newList as any
    activeScenarioId.value = defaultId ?? newList[0]?.id ?? ''
  }

  provide(ScenarioKey, { scenarios, activeScenarioId, activeScenario, mockData, setScenario, updateScenarios } as ScenarioCtx)
  return { scenarios, activeScenarioId, activeScenario, mockData, setScenario, updateScenarios }
}

export function useScenario<T = any>() {
  const ctx = inject(ScenarioKey)
  if (!ctx) throw new Error('useScenario requires a provideScenario ancestor')
  return ctx as ScenarioCtx<T>
}
