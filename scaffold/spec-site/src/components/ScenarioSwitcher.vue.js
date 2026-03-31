const props = defineProps();
const emit = defineEmits();
function isCustom(id) {
    return id.startsWith('custom-');
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['variant-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['variant-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['variant-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-btn']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "variant-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
for (const [s] of __VLS_getVForSourceType((__VLS_ctx.scenarios))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (s.id),
        ...{ class: "variant-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('change', s.id);
            } },
        ...{ class: "variant-btn" },
        ...{ class: ({ active: __VLS_ctx.activeId === s.id }) },
    });
    (s.label);
    if (__VLS_ctx.activeId === s.id && !__VLS_ctx.isCustom(s.id)) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeId === s.id && !__VLS_ctx.isCustom(s.id)))
                        return;
                    __VLS_ctx.emit('duplicate', s.id);
                } },
            ...{ class: "action-btn duplicate-btn" },
            title: "Duplicate scenario",
        });
    }
    if (__VLS_ctx.isCustom(s.id)) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.isCustom(s.id)))
                        return;
                    __VLS_ctx.emit('deleteCustom', s.id);
                } },
            ...{ class: "action-btn delete-btn" },
            title: "Delete custom scenario",
        });
    }
}
/** @type {__VLS_StyleScopedClasses['variant-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['variant-item']} */ ;
/** @type {__VLS_StyleScopedClasses['variant-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['duplicate-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            emit: emit,
            isCustom: isCustom,
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
