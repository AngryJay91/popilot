import { ref, provide, inject, computed } from 'vue';
const ScenarioKey = '__scenario__';
export function provideScenario(scenarioList, defaultId) {
    const scenarios = ref(scenarioList);
    const activeScenarioId = ref(defaultId ?? scenarioList[0]?.id ?? '');
    const activeScenario = computed(() => scenarios.value.find(s => s.id === activeScenarioId.value));
    const mockData = computed(() => activeScenario.value?.data);
    function setScenario(id) {
        activeScenarioId.value = id;
    }
    function updateScenarios(newList, defaultId) {
        scenarios.value = newList;
        activeScenarioId.value = defaultId ?? newList[0]?.id ?? '';
    }
    provide(ScenarioKey, { scenarios, activeScenarioId, activeScenario, mockData, setScenario, updateScenarios });
    return { scenarios, activeScenarioId, activeScenario, mockData, setScenario, updateScenarios };
}
export function useScenario() {
    const ctx = inject(ScenarioKey);
    if (!ctx)
        throw new Error('useScenario requires a provideScenario ancestor');
    return ctx;
}
