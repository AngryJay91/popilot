import { ref, computed } from 'vue';
import { COMPONENT_CATALOG, CATEGORIES } from './componentCatalog';
const emit = defineEmits();
const searchQuery = ref('');
const expandedCategory = ref(CATEGORIES[0]);
const filtered = computed(() => {
    if (!searchQuery.value)
        return COMPONENT_CATALOG;
    const q = searchQuery.value.toLowerCase();
    return COMPONENT_CATALOG.filter(c => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
});
function groupedByCategory() {
    const groups = {};
    for (const c of filtered.value) {
        if (!groups[c.category])
            groups[c.category] = [];
        groups[c.category].push(c);
    }
    return groups;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['palette-item']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "palette" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "palette-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ class: "palette-search" },
    placeholder: "Search...",
});
(__VLS_ctx.searchQuery);
for (const [comps, cat] of __VLS_getVForSourceType((__VLS_ctx.groupedByCategory()))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (cat),
        ...{ class: "palette-group" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.expandedCategory = __VLS_ctx.expandedCategory === cat ? null : cat;
            } },
        ...{ class: "palette-category" },
    });
    (__VLS_ctx.expandedCategory === cat ? '▾' : '▸');
    (cat);
    if (__VLS_ctx.expandedCategory === cat || __VLS_ctx.searchQuery) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "palette-items" },
        });
        for (const [c] of __VLS_getVForSourceType((comps))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onDragstart: (...[$event]) => {
                        if (!(__VLS_ctx.expandedCategory === cat || __VLS_ctx.searchQuery))
                            return;
                        $event.dataTransfer?.setData('component-id', c.id);
                    } },
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.expandedCategory === cat || __VLS_ctx.searchQuery))
                            return;
                        __VLS_ctx.emit('add', c);
                    } },
                key: (c.id),
                ...{ class: "palette-item" },
                draggable: "true",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "palette-icon" },
            });
            (c.icon);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "palette-name" },
            });
            (c.name);
        }
    }
}
/** @type {__VLS_StyleScopedClasses['palette']} */ ;
/** @type {__VLS_StyleScopedClasses['palette-header']} */ ;
/** @type {__VLS_StyleScopedClasses['palette-search']} */ ;
/** @type {__VLS_StyleScopedClasses['palette-group']} */ ;
/** @type {__VLS_StyleScopedClasses['palette-category']} */ ;
/** @type {__VLS_StyleScopedClasses['palette-items']} */ ;
/** @type {__VLS_StyleScopedClasses['palette-item']} */ ;
/** @type {__VLS_StyleScopedClasses['palette-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['palette-name']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            emit: emit,
            searchQuery: searchQuery,
            expandedCategory: expandedCategory,
            groupedByCategory: groupedByCategory,
        };
    },
    __typeEmits: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
});
; /* PartiallyEnd: #4569/main.vue */
