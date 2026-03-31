import { ref, computed, onMounted } from 'vue';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/composables/useTurso';
const props = defineProps();
const items = ref([]);
const newContent = ref('');
async function load() {
    const { data } = await apiGet(`/api/v2/memos/${props.memoId}/checklist`);
    items.value = data?.items || [];
}
const progress = computed(() => {
    const total = items.value.length;
    const done = items.value.filter(i => i.is_done).length;
    return { done, total, percent: total ? Math.round(done / total * 100) : 0 };
});
async function addItem() {
    if (!newContent.value.trim())
        return;
    await apiPost(`/api/v2/memos/${props.memoId}/checklist`, { content: newContent.value.trim() });
    newContent.value = '';
    await load();
}
async function toggleDone(item) {
    await apiPatch(`/api/v2/memos/checklist/${item.id}`, { is_done: item.is_done ? 0 : 1 });
    item.is_done = item.is_done ? 0 : 1;
}
async function setAssignee(item, assignee) {
    await apiPatch(`/api/v2/memos/checklist/${item.id}`, { assignee });
    item.assignee = assignee;
}
async function removeItem(id) {
    await apiDelete(`/api/v2/memos/checklist/${id}`);
    await load();
}
onMounted(load);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['cl-item']} */ ;
/** @type {__VLS_StyleScopedClasses['cl-content']} */ ;
/** @type {__VLS_StyleScopedClasses['cl-remove']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "memo-checklist" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "cl-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "cl-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "cl-progress" },
});
(__VLS_ctx.progress.done);
(__VLS_ctx.progress.total);
(__VLS_ctx.progress.percent);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "cl-progress-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "cl-progress-fill" },
    ...{ style: ({ width: __VLS_ctx.progress.percent + '%' }) },
});
for (const [item] of __VLS_getVForSourceType((__VLS_ctx.items))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (item.id),
        ...{ class: "cl-item" },
        ...{ class: ({ done: item.is_done }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.toggleDone(item);
            } },
        type: "checkbox",
        checked: (!!item.is_done),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "cl-content" },
    });
    (item.content);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        ...{ onChange: (...[$event]) => {
                __VLS_ctx.setAssignee(item, $event.target.value);
            } },
        ...{ class: "cl-assignee" },
        value: (item.assignee || ''),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    for (const [m] of __VLS_getVForSourceType(((__VLS_ctx.members || [])))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (m),
            value: (m),
        });
        (m);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.removeItem(item.id);
            } },
        ...{ class: "cl-remove" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "cl-add" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onKeyup: (__VLS_ctx.addItem) },
    ...{ class: "cl-input" },
    placeholder: "Add item...",
});
(__VLS_ctx.newContent);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.addItem) },
    ...{ class: "btn btn--xs btn--primary" },
});
/** @type {__VLS_StyleScopedClasses['memo-checklist']} */ ;
/** @type {__VLS_StyleScopedClasses['cl-header']} */ ;
/** @type {__VLS_StyleScopedClasses['cl-title']} */ ;
/** @type {__VLS_StyleScopedClasses['cl-progress']} */ ;
/** @type {__VLS_StyleScopedClasses['cl-progress-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['cl-progress-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['cl-item']} */ ;
/** @type {__VLS_StyleScopedClasses['done']} */ ;
/** @type {__VLS_StyleScopedClasses['cl-content']} */ ;
/** @type {__VLS_StyleScopedClasses['cl-assignee']} */ ;
/** @type {__VLS_StyleScopedClasses['cl-remove']} */ ;
/** @type {__VLS_StyleScopedClasses['cl-add']} */ ;
/** @type {__VLS_StyleScopedClasses['cl-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            items: items,
            newContent: newContent,
            progress: progress,
            addItem: addItem,
            toggleDone: toggleDone,
            setAssignee: setAssignee,
            removeItem: removeItem,
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
