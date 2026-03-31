import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiGet } from '@/composables/useTurso';
import SplitPaneLayout from '@/layouts/SplitPaneLayout.vue';
import MockupShell from '@/components/MockupShell.vue';
import MockupCanvas from '@/mockup/MockupCanvas.vue';
import { provideViewport } from '@/composables/useViewport';
import { provideActiveSection } from '@/composables/useActiveSection';
import { renderMarkdown } from '@/utils/markdown';
import { getComponentDef } from '@/mockup/componentCatalog';
import { useScenarios } from '@/mockup/useScenarios';
const { setMode } = provideViewport();
const { activeSection } = provideActiveSection();
const route = useRoute();
const router = useRouter();
const slug = computed(() => route.params.slug);
const components = ref([]);
const pageTitle = ref('');
const viewport = ref('desktop');
const loading = ref(true);
const selectedId = ref(null);
// Scenarios
const token = localStorage.getItem('spec-auth-token') || '';
const { scenarios, activeScenarioId, overrides, fetchScenarios, selectScenario } = useScenarios(slug.value, token);
// Section tabs
const sections = computed(() => {
    const cats = new Set();
    cats.add('All');
    for (const c of components.value) {
        const def = getComponentDef(c.componentType);
        if (def?.category)
            cats.add(def.category);
    }
    return Array.from(cats);
});
const activeTab = ref('All');
const filteredComponents = computed(() => {
    if (activeTab.value === 'All')
        return components.value;
    return components.value.filter(c => {
        const def = getComponentDef(c.componentType);
        return def?.category === activeTab.value;
    });
});
// Selected component spec
const selectedComp = computed(() => {
    if (!selectedId.value)
        return null;
    return findComponent(components.value, selectedId.value);
});
const specTitle = computed(() => {
    if (!selectedComp.value)
        return '';
    const def = getComponentDef(selectedComp.value.componentType);
    return `${def?.icon || ''} ${def?.name || selectedComp.value.componentType}`;
});
const specDescription = computed(() => {
    if (!selectedComp.value)
        return '';
    return selectedComp.value.props.specDescription || '';
});
function findComponent(list, id) {
    for (const c of list) {
        if (c.id === id)
            return c;
        const found = findComponent(c.children || [], id);
        if (found)
            return found;
    }
    return null;
}
function onSelect(id) {
    selectedId.value = id;
}
function copySpec() {
    if (specDescription.value) {
        navigator.clipboard.writeText(specDescription.value);
        alert('Spec copied');
    }
}
onMounted(async () => {
    fetchScenarios();
    const { data } = await apiGet(`/api/v2/mockups/${slug.value}`);
    if (data?.page) {
        pageTitle.value = data.page.title || slug.value;
        viewport.value = data.page.viewport === 'mobile' ? 'mobile' : 'desktop';
    }
    if (data?.components) {
        components.value = buildTree(data.components);
    }
    loading.value = false;
    if (viewport.value === 'mobile')
        setMode('mobile');
});
function buildTree(flat) {
    const map = new Map();
    const roots = [];
    for (const f of flat) {
        map.set(f.id, { id: `c-${f.id}`, componentType: f.component_type, props: JSON.parse(f.props || '{}'), children: [] });
    }
    for (const f of flat) {
        const comp = map.get(f.id);
        if (f.parent_id && map.has(f.parent_id))
            map.get(f.parent_id).children.push(comp);
        else
            roots.push(comp);
    }
    return roots;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['viewer-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['styled-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['styled-btn--ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-body']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-body']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-body']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-body']} */ ;
// CSS variable injection 
// CSS variable injection end 
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
}
else {
    /** @type {[typeof SplitPaneLayout, typeof SplitPaneLayout, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(SplitPaneLayout, new SplitPaneLayout({
        specAreas: ([]),
    }));
    const __VLS_1 = __VLS_0({
        specAreas: ([]),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    var __VLS_3 = {};
    __VLS_2.slots.default;
    {
        const { mockup: __VLS_thisSlot } = __VLS_2.slots;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "viewer-toolbar" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        (__VLS_ctx.pageTitle);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.router.push(`/mockup-editor/${__VLS_ctx.slug}`);
                } },
            ...{ class: "styled-btn styled-btn--secondary" },
        });
        if (__VLS_ctx.scenarios.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                ...{ onChange: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.scenarios.length))
                            return;
                        __VLS_ctx.selectScenario($event.target.value ? Number($event.target.value) : null);
                    } },
                ...{ class: "scenario-select" },
                value: (__VLS_ctx.activeScenarioId || ''),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "",
            });
            for (const [s] of __VLS_getVForSourceType((__VLS_ctx.scenarios))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: (s.id),
                    value: (s.id),
                });
                (s.name);
            }
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.router.push('/mockups');
                } },
            ...{ class: "styled-btn styled-btn--ghost" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section-tabs" },
        });
        for (const [sec] of __VLS_getVForSourceType((__VLS_ctx.sections))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        __VLS_ctx.activeTab = sec;
                    } },
                key: (sec),
                ...{ class: "tab-btn" },
                ...{ class: ({ active: __VLS_ctx.activeTab === sec }) },
            });
            (sec);
        }
        /** @type {[typeof MockupShell, typeof MockupShell, ]} */ ;
        // @ts-ignore
        const __VLS_4 = __VLS_asFunctionalComponent(MockupShell, new MockupShell({}));
        const __VLS_5 = __VLS_4({}, ...__VLS_functionalComponentArgsRest(__VLS_4));
        __VLS_6.slots.default;
        /** @type {[typeof MockupCanvas, ]} */ ;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent(MockupCanvas, new MockupCanvas({
            ...{ 'onSelect': {} },
            components: (__VLS_ctx.filteredComponents),
            selectedId: (__VLS_ctx.selectedId),
            viewport: (__VLS_ctx.viewport),
            viewMode: (true),
        }));
        const __VLS_8 = __VLS_7({
            ...{ 'onSelect': {} },
            components: (__VLS_ctx.filteredComponents),
            selectedId: (__VLS_ctx.selectedId),
            viewport: (__VLS_ctx.viewport),
            viewMode: (true),
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        let __VLS_10;
        let __VLS_11;
        let __VLS_12;
        const __VLS_13 = {
            onSelect: (__VLS_ctx.onSelect)
        };
        var __VLS_9;
        var __VLS_6;
    }
    {
        const { spec: __VLS_thisSlot } = __VLS_2.slots;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "spec-panel-v2" },
        });
        if (__VLS_ctx.selectedComp) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "spec-header" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "spec-comp-name" },
            });
            (__VLS_ctx.specTitle);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "spec-comp-type" },
            });
            (__VLS_ctx.selectedComp.componentType);
            if (__VLS_ctx.specDescription) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "spec-body" },
                });
                __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.renderMarkdown(__VLS_ctx.specDescription)) }, null, null);
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "spec-empty" },
                });
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "spec-actions" },
            });
            if (__VLS_ctx.specDescription) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.copySpec) },
                    ...{ class: "styled-btn styled-btn--ghost" },
                });
            }
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "spec-guide" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        }
    }
    var __VLS_2;
}
/** @type {__VLS_StyleScopedClasses['viewer-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['styled-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['styled-btn--secondary']} */ ;
/** @type {__VLS_StyleScopedClasses['scenario-select']} */ ;
/** @type {__VLS_StyleScopedClasses['styled-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['styled-btn--ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['section-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-panel-v2']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-header']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-comp-name']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-comp-type']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-body']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['styled-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['styled-btn--ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-guide']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            SplitPaneLayout: SplitPaneLayout,
            MockupShell: MockupShell,
            MockupCanvas: MockupCanvas,
            renderMarkdown: renderMarkdown,
            router: router,
            slug: slug,
            pageTitle: pageTitle,
            viewport: viewport,
            loading: loading,
            selectedId: selectedId,
            scenarios: scenarios,
            activeScenarioId: activeScenarioId,
            selectScenario: selectScenario,
            sections: sections,
            activeTab: activeTab,
            filteredComponents: filteredComponents,
            selectedComp: selectedComp,
            specTitle: specTitle,
            specDescription: specDescription,
            onSelect: onSelect,
            copySpec: copySpec,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
