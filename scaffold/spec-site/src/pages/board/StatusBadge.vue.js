const __VLS_props = defineProps();
const statusColors = {
    'draft': '#94a3b8',
    'backlog': '#a78bfa',
    'ready': '#3b82f6',
    'in-progress': '#f59e0b',
    'review': '#8b5cf6',
    'done': '#22c55e',
    'todo': '#94a3b8',
};
const priorityColors = {
    'low': '#94a3b8',
    'medium': '#3b82f6',
    'high': '#f59e0b',
    'critical': '#ef4444',
};
function getColor(type, value) {
    if (type === 'priority')
        return priorityColors[value] ?? '#94a3b8';
    return statusColors[value] ?? '#94a3b8';
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "status-badge" },
    ...{ style: ({
            '--badge-color': __VLS_ctx.getColor(__VLS_ctx.type ?? 'status', __VLS_ctx.value),
        }) },
});
(__VLS_ctx.label);
/** @type {__VLS_StyleScopedClasses['status-badge']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            getColor: getColor,
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
