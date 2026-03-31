import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useMemo } from '@/composables/useMemo';
import { useUser } from '@/composables/useUser';
const route = useRoute();
const pageId = computed(() => route.params.pageId || 'global');
const { currentUser } = useUser();
const memoStore = ref(useMemo(pageId.value));
watch(pageId, (newId) => {
    memoStore.value = useMemo(newId);
});
const memoOpen = ref(false);
const newMemo = ref('');
const isComposing = ref(false);
function openMemo() {
    memoOpen.value = true;
    memoStore.value.loadMemos();
}
async function handleAdd() {
    if (isComposing.value)
        return;
    const text = newMemo.value.trim();
    if (!text)
        return;
    await memoStore.value.addMemo(text, currentUser.value ?? '');
    newMemo.value = '';
}
function handleClearAll() {
    if (confirm('Delete all memos?')) {
        memoStore.value.clearAll();
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['memo-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-tab']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.openMemo) },
    ...{ class: "memo-tab" },
    ...{ class: ({ hidden: __VLS_ctx.memoOpen }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "memo-tab-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "memo-tab-label" },
});
if (__VLS_ctx.memoStore.memoCount > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "memo-tab-count" },
    });
    (__VLS_ctx.memoStore.memoCount);
}
const __VLS_0 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    to: "body",
}));
const __VLS_2 = __VLS_1({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
const __VLS_4 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    name: "memo-slide",
}));
const __VLS_6 = __VLS_5({
    name: "memo-slide",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
if (__VLS_ctx.memoOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-sidebar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "memo-title" },
    });
    (__VLS_ctx.pageId);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.memoOpen))
                    return;
                __VLS_ctx.memoOpen = false;
            } },
        ...{ class: "memo-close" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-body" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-input-area" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        ...{ onCompositionstart: (...[$event]) => {
                if (!(__VLS_ctx.memoOpen))
                    return;
                __VLS_ctx.isComposing = true;
            } },
        ...{ onCompositionend: (...[$event]) => {
                if (!(__VLS_ctx.memoOpen))
                    return;
                __VLS_ctx.isComposing = false;
            } },
        ...{ onKeydown: (__VLS_ctx.handleAdd) },
        value: (__VLS_ctx.newMemo),
        ...{ class: "memo-textarea" },
        placeholder: "Write a memo... (Enter to save, Shift+Enter for newline)",
        rows: "3",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.handleAdd) },
        ...{ class: "memo-add-btn" },
        disabled: (!__VLS_ctx.newMemo.trim()),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-list" },
    });
    if (__VLS_ctx.memoStore.error) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "memo-error" },
        });
        (__VLS_ctx.memoStore.error);
    }
    for (const [m] of __VLS_getVForSourceType((__VLS_ctx.memoStore.memos))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (m.id),
            ...{ class: "memo-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "memo-item-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "memo-item-meta" },
        });
        if (m.author) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-item-author" },
            });
            (m.author);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "memo-item-time" },
        });
        (__VLS_ctx.memoStore.formatTime(m.ts));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.memoOpen))
                        return;
                    __VLS_ctx.memoStore.deleteMemo(m.id);
                } },
            ...{ class: "memo-item-del" },
            title: "Delete",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "memo-item-text" },
        });
        (m.text);
    }
    if (__VLS_ctx.memoStore.memos.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "memo-empty" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.br, __VLS_intrinsicElements.br)({});
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-footer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "memo-footer-info" },
    });
    if (__VLS_ctx.memoStore.memos.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.handleClearAll) },
            ...{ class: "memo-clear-btn" },
        });
    }
}
var __VLS_7;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['memo-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-tab-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-tab-label']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-tab-count']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-header']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-title']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-close']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-body']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-input-area']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-add-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-list']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-error']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-header']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-author']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-time']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-del']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-text']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-footer-info']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-clear-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            pageId: pageId,
            memoStore: memoStore,
            memoOpen: memoOpen,
            newMemo: newMemo,
            isComposing: isComposing,
            openMemo: openMemo,
            handleAdd: handleAdd,
            handleClearAll: handleClearAll,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
