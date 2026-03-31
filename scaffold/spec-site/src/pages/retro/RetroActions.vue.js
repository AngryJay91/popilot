import { ref } from 'vue';
const __VLS_props = defineProps();
const emit = defineEmits();
const newContent = ref('');
const newAssignee = ref('');
function handleAdd() {
    const text = newContent.value.trim();
    if (!text)
        return;
    emit('add-action', text, newAssignee.value || null);
    newContent.value = '';
    newAssignee.value = '';
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['actions-input']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-add-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-row']} */ ;
/** @type {__VLS_StyleScopedClasses['action-row']} */ ;
/** @type {__VLS_StyleScopedClasses['action-check']} */ ;
/** @type {__VLS_StyleScopedClasses['action-content']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "retro-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "actions-title" },
});
if (!__VLS_ctx.readonly) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "actions-add" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onKeydown: (__VLS_ctx.handleAdd) },
        ...{ class: "actions-input" },
        placeholder: "Add action item...",
    });
    (__VLS_ctx.newContent);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.newAssignee),
        ...{ class: "actions-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    for (const [m] of __VLS_getVForSourceType((__VLS_ctx.teamMembers))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (m),
            value: (m),
        });
        (m);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.handleAdd) },
        ...{ class: "actions-add-btn" },
        disabled: (!__VLS_ctx.newContent.trim()),
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "actions-list" },
});
for (const [action] of __VLS_getVForSourceType((__VLS_ctx.actions))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (action.id),
        ...{ class: "action-row" },
        ...{ class: ({ done: action.status === 'done' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('toggle-status', action.id, action.status);
            } },
        ...{ class: "action-check" },
        disabled: (__VLS_ctx.readonly),
    });
    (action.status === 'done' ? '&#9989;' : '&#11036;');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "action-content" },
    });
    (action.content);
    if (action.assignee) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "action-assignee" },
        });
        (action.assignee);
    }
}
if (__VLS_ctx.actions.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "actions-empty" },
    });
}
/** @type {__VLS_StyleScopedClasses['retro-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-title']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-add']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-input']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-select']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-add-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-list']} */ ;
/** @type {__VLS_StyleScopedClasses['action-row']} */ ;
/** @type {__VLS_StyleScopedClasses['done']} */ ;
/** @type {__VLS_StyleScopedClasses['action-check']} */ ;
/** @type {__VLS_StyleScopedClasses['action-content']} */ ;
/** @type {__VLS_StyleScopedClasses['action-assignee']} */ ;
/** @type {__VLS_StyleScopedClasses['actions-empty']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            emit: emit,
            newContent: newContent,
            newAssignee: newAssignee,
            handleAdd: handleAdd,
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
