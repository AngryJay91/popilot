import { onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUser } from '@/composables/useUser';
import { useRetro } from '@/composables/useRetro';
import { getActiveSprint } from '@/composables/useNavStore';
import { apiPost } from '@/api/client';
import RetroHeader from './RetroHeader.vue';
import RetroBoard from './RetroBoard.vue';
import RetroActions from './RetroActions.vue';
const route = useRoute();
const router = useRouter();
const sprintId = route.params.sprint || getActiveSprint().id;
async function completeAndKickoff() {
    await apiPost(`/api/v2/retro/${sprintId}/complete`, {});
    router.push('/kickoff/new');
}
const { currentUser, dynamicMembers, loadMembers } = useUser();
const retro = useRetro(sprintId);
const userName = computed(() => currentUser.value ?? localStorage.getItem('retro-user-name') ?? '');
onMounted(async () => {
    loadMembers();
    await retro.loadOrCreateSession();
    retro.startPolling(userName.value);
});
function handleExport() {
    const md = retro.exportMarkdown();
    if (!md)
        return;
    navigator.clipboard.writeText(md).then(() => {
        alert('Copied to clipboard');
    });
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "retro-page" },
});
/** @type {[typeof RetroHeader, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(RetroHeader, new RetroHeader({
    ...{ 'onPhaseChange': {} },
    ...{ 'onReset': {} },
    ...{ 'onExport': {} },
    session: (__VLS_ctx.retro.session.value),
    sprintId: (__VLS_ctx.sprintId),
    currentUser: (__VLS_ctx.userName),
    votesRemaining: (__VLS_ctx.retro.votesRemaining.value),
    teamMembers: (__VLS_ctx.dynamicMembers),
    participants: (__VLS_ctx.retro.participants.value),
    itemCount: (__VLS_ctx.retro.items.value.length),
}));
const __VLS_1 = __VLS_0({
    ...{ 'onPhaseChange': {} },
    ...{ 'onReset': {} },
    ...{ 'onExport': {} },
    session: (__VLS_ctx.retro.session.value),
    sprintId: (__VLS_ctx.sprintId),
    currentUser: (__VLS_ctx.userName),
    votesRemaining: (__VLS_ctx.retro.votesRemaining.value),
    teamMembers: (__VLS_ctx.dynamicMembers),
    participants: (__VLS_ctx.retro.participants.value),
    itemCount: (__VLS_ctx.retro.items.value.length),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onPhaseChange: (__VLS_ctx.retro.setPhase)
};
const __VLS_7 = {
    onReset: (__VLS_ctx.retro.resetSession)
};
const __VLS_8 = {
    onExport: (__VLS_ctx.handleExport)
};
var __VLS_2;
if (__VLS_ctx.retro.loading.value) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "retro-loading" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "loading-spinner" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
}
else if (__VLS_ctx.retro.error.value) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "retro-error" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-icon" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-msg" },
    });
    (__VLS_ctx.retro.error.value);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.retro.loading.value))
                    return;
                if (!(__VLS_ctx.retro.error.value))
                    return;
                __VLS_ctx.retro.loadOrCreateSession();
            } },
        ...{ class: "error-retry" },
    });
}
else {
    if (__VLS_ctx.retro.session.value && __VLS_ctx.retro.session.value.phase !== 'done') {
        /** @type {[typeof RetroBoard, ]} */ ;
        // @ts-ignore
        const __VLS_9 = __VLS_asFunctionalComponent(RetroBoard, new RetroBoard({
            ...{ 'onAddItem': {} },
            ...{ 'onDeleteItem': {} },
            ...{ 'onToggleVote': {} },
            keepItems: (__VLS_ctx.retro.keepItems.value),
            problemItems: (__VLS_ctx.retro.problemItems.value),
            tryItems: (__VLS_ctx.retro.tryItems.value),
            phase: (__VLS_ctx.retro.session.value.phase),
            currentUser: (__VLS_ctx.userName),
            votesRemaining: (__VLS_ctx.retro.votesRemaining.value),
        }));
        const __VLS_10 = __VLS_9({
            ...{ 'onAddItem': {} },
            ...{ 'onDeleteItem': {} },
            ...{ 'onToggleVote': {} },
            keepItems: (__VLS_ctx.retro.keepItems.value),
            problemItems: (__VLS_ctx.retro.problemItems.value),
            tryItems: (__VLS_ctx.retro.tryItems.value),
            phase: (__VLS_ctx.retro.session.value.phase),
            currentUser: (__VLS_ctx.userName),
            votesRemaining: (__VLS_ctx.retro.votesRemaining.value),
        }, ...__VLS_functionalComponentArgsRest(__VLS_9));
        let __VLS_12;
        let __VLS_13;
        let __VLS_14;
        const __VLS_15 = {
            onAddItem: (__VLS_ctx.retro.addItem)
        };
        const __VLS_16 = {
            onDeleteItem: ((id) => __VLS_ctx.retro.deleteItem(id, __VLS_ctx.userName))
        };
        const __VLS_17 = {
            onToggleVote: ((id, hasVoted) => __VLS_ctx.retro.toggleVote(id, __VLS_ctx.userName, hasVoted))
        };
        var __VLS_11;
    }
    if (__VLS_ctx.retro.session.value?.phase === 'done') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "retro-done" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "done-banner" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "done-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.completeAndKickoff) },
            ...{ class: "btn btn--primary" },
        });
        /** @type {[typeof RetroBoard, ]} */ ;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent(RetroBoard, new RetroBoard({
            ...{ 'onAddItem': {} },
            ...{ 'onDeleteItem': {} },
            ...{ 'onToggleVote': {} },
            keepItems: (__VLS_ctx.retro.keepItems.value),
            problemItems: (__VLS_ctx.retro.problemItems.value),
            tryItems: (__VLS_ctx.retro.tryItems.value),
            phase: "discuss",
            currentUser: (__VLS_ctx.userName),
            votesRemaining: (0),
        }));
        const __VLS_19 = __VLS_18({
            ...{ 'onAddItem': {} },
            ...{ 'onDeleteItem': {} },
            ...{ 'onToggleVote': {} },
            keepItems: (__VLS_ctx.retro.keepItems.value),
            problemItems: (__VLS_ctx.retro.problemItems.value),
            tryItems: (__VLS_ctx.retro.tryItems.value),
            phase: "discuss",
            currentUser: (__VLS_ctx.userName),
            votesRemaining: (0),
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
        let __VLS_21;
        let __VLS_22;
        let __VLS_23;
        const __VLS_24 = {
            onAddItem: (() => { })
        };
        const __VLS_25 = {
            onDeleteItem: (() => { })
        };
        const __VLS_26 = {
            onToggleVote: (() => { })
        };
        var __VLS_20;
    }
    if (__VLS_ctx.retro.session.value?.phase === 'discuss' ||
        __VLS_ctx.retro.session.value?.phase === 'done') {
        /** @type {[typeof RetroActions, ]} */ ;
        // @ts-ignore
        const __VLS_27 = __VLS_asFunctionalComponent(RetroActions, new RetroActions({
            ...{ 'onAddAction': {} },
            ...{ 'onToggleStatus': {} },
            actions: (__VLS_ctx.retro.actions.value),
            teamMembers: (__VLS_ctx.dynamicMembers),
            readonly: (__VLS_ctx.retro.session.value?.phase === 'done'),
        }));
        const __VLS_28 = __VLS_27({
            ...{ 'onAddAction': {} },
            ...{ 'onToggleStatus': {} },
            actions: (__VLS_ctx.retro.actions.value),
            teamMembers: (__VLS_ctx.dynamicMembers),
            readonly: (__VLS_ctx.retro.session.value?.phase === 'done'),
        }, ...__VLS_functionalComponentArgsRest(__VLS_27));
        let __VLS_30;
        let __VLS_31;
        let __VLS_32;
        const __VLS_33 = {
            onAddAction: (__VLS_ctx.retro.addAction)
        };
        const __VLS_34 = {
            onToggleStatus: (__VLS_ctx.retro.toggleActionStatus)
        };
        var __VLS_29;
    }
}
/** @type {__VLS_StyleScopedClasses['retro-page']} */ ;
/** @type {__VLS_StyleScopedClasses['retro-loading']} */ ;
/** @type {__VLS_StyleScopedClasses['loading-spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['retro-error']} */ ;
/** @type {__VLS_StyleScopedClasses['error-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['error-msg']} */ ;
/** @type {__VLS_StyleScopedClasses['error-retry']} */ ;
/** @type {__VLS_StyleScopedClasses['retro-done']} */ ;
/** @type {__VLS_StyleScopedClasses['done-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['done-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            RetroHeader: RetroHeader,
            RetroBoard: RetroBoard,
            RetroActions: RetroActions,
            sprintId: sprintId,
            completeAndKickoff: completeAndKickoff,
            dynamicMembers: dynamicMembers,
            retro: retro,
            userName: userName,
            handleExport: handleExport,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
