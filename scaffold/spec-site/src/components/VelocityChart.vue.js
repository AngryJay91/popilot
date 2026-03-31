import { computed } from 'vue';
const props = defineProps();
const maxValue = computed(() => {
    const vals = props.data.flatMap(d => [d.planned, d.actual]);
    return Math.max(...vals, 1);
});
const chartWidth = 600;
const chartHeight = 200;
const padding = { top: 20, right: 20, bottom: 40, left: 50 };
const innerW = chartWidth - padding.left - padding.right;
const innerH = chartHeight - padding.top - padding.bottom;
function x(i) {
    return padding.left + (i / Math.max(props.data.length - 1, 1)) * innerW;
}
function y(val) {
    return padding.top + innerH - (val / maxValue.value) * innerH;
}
const plannedPath = computed(() => {
    return props.data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.planned)}`).join(' ');
});
const actualPath = computed(() => {
    return props.data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.actual)}`).join(' ');
});
const yTicks = computed(() => {
    const max = maxValue.value;
    const step = Math.ceil(max / 4);
    return [0, step, step * 2, step * 3, step * 4].filter(v => v <= max + step);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['velocity-chart']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "velocity-chart" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: (`0 0 ${__VLS_ctx.chartWidth} ${__VLS_ctx.chartHeight}`),
    preserveAspectRatio: "xMidYMid meet",
});
for (const [tick] of __VLS_getVForSourceType((__VLS_ctx.yTicks))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        key: (tick),
        x1: (__VLS_ctx.padding.left),
        x2: (__VLS_ctx.chartWidth - __VLS_ctx.padding.right),
        y1: (__VLS_ctx.y(tick)),
        y2: (__VLS_ctx.y(tick)),
        stroke: "rgba(0,0,0,0.06)",
        'stroke-dasharray': "4,4",
    });
}
for (const [tick] of __VLS_getVForSourceType((__VLS_ctx.yTicks))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
        key: ('t' + tick),
        x: (__VLS_ctx.padding.left - 8),
        y: (__VLS_ctx.y(tick) + 4),
        'text-anchor': "end",
        'font-size': "10",
        fill: "var(--text-muted)",
    });
    (tick);
}
for (const [d, i] of __VLS_getVForSourceType((__VLS_ctx.data))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
        key: ('x' + i),
        x: (__VLS_ctx.x(i)),
        y: (__VLS_ctx.chartHeight - 8),
        'text-anchor': "middle",
        'font-size': "10",
        fill: "var(--text-muted)",
    });
    (d.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: (__VLS_ctx.plannedPath),
    fill: "none",
    stroke: "rgba(148,163,184,0.5)",
    'stroke-width': "2",
    'stroke-dasharray': "6,4",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: (__VLS_ctx.actualPath),
    fill: "none",
    stroke: "#3B82F6",
    'stroke-width': "2.5",
});
for (const [d, i] of __VLS_getVForSourceType((__VLS_ctx.data))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
        key: ('d' + i),
        cx: (__VLS_ctx.x(i)),
        cy: (__VLS_ctx.y(d.actual)),
        r: "4",
        fill: "#3B82F6",
        stroke: "#fff",
        'stroke-width': "2",
    });
}
for (const [d, i] of __VLS_getVForSourceType((__VLS_ctx.data))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
        key: ('p' + i),
        cx: (__VLS_ctx.x(i)),
        cy: (__VLS_ctx.y(d.planned)),
        r: "3",
        fill: "rgba(148,163,184,0.6)",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-legend" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "legend-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "legend-line legend--actual" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "legend-item" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "legend-line legend--planned" },
});
/** @type {__VLS_StyleScopedClasses['velocity-chart']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-legend']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-line']} */ ;
/** @type {__VLS_StyleScopedClasses['legend--actual']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-line']} */ ;
/** @type {__VLS_StyleScopedClasses['legend--planned']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            chartWidth: chartWidth,
            chartHeight: chartHeight,
            padding: padding,
            x: x,
            y: y,
            plannedPath: plannedPath,
            actualPath: actualPath,
            yTicks: yTicks,
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
