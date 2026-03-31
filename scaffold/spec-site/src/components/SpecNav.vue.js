const __VLS_props = defineProps();
const emit = defineEmits();
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "spec-nav" },
});
for (const [area] of __VLS_getVForSourceType((__VLS_ctx.areas))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('select', area.id);
            } },
        key: (area.id),
        ...{ class: "spec-nav-btn" },
        ...{ class: ({ active: __VLS_ctx.activeId === area.id }) },
    });
    (area.shortLabel);
}
/** @type {__VLS_StyleScopedClasses['spec-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-nav-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            emit: emit,
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
