import { computed, watch, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import SplitPaneLayout from '@/layouts/SplitPaneLayout.vue';
import ScenarioSwitcher from '@/components/ScenarioSwitcher.vue';
import VersionBadge from '@/components/VersionBadge.vue';
import MockupShell from '@/components/MockupShell.vue';
import PolicyFallback from '@/pages/shared/PolicyFallback.vue';
import NoContentPlaceholder from '@/pages/shared/NoContentPlaceholder.vue';
import { provideScenario } from '@/composables/useScenario';
import { useScenarioStore } from '@/composables/useScenarioStore';
import { useUser } from '@/composables/useUser';
import { getWireframe } from '@/data/wireframeRegistry';
import { featurePages } from '@/data/navigation';
const route = useRoute();
const { currentUser } = useUser();
const pageId = computed(() => route.params.pageId || '');
const sprint = computed(() => route.params.sprint || '');
const wireframeConfig = computed(() => getWireframe(pageId.value, sprint.value));
const hasWireframe = computed(() => !!wireframeConfig.value);
const featurePage = computed(() => featurePages.find(p => p.id === pageId.value));
const fallbackEpicId = computed(() => {
    if (hasWireframe.value)
        return null;
    return featurePage.value?.epicMap[sprint.value] ?? null;
});
const renderMode = computed(() => {
    if (hasWireframe.value)
        return 'wireframe';
    if (fallbackEpicId.value)
        return 'policy';
    return 'empty';
});
// Turso custom scenario store
const store = useScenarioStore(pageId.value, sprint.value);
const storeRef = ref(store);
const initialConfig = wireframeConfig.value;
const { scenarios, activeScenarioId, setScenario, updateScenarios } = provideScenario(initialConfig?.scenarios ?? [], initialConfig?.defaultScenarioId ?? '');
async function mergeCustomScenarios() {
    const config = getWireframe(pageId.value, sprint.value);
    const baseScenarios = config?.scenarios ?? [];
    const custom = await storeRef.value.loadCustomScenarios();
    if (storeRef.value.error) {
        console.warn('[WireframeShell] custom scenario sync failed:', storeRef.value.error);
    }
    updateScenarios([...baseScenarios, ...custom], config?.defaultScenarioId ?? '');
}
async function handleDuplicate(sourceId) {
    const source = scenarios.value.find(s => s.id === sourceId);
    if (!source)
        return;
    const label = `${source.label} (copy)`;
    const newId = await storeRef.value.duplicateScenario(source, label, currentUser.value ?? 'unknown');
    if (!newId)
        return;
    await mergeCustomScenarios();
}
async function handleDeleteCustom(scenarioId) {
    const ok = await storeRef.value.deleteScenario(scenarioId);
    if (!ok)
        return;
    await mergeCustomScenarios();
}
watch([pageId, sprint], () => {
    const newStore = useScenarioStore(pageId.value, sprint.value);
    storeRef.value = newStore;
    mergeCustomScenarios();
});
onMounted(() => {
    mergeCustomScenarios();
});
const showScenarioSwitcher = computed(() => hasWireframe.value && (wireframeConfig.value?.scenarios.length ?? 0) > 0);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "wireframe-shell" },
});
if (__VLS_ctx.renderMode === 'wireframe') {
    /** @type {[typeof SplitPaneLayout, typeof SplitPaneLayout, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(SplitPaneLayout, new SplitPaneLayout({
        specAreas: (__VLS_ctx.wireframeConfig.specAreas),
        title: (__VLS_ctx.wireframeConfig.specTitle),
    }));
    const __VLS_1 = __VLS_0({
        specAreas: (__VLS_ctx.wireframeConfig.specAreas),
        title: (__VLS_ctx.wireframeConfig.specTitle),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    __VLS_2.slots.default;
    {
        const { mockup: __VLS_thisSlot } = __VLS_2.slots;
        if (__VLS_ctx.showScenarioSwitcher) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "mockup-toolbar" },
            });
            /** @type {[typeof ScenarioSwitcher, ]} */ ;
            // @ts-ignore
            const __VLS_3 = __VLS_asFunctionalComponent(ScenarioSwitcher, new ScenarioSwitcher({
                ...{ 'onChange': {} },
                ...{ 'onDuplicate': {} },
                ...{ 'onDeleteCustom': {} },
                scenarios: (__VLS_ctx.scenarios),
                activeId: (__VLS_ctx.activeScenarioId),
            }));
            const __VLS_4 = __VLS_3({
                ...{ 'onChange': {} },
                ...{ 'onDuplicate': {} },
                ...{ 'onDeleteCustom': {} },
                scenarios: (__VLS_ctx.scenarios),
                activeId: (__VLS_ctx.activeScenarioId),
            }, ...__VLS_functionalComponentArgsRest(__VLS_3));
            let __VLS_6;
            let __VLS_7;
            let __VLS_8;
            const __VLS_9 = {
                onChange: (__VLS_ctx.setScenario)
            };
            const __VLS_10 = {
                onDuplicate: (__VLS_ctx.handleDuplicate)
            };
            const __VLS_11 = {
                onDeleteCustom: (__VLS_ctx.handleDeleteCustom)
            };
            var __VLS_5;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "mockup-version" },
            });
            /** @type {[typeof VersionBadge, ]} */ ;
            // @ts-ignore
            const __VLS_12 = __VLS_asFunctionalComponent(VersionBadge, new VersionBadge({
                version: (__VLS_ctx.wireframeConfig.version),
            }));
            const __VLS_13 = __VLS_12({
                version: (__VLS_ctx.wireframeConfig.version),
            }, ...__VLS_functionalComponentArgsRest(__VLS_12));
        }
        /** @type {[typeof MockupShell, typeof MockupShell, ]} */ ;
        // @ts-ignore
        const __VLS_15 = __VLS_asFunctionalComponent(MockupShell, new MockupShell({}));
        const __VLS_16 = __VLS_15({}, ...__VLS_functionalComponentArgsRest(__VLS_15));
        __VLS_17.slots.default;
        const __VLS_18 = ((__VLS_ctx.wireframeConfig.mockup));
        // @ts-ignore
        const __VLS_19 = __VLS_asFunctionalComponent(__VLS_18, new __VLS_18({
            key: (`${__VLS_ctx.pageId}-${__VLS_ctx.sprint}`),
        }));
        const __VLS_20 = __VLS_19({
            key: (`${__VLS_ctx.pageId}-${__VLS_ctx.sprint}`),
        }, ...__VLS_functionalComponentArgsRest(__VLS_19));
        var __VLS_17;
    }
    {
        const { spec: __VLS_thisSlot } = __VLS_2.slots;
        const __VLS_22 = ((__VLS_ctx.wireframeConfig.specPanel));
        // @ts-ignore
        const __VLS_23 = __VLS_asFunctionalComponent(__VLS_22, new __VLS_22({
            key: (`${__VLS_ctx.pageId}-${__VLS_ctx.sprint}`),
        }));
        const __VLS_24 = __VLS_23({
            key: (`${__VLS_ctx.pageId}-${__VLS_ctx.sprint}`),
        }, ...__VLS_functionalComponentArgsRest(__VLS_23));
    }
    var __VLS_2;
}
else if (__VLS_ctx.renderMode === 'policy') {
    /** @type {[typeof PolicyFallback, ]} */ ;
    // @ts-ignore
    const __VLS_26 = __VLS_asFunctionalComponent(PolicyFallback, new PolicyFallback({
        sprint: (__VLS_ctx.sprint),
        epicId: (__VLS_ctx.fallbackEpicId),
        pageLabel: (__VLS_ctx.featurePage?.label ?? __VLS_ctx.pageId),
    }));
    const __VLS_27 = __VLS_26({
        sprint: (__VLS_ctx.sprint),
        epicId: (__VLS_ctx.fallbackEpicId),
        pageLabel: (__VLS_ctx.featurePage?.label ?? __VLS_ctx.pageId),
    }, ...__VLS_functionalComponentArgsRest(__VLS_26));
}
else {
    /** @type {[typeof NoContentPlaceholder, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(NoContentPlaceholder, new NoContentPlaceholder({
        pageId: (__VLS_ctx.pageId),
        sprint: (__VLS_ctx.sprint),
    }));
    const __VLS_30 = __VLS_29({
        pageId: (__VLS_ctx.pageId),
        sprint: (__VLS_ctx.sprint),
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
}
/** @type {__VLS_StyleScopedClasses['wireframe-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['mockup-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['mockup-version']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            SplitPaneLayout: SplitPaneLayout,
            ScenarioSwitcher: ScenarioSwitcher,
            VersionBadge: VersionBadge,
            MockupShell: MockupShell,
            PolicyFallback: PolicyFallback,
            NoContentPlaceholder: NoContentPlaceholder,
            pageId: pageId,
            sprint: sprint,
            wireframeConfig: wireframeConfig,
            featurePage: featurePage,
            fallbackEpicId: fallbackEpicId,
            renderMode: renderMode,
            scenarios: scenarios,
            activeScenarioId: activeScenarioId,
            setScenario: setScenario,
            handleDuplicate: handleDuplicate,
            handleDeleteCustom: handleDeleteCustom,
            showScenarioSwitcher: showScenarioSwitcher,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
