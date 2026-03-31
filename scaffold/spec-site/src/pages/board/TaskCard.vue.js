const __VLS_props = defineProps();
const __VLS_emit = defineEmits();
function statusColor(status) {
    const map = { done: '#22c55e', 'in-progress': '#f59e0b', review: '#8b5cf6', backlog: '#94a3b8', draft: '#94a3b8', blocked: '#ef4444' };
    return map[status] || '#6b7280';
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['task-card']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('click');
        } },
    ...{ class: "task-card" },
    draggable: "true",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "task-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "task-id" },
});
(__VLS_ctx.story.id);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
    ...{ class: "task-status-dot" },
    ...{ style: ({ background: __VLS_ctx.statusColor(__VLS_ctx.story.status) }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "task-title" },
});
(__VLS_ctx.story.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "task-footer" },
});
if (__VLS_ctx.story.assignee) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "task-assignee" },
    });
    (__VLS_ctx.story.assignee);
}
if (__VLS_ctx.story.storyPoints) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "task-sp" },
    });
    (__VLS_ctx.story.storyPoints);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "task-priority" },
    ...{ class: ('priority--' + __VLS_ctx.story.priority) },
});
(__VLS_ctx.story.priority);
/** @type {__VLS_StyleScopedClasses['task-card']} */ ;
/** @type {__VLS_StyleScopedClasses['task-header']} */ ;
/** @type {__VLS_StyleScopedClasses['task-id']} */ ;
/** @type {__VLS_StyleScopedClasses['task-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['task-title']} */ ;
/** @type {__VLS_StyleScopedClasses['task-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['task-assignee']} */ ;
/** @type {__VLS_StyleScopedClasses['task-sp']} */ ;
/** @type {__VLS_StyleScopedClasses['task-priority']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            statusColor: statusColor,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
