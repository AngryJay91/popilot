import { ref, computed } from 'vue';
import { VOTES_PER_PERSON } from '@/composables/useRetro';
const AUTHOR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const props = defineProps();
const emit = defineEmits();
function authorColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++)
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AUTHOR_COLORS[Math.abs(hash) % AUTHOR_COLORS.length];
}
const participantList = computed(() => props.participants.map(name => ({
    name,
    initial: name.charAt(0),
    color: authorColor(name),
    isMe: name === props.currentUser,
})));
const PHASE_META = {
    write: { label: 'Writing', next: 'Start Voting' },
    vote: { label: 'Voting', next: 'Start Discussion' },
    discuss: { label: 'Discussing', next: 'Complete' },
    done: { label: 'Done', next: '' },
};
const PHASE_ORDER = ['write', 'vote', 'discuss', 'done'];
function prevPhase() {
    if (!props.session)
        return;
    const idx = PHASE_ORDER.indexOf(props.session.phase);
    if (idx > 0)
        emit('phase-change', PHASE_ORDER[idx - 1]);
}
function nextPhase() {
    if (!props.session)
        return;
    // write -> vote: require at least 1 card
    if (props.session.phase === 'write' && (props.itemCount ?? 0) === 0) {
        alert('Add at least one card before starting the vote.');
        return;
    }
    const idx = PHASE_ORDER.indexOf(props.session.phase);
    if (idx < PHASE_ORDER.length - 1)
        emit('phase-change', PHASE_ORDER[idx + 1]);
}
function phase() {
    return props.session?.phase ?? 'write';
}
const menuOpen = ref(false);
function handleReset() {
    menuOpen.value = false;
    if (confirm('Reset all retro data for this sprint?')) {
        emit('reset');
    }
}
function handleExport() {
    menuOpen.value = false;
    emit('export');
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['rh-phase']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-phase']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-phase']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-phase']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-votes']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-prev']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-next']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-next']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-menu-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-menu-danger']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "retro-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rh-left" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "rh-sprint" },
});
(__VLS_ctx.sprintId.toUpperCase());
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "rh-phase" },
    'data-phase': (__VLS_ctx.phase()),
});
(__VLS_ctx.PHASE_META[__VLS_ctx.phase()].label);
if (__VLS_ctx.phase() === 'vote') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "rh-votes" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.votesRemaining);
    (__VLS_ctx.VOTES_PER_PERSON);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rh-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rh-participants" },
});
for (const [p] of __VLS_getVForSourceType((__VLS_ctx.participantList))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (p.name),
        ...{ class: "rh-avatar" },
        ...{ class: ({ 'rh-avatar--me': p.isMe }) },
        ...{ style: ({ background: p.color }) },
        title: (p.name + (p.isMe ? ' (me)' : '')),
    });
    (p.initial);
}
if (__VLS_ctx.participantList.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "rh-no-participants" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "rh-participant-count" },
    });
    (__VLS_ctx.participantList.length);
}
if (__VLS_ctx.currentUser) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rh-me-badge" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
        ...{ class: "rh-me-dot" },
        ...{ style: ({ background: __VLS_ctx.authorColor(__VLS_ctx.currentUser) }) },
    });
    (__VLS_ctx.currentUser);
}
if (__VLS_ctx.phase() !== 'write') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.prevPhase) },
        ...{ class: "rh-prev" },
    });
}
if (__VLS_ctx.phase() !== 'done') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.nextPhase) },
        ...{ class: "rh-next" },
        disabled: (__VLS_ctx.phase() === 'write' && (__VLS_ctx.itemCount ?? 0) === 0),
    });
    (__VLS_ctx.PHASE_META[__VLS_ctx.phase()].next);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rh-menu-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.menuOpen = !__VLS_ctx.menuOpen;
        } },
    ...{ class: "rh-menu-btn" },
});
if (__VLS_ctx.menuOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rh-menu-dropdown" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.handleExport) },
        ...{ class: "rh-menu-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.handleReset) },
        ...{ class: "rh-menu-item rh-menu-danger" },
    });
}
/** @type {__VLS_StyleScopedClasses['retro-header']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-left']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-sprint']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-phase']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-votes']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-right']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-participants']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-avatar--me']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-no-participants']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-participant-count']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-me-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-me-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-prev']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-next']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-menu-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-menu-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-menu-dropdown']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-menu-danger']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VOTES_PER_PERSON: VOTES_PER_PERSON,
            authorColor: authorColor,
            participantList: participantList,
            PHASE_META: PHASE_META,
            prevPhase: prevPhase,
            nextPhase: nextPhase,
            phase: phase,
            menuOpen: menuOpen,
            handleReset: handleReset,
            handleExport: handleExport,
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
