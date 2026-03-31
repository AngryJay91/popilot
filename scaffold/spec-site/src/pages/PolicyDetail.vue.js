import { ref, computed, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { sprints, getPagesByCategory } from '../composables/useNavStore';
import { renderMarkdown } from '../utils/markdown';
const route = useRoute();
const router = useRouter();
const sprintId = computed(() => route.params.sprint || sprints.value[0]?.id || '');
const epicId = computed(() => route.params.epicId || '');
const sprintConfig = computed(() => sprints.value.find(s => s.id === sprintId.value));
const epicList = computed(() => getPagesByCategory(sprintId.value, 'policy'));
const currentEpic = computed(() => epicList.value.find(e => e.id === epicId.value));
const markdownHtml = ref('');
const loading = ref(true);
const error = ref(false);
// Glob import all epic spec markdown files
const mdModules = import.meta.glob('../../../.context/sprints/*/epic-specs/*.md', { query: '?raw', import: 'default' });
watchEffect(async () => {
    loading.value = true;
    error.value = false;
    markdownHtml.value = '';
    if (!epicId.value) {
        error.value = true;
        loading.value = false;
        return;
    }
    // Try to find a matching markdown file by convention: E-XX.md
    const patterns = [
        `../../../.context/sprints/${sprintId.value}/epic-specs/${epicId.value}.md`,
        `../../../.context/sprints/${sprintId.value}/epic-specs/${epicId.value.toLowerCase()}.md`,
    ];
    let loader;
    for (const key of patterns) {
        if (mdModules[key]) {
            loader = mdModules[key];
            break;
        }
    }
    if (!loader) {
        // Try matching by partial key
        const prefix = `../../../.context/sprints/${sprintId.value}/epic-specs/`;
        const matchKey = Object.keys(mdModules).find(k => k.startsWith(prefix) && k.toLowerCase().includes(epicId.value.toLowerCase()));
        if (matchKey)
            loader = mdModules[matchKey];
    }
    if (!loader) {
        error.value = true;
        loading.value = false;
        return;
    }
    try {
        const raw = (await loader());
        markdownHtml.value = renderMarkdown(raw);
    }
    catch {
        error.value = true;
    }
    loading.value = false;
});
function goBack() {
    router.push(`/policy/${sprintId.value}`);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-id']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "policy-detail" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "policy-sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.goBack) },
    ...{ class: "back-btn" },
});
(__VLS_ctx.sprintConfig?.label);
for (const [epic] of __VLS_getVForSourceType((__VLS_ctx.epicList))) {
    const __VLS_0 = {}.RouterLink;
    /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        key: (epic.id),
        to: (`/policy/${__VLS_ctx.sprintId}/${epic.id}`),
        ...{ class: "sidebar-item" },
        ...{ class: ({ active: epic.id === __VLS_ctx.epicId }) },
    }));
    const __VLS_2 = __VLS_1({
        key: (epic.id),
        to: (`/policy/${__VLS_ctx.sprintId}/${epic.id}`),
        ...{ class: "sidebar-item" },
        ...{ class: ({ active: epic.id === __VLS_ctx.epicId }) },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_3.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "sidebar-id" },
    });
    (epic.id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "sidebar-label" },
    });
    (epic.label);
    var __VLS_3;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "policy-content" },
});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "policy-loading" },
    });
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "policy-error" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "markdown-body" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.markdownHtml) }, null, null);
}
/** @type {__VLS_StyleScopedClasses['policy-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['policy-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
/** @type {__VLS_StyleScopedClasses['back-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-id']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-label']} */ ;
/** @type {__VLS_StyleScopedClasses['policy-content']} */ ;
/** @type {__VLS_StyleScopedClasses['policy-loading']} */ ;
/** @type {__VLS_StyleScopedClasses['policy-error']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            sprintId: sprintId,
            epicId: epicId,
            sprintConfig: sprintConfig,
            epicList: epicList,
            markdownHtml: markdownHtml,
            loading: loading,
            error: error,
            goBack: goBack,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
