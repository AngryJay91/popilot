import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { stories, loadPmData, getMyStories, getMyTasks, updateStoryStatus, updateTaskStatus, STORY_STATUSES, TASK_STATUSES, STORY_STATUS_LABELS, TASK_STATUS_LABELS, } from '@/composables/usePmStore';
import { useUser } from '@/composables/useUser';
import StatusBadge from './StatusBadge.vue';
const route = useRoute();
const { currentUser } = useUser();
const loading = ref(true);
const sprint = computed(() => route.params.sprint);
const myStories = computed(() => {
    if (!currentUser.value)
        return [];
    return getMyStories(currentUser.value).filter((s) => s.sprint === sprint.value);
});
const myTasks = computed(() => {
    if (!currentUser.value)
        return [];
    return getMyTasks(currentUser.value).filter((t) => {
        const story = stories.value.find((s) => s.id === t.storyId);
        return story && story.sprint === sprint.value;
    });
});
async function cycleStoryStatus(story) {
    const idx = STORY_STATUSES.indexOf(story.status);
    const next = STORY_STATUSES[(idx + 1) % STORY_STATUSES.length];
    await updateStoryStatus(story.id, next);
}
async function cycleTaskStatus(task) {
    const idx = TASK_STATUSES.indexOf(task.status);
    const next = TASK_STATUSES[(idx + 1) % TASK_STATUSES.length];
    await updateTaskStatus(task.id, next);
}
function getStoryTitle(storyId) {
    return stories.value.find(s => s.id === storyId)?.title ?? '?';
}
onMounted(async () => {
    await loadPmData(sprint.value);
    loading.value = false;
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['item-row']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "my-tasks-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
(__VLS_ctx.sprint.toUpperCase());
if (!__VLS_ctx.currentUser) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty" },
    });
}
else if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "user-label" },
    });
    (__VLS_ctx.currentUser);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "count" },
    });
    (__VLS_ctx.myStories.length);
    if (__VLS_ctx.myStories.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-section" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "item-list" },
        });
        for (const [s] of __VLS_getVForSourceType((__VLS_ctx.myStories))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!!(!__VLS_ctx.currentUser))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.myStories.length === 0))
                            return;
                        __VLS_ctx.cycleStoryStatus(s);
                    } },
                key: (s.id),
                ...{ class: "item-row" },
            });
            /** @type {[typeof StatusBadge, ]} */ ;
            // @ts-ignore
            const __VLS_0 = __VLS_asFunctionalComponent(StatusBadge, new StatusBadge({
                label: (__VLS_ctx.STORY_STATUS_LABELS[s.status]),
                type: "status",
                value: (s.status),
            }));
            const __VLS_1 = __VLS_0({
                label: (__VLS_ctx.STORY_STATUS_LABELS[s.status]),
                type: "status",
                value: (s.status),
            }, ...__VLS_functionalComponentArgsRest(__VLS_0));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "item-title" },
            });
            (s.title);
            if (s.storyPoints) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "item-points" },
                });
                (s.storyPoints);
            }
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "count" },
    });
    (__VLS_ctx.myTasks.length);
    if (__VLS_ctx.myTasks.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-section" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "item-list" },
        });
        for (const [t] of __VLS_getVForSourceType((__VLS_ctx.myTasks))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!!(!__VLS_ctx.currentUser))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.myTasks.length === 0))
                            return;
                        __VLS_ctx.cycleTaskStatus(t);
                    } },
                key: (t.id),
                ...{ class: "item-row" },
            });
            /** @type {[typeof StatusBadge, ]} */ ;
            // @ts-ignore
            const __VLS_3 = __VLS_asFunctionalComponent(StatusBadge, new StatusBadge({
                label: (__VLS_ctx.TASK_STATUS_LABELS[t.status]),
                type: "status",
                value: (t.status),
            }));
            const __VLS_4 = __VLS_3({
                label: (__VLS_ctx.TASK_STATUS_LABELS[t.status]),
                type: "status",
                value: (t.status),
            }, ...__VLS_functionalComponentArgsRest(__VLS_3));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "item-title" },
            });
            (t.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "item-story" },
            });
            (__VLS_ctx.getStoryTitle(t.storyId));
        }
    }
}
/** @type {__VLS_StyleScopedClasses['my-tasks-page']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['user-label']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['count']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-section']} */ ;
/** @type {__VLS_StyleScopedClasses['item-list']} */ ;
/** @type {__VLS_StyleScopedClasses['item-row']} */ ;
/** @type {__VLS_StyleScopedClasses['item-title']} */ ;
/** @type {__VLS_StyleScopedClasses['item-points']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['count']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-section']} */ ;
/** @type {__VLS_StyleScopedClasses['item-list']} */ ;
/** @type {__VLS_StyleScopedClasses['item-row']} */ ;
/** @type {__VLS_StyleScopedClasses['item-title']} */ ;
/** @type {__VLS_StyleScopedClasses['item-story']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            STORY_STATUS_LABELS: STORY_STATUS_LABELS,
            TASK_STATUS_LABELS: TASK_STATUS_LABELS,
            StatusBadge: StatusBadge,
            currentUser: currentUser,
            loading: loading,
            sprint: sprint,
            myStories: myStories,
            myTasks: myTasks,
            cycleStoryStatus: cycleStoryStatus,
            cycleTaskStatus: cycleTaskStatus,
            getStoryTitle: getStoryTitle,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
