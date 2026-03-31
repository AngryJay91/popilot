import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiGet } from '@/composables/useTurso';
import VelocityChart from '@/components/VelocityChart.vue';
const router = useRouter();
const timeline = ref([]);
const chartData = computed(() => {
    return timeline.value
        .filter(s => s.status === 'closed' || s.status === 'active')
        .reverse()
        .map(s => ({
        label: s.label,
        planned: s.totalSP,
        actual: s.doneSP,
    }));
});
function statusLabel(s) {
    return { planning: 'Planning', active: 'Active', closed: 'Closed' }[s] ?? s;
}
function statusClass(s) {
    return `status--${s}`;
}
function duration(start, end) {
    if (!start || !end)
        return '-';
    const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days`;
}
onMounted(async () => {
    const { data } = await apiGet('/api/v2/nav/sprints/timeline');
    if (data?.timeline) {
        // active -> planning -> closed
        const order = { active: 0, planning: 1, closed: 2 };
        timeline.value = data.timeline.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['timeline-page']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-card']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-card']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-card']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-card']} */ ;
/** @type {__VLS_StyleScopedClasses['status--active']} */ ;
/** @type {__VLS_StyleScopedClasses['card-status']} */ ;
/** @type {__VLS_StyleScopedClasses['status--planning']} */ ;
/** @type {__VLS_StyleScopedClasses['card-status']} */ ;
/** @type {__VLS_StyleScopedClasses['status--closed']} */ ;
/** @type {__VLS_StyleScopedClasses['card-status']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-page']} */ ;
/** @type {__VLS_StyleScopedClasses['card-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['card-meta']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "timeline-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
if (__VLS_ctx.chartData.length >= 2) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "chart-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    /** @type {[typeof VelocityChart, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(VelocityChart, new VelocityChart({
        data: (__VLS_ctx.chartData),
    }));
    const __VLS_1 = __VLS_0({
        data: (__VLS_ctx.chartData),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "timeline" },
});
for (const [s] of __VLS_getVForSourceType((__VLS_ctx.timeline))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.router.push(`/board/${s.id}`);
            } },
        key: (s.id),
        ...{ class: "timeline-card" },
        ...{ class: (__VLS_ctx.statusClass(s.status)) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "card-label" },
    });
    (s.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "card-status" },
    });
    (__VLS_ctx.statusLabel(s.status));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-theme" },
    });
    (s.theme || '-');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-stats" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stat" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stat-value" },
    });
    (s.doneCount);
    (s.storyCount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stat-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stat" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stat-value" },
    });
    (s.doneSP);
    (s.totalSP);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stat-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stat" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stat-value" },
    });
    (s.completionRate);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stat-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-bar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "bar-fill" },
        ...{ style: ({ width: s.completionRate + '%' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-meta" },
    });
    if (s.startDate) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (s.startDate);
        (s.endDate);
        (__VLS_ctx.duration(s.startDate, s.endDate));
    }
    if (s.velocity) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (s.velocity);
    }
}
/** @type {__VLS_StyleScopedClasses['timeline-page']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-card']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-label']} */ ;
/** @type {__VLS_StyleScopedClasses['card-status']} */ ;
/** @type {__VLS_StyleScopedClasses['card-theme']} */ ;
/** @type {__VLS_StyleScopedClasses['card-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['card-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['card-meta']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VelocityChart: VelocityChart,
            router: router,
            timeline: timeline,
            chartData: chartData,
            statusLabel: statusLabel,
            statusClass: statusClass,
            duration: duration,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
