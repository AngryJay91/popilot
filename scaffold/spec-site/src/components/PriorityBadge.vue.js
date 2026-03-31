import { ArrowUp, Minus, ArrowDown } from 'lucide-vue-next';
const props = defineProps();
const config = {
    high: { icon: ArrowUp, color: '#ef4444', label: 'High' },
    medium: { icon: Minus, color: '#f59e0b', label: 'Medium' },
    low: { icon: ArrowDown, color: '#3b82f6', label: 'Low' },
};
const c = config[props.priority] || { icon: Minus, color: '#9ca3af', label: props.priority || '-' };
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "priority-badge" },
    ...{ style: ({ color: __VLS_ctx.c.color }) },
    title: (__VLS_ctx.c.label),
});
const __VLS_0 = ((__VLS_ctx.c.icon));
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    size: (14),
}));
const __VLS_2 = __VLS_1({
    size: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
/** @type {__VLS_StyleScopedClasses['priority-badge']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            c: c,
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
