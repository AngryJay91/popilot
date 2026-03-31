import { ref, onMounted } from 'vue';
import { apiGet, isStaticMode } from '@/api/client';
const loading = ref(true);
const error = ref(null);
const docs = ref([]);
const recentEdits = ref([]);
const expandedIds = ref(new Set());
function toggleExpand(id) {
    if (expandedIds.value.has(id)) {
        expandedIds.value.delete(id);
    }
    else {
        expandedIds.value.add(id);
    }
}
onMounted(async () => {
    if (isStaticMode()) {
        loading.value = false;
        return;
    }
    const { data, error: err } = await apiGet('/api/v2/docs');
    if (err) {
        error.value = err;
    }
    else if (data) {
        docs.value = data.documents;
        recentEdits.value = data.recent_edits;
    }
    loading.value = false;
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['error-state']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-row']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-row']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-item']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "docs-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "page-desc" },
});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading-state" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "loading-spinner" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-state" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-icon" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.error);
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "docs-layout" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "docs-tree" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    if (!__VLS_ctx.docs.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-msg" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
        ...{ class: "tree-list" },
    });
    for (const [doc] of __VLS_getVForSourceType((__VLS_ctx.docs))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (doc.id),
            ...{ class: "tree-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    __VLS_ctx.toggleExpand(doc.id);
                } },
            ...{ class: "tree-row" },
        });
        if (doc.children?.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "tree-icon" },
            });
            (__VLS_ctx.expandedIds.has(doc.id) ? '&#9660;' : '&#9654;');
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "tree-icon tree-leaf" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "tree-title" },
        });
        (doc.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "tree-meta" },
        });
        (doc.updated_by);
        if (doc.children?.length && __VLS_ctx.expandedIds.has(doc.id)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
                ...{ class: "tree-children" },
            });
            for (const [child] of __VLS_getVForSourceType((doc.children))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                    key: (child.id),
                    ...{ class: "tree-item tree-child" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "tree-row" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "tree-icon tree-leaf" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "tree-title" },
                });
                (child.title);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "tree-meta" },
                });
                (child.updated_by);
            }
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "docs-recent" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    if (!__VLS_ctx.recentEdits.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-msg" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
        ...{ class: "edit-list" },
    });
    for (const [edit] of __VLS_getVForSourceType((__VLS_ctx.recentEdits))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
            key: (edit.id),
            ...{ class: "edit-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "edit-title" },
        });
        (edit.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "edit-meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (edit.user);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (edit.updated_at);
    }
}
/** @type {__VLS_StyleScopedClasses['docs-page']} */ ;
/** @type {__VLS_StyleScopedClasses['page-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-state']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['error-state']} */ ;
/** @type {__VLS_StyleScopedClasses['error-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-tree']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-msg']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-list']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-row']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-leaf']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-title']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-children']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-child']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-row']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-leaf']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-title']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-recent']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-msg']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-list']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-item']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-title']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-meta']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            loading: loading,
            error: error,
            docs: docs,
            recentEdits: recentEdits,
            expandedIds: expandedIds,
            toggleExpand: toggleExpand,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
