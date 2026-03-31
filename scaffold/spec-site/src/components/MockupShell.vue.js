import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useActiveSection } from '@/composables/useActiveSection';
const route = useRoute();
const router = useRouter();
const { clearActiveSection } = useActiveSection();
const currentSprint = computed(() => route.params.sprint || '');
const currentPageId = computed(() => route.params.pageId || '');
// TODO: Replace with your project's sidebar items
const sidebarItems = [
    { id: 'home', icon: '🏠', label: 'Home', pageId: 'home' },
];
function navigate(item) {
    if (!item.pageId || item.pageId === currentPageId.value)
        return;
    router.push(`/${item.pageId}/${currentSprint.value}`);
}
watch(currentPageId, () => {
    clearActiveSection();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mockup-shell" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "app-sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-logo" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-menu" },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.sidebarItems))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.navigate(item);
            } },
        key: (item.id),
        ...{ class: "sidebar-item" },
        ...{ class: ({
                active: item.pageId === __VLS_ctx.currentPageId,
                disabled: !item.pageId,
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "sidebar-icon" },
    });
    (item.icon);
    (item.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mockup-main" },
});
var __VLS_0 = {};
/** @type {__VLS_StyleScopedClasses['mockup-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['app-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['mockup-main']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            currentPageId: currentPageId,
            sidebarItems: sidebarItems,
            navigate: navigate,
        };
    },
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
