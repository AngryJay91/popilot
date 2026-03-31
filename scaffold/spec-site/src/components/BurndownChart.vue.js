import { ref, onMounted, computed, watch } from 'vue';
import { apiGet } from '@/composables/useTurso';
const props = defineProps();
const data = ref(null);
async function loadBurndown() {
    const { data: d } = await apiGet(`/api/v2/pm/sprints/${props.sprintId}/burndown`);
    data.value = d;
}
onMounted(loadBurndown);
watch(() => props.sprintId, loadBurndown);
const chartData = computed(() => {
    if (!data.value)
        return { points: [], idealPoints: [], dates: [] };
    const { totalSP, dailyDone, startDate, endDate } = data.value;
    if (!startDate || !endDate || !totalSP)
        return { points: [], idealPoints: [], dates: [] };
    // Date array
    const dates = [];
    let d = new Date(startDate);
    const end = new Date(endDate);
    while (d <= end) {
        dates.push(d.toISOString().split('T')[0]);
        d.setDate(d.getDate() + 1);
    }
    // Daily done SP map
    const doneMap = {};
    for (const r of dailyDone)
        doneMap[r.date] = r.sp;
    // Remaining
    let cumDone = 0;
    const points = dates.map(dt => { cumDone += doneMap[dt] || 0; return totalSP - cumDone; });
    // Ideal
    const idealPoints = dates.map((_, i) => Math.round(totalSP * (1 - i / (dates.length - 1))));
    return { points, idealPoints, dates };
});
const svgW = 400;
const svgH = 200;
const pad = 30;
function x(i, total) { return pad + (i / Math.max(total - 1, 1)) * (svgW - pad * 2); }
function y(val, max) { return pad + (1 - val / Math.max(max, 1)) * (svgH - pad * 2); }
function polyline(points, max) {
    return points.map((p, i) => `${x(i, points.length)},${y(p, max)}`).join(' ');
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['burndown-chart']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "burndown-chart" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
if (__VLS_ctx.chartData.points.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        viewBox: (`0 0 ${__VLS_ctx.svgW} ${__VLS_ctx.svgH}`),
        ...{ class: "chart-svg" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
        points: (__VLS_ctx.polyline(__VLS_ctx.chartData.idealPoints, __VLS_ctx.data?.totalSP || 1)),
        fill: "none",
        stroke: "#d1d5db",
        'stroke-width': "1.5",
        'stroke-dasharray': "4",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
        points: (__VLS_ctx.polyline(__VLS_ctx.chartData.points, __VLS_ctx.data?.totalSP || 1)),
        fill: "none",
        stroke: "var(--primary)",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: (__VLS_ctx.pad),
        y1: (__VLS_ctx.svgH - __VLS_ctx.pad),
        x2: (__VLS_ctx.svgW - __VLS_ctx.pad),
        y2: (__VLS_ctx.svgH - __VLS_ctx.pad),
        stroke: "#e5e7eb",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: (__VLS_ctx.pad),
        y1: (__VLS_ctx.pad),
        x2: (__VLS_ctx.pad),
        y2: (__VLS_ctx.svgH - __VLS_ctx.pad),
        stroke: "#e5e7eb",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
        x: (__VLS_ctx.pad),
        y: (__VLS_ctx.pad - 5),
        'font-size': "10",
        fill: "var(--text-muted)",
    });
    (__VLS_ctx.data?.totalSP);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
        x: (__VLS_ctx.svgW - __VLS_ctx.pad),
        y: (__VLS_ctx.svgH - __VLS_ctx.pad + 15),
        'font-size': "9",
        fill: "var(--text-muted)",
        'text-anchor': "end",
    });
    (__VLS_ctx.chartData.dates[__VLS_ctx.chartData.dates.length - 1]);
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "chart-empty" },
    });
}
/** @type {__VLS_StyleScopedClasses['burndown-chart']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-svg']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-empty']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            data: data,
            chartData: chartData,
            svgW: svgW,
            svgH: svgH,
            pad: pad,
            polyline: polyline,
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
