import { ref, computed, onMounted } from 'vue';
import { apiGet, apiPost, apiPatch, isStaticMode } from '@/api/client';
const rewards = ref([]);
const summary = ref([]);
const members = ref([]);
const loading = ref(true);
const filterMember = ref('');
const activeTab = ref('pending');
// Create form
const showForm = ref(false);
const formMember = ref('');
const formType = ref('reward');
const formAmount = ref(0);
const formReason = ref('');
// Wallet editing
const editingWallet = ref(null);
const walletInput = ref('');
// Payment
const selectedIds = ref(new Set());
const txHashInput = ref('');
const pendingRewards = computed(() => rewards.value.filter(r => r.status === 'pending'));
const filteredRewards = computed(() => {
    let list = activeTab.value === 'pending' ? pendingRewards.value : rewards.value;
    if (filterMember.value)
        list = list.filter(r => r.member_name === filterMember.value);
    return list;
});
async function loadData() {
    if (isStaticMode()) {
        loading.value = false;
        return;
    }
    loading.value = true;
    const [rewardsRes, summaryRes, membersRes] = await Promise.all([
        apiGet('/api/v2/rewards'),
        apiGet('/api/v2/rewards/summary'),
        apiGet('/api/v2/admin/members'),
    ]);
    if (rewardsRes.data?.rewards)
        rewards.value = rewardsRes.data.rewards;
    if (summaryRes.data?.summary)
        summary.value = summaryRes.data.summary;
    if (membersRes.data?.members)
        members.value = membersRes.data.members.filter((m) => m.is_active);
    loading.value = false;
}
async function addReward() {
    if (!formMember.value || !formAmount.value || !formReason.value)
        return;
    await apiPost('/api/v2/rewards', { memberName: formMember.value, type: formType.value, amount: formAmount.value, reason: formReason.value });
    showForm.value = false;
    formMember.value = '';
    formAmount.value = 0;
    formReason.value = '';
    await loadData();
}
async function paySelected() {
    for (const id of selectedIds.value) {
        await apiPatch(`/api/v2/rewards/${id}/pay`, { txHash: txHashInput.value || null });
    }
    selectedIds.value.clear();
    txHashInput.value = '';
    await loadData();
}
async function batchPay(memberName) {
    await apiPatch('/api/v2/rewards/batch-pay', { memberName, txHash: txHashInput.value || null });
    txHashInput.value = '';
    await loadData();
}
function startEditWallet(m) {
    editingWallet.value = m.id;
    walletInput.value = m.wallet_address || '';
}
async function saveWallet(memberId) {
    await apiPatch(`/api/v2/admin/members/${memberId}`, { wallet_address: walletInput.value });
    editingWallet.value = null;
    await loadData();
}
function toggleSelect(id) {
    if (selectedIds.value.has(id))
        selectedIds.value.delete(id);
    else
        selectedIds.value.add(id);
}
function formatDate(d) {
    if (!d)
        return '';
    const date = new Date(d.endsWith('Z') ? d : d + 'Z');
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function getMemberWallet(name) {
    return members.value.find(m => m.display_name === name)?.wallet_address || '';
}
function copyAddr(addr) {
    if (!addr)
        return;
    navigator.clipboard.writeText(addr);
}
onMounted(loadData);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['rewards-header']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-section']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-balance']} */ ;
/** @type {__VLS_StyleScopedClasses['wallet-addr']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['type--reward']} */ ;
/** @type {__VLS_StyleScopedClasses['reward-type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['type--penalty']} */ ;
/** @type {__VLS_StyleScopedClasses['reward-type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['reward-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['reward-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-hash']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-row']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rewards-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rewards-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showForm = !__VLS_ctx.showForm;
        } },
    ...{ class: "btn-add" },
});
(__VLS_ctx.showForm ? 'Cancel' : '+ Add Entry');
if (__VLS_ctx.showForm) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.formMember),
        ...{ class: "input" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    for (const [m] of __VLS_getVForSourceType((__VLS_ctx.members))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (m.id),
            value: (m.display_name),
        });
        (m.display_name);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.formType),
        ...{ class: "input" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "reward",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "penalty",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ class: "input" },
        type: "number",
        placeholder: "Amount",
    });
    (__VLS_ctx.formAmount);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onKeydown: (__VLS_ctx.addReward) },
        ...{ class: "input full" },
        placeholder: "Reason",
    });
    (__VLS_ctx.formReason);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.addReward) },
        ...{ class: "btn-submit" },
        disabled: (!__VLS_ctx.formMember || !__VLS_ctx.formAmount || !__VLS_ctx.formReason),
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "summary-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "summary-grid" },
});
for (const [s] of __VLS_getVForSourceType((__VLS_ctx.summary))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (s.member_name),
        ...{ class: "summary-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-top" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-name" },
    });
    (s.member_name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-balance" },
        ...{ class: ({ negative: s.balance < 0 }) },
    });
    (s.balance.toLocaleString());
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-wallet" },
    });
    if (__VLS_ctx.editingWallet === __VLS_ctx.members.find(m => m.display_name === s.member_name)?.id) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onKeydown: (...[$event]) => {
                    if (!(__VLS_ctx.editingWallet === __VLS_ctx.members.find(m => m.display_name === s.member_name)?.id))
                        return;
                    __VLS_ctx.saveWallet(__VLS_ctx.members.find(m => m.display_name === s.member_name).id);
                } },
            ...{ class: "wallet-input" },
            placeholder: "Wallet address",
        });
        (__VLS_ctx.walletInput);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.editingWallet === __VLS_ctx.members.find(m => m.display_name === s.member_name)?.id))
                        return;
                    __VLS_ctx.saveWallet(__VLS_ctx.members.find(m => m.display_name === s.member_name).id);
                } },
            ...{ class: "btn-sm" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.editingWallet === __VLS_ctx.members.find(m => m.display_name === s.member_name)?.id))
                        return;
                    __VLS_ctx.copyAddr(__VLS_ctx.getMemberWallet(s.member_name));
                } },
            ...{ class: "wallet-addr" },
            title: (__VLS_ctx.getMemberWallet(s.member_name)),
        });
        (__VLS_ctx.getMemberWallet(s.member_name)?.slice(0, 12) || 'Not set');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.editingWallet === __VLS_ctx.members.find(m => m.display_name === s.member_name)?.id))
                        return;
                    __VLS_ctx.startEditWallet(__VLS_ctx.members.find(m => m.display_name === s.member_name));
                } },
            ...{ class: "btn-edit" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "summary-detail" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "reward-text" },
    });
    (s.total_rewards.toLocaleString());
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "penalty-text" },
    });
    (s.total_penalties.toLocaleString());
    if (s.pending_balance) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "pending-text" },
        });
        (s.pending_balance.toLocaleString());
    }
    if (s.pending_balance > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(s.pending_balance > 0))
                        return;
                    __VLS_ctx.batchPay(s.member_name);
                } },
            ...{ class: "btn-batch-pay" },
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tab-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.activeTab = 'pending';
        } },
    ...{ class: (['tab-btn', { active: __VLS_ctx.activeTab === 'pending' }]) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.activeTab = 'all';
        } },
    ...{ class: (['tab-btn', { active: __VLS_ctx.activeTab === 'all' }]) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.filterMember),
    ...{ class: "input filter-select" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "",
});
for (const [s] of __VLS_getVForSourceType((__VLS_ctx.summary))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (s.member_name),
        value: (s.member_name),
    });
    (s.member_name);
}
if (__VLS_ctx.selectedIds.size > 0 && __VLS_ctx.activeTab === 'pending') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "pay-bar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.selectedIds.size);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ class: "input" },
        placeholder: "TX hash (optional)",
    });
    (__VLS_ctx.txHashInput);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.paySelected) },
        ...{ class: "btn-pay" },
    });
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading" },
    });
}
else if (!__VLS_ctx.filteredRewards.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rewards-list" },
    });
    for (const [r] of __VLS_getVForSourceType((__VLS_ctx.filteredRewards))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (r.id),
            ...{ class: "reward-item" },
            ...{ class: ('type--' + r.type) },
        });
        if (__VLS_ctx.activeTab === 'pending') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onChange: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(!__VLS_ctx.filteredRewards.length))
                            return;
                        if (!(__VLS_ctx.activeTab === 'pending'))
                            return;
                        __VLS_ctx.toggleSelect(r.id);
                    } },
                type: "checkbox",
                checked: (__VLS_ctx.selectedIds.has(r.id)),
                ...{ class: "reward-check" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "reward-main" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "reward-type-badge" },
        });
        (r.type === 'reward' ? 'Reward' : 'Penalty');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "reward-member" },
        });
        (r.member_name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "reward-amount" },
            ...{ class: (r.type) },
        });
        (r.type === 'reward' ? '+' : '-');
        (r.amount.toLocaleString());
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "reward-status" },
            ...{ class: ('st--' + r.status) },
        });
        (r.status === 'paid' ? 'Paid' : 'Pending');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "reward-reason" },
        });
        (r.reason);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "reward-meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (r.issued_by);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.formatDate(r.created_at));
        if (r.tx_hash) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
                ...{ class: "tx-hash" },
                href: (`https://tronscan.org/#/transaction/${r.tx_hash}`),
                target: "_blank",
            });
            (r.tx_hash.slice(0, 12));
        }
    }
}
/** @type {__VLS_StyleScopedClasses['rewards-page']} */ ;
/** @type {__VLS_StyleScopedClasses['rewards-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-add']} */ ;
/** @type {__VLS_StyleScopedClasses['form-card']} */ ;
/** @type {__VLS_StyleScopedClasses['form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['full']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-submit']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-section']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-card']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-top']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-name']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-balance']} */ ;
/** @type {__VLS_StyleScopedClasses['negative']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-wallet']} */ ;
/** @type {__VLS_StyleScopedClasses['wallet-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['wallet-addr']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['summary-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['reward-text']} */ ;
/** @type {__VLS_StyleScopedClasses['penalty-text']} */ ;
/** @type {__VLS_StyleScopedClasses['pending-text']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-batch-pay']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-row']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['pay-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-pay']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['rewards-list']} */ ;
/** @type {__VLS_StyleScopedClasses['reward-item']} */ ;
/** @type {__VLS_StyleScopedClasses['reward-check']} */ ;
/** @type {__VLS_StyleScopedClasses['reward-main']} */ ;
/** @type {__VLS_StyleScopedClasses['reward-type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['reward-member']} */ ;
/** @type {__VLS_StyleScopedClasses['reward-amount']} */ ;
/** @type {__VLS_StyleScopedClasses['reward-status']} */ ;
/** @type {__VLS_StyleScopedClasses['reward-reason']} */ ;
/** @type {__VLS_StyleScopedClasses['reward-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['tx-hash']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            summary: summary,
            members: members,
            loading: loading,
            filterMember: filterMember,
            activeTab: activeTab,
            showForm: showForm,
            formMember: formMember,
            formType: formType,
            formAmount: formAmount,
            formReason: formReason,
            editingWallet: editingWallet,
            walletInput: walletInput,
            selectedIds: selectedIds,
            txHashInput: txHashInput,
            filteredRewards: filteredRewards,
            addReward: addReward,
            paySelected: paySelected,
            batchPay: batchPay,
            startEditWallet: startEditWallet,
            saveWallet: saveWallet,
            toggleSelect: toggleSelect,
            formatDate: formatDate,
            getMemberWallet: getMemberWallet,
            copyAddr: copyAddr,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
