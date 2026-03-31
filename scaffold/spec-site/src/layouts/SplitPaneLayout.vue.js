import { ref, onMounted, onUnmounted } from 'vue';
import { provideActiveSection } from '@/composables/useActiveSection';
import SpecNav from '@/components/SpecNav.vue';
const __VLS_props = defineProps();
const { activeSection, setActiveSection } = provideActiveSection();
// Resizable divider
const leftPane = ref(null);
const divider = ref(null);
let isDragging = false;
let startX = 0;
let startWidth = 0;
function onMouseDown(e) {
    if (!leftPane.value)
        return;
    isDragging = true;
    startX = e.clientX;
    startWidth = leftPane.value.offsetWidth;
    divider.value?.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
}
function onMouseMove(e) {
    if (!isDragging || !leftPane.value)
        return;
    const newWidth = Math.max(400, Math.min(startWidth + e.clientX - startX, window.innerWidth - 560));
    leftPane.value.style.width = newWidth + 'px';
    leftPane.value.style.flex = 'none';
}
function onMouseUp() {
    if (!isDragging)
        return;
    isDragging = false;
    divider.value?.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
}
onMounted(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
});
onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "split-pane" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pane-left" },
    ref: "leftPane",
});
/** @type {typeof __VLS_ctx.leftPane} */ ;
var __VLS_0 = {};
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ onMousedown: (__VLS_ctx.onMouseDown) },
    ...{ class: "pane-divider" },
    ref: "divider",
});
/** @type {typeof __VLS_ctx.divider} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pane-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "spec-panel-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "spec-panel-title" },
});
(__VLS_ctx.title ?? 'Storyboard Spec');
/** @type {[typeof SpecNav, ]} */ ;
// @ts-ignore
const __VLS_2 = __VLS_asFunctionalComponent(SpecNav, new SpecNav({
    ...{ 'onSelect': {} },
    areas: (__VLS_ctx.specAreas),
    activeId: (__VLS_ctx.activeSection),
}));
const __VLS_3 = __VLS_2({
    ...{ 'onSelect': {} },
    areas: (__VLS_ctx.specAreas),
    activeId: (__VLS_ctx.activeSection),
}, ...__VLS_functionalComponentArgsRest(__VLS_2));
let __VLS_5;
let __VLS_6;
let __VLS_7;
const __VLS_8 = {
    onSelect: (__VLS_ctx.setActiveSection)
};
var __VLS_4;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "spec-panel-body" },
    id: "spec-body",
});
var __VLS_9 = {};
/** @type {__VLS_StyleScopedClasses['split-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['pane-left']} */ ;
/** @type {__VLS_StyleScopedClasses['pane-divider']} */ ;
/** @type {__VLS_StyleScopedClasses['pane-right']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-panel-body']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0, __VLS_10 = __VLS_9;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            SpecNav: SpecNav,
            activeSection: activeSection,
            setActiveSection: setActiveSection,
            leftPane: leftPane,
            divider: divider,
            onMouseDown: onMouseDown,
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
