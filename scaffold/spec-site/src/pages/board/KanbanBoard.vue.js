import { computed } from 'vue';
import { apiPatch } from '@/composables/useTurso';
const props = defineProps();
const COLUMNS = [
    { id: 'backlog', label: 'Backlog', color: '#9ca3af' },
    { id: 'ready-for-dev', label: 'Ready', color: '#3b82f6' },
    { id: 'in-progress', label: 'In Progress', color: '#f59e0b' },
    { id: 'review', label: 'Review', color: '#8b5cf6' },
    { id: 'done', label: 'Done', color: '#22c55e' },
];
const grouped = computed(() => {
    const groups = {};
    for (const col of COLUMNS)
        groups[col.id] = [];
    for (const s of props.stories) {
        const col = COLUMNS.find(c => c.id === s.status) ? s.status : 'backlog';
        groups[col].push(s);
    }
    return groups;
});
let dragStoryId = null;
function onDragStart(e, storyId) {
    dragStoryId = storyId;
    e.dataTransfer?.setData('story-id', String(storyId));
}
async function onDrop(e, newStatus) {
    e.preventDefault();
    const id = Number(e.dataTransfer?.getData('story-id') || dragStoryId);
    if (!id)
        return;
    await apiPatch(`/api/v2/pm/stories/${id}`, { status: newStatus });
    const story = props.stories.find(s => s.id === id);
    if (story)
        story.status = newStatus;
    props.onUpdate?.();
    dragStoryId = null;
}
const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['kanban-card']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-card']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "kanban-board" },
});
for (const [col] of __VLS_getVForSourceType((__VLS_ctx.COLUMNS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onDragover: () => { } },
        ...{ onDrop: (...[$event]) => {
                __VLS_ctx.onDrop($event, col.id);
            } },
        key: (col.id),
        ...{ class: "kanban-column" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "column-header" },
        ...{ style: ({ borderTopColor: col.color }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "column-title" },
    });
    (col.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "column-count" },
    });
    (__VLS_ctx.grouped[col.id].length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "column-body" },
    });
    for (const [story] of __VLS_getVForSourceType((__VLS_ctx.grouped[col.id]))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onDragstart: (...[$event]) => {
                    __VLS_ctx.onDragStart($event, story.id);
                } },
            key: (story.id),
            ...{ class: "kanban-card" },
            draggable: "true",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-top" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "card-id" },
        });
        (story.id);
        if (story.story_points) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "card-sp" },
            });
            (story.story_points);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-title" },
        });
        (story.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-bottom" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "card-priority" },
            ...{ style: ({ color: __VLS_ctx.priorityColors[story.priority] || '#9ca3af' }) },
        });
        (story.priority);
        if (story.assignee) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "card-assignee" },
            });
            (story.assignee);
        }
    }
}
/** @type {__VLS_StyleScopedClasses['kanban-board']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-column']} */ ;
/** @type {__VLS_StyleScopedClasses['column-header']} */ ;
/** @type {__VLS_StyleScopedClasses['column-title']} */ ;
/** @type {__VLS_StyleScopedClasses['column-count']} */ ;
/** @type {__VLS_StyleScopedClasses['column-body']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-top']} */ ;
/** @type {__VLS_StyleScopedClasses['card-id']} */ ;
/** @type {__VLS_StyleScopedClasses['card-sp']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card-bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['card-priority']} */ ;
/** @type {__VLS_StyleScopedClasses['card-assignee']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            COLUMNS: COLUMNS,
            grouped: grouped,
            onDragStart: onDragStart,
            onDrop: onDrop,
            priorityColors: priorityColors,
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
