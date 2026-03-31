import { ref, onMounted } from 'vue';
import { apiGet } from '@/composables/useTurso';
import { renderMarkdown } from '@/utils/markdown';
const props = defineProps();
const timeline = ref([]);
async function load() {
    const { data } = await apiGet(`/api/v2/memos/${props.memoId}/timeline`);
    timeline.value = data?.timeline || [];
}
const typeIcons = { reply: '<Icon name="messageCircle" :size="14" />', activity: '<Icon name="document" :size="14" />', status_change: '<Icon name="refreshCw" :size="14" />' };
const typeLabels = { reply: 'Reply', activity: 'Activity', status_change: 'Status Change' };
onMounted(load);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "memo-timeline" },
});
for (const [entry] of __VLS_getVForSourceType((__VLS_ctx.timeline))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (`${entry.type}-${entry.id}`),
        ...{ class: "tl-entry" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "tl-dot" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "tl-content" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "tl-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "tl-icon" },
    });
    (__VLS_ctx.typeIcons[entry.type] || '<Icon name="pin" :size="14" />');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "tl-author" },
    });
    (entry.author);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "tl-type" },
    });
    (__VLS_ctx.typeLabels[entry.type] || entry.type);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "tl-time" },
    });
    (entry.created_at);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "tl-body" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.renderMarkdown(entry.content || '')) }, null, null);
}
if (!__VLS_ctx.timeline.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "tl-empty" },
    });
}
/** @type {__VLS_StyleScopedClasses['memo-timeline']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-entry']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-content']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-header']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-author']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-type']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-time']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-body']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-empty']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            renderMarkdown: renderMarkdown,
            timeline: timeline,
            typeIcons: typeIcons,
            typeLabels: typeLabels,
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
