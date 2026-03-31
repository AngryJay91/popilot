import { ref } from 'vue';
const __VLS_props = defineProps();
const checked = ref(false);
function toggleCheck() {
    checked.value = !checked.value;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['coaching-card']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-card']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-card']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-card']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-card']} */ ;
/** @type {__VLS_StyleScopedClasses['done']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-severity']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-severity']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-severity']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-title']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-check']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-check']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-outline']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "coaching-card" },
    ...{ class: ([`severity-${__VLS_ctx.severity}`, { done: __VLS_ctx.checked }]) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "coaching-card-top" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "coaching-severity" },
    ...{ class: (__VLS_ctx.severity) },
});
(__VLS_ctx.severityLabel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.toggleCheck) },
    ...{ class: "coaching-check" },
    ...{ class: ({ checked: __VLS_ctx.checked }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "coaching-title" },
});
(__VLS_ctx.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "coaching-action" },
});
(__VLS_ctx.action);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "coaching-effect" },
});
(__VLS_ctx.effect);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "coaching-buttons" },
});
for (const [btn, i] of __VLS_getVForSourceType((__VLS_ctx.buttons))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                btn.variant === 'primary' ? __VLS_ctx.toggleCheck() : undefined;
            } },
        key: (i),
        ...{ class: "btn" },
        ...{ class: (`btn-${btn.variant}`) },
    });
    (btn.label);
}
/** @type {__VLS_StyleScopedClasses['coaching-card']} */ ;
/** @type {__VLS_StyleScopedClasses['done']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-card-top']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-severity']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-check']} */ ;
/** @type {__VLS_StyleScopedClasses['checked']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-title']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-action']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-effect']} */ ;
/** @type {__VLS_StyleScopedClasses['coaching-buttons']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            checked: checked,
            toggleCheck: toggleCheck,
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
