import { ref } from 'vue';
const props = defineProps();
const isOpen = ref(props.defaultOpen ?? false);
function toggle() {
    isOpen.value = !isOpen.value;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['accordion-trigger']} */ ;
/** @type {__VLS_StyleScopedClasses['accordion']} */ ;
/** @type {__VLS_StyleScopedClasses['chevron']} */ ;
/** @type {__VLS_StyleScopedClasses['accordion']} */ ;
/** @type {__VLS_StyleScopedClasses['open']} */ ;
/** @type {__VLS_StyleScopedClasses['accordion-body']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "accordion" },
    ...{ class: ({ open: __VLS_ctx.isOpen }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.toggle) },
    ...{ class: "accordion-trigger" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "trigger-left" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "trigger-icon" },
});
(__VLS_ctx.icon);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.title);
if (__VLS_ctx.badge) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "trigger-badge" },
        ...{ class: (`badge-${__VLS_ctx.badgeVariant ?? 'blue'}`) },
    });
    (__VLS_ctx.badge);
}
if (__VLS_ctx.summary) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "trigger-summary" },
    });
    (__VLS_ctx.summary);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "trigger-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "chevron" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "divider" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "accordion-body" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "accordion-content" },
});
var __VLS_0 = {};
/** @type {__VLS_StyleScopedClasses['accordion']} */ ;
/** @type {__VLS_StyleScopedClasses['open']} */ ;
/** @type {__VLS_StyleScopedClasses['accordion-trigger']} */ ;
/** @type {__VLS_StyleScopedClasses['trigger-left']} */ ;
/** @type {__VLS_StyleScopedClasses['trigger-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['trigger-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['trigger-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['trigger-right']} */ ;
/** @type {__VLS_StyleScopedClasses['chevron']} */ ;
/** @type {__VLS_StyleScopedClasses['divider']} */ ;
/** @type {__VLS_StyleScopedClasses['accordion-body']} */ ;
/** @type {__VLS_StyleScopedClasses['accordion-content']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            isOpen: isOpen,
            toggle: toggle,
        };
    },
    __typeProps: {},
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
