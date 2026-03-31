import { ref, watchEffect, computed } from 'vue';
import { sprints } from '@/composables/useNavStore';
import { renderMarkdown } from '@/utils/markdown';
const props = defineProps();
const sprintLabel = computed(() => sprints.value.find((s) => s.id === props.sprint)?.label ?? props.sprint);
const markdownHtml = ref('');
const loading = ref(true);
const error = ref(false);
const mdModules = import.meta.glob('../../../../.context/sprints/*/epic-specs/*.md', { query: '?raw', import: 'default' });
watchEffect(async () => {
    loading.value = true;
    error.value = false;
    markdownHtml.value = '';
    // Try multiple filename patterns: E-XX.md, e-xx.md, partial match
    const candidates = [
        `${props.epicId}.md`,
        `${props.epicId.toLowerCase()}.md`,
        `${props.epicId.toUpperCase()}.md`,
    ];
    const prefix = `../../../../.context/sprints/${props.sprint}/epic-specs/`;
    let loader;
    for (const name of candidates) {
        const key = prefix + name;
        if (mdModules[key]) {
            loader = mdModules[key];
            break;
        }
    }
    // Fallback: partial key match
    if (!loader) {
        const partialKey = Object.keys(mdModules).find((k) => k.includes(`/${props.sprint}/`) && k.toLowerCase().includes(props.epicId.toLowerCase()));
        if (partialKey)
            loader = mdModules[partialKey];
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
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
    ...{ class: "policy-fallback" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "fallback-banner" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "banner-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(__VLS_ctx.pageLabel);
(__VLS_ctx.sprintLabel);
(__VLS_ctx.epicId);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "fallback-content" },
});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fallback-loading" },
    });
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fallback-error" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
        ...{ class: "markdown-body" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.markdownHtml) }, null, null);
}
/** @type {__VLS_StyleScopedClasses['policy-fallback']} */ ;
/** @type {__VLS_StyleScopedClasses['fallback-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['banner-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['fallback-content']} */ ;
/** @type {__VLS_StyleScopedClasses['fallback-loading']} */ ;
/** @type {__VLS_StyleScopedClasses['fallback-error']} */ ;
/** @type {__VLS_StyleScopedClasses['markdown-body']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            sprintLabel: sprintLabel,
            markdownHtml: markdownHtml,
            loading: loading,
            error: error,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
