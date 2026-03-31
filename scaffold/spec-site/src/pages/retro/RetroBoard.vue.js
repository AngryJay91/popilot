import RetroCard from './RetroCard.vue';
import { ref } from 'vue';
const props = defineProps();
const emit = defineEmits();
const newContent = ref({
    keep: '',
    problem: '',
    try: '',
});
function handleAdd(cat, e) {
    if (e?.isComposing)
        return;
    const text = newContent.value[cat].trim();
    if (!text)
        return;
    emit('add-item', cat, text, props.currentUser);
    newContent.value[cat] = '';
}
function getItems(cat) {
    if (cat === 'keep')
        return props.keepItems;
    if (cat === 'problem')
        return props.problemItems;
    return props.tryItems;
}
function getSortedItems(cat) {
    const list = getItems(cat);
    if (props.phase === 'discuss') {
        return [...list].sort((a, b) => b.voteCount - a.voteCount);
    }
    return list;
}
const COLUMNS = [
    { id: 'keep', label: 'Keep', emoji: '&#9989;', bg: '#E8F5E9' },
    { id: 'problem', label: 'Problem', emoji: '&#128308;', bg: '#FFF4F4' },
    { id: 'try', label: 'Try', emoji: '&#128161;', bg: '#EFF6FF' },
];
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['col-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['col-add-btn']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "retro-board" },
});
for (const [col] of __VLS_getVForSourceType((__VLS_ctx.COLUMNS))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (col.id),
        ...{ class: "retro-col" },
        ...{ style: ({ '--col-bg': col.bg }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "col-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
        ...{ class: "col-emoji" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (col.emoji) }, null, null);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "col-label" },
    });
    (col.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "col-count" },
    });
    (__VLS_ctx.getItems(col.id).length);
    if (__VLS_ctx.phase === 'write') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "col-input" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
            ...{ onKeydown: (...[$event]) => {
                    if (!(__VLS_ctx.phase === 'write'))
                        return;
                    __VLS_ctx.handleAdd(col.id, $event);
                } },
            value: (__VLS_ctx.newContent[col.id]),
            ...{ class: "col-textarea" },
            placeholder: "Add card... (Enter to submit)",
            rows: "2",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.phase === 'write'))
                        return;
                    __VLS_ctx.handleAdd(col.id);
                } },
            ...{ class: "col-add-btn" },
            disabled: (!__VLS_ctx.newContent[col.id].trim()),
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "col-cards" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.getSortedItems(col.id)))) {
        /** @type {[typeof RetroCard, ]} */ ;
        // @ts-ignore
        const __VLS_0 = __VLS_asFunctionalComponent(RetroCard, new RetroCard({
            ...{ 'onDelete': {} },
            ...{ 'onToggleVote': {} },
            key: (item.id),
            item: (item),
            phase: (__VLS_ctx.phase),
            currentUser: (__VLS_ctx.currentUser),
            canVote: (__VLS_ctx.votesRemaining > 0 || item.hasVoted),
        }));
        const __VLS_1 = __VLS_0({
            ...{ 'onDelete': {} },
            ...{ 'onToggleVote': {} },
            key: (item.id),
            item: (item),
            phase: (__VLS_ctx.phase),
            currentUser: (__VLS_ctx.currentUser),
            canVote: (__VLS_ctx.votesRemaining > 0 || item.hasVoted),
        }, ...__VLS_functionalComponentArgsRest(__VLS_0));
        let __VLS_3;
        let __VLS_4;
        let __VLS_5;
        const __VLS_6 = {
            onDelete: (...[$event]) => {
                __VLS_ctx.emit('delete-item', item.id);
            }
        };
        const __VLS_7 = {
            onToggleVote: (...[$event]) => {
                __VLS_ctx.emit('toggle-vote', item.id, item.hasVoted);
            }
        };
        var __VLS_2;
    }
}
/** @type {__VLS_StyleScopedClasses['retro-board']} */ ;
/** @type {__VLS_StyleScopedClasses['retro-col']} */ ;
/** @type {__VLS_StyleScopedClasses['col-header']} */ ;
/** @type {__VLS_StyleScopedClasses['col-emoji']} */ ;
/** @type {__VLS_StyleScopedClasses['col-label']} */ ;
/** @type {__VLS_StyleScopedClasses['col-count']} */ ;
/** @type {__VLS_StyleScopedClasses['col-input']} */ ;
/** @type {__VLS_StyleScopedClasses['col-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['col-add-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['col-cards']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            RetroCard: RetroCard,
            emit: emit,
            newContent: newContent,
            handleAdd: handleAdd,
            getItems: getItems,
            getSortedItems: getSortedItems,
            COLUMNS: COLUMNS,
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
