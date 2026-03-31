const props = defineProps();
function hashColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++)
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
    return colors[Math.abs(hash) % colors.length];
}
const initial = props.name ? (props.name.length <= 3 ? props.name : props.name.slice(0, 3)) : '?';
const bg = hashColor(props.name || '');
const sz = props.size || 24;
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "user-avatar" },
    ...{ style: ({ width: __VLS_ctx.sz + 'px', height: __VLS_ctx.sz + 'px', background: __VLS_ctx.bg }) },
    title: (__VLS_ctx.name),
});
(__VLS_ctx.initial);
/** @type {__VLS_StyleScopedClasses['user-avatar']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            initial: initial,
            bg: bg,
            sz: sz,
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
