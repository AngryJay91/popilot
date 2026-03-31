const __VLS_props = defineProps();
const emit = defineEmits();
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['state-display']} */ ;
/** @type {__VLS_StyleScopedClasses['cta-btn']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "state-display" },
    ...{ class: (`state--${__VLS_ctx.type}`) },
});
if (__VLS_ctx.type === 'loading') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "spinner" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.message || 'Loading...');
}
if (__VLS_ctx.type === 'empty') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty-icon" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.message || 'No data available');
    if (__VLS_ctx.ctaTo) {
        const __VLS_0 = {}.RouterLink;
        /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
            to: (__VLS_ctx.ctaTo),
            ...{ class: "cta-btn" },
        }));
        const __VLS_2 = __VLS_1({
            to: (__VLS_ctx.ctaTo),
            ...{ class: "cta-btn" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        __VLS_3.slots.default;
        (__VLS_ctx.ctaLabel || 'Get started');
        var __VLS_3;
    }
    else if (__VLS_ctx.ctaLabel) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.type === 'empty'))
                        return;
                    if (!!(__VLS_ctx.ctaTo))
                        return;
                    if (!(__VLS_ctx.ctaLabel))
                        return;
                    __VLS_ctx.emit('cta');
                } },
            ...{ class: "cta-btn" },
        });
        (__VLS_ctx.ctaLabel);
    }
}
if (__VLS_ctx.type === 'error') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-icon" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.message || 'Something went wrong');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.type === 'error'))
                    return;
                __VLS_ctx.emit('cta');
            } },
        ...{ class: "cta-btn" },
    });
    (__VLS_ctx.ctaLabel || 'Retry');
}
/** @type {__VLS_StyleScopedClasses['state-display']} */ ;
/** @type {__VLS_StyleScopedClasses['spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['cta-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['cta-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['error-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['cta-btn']} */ ;
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
