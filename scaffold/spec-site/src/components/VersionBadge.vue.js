const __VLS_props = defineProps();
function statusColor(s) {
    const m = { draft: 'yellow', review: 'blue', approved: 'green', dev: 'green' };
    return m[s] ?? 'blue';
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "version-badge" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "ver-tag" },
});
(__VLS_ctx.version.version);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "ver-status" },
    ...{ class: (`status-${__VLS_ctx.statusColor(__VLS_ctx.version.status)}`) },
});
(__VLS_ctx.version.status);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "ver-date" },
});
(__VLS_ctx.version.lastUpdated);
/** @type {__VLS_StyleScopedClasses['version-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['ver-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['ver-status']} */ ;
/** @type {__VLS_StyleScopedClasses['ver-date']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            statusColor: statusColor,
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
