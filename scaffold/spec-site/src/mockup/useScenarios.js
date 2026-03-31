import { ref } from 'vue';
const API = import.meta.env.VITE_API_URL || '';
export function useScenarios(slug, token) {
    const scenarios = ref([]);
    const activeScenarioId = ref(null);
    const overrides = ref({});
    async function fetchScenarios() {
        const res = await fetch(`${API}/api/v2/mockups/${slug}/scenarios`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            scenarios.value = data.scenarios || [];
        }
    }
    async function selectScenario(id) {
        activeScenarioId.value = id;
        if (!id) {
            overrides.value = {};
            return;
        }
        const res = await fetch(`${API}/api/v2/mockups/${slug}/scenarios/${id}/data`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const data = await res.json();
            const map = {};
            for (const ov of (data.overrides || [])) {
                map[ov.component_id] = JSON.parse(ov.override_props);
            }
            overrides.value = map;
        }
    }
    async function createScenario(name, description = '') {
        await fetch(`${API}/api/v2/mockups/${slug}/scenarios`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description }),
        });
        await fetchScenarios();
    }
    async function deleteScenario(id) {
        await fetch(`${API}/api/v2/mockups/${slug}/scenarios/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (activeScenarioId.value === id) {
            activeScenarioId.value = null;
            overrides.value = {};
        }
        await fetchScenarios();
    }
    return { scenarios, activeScenarioId, overrides, fetchScenarios, selectScenario, createScenario, deleteScenario };
}
