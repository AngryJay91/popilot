import { useRouter } from 'vue-router';
const props = defineProps();
const emit = defineEmits();
const router = useRouter();
const depth = props.depth ?? 0;
function onDragStart(e) {
    e.stopPropagation();
    e.dataTransfer?.setData('doc-id', props.node.id);
    emit('dragstart', e, props.node.id);
}
function navigate() {
    router.push(`/docs/${props.node.id}`);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['tree-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onDragstart: (...[$event]) => {
            __VLS_ctx.onDragStart($event);
        } },
    ...{ onDragover: () => { } },
    ...{ onDrop: (...[$event]) => {
            __VLS_ctx.emit('drop', $event, __VLS_ctx.node);
        } },
    ...{ onContextmenu: (...[$event]) => {
            __VLS_ctx.emit('contextmenu', $event, __VLS_ctx.node);
        } },
    ...{ onClick: (__VLS_ctx.navigate) },
    ...{ class: "tree-item" },
    ...{ class: ({ active: __VLS_ctx.activeDocId === __VLS_ctx.node.id }) },
    ...{ style: ({ paddingLeft: (12 + __VLS_ctx.depth * 16) + 'px' }) },
    draggable: "true",
});
if (__VLS_ctx.node.children.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.node.children.length))
                    return;
                __VLS_ctx.emit('toggle', __VLS_ctx.node.id);
            } },
        ...{ class: "tree-arrow" },
    });
    (__VLS_ctx.expanded.has(__VLS_ctx.node.id) ? '▼' : '▶');
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "tree-icon" },
});
((__VLS_ctx.node.icon && !__VLS_ctx.node.icon.startsWith('Icon') && !__VLS_ctx.node.icon.startsWith('<')) ? __VLS_ctx.node.icon : '📄');
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "tree-label" },
});
(__VLS_ctx.node.title);
if (__VLS_ctx.node.children.length && __VLS_ctx.expanded.has(__VLS_ctx.node.id)) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    for (const [child] of __VLS_getVForSourceType((__VLS_ctx.node.children))) {
        const __VLS_0 = {}.TreeNode;
        /** @type {[typeof __VLS_components.TreeNode, ]} */ ;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
            ...{ 'onToggle': {} },
            ...{ 'onDragstart': {} },
            ...{ 'onDrop': {} },
            ...{ 'onContextmenu': {} },
            key: (child.id),
            node: (child),
            activeDocId: (__VLS_ctx.activeDocId),
            expanded: (__VLS_ctx.expanded),
            depth: (__VLS_ctx.depth + 1),
        }));
        const __VLS_2 = __VLS_1({
            ...{ 'onToggle': {} },
            ...{ 'onDragstart': {} },
            ...{ 'onDrop': {} },
            ...{ 'onContextmenu': {} },
            key: (child.id),
            node: (child),
            activeDocId: (__VLS_ctx.activeDocId),
            expanded: (__VLS_ctx.expanded),
            depth: (__VLS_ctx.depth + 1),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        let __VLS_4;
        let __VLS_5;
        let __VLS_6;
        const __VLS_7 = {
            onToggle: (...[$event]) => {
                if (!(__VLS_ctx.node.children.length && __VLS_ctx.expanded.has(__VLS_ctx.node.id)))
                    return;
                __VLS_ctx.emit('toggle', $event);
            }
        };
        const __VLS_8 = {
            onDragstart: ((e, id) => __VLS_ctx.emit('dragstart', e, id))
        };
        const __VLS_9 = {
            onDrop: ((e, n) => __VLS_ctx.emit('drop', e, n))
        };
        const __VLS_10 = {
            onContextmenu: ((e, n) => __VLS_ctx.emit('contextmenu', e, n))
        };
        var __VLS_3;
    }
}
/** @type {__VLS_StyleScopedClasses['tree-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-label']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            emit: emit,
            depth: depth,
            onDragStart: onDragStart,
            navigate: navigate,
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
