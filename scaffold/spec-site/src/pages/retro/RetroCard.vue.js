const AUTHOR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
function authorColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++)
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AUTHOR_COLORS[Math.abs(hash) % AUTHOR_COLORS.length];
}
const props = defineProps();
const emit = defineEmits();
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['retro-card']} */ ;
/** @type {__VLS_StyleScopedClasses['retro-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-vote-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['card-vote-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['card-vote-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['card-del-btn']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "retro-card" },
    ...{ class: ({ voted: __VLS_ctx.item.hasVoted, mine: __VLS_ctx.item.author === __VLS_ctx.currentUser }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "card-content" },
});
(__VLS_ctx.item.content);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "card-footer" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "card-author-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "card-author-dot" },
    ...{ style: ({ background: __VLS_ctx.authorColor(__VLS_ctx.item.author) }) },
});
(__VLS_ctx.item.author.charAt(0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "card-author" },
});
(__VLS_ctx.item.author);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "card-actions" },
});
if (__VLS_ctx.phase === 'vote' || __VLS_ctx.phase === 'discuss') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.phase === 'vote' || __VLS_ctx.phase === 'discuss'))
                    return;
                __VLS_ctx.emit('toggle-vote');
            } },
        ...{ class: "card-vote-btn" },
        ...{ class: ({ active: __VLS_ctx.item.hasVoted, disabled: !__VLS_ctx.canVote && !__VLS_ctx.item.hasVoted }) },
        disabled: (!__VLS_ctx.canVote && !__VLS_ctx.item.hasVoted),
    });
    (__VLS_ctx.item.hasVoted ? '&#128077;' : '&#9757;');
    (__VLS_ctx.item.voteCount);
}
if (__VLS_ctx.phase === 'write' && __VLS_ctx.item.author === __VLS_ctx.currentUser) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.phase === 'write' && __VLS_ctx.item.author === __VLS_ctx.currentUser))
                    return;
                __VLS_ctx.emit('delete');
            } },
        ...{ class: "card-del-btn" },
    });
}
/** @type {__VLS_StyleScopedClasses['retro-card']} */ ;
/** @type {__VLS_StyleScopedClasses['voted']} */ ;
/** @type {__VLS_StyleScopedClasses['mine']} */ ;
/** @type {__VLS_StyleScopedClasses['card-content']} */ ;
/** @type {__VLS_StyleScopedClasses['card-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['card-author-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['card-author-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['card-author']} */ ;
/** @type {__VLS_StyleScopedClasses['card-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['card-vote-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled']} */ ;
/** @type {__VLS_StyleScopedClasses['card-del-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            authorColor: authorColor,
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
