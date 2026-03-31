import { TASK_STATUSES, TASK_STATUS_LABELS, updateTaskStatus, updateTask } from '@/composables/usePmStore';
const props = defineProps();
const emit = defineEmits();
async function updateTaskDate(value) {
    await updateTask(props.task.id, { dueDate: value || null });
    emit('updated');
}
async function cycleStatus() {
    const idx = TASK_STATUSES.indexOf(props.task.status);
    const next = TASK_STATUSES[(idx + 1) % TASK_STATUSES.length];
    await updateTaskStatus(props.task.id, next);
    emit('updated');
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['task-item']} */ ;
/** @type {__VLS_StyleScopedClasses['task-item']} */ ;
/** @type {__VLS_StyleScopedClasses['task-check']} */ ;
/** @type {__VLS_StyleScopedClasses['task-title']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "task-item" },
    ...{ class: ({ done: __VLS_ctx.task.status === 'done' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.cycleStatus) },
    ...{ class: "task-check" },
    title: (__VLS_ctx.TASK_STATUS_LABELS[__VLS_ctx.task.status]),
});
if (__VLS_ctx.task.status === 'done') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
else if (__VLS_ctx.task.status === 'in-progress') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "check-progress" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "check-empty" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "task-title" },
});
(__VLS_ctx.task.title);
if (__VLS_ctx.task.storyPoints) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "task-sp" },
    });
    (__VLS_ctx.task.storyPoints);
}
if (__VLS_ctx.task.assignee) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "task-assignee" },
    });
    (__VLS_ctx.task.assignee);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.updateTaskDate($event.target.value);
        } },
    type: "date",
    ...{ class: "task-date" },
    value: (__VLS_ctx.task.dueDate ?? ''),
    title: "Due date",
});
/** @type {__VLS_StyleScopedClasses['task-item']} */ ;
/** @type {__VLS_StyleScopedClasses['done']} */ ;
/** @type {__VLS_StyleScopedClasses['task-check']} */ ;
/** @type {__VLS_StyleScopedClasses['check-progress']} */ ;
/** @type {__VLS_StyleScopedClasses['check-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['task-title']} */ ;
/** @type {__VLS_StyleScopedClasses['task-sp']} */ ;
/** @type {__VLS_StyleScopedClasses['task-assignee']} */ ;
/** @type {__VLS_StyleScopedClasses['task-date']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            TASK_STATUS_LABELS: TASK_STATUS_LABELS,
            updateTaskDate: updateTaskDate,
            cycleStatus: cycleStatus,
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
