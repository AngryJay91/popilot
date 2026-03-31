import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiGet, apiPost } from '@/api/client';
const route = useRoute();
const router = useRouter();
const sprintId = computed(() => route.params.sprintId);
const loading = ref(false);
const error = ref('');
const planData = ref(null);
const result = ref(null);
const incomplete = computed(() => planData.value?.incompleteStories ?? []);
const doneSP = computed(() => planData.value?.summary?.doneSP ?? 0);
const totalSP = computed(() => planData.value?.summary?.totalSP ?? 0);
const completionRate = computed(() => {
    const total = planData.value?.summary?.totalStories ?? 0;
    const completed = planData.value?.summary?.completedCount ?? 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
});
async function closeSprint() {
    loading.value = true;
    error.value = '';
    const { data, error: e } = await apiPost(`/api/v2/kickoff/${sprintId.value}/close`, {});
    loading.value = false;
    if (e) {
        error.value = e;
        return;
    }
    result.value = data;
}
onMounted(async () => {
    const { data } = await apiGet(`/api/v2/kickoff/${sprintId.value}/close-preview`);
    if (data)
        planData.value = data;
    if (data?.sprint?.status !== 'active') {
        error.value = `${sprintId.value} is not in active status (current: ${data?.sprint?.status})`;
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['close-page']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-section']} */ ;
/** @type {__VLS_StyleScopedClasses['incomplete-section']} */ ;
/** @type {__VLS_StyleScopedClasses['backlog-list']} */ ;
/** @type {__VLS_StyleScopedClasses['close-result']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['close-page']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['close-page']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "close-page" },
});
if (__VLS_ctx.result) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "close-result" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    (__VLS_ctx.sprintId);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-cards" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-value" },
    });
    (__VLS_ctx.result.summary.completedCount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-value" },
    });
    (__VLS_ctx.result.summary.doneSP);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-value" },
    });
    (__VLS_ctx.result.summary.completionRate);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-label" },
    });
    if (__VLS_ctx.result.summary.movedToBacklog.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "backlog-list" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        (__VLS_ctx.result.summary.incompleteCount);
        for (const [s] of __VLS_getVForSourceType((__VLS_ctx.result.summary.movedToBacklog))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (s.id),
                ...{ class: "backlog-item" },
            });
            (s.id);
            (s.title);
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "close-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.result))
                    return;
                __VLS_ctx.router.push(`/retro/${__VLS_ctx.sprintId}`);
            } },
        ...{ class: "btn btn--primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.result))
                    return;
                __VLS_ctx.router.push('/');
            } },
        ...{ class: "btn" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    (__VLS_ctx.sprintId);
    if (__VLS_ctx.error) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "error-msg" },
        });
        (__VLS_ctx.error);
    }
    if (__VLS_ctx.planData && !__VLS_ctx.error) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "close-preview" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "summary-cards" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "summary-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "summary-value" },
        });
        (__VLS_ctx.planData?.summary?.completedCount ?? 0);
        (__VLS_ctx.planData?.summary?.totalStories ?? 0);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "summary-label" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "summary-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "summary-value" },
        });
        (__VLS_ctx.doneSP);
        (__VLS_ctx.totalSP);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "summary-label" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "summary-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "summary-value" },
        });
        (__VLS_ctx.completionRate);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "summary-label" },
        });
        if (__VLS_ctx.planData?.velocity) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "velocity-section" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            for (const [v] of __VLS_getVForSourceType((__VLS_ctx.planData.velocity))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: (v.assignee),
                    ...{ class: "velocity-row" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "velocity-name" },
                });
                (v.assignee);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "velocity-sp" },
                });
                (v.doneSP);
                (v.totalSP);
            }
        }
        if (__VLS_ctx.incomplete.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "incomplete-section" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
            (__VLS_ctx.incomplete.length);
            for (const [s] of __VLS_getVForSourceType((__VLS_ctx.incomplete))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: (s.id),
                    ...{ class: "incomplete-item" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
                    ...{ class: "status-dot" },
                });
                (s.id);
                (s.title);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "sp-badge" },
                });
                (s.story_points ?? '-');
            }
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.closeSprint) },
            ...{ class: "btn btn--danger btn--lg" },
            disabled: (__VLS_ctx.loading),
        });
        (__VLS_ctx.loading ? 'Closing...' : `Close ${__VLS_ctx.sprintId}`);
    }
}
/** @type {__VLS_StyleScopedClasses['close-page']} */ ;
/** @type {__VLS_StyleScopedClasses['close-result']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
/** @type {__VLS_StyleScopedClasses['backlog-list']} */ ;
/** @type {__VLS_StyleScopedClasses['backlog-item']} */ ;
/** @type {__VLS_StyleScopedClasses['close-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['error-msg']} */ ;
/** @type {__VLS_StyleScopedClasses['close-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-value']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-label']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-section']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-row']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-name']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-sp']} */ ;
/** @type {__VLS_StyleScopedClasses['incomplete-section']} */ ;
/** @type {__VLS_StyleScopedClasses['incomplete-item']} */ ;
/** @type {__VLS_StyleScopedClasses['status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['sp-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--lg']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            sprintId: sprintId,
            loading: loading,
            error: error,
            planData: planData,
            result: result,
            incomplete: incomplete,
            doneSP: doneSP,
            totalSP: totalSP,
            completionRate: completionRate,
            closeSprint: closeSprint,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
