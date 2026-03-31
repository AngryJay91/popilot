import { computed } from 'vue';
import { getTasksForStory, STORY_STATUS_LABELS, PRIORITY_LABELS } from '@/composables/usePmStore';
import StatusBadge from './StatusBadge.vue';
const props = defineProps();
const emit = defineEmits();
const storyTasks = computed(() => getTasksForStory(props.story.id));
const doneCount = computed(() => storyTasks.value.filter(t => t.status === 'done').length);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['story-card']} */ ;
/** @type {__VLS_StyleScopedClasses['story-card']} */ ;
/** @type {__VLS_StyleScopedClasses['story-title']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('select', __VLS_ctx.story);
        } },
    ...{ class: "story-card" },
    ...{ class: ({ 'story-done': __VLS_ctx.story.status === 'done' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "story-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "story-top-row" },
});
/** @type {[typeof StatusBadge, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(StatusBadge, new StatusBadge({
    label: (__VLS_ctx.STORY_STATUS_LABELS[__VLS_ctx.story.status]),
    type: "status",
    value: (__VLS_ctx.story.status),
}));
const __VLS_1 = __VLS_0({
    label: (__VLS_ctx.STORY_STATUS_LABELS[__VLS_ctx.story.status]),
    type: "status",
    value: (__VLS_ctx.story.status),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
/** @type {[typeof StatusBadge, ]} */ ;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent(StatusBadge, new StatusBadge({
    label: (__VLS_ctx.PRIORITY_LABELS[__VLS_ctx.story.priority]),
    type: "priority",
    value: (__VLS_ctx.story.priority),
}));
const __VLS_4 = __VLS_3({
    label: (__VLS_ctx.PRIORITY_LABELS[__VLS_ctx.story.priority]),
    type: "priority",
    value: (__VLS_ctx.story.priority),
}, ...__VLS_functionalComponentArgsRest(__VLS_3));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "story-area" },
});
(__VLS_ctx.story.area);
if (__VLS_ctx.story.storyPoints) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "story-points" },
    });
    (__VLS_ctx.story.storyPoints);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "story-title" },
});
(__VLS_ctx.story.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "story-bottom" },
});
if (__VLS_ctx.story.assignee) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "story-assignee" },
    });
    (__VLS_ctx.story.assignee);
}
if (__VLS_ctx.storyTasks.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "story-task-count" },
    });
    (__VLS_ctx.doneCount);
    (__VLS_ctx.storyTasks.length);
}
if (__VLS_ctx.story.relatedPrs?.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "story-pr-badge" },
        title: "PRs linked",
    });
    (__VLS_ctx.story.relatedPrs.length);
}
/** @type {__VLS_StyleScopedClasses['story-card']} */ ;
/** @type {__VLS_StyleScopedClasses['story-done']} */ ;
/** @type {__VLS_StyleScopedClasses['story-header']} */ ;
/** @type {__VLS_StyleScopedClasses['story-top-row']} */ ;
/** @type {__VLS_StyleScopedClasses['story-area']} */ ;
/** @type {__VLS_StyleScopedClasses['story-points']} */ ;
/** @type {__VLS_StyleScopedClasses['story-title']} */ ;
/** @type {__VLS_StyleScopedClasses['story-bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['story-assignee']} */ ;
/** @type {__VLS_StyleScopedClasses['story-task-count']} */ ;
/** @type {__VLS_StyleScopedClasses['story-pr-badge']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            STORY_STATUS_LABELS: STORY_STATUS_LABELS,
            PRIORITY_LABELS: PRIORITY_LABELS,
            StatusBadge: StatusBadge,
            emit: emit,
            storyTasks: storyTasks,
            doneCount: doneCount,
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
