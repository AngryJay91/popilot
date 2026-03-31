import TaskCard from './TaskCard.vue';
const __VLS_props = defineProps();
const __VLS_emit = defineEmits();
function statusDotColor(status) {
    const map = { draft: '#94a3b8', backlog: '#a78bfa', ready: '#3b82f6', 'ready-for-dev': '#3b82f6', 'in-progress': '#f59e0b', review: '#8b5cf6', qa: '#ec4899', done: '#22c55e' };
    return map[status] || '#94a3b8';
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['kanban-card-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-body']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onDragover: (...[$event]) => {
            __VLS_ctx.$emit('drag-over', $event);
        } },
    ...{ onDragleave: (...[$event]) => {
            __VLS_ctx.$emit('drag-leave');
        } },
    ...{ onDrop: (...[$event]) => {
            __VLS_ctx.$emit('drop', $event);
        } },
    ...{ class: "kanban-col" },
    ...{ class: ({ 'kanban-col--dragover': __VLS_ctx.dragOver }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "kanban-col-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
    ...{ class: "kanban-col-dot" },
    ...{ style: ({ background: __VLS_ctx.statusDotColor(__VLS_ctx.status) }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "kanban-col-label" },
});
(__VLS_ctx.label);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "kanban-col-count" },
});
(__VLS_ctx.stories.length);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "kanban-col-body" },
});
for (const [story] of __VLS_getVForSourceType((__VLS_ctx.stories))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onDragstart: (...[$event]) => {
                __VLS_ctx.$emit('drag-start', $event, story);
            } },
        ...{ onDragend: (...[$event]) => {
                __VLS_ctx.$emit('drag-end');
            } },
        key: (story.id),
        ...{ class: "kanban-card-wrap" },
        draggable: "true",
    });
    /** @type {[typeof TaskCard, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(TaskCard, new TaskCard({
        ...{ 'onClick': {} },
        story: (story),
    }));
    const __VLS_1 = __VLS_0({
        ...{ 'onClick': {} },
        story: (story),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    let __VLS_3;
    let __VLS_4;
    let __VLS_5;
    const __VLS_6 = {
        onClick: (...[$event]) => {
            __VLS_ctx.$emit('select', story);
        }
    };
    var __VLS_2;
}
if (__VLS_ctx.stories.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "kanban-empty" },
    });
}
/** @type {__VLS_StyleScopedClasses['kanban-col']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col--dragover']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-header']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-label']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-count']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-body']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-card-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-empty']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            TaskCard: TaskCard,
            statusDotColor: statusDotColor,
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
