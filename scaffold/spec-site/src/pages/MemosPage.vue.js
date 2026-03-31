import Icon from '@/components/Icon.vue';
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiGet, apiPost, apiPatch } from '@/composables/useTurso';
import MentionInput from '@/components/MentionInput.vue';
import { renderMarkdown } from '@/utils/markdown';
import MemoRelations from '@/components/MemoRelations.vue';
import MemoTimeline from '@/components/MemoTimeline.vue';
import MemoChecklist from '@/components/MemoChecklist.vue';
import MemoGraph from '@/components/MemoGraph.vue';
import { useAuth } from '@/composables/useAuth';
const { authUser } = useAuth();
const route = useRoute();
const router = useRouter();
const memos = ref([]);
const replies = ref({});
const loading = ref(true);
const selectedId = computed(() => route.params.id ? Number(route.params.id) : null);
// Search / Filter
const searchKeyword = ref('');
const filterStatus = ref('');
const filterAuthor = ref('');
const memberList = ref([]);
const showNewMemo = ref(false);
const newMemoContent = ref('');
const newMemoChannel = ref('general');
const memoTemplates = ref([]);
const showTemplateModal = ref(false);
async function loadMemoTemplates() {
    const { data } = await apiGet('/api/v2/memos/templates');
    memoTemplates.value = data?.templates || [];
}
function applyTemplate(tmpl) {
    const fields = JSON.parse(tmpl.fields || '[]');
    let content = `# ${tmpl.name}\n\n`;
    for (const f of fields) {
        content += `## ${f.label}\n\n`;
    }
    newMemoContent.value = content;
    showTemplateModal.value = false;
}
const newMemoType = ref('memo');
const newMemoAssignees = ref([]);
const pageSize = 20;
const currentOffset = ref(0);
const totalMemos = ref(0);
const hasMore = computed(() => currentOffset.value + pageSize < totalMemos.value);
const loadingMore = ref(false);
async function loadMemos(append = false) {
    if (append) {
        loadingMore.value = true;
    }
    else {
        loading.value = true;
        currentOffset.value = 0;
    }
    const params = new URLSearchParams({ limit: String(pageSize), offset: String(currentOffset.value) });
    if (searchKeyword.value)
        params.set('keyword', searchKeyword.value);
    if (filterStatus.value)
        params.set('status', filterStatus.value);
    if (filterAuthor.value)
        params.set('author', filterAuthor.value);
    const { data, error } = await apiGet(`/api/v2/memos/all?${params}`);
    if (!error && data?.memos) {
        if (append) {
            memos.value = [...memos.value, ...data.memos];
        }
        else {
            memos.value = data.memos;
        }
        totalMemos.value = Number(data.total) || 0;
        // Load all replies
        const ids = memos.value.map(m => m.id);
        if (ids.length) {
            const { data: rData } = await apiGet(`/api/v2/memos/replies?memoIds=${ids.join(',')}`);
            if (rData?.replies) {
                const grouped = {};
                for (const r of rData.replies) {
                    if (!grouped[r.memo_id])
                        grouped[r.memo_id] = [];
                    grouped[r.memo_id].push(r);
                }
                replies.value = grouped;
            }
        }
    }
    loading.value = false;
    loadingMore.value = false;
    // Deep link: fetch individually if not in list
    if (selectedId.value && !memos.value.find(m => m.id === selectedId.value)) {
        const { data: singleData } = await apiGet(`/api/v2/memos/by-id/${selectedId.value}`);
        const singleMemos = singleData?.memos;
        if (singleMemos?.length) {
            memos.value = [singleMemos[0], ...memos.value];
        }
    }
    // Load replies for deep-linked memo
    if (selectedId.value && !replies.value[selectedId.value]) {
        const { data: rData } = await apiGet(`/api/v2/memos/replies?memoIds=${selectedId.value}`);
        if (rData?.replies) {
            const grouped = { ...replies.value };
            for (const r of rData.replies) {
                if (!grouped[r.memo_id])
                    grouped[r.memo_id] = [];
                grouped[r.memo_id].push(r);
            }
            replies.value = grouped;
        }
    }
}
function loadMore() {
    currentOffset.value += pageSize;
    loadMemos(true);
}
const activeTab = ref('thread');
const showGraph = ref(false);
// Channels
const channels = ref([]);
const activeChannel = ref('');
// Read receipts + Presence
const readers = ref([]);
const presentUsers = ref([]);
const readMemoIds = ref(new Set());
let presenceTimer = null;
async function loadMyReads() {
    const { data } = await apiGet(`/api/v2/memos/my-reads?userName=${encodeURIComponent(currentUser.value)}`);
    const ids = data?.memoIds || [];
    readMemoIds.value = new Set(ids);
}
async function markRead(memoId) {
    await apiPost(`/api/v2/memos/${memoId}/read`, {});
    readMemoIds.value.add(memoId);
}
async function loadReaders(memoId) {
    const { data } = await apiGet(`/api/v2/memos/${memoId}/readers`);
    readers.value = data?.readers || [];
}
async function sendPresence(memoId) {
    await apiPost(`/api/v2/memos/${memoId}/presence`, {});
    const { data } = await apiGet(`/api/v2/memos/${memoId}/presence`);
    presentUsers.value = data?.present || [];
}
// Typing indicator
const typingUsers = ref([]);
let typingTimer = null;
async function sendTyping(memoId) {
    await apiPost(`/api/v2/memos/${memoId}/typing`, {});
}
async function pollTyping(memoId) {
    const { data } = await apiGet(`/api/v2/memos/${memoId}/typing`);
    typingUsers.value = (data?.typing || []).map((t) => t.user_name);
}
function startTypingPoll(memoId) {
    if (typingTimer)
        clearInterval(typingTimer);
    typingTimer = setInterval(() => pollTyping(memoId), 3000);
}
function stopTypingPoll() {
    if (typingTimer) {
        clearInterval(typingTimer);
        typingTimer = null;
    }
    typingUsers.value = [];
}
function startPresence(memoId) {
    if (presenceTimer)
        clearInterval(presenceTimer);
    sendPresence(memoId);
    presenceTimer = setInterval(() => sendPresence(memoId), 5000);
}
function stopPresence() {
    if (presenceTimer) {
        clearInterval(presenceTimer);
        presenceTimer = null;
    }
    presentUsers.value = [];
}
const unreadCounts = ref({});
const showMobileSearch = ref(false);
async function loadChannels() {
    const { data } = await apiGet('/api/v2/memos/channels');
    channels.value = data?.channels || [];
    // Unread counts
    const { data: ucData } = await apiGet('/api/v2/memos/channels/unread-counts');
    unreadCounts.value = ucData?.counts || {};
}
// Extended filters
const currentUser = ref(localStorage.getItem('spec-user-name') || '');
const filterAssignedTo = ref('');
const filterDateFrom = ref('');
const filteredMemos = computed(() => {
    let result = memos.value;
    if (activeChannel.value)
        result = result.filter(m => m.channel_id === activeChannel.value);
    if (filterStatus.value)
        result = result.filter(m => m.status === filterStatus.value);
    if (filterAssignedTo.value === 'me')
        result = result.filter(m => m.assigned_to === currentUser.value);
    else if (filterAssignedTo.value)
        result = result.filter(m => m.assigned_to === filterAssignedTo.value);
    if (filterDateFrom.value)
        result = result.filter(m => m.created_at >= filterDateFrom.value);
    return result;
});
// Presets
function presetMyMemos() { filterAssignedTo.value = 'me'; filterStatus.value = ''; }
function presetOpen() { filterStatus.value = 'open'; filterAssignedTo.value = ''; }
function presetThisWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    now.setDate(now.getDate() - diff);
    filterDateFrom.value = now.toISOString().split('T')[0];
    filterStatus.value = '';
    filterAssignedTo.value = '';
}
function clearFilters() { filterStatus.value = ''; filterAssignedTo.value = ''; filterDateFrom.value = ''; }
// Saved views
const savedViews = ref([]);
async function loadViews() {
    const { data } = await apiGet('/api/v2/memos/views');
    savedViews.value = data?.views || [];
}
async function saveView() {
    const name = prompt('View name:');
    if (!name)
        return;
    await apiPost('/api/v2/memos/views', { name, filters: { status: filterStatus.value, assignedTo: filterAssignedTo.value, dateFrom: filterDateFrom.value } });
    await loadViews();
}
function applyView(v) {
    const f = JSON.parse(v.filters || '{}');
    filterStatus.value = f.status || '';
    filterAssignedTo.value = f.assignedTo || '';
    filterDateFrom.value = f.dateFrom || '';
}
const linkedDocs = ref([]);
async function loadLinkedDocs(memoId) {
    const { data } = await apiGet(`/api/v2/memos/${memoId}/linked-docs`);
    linkedDocs.value = data?.links || [];
}
async function createDocFromMemo() {
    if (!selectedMemo.value)
        return;
    const { data } = await apiPost(`/api/v2/memos/${selectedMemo.value.id}/create-doc`, {});
    if (data?.docId) {
        alert('Document has been created.');
        await loadLinkedDocs(selectedMemo.value.id);
    }
}
const selectedMemo = computed(() => selectedId.value ? memos.value.find(m => m.id === selectedId.value) : null);
const selectedReplies = computed(() => selectedId.value ? (replies.value[selectedId.value] || []) : []);
function selectMemo(id) {
    router.push(`/memos/${id}`);
    loadLinkedDocs(id);
    markRead(id);
    loadReaders(id);
    startPresence(id);
    startTypingPoll(id);
    nextTick(() => {
        const main = document.querySelector('.app-main');
        if (main)
            main.scrollTo({ top: 0, behavior: 'smooth' });
        else
            window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
function goBackClean() {
    stopPresence();
    stopTypingPoll();
    router.push('/memos');
}
function goBack() {
    router.push('/memos');
}
function formatDate(d) {
    // DB stores UTC without Z suffix
    const date = new Date(d.endsWith('Z') ? d : d + 'Z');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function statusLabel(s) {
    const map = {
        open: 'OPEN', resolved: 'RESOLVED', 'request-changes': 'REQUEST_CHANGES'
    };
    return map[s] || s;
}
function statusClass(s) {
    return `status-${s}`;
}
// Reply input
const replyContent = ref('');
async function submitReply() {
    if (!selectedId.value || !replyContent.value.trim())
        return;
    await apiPost('/api/v2/memos/replies', {
        memoId: selectedId.value,
        content: replyContent.value.trim(),
    });
    replyContent.value = '';
    await loadMemos();
    // Auto scroll
    await nextTick();
    const repliesEl = document.querySelector('.replies-section');
    if (repliesEl)
        repliesEl.scrollTop = repliesEl.scrollHeight;
}
function highlightMentions(text) {
    return text.replace(/@([^\s@][^\n@]*?)(?=\s|$|@)/g, '<span class="mention-chip">@$1</span>');
}
async function deleteReply(replyId) {
    if (!confirm('Delete this reply?'))
        return;
    const { apiDelete } = await import('@/composables/useTurso');
    await apiDelete(`/api/v2/memos/replies/${replyId}`);
    await loadMemos();
}
async function quickResolve(id) {
    await apiPatch(`/api/v2/memos/${id}/resolve`, {});
    const memo = memos.value.find(m => m.id === id);
    if (memo)
        memo.status = 'resolved';
}
async function resolveMemo() {
    if (!selectedMemo.value)
        return;
    await apiPatch(`/api/v2/memos/${selectedMemo.value.id}/resolve`, {});
    selectedMemo.value.status = 'resolved';
}
async function reopenMemo() {
    if (!selectedMemo.value)
        return;
    await apiPatch(`/api/v2/memos/${selectedMemo.value.id}`, { status: 'open' });
    selectedMemo.value.status = 'open';
}
async function convertToStory() {
    if (!selectedMemo.value)
        return;
    const title = selectedMemo.value.content.split('\n')[0].slice(0, 100);
    const ok = confirm(`Create story "${title}"?`);
    if (!ok)
        return;
    const { error } = await apiPost('/api/v2/pm/stories', {
        title,
        description: selectedMemo.value.content,
        status: 'backlog',
    });
    if (error) {
        alert(error);
        return;
    }
    // resolve memo
    await apiPatch(`/api/v2/memos/${selectedMemo.value.id}/resolve`, {});
    await loadMemos();
}
async function convertToInitiative() {
    if (!selectedMemo.value)
        return;
    const title = selectedMemo.value.content.split('\n')[0].slice(0, 100);
    const ok = confirm(`Create initiative "${title}"?`);
    if (!ok)
        return;
    const { error } = await apiPost('/api/v2/initiatives', {
        title,
        content: selectedMemo.value.content,
        source_context: `Memo #${selectedMemo.value.id}`,
    });
    if (error) {
        alert(error);
        return;
    }
    await apiPatch(`/api/v2/memos/${selectedMemo.value.id}/resolve`, {});
    await loadMemos();
}
async function loadMembers() {
    const { data } = await apiGet('/api/v2/admin/members');
    if (data?.members)
        memberList.value = data.members.filter(m => m.is_active).map(m => m.display_name);
}
async function createMemo() {
    if (!newMemoContent.value.trim())
        return;
    if (!newMemoAssignees.value.length) {
        if (!confirm('No recipients specified. Post anyway?'))
            return;
    }
    await apiPost('/api/v2/memos', {
        pageId: 'general',
        content: newMemoContent.value,
        memoType: newMemoType.value,
        assignedTo: newMemoAssignees.value.join(', ') || null,
    });
    newMemoContent.value = '';
    newMemoAssignees.value = [];
    showNewMemo.value = false;
    await loadMemos();
}
onMounted(() => { loadMemos(); loadMembers(); loadViews(); loadChannels(); loadMemoTemplates(); loadMyReads(); });
watch(() => route.params.id, () => {
    if (route.params.id && !memos.value.length)
        loadMemos();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['list-card']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['resolve-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['linked-doc-item']} */ ;
/** @type {__VLS_StyleScopedClasses['channel-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['channel-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-card']} */ ;
/** @type {__VLS_StyleScopedClasses['tmpl-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['tmpl-item']} */ ;
/** @type {__VLS_StyleScopedClasses['replies-section']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-content']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-content']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-content']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-content']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-content']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-content']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-content']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-content']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-content']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-input']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['memos-page']} */ ;
/** @type {__VLS_StyleScopedClasses['channel-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['channel-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-view-select']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-view-select']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-search-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-input']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-input']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-card']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['replies-section']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-card']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-presence-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "memos-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "memos-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
if (__VLS_ctx.showNewMemo) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "new-memo-card" },
    });
    if (__VLS_ctx.memoTemplates.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showNewMemo))
                        return;
                    if (!(__VLS_ctx.memoTemplates.length))
                        return;
                    __VLS_ctx.showTemplateModal = true;
                } },
            ...{ class: "btn btn--xs btn--ghost" },
        });
        /** @type {[typeof Icon, ]} */ ;
        // @ts-ignore
        const __VLS_0 = __VLS_asFunctionalComponent(Icon, new Icon({
            name: "sprint",
            size: (14),
        }));
        const __VLS_1 = __VLS_0({
            name: "sprint",
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.newMemoChannel),
        ...{ class: "channel-select" },
    });
    for (const [ch] of __VLS_getVForSourceType((__VLS_ctx.channels))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (ch.id),
            value: (ch.id),
        });
        (ch.icon);
        (ch.name);
    }
    /** @type {[typeof MentionInput, ]} */ ;
    // @ts-ignore
    const __VLS_3 = __VLS_asFunctionalComponent(MentionInput, new MentionInput({
        ...{ 'onSubmit': {} },
        modelValue: (__VLS_ctx.newMemoContent),
        placeholder: "Memo content...",
        rows: (3),
    }));
    const __VLS_4 = __VLS_3({
        ...{ 'onSubmit': {} },
        modelValue: (__VLS_ctx.newMemoContent),
        placeholder: "Memo content...",
        rows: (3),
    }, ...__VLS_functionalComponentArgsRest(__VLS_3));
    let __VLS_6;
    let __VLS_7;
    let __VLS_8;
    const __VLS_9 = {
        onSubmit: (__VLS_ctx.createMemo)
    };
    var __VLS_5;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "new-memo-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.newMemoType),
        ...{ class: "filter-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "memo",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "decision",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "request",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "feature_request",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "policy_request",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "assignee-multi" },
    });
    if (__VLS_ctx.newMemoAssignees.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "assignee-tags" },
        });
        for (const [a] of __VLS_getVForSourceType((__VLS_ctx.newMemoAssignees))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                key: (a),
                ...{ class: "assignee-tag" },
            });
            (a);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.showNewMemo))
                            return;
                        if (!(__VLS_ctx.newMemoAssignees.length))
                            return;
                        __VLS_ctx.newMemoAssignees = __VLS_ctx.newMemoAssignees.filter(x => x !== a);
                    } },
                ...{ class: "tag-remove" },
            });
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        ...{ onChange: ((e) => { const v = e.target.value; if (v && !__VLS_ctx.newMemoAssignees.includes(v))
                __VLS_ctx.newMemoAssignees.push(v); e.target.value = ''; }) },
        ...{ class: "filter-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    for (const [m] of __VLS_getVForSourceType((__VLS_ctx.memberList.filter(n => !__VLS_ctx.newMemoAssignees.includes(n))))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (m),
            value: (m),
        });
        (m);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.createMemo) },
        ...{ class: "btn btn--primary" },
        disabled: (!__VLS_ctx.newMemoContent.trim()),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showNewMemo))
                    return;
                __VLS_ctx.showNewMemo = false;
            } },
        ...{ class: "btn" },
    });
}
if (__VLS_ctx.selectedMemo) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-detail" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.goBack) },
        ...{ class: "btn-back" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-card detail-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-meta" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "memo-id" },
    });
    (__VLS_ctx.selectedMemo.id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: (['memo-status', __VLS_ctx.statusClass(__VLS_ctx.selectedMemo.status)]) },
    });
    (__VLS_ctx.statusLabel(__VLS_ctx.selectedMemo.status));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "memo-author" },
    });
    (__VLS_ctx.selectedMemo.created_by);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "memo-date" },
    });
    (__VLS_ctx.formatDate(__VLS_ctx.selectedMemo.created_at));
    if (__VLS_ctx.selectedMemo.assigned_to) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "memo-assigned" },
        });
        (__VLS_ctx.selectedMemo.assigned_to);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-content" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.renderMarkdown(__VLS_ctx.selectedMemo.content)) }, null, null);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-actions" },
    });
    if (__VLS_ctx.selectedMemo.status === 'open') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.resolveMemo) },
            ...{ class: "btn btn--primary btn--sm" },
        });
        /** @type {[typeof Icon, ]} */ ;
        // @ts-ignore
        const __VLS_10 = __VLS_asFunctionalComponent(Icon, new Icon({
            name: "check",
            size: (14),
        }));
        const __VLS_11 = __VLS_10({
            name: "check",
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_10));
    }
    if (__VLS_ctx.selectedMemo.status === 'resolved') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.reopenMemo) },
            ...{ class: "btn btn--ghost btn--sm" },
        });
        /** @type {[typeof Icon, ]} */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(Icon, new Icon({
            name: "refreshCw",
            size: (14),
        }));
        const __VLS_14 = __VLS_13({
            name: "refreshCw",
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    }
    if (__VLS_ctx.selectedMemo.status === 'open') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.convertToStory) },
            ...{ class: "btn btn--convert" },
        });
    }
    if (__VLS_ctx.selectedMemo.status === 'open') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.convertToInitiative) },
            ...{ class: "btn btn--initiative" },
        });
    }
    if (__VLS_ctx.readers.length || __VLS_ctx.presentUsers.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "memo-presence-bar" },
        });
        if (__VLS_ctx.presentUsers.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "presence-now" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
                ...{ class: "presence-dot" },
            });
            for (const [u] of __VLS_getVForSourceType((__VLS_ctx.presentUsers))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    key: (u.user_name),
                    ...{ class: "presence-avatar" },
                    title: (u.user_name),
                });
                (u.user_name.length <= 3 ? u.user_name : u.user_name.slice(0, 3));
            }
        }
        if (__VLS_ctx.readers.length) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "readers-list" },
            });
            (__VLS_ctx.readers.map(r => r.user_name).join(', '));
        }
    }
    if (__VLS_ctx.typingUsers.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "typing-indicator" },
        });
        (__VLS_ctx.typingUsers.join(', '));
        (__VLS_ctx.typingUsers.length === 1 ? 'is' : 'are');
    }
    if (__VLS_ctx.selectedMemo) {
        /** @type {[typeof MemoChecklist, ]} */ ;
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent(MemoChecklist, new MemoChecklist({
            memoId: (__VLS_ctx.selectedMemo.id),
            members: (__VLS_ctx.memberList),
        }));
        const __VLS_17 = __VLS_16({
            memoId: (__VLS_ctx.selectedMemo.id),
            members: (__VLS_ctx.memberList),
        }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    }
    if (__VLS_ctx.selectedMemo) {
        /** @type {[typeof MemoRelations, ]} */ ;
        // @ts-ignore
        const __VLS_19 = __VLS_asFunctionalComponent(MemoRelations, new MemoRelations({
            memoId: (__VLS_ctx.selectedMemo.id),
        }));
        const __VLS_20 = __VLS_19({
            memoId: (__VLS_ctx.selectedMemo.id),
        }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    }
    if (__VLS_ctx.selectedMemo && __VLS_ctx.linkedDocs.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "linked-docs" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "linked-docs-title" },
        });
        for (const [d] of __VLS_getVForSourceType((__VLS_ctx.linkedDocs))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.selectedMemo))
                            return;
                        if (!(__VLS_ctx.selectedMemo && __VLS_ctx.linkedDocs.length))
                            return;
                        __VLS_ctx.$router.push(`/docs/${d.doc_id}`);
                    } },
                key: (d.doc_id),
                ...{ class: "linked-doc-item" },
            });
            (d.icon || '📄');
            (d.title);
        }
    }
    if (__VLS_ctx.selectedMemo) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.createDocFromMemo) },
            ...{ class: "btn btn--xs btn--ghost" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-tabs" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedMemo))
                    return;
                __VLS_ctx.activeTab = 'thread';
            } },
        ...{ class: "memo-tab" },
        ...{ class: ({ active: __VLS_ctx.activeTab === 'thread' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedMemo))
                    return;
                __VLS_ctx.activeTab = 'timeline';
            } },
        ...{ class: "memo-tab" },
        ...{ class: ({ active: __VLS_ctx.activeTab === 'timeline' }) },
    });
    if (__VLS_ctx.activeTab === 'timeline' && __VLS_ctx.selectedMemo) {
        /** @type {[typeof MemoTimeline, ]} */ ;
        // @ts-ignore
        const __VLS_22 = __VLS_asFunctionalComponent(MemoTimeline, new MemoTimeline({
            memoId: (__VLS_ctx.selectedMemo.id),
        }));
        const __VLS_23 = __VLS_22({
            memoId: (__VLS_ctx.selectedMemo.id),
        }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    }
    if (__VLS_ctx.activeTab === 'thread') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "replies-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        (__VLS_ctx.selectedReplies.length);
        for (const [r] of __VLS_getVForSourceType((__VLS_ctx.selectedReplies))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (r.id),
                ...{ class: "reply-card" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "reply-meta" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "reply-author" },
            });
            (r.created_by);
            if (r.review_type !== 'comment') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: (['reply-type', `type-${r.review_type}`]) },
                });
                (r.review_type);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "reply-date" },
            });
            (__VLS_ctx.formatDate(r.created_at));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "reply-content" },
            });
            __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.renderMarkdown(__VLS_ctx.highlightMentions(r.content))) }, null, null);
            if (r.created_by === __VLS_ctx.authUser) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.selectedMemo))
                                return;
                            if (!(__VLS_ctx.activeTab === 'thread'))
                                return;
                            if (!(r.created_by === __VLS_ctx.authUser))
                                return;
                            __VLS_ctx.deleteReply(r.id);
                        } },
                    ...{ class: "reply-delete-btn" },
                });
            }
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "reply-input" },
        });
        /** @type {[typeof MentionInput, ]} */ ;
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent(MentionInput, new MentionInput({
            ...{ 'onSubmit': {} },
            modelValue: (__VLS_ctx.replyContent),
            placeholder: "Write a reply... (@ to mention)",
        }));
        const __VLS_26 = __VLS_25({
            ...{ 'onSubmit': {} },
            modelValue: (__VLS_ctx.replyContent),
            placeholder: "Write a reply... (@ to mention)",
        }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        let __VLS_28;
        let __VLS_29;
        let __VLS_30;
        const __VLS_31 = {
            onSubmit: (__VLS_ctx.submitReply)
        };
        var __VLS_27;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.submitReply) },
            ...{ class: "btn btn--primary" },
            disabled: (!__VLS_ctx.replyContent.trim()),
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "channel-tabs" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.activeChannel = '';
        } },
    ...{ class: "channel-tab" },
    ...{ class: ({ active: !__VLS_ctx.activeChannel }) },
});
for (const [ch] of __VLS_getVForSourceType((__VLS_ctx.channels))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.activeChannel = ch.id;
            } },
        key: (ch.id),
        ...{ class: "channel-tab" },
        ...{ class: ({ active: __VLS_ctx.activeChannel === ch.id }) },
    });
    (ch.icon);
    (ch.name);
    if (__VLS_ctx.unreadCounts[ch.id]) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "unread-badge" },
        });
        (__VLS_ctx.unreadCounts[ch.id]);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "memo-filter-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.presetMyMemos) },
    ...{ class: "btn btn--xs" },
    ...{ class: (__VLS_ctx.filterAssignedTo === 'me' ? 'btn--primary' : 'btn--ghost') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.presetOpen) },
    ...{ class: "btn btn--xs" },
    ...{ class: (__VLS_ctx.filterStatus === 'open' ? 'btn--primary' : 'btn--ghost') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.presetThisWeek) },
    ...{ class: "btn btn--xs btn--ghost" },
});
if (__VLS_ctx.filterStatus || __VLS_ctx.filterAssignedTo || __VLS_ctx.filterDateFrom) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.clearFilters) },
        ...{ class: "btn btn--xs btn--ghost" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.saveView) },
    ...{ class: "btn btn--xs btn--ghost" },
});
if (__VLS_ctx.savedViews.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        ...{ onChange: (...[$event]) => {
                if (!(__VLS_ctx.savedViews.length))
                    return;
                __VLS_ctx.applyView(__VLS_ctx.savedViews[$event.target.selectedIndex - 1]);
            } },
        ...{ class: "filter-view-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    for (const [v] of __VLS_getVForSourceType((__VLS_ctx.savedViews))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (v.id),
        });
        (v.name);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "graph-toggle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showGraph = !__VLS_ctx.showGraph;
        } },
    ...{ class: "btn btn--xs" },
    ...{ class: (__VLS_ctx.showGraph ? 'btn--primary' : 'btn--ghost') },
});
/** @type {[typeof Icon, ]} */ ;
// @ts-ignore
const __VLS_32 = __VLS_asFunctionalComponent(Icon, new Icon({
    name: "link",
    size: (14),
}));
const __VLS_33 = __VLS_32({
    name: "link",
    size: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_32));
if (__VLS_ctx.showGraph) {
    /** @type {[typeof MemoGraph, ]} */ ;
    // @ts-ignore
    const __VLS_35 = __VLS_asFunctionalComponent(MemoGraph, new MemoGraph({
        memos: (__VLS_ctx.memos),
    }));
    const __VLS_36 = __VLS_35({
        memos: (__VLS_ctx.memos),
    }, ...__VLS_functionalComponentArgsRest(__VLS_35));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-list" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-filters" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.showGraph))
                    return;
                __VLS_ctx.showMobileSearch = !__VLS_ctx.showMobileSearch;
            } },
        ...{ class: "mobile-search-btn" },
    });
    /** @type {[typeof Icon, ]} */ ;
    // @ts-ignore
    const __VLS_38 = __VLS_asFunctionalComponent(Icon, new Icon({
        name: "search",
        size: (14),
    }));
    const __VLS_39 = __VLS_38({
        name: "search",
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_38));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onKeydown: (...[$event]) => {
                if (!!(__VLS_ctx.showGraph))
                    return;
                __VLS_ctx.loadMemos();
            } },
        value: (__VLS_ctx.searchKeyword),
        type: "text",
        placeholder: "Search by keyword...",
        ...{ class: "filter-input" },
        ...{ class: ({ 'mobile-search-open': __VLS_ctx.showMobileSearch }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        ...{ onChange: (...[$event]) => {
                if (!!(__VLS_ctx.showGraph))
                    return;
                __VLS_ctx.loadMemos();
            } },
        value: (__VLS_ctx.filterStatus),
        ...{ class: "filter-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "open",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "resolved",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "request-changes",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        ...{ onChange: (...[$event]) => {
                if (!!(__VLS_ctx.showGraph))
                    return;
                __VLS_ctx.loadMemos();
            } },
        value: (__VLS_ctx.filterAuthor),
        ...{ class: "filter-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    for (const [m] of __VLS_getVForSourceType((__VLS_ctx.memberList))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (m),
            value: (m),
        });
        (m);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.showGraph))
                    return;
                __VLS_ctx.loadMemos();
            } },
        ...{ class: "btn btn--primary btn-search" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.showGraph))
                    return;
                __VLS_ctx.showNewMemo = true;
            } },
        ...{ class: "btn-new-memo" },
    });
    if (__VLS_ctx.loading) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "loading" },
        });
    }
    else if (!__VLS_ctx.memos.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty" },
        });
    }
    else {
        for (const [m] of __VLS_getVForSourceType((__VLS_ctx.filteredMemos))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.showGraph))
                            return;
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(!__VLS_ctx.memos.length))
                            return;
                        __VLS_ctx.selectMemo(m.id);
                    } },
                key: (m.id),
                ...{ class: "memo-card list-card" },
                ...{ class: ({ unread: !__VLS_ctx.readMemoIds.has(m.id) }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "memo-meta" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-id" },
            });
            (m.id);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: (['memo-status', __VLS_ctx.statusClass(m.status)]) },
            });
            (__VLS_ctx.statusLabel(m.status));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-author" },
            });
            (m.created_by);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-date" },
            });
            (__VLS_ctx.formatDate(m.created_at));
            if (__VLS_ctx.replies[m.id]?.length) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "reply-count" },
                });
                (__VLS_ctx.replies[m.id].length);
                (__VLS_ctx.replies[m.id].length === 1 ? 'reply' : 'replies');
            }
            if (m.status === 'open') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.showGraph))
                                return;
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(!__VLS_ctx.memos.length))
                                return;
                            if (!(m.status === 'open'))
                                return;
                            __VLS_ctx.quickResolve(m.id);
                        } },
                    ...{ class: "resolve-icon" },
                    title: "Resolve",
                });
                /** @type {[typeof Icon, ]} */ ;
                // @ts-ignore
                const __VLS_41 = __VLS_asFunctionalComponent(Icon, new Icon({
                    name: "check",
                    size: (14),
                }));
                const __VLS_42 = __VLS_41({
                    name: "check",
                    size: (14),
                }, ...__VLS_functionalComponentArgsRest(__VLS_41));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "memo-preview" },
            });
            (m.content.slice(0, 120));
            (m.content.length > 120 ? '...' : '');
        }
    }
    if (__VLS_ctx.hasMore) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "load-more" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.loadMore) },
            ...{ class: "btn btn--primary" },
            disabled: (__VLS_ctx.loadingMore),
        });
        (__VLS_ctx.loadingMore ? 'Loading...' : 'Load More');
    }
    if (__VLS_ctx.memos.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "memo-count" },
        });
        (__VLS_ctx.memos.length);
        (__VLS_ctx.totalMemos);
    }
}
const __VLS_44 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
    to: "body",
}));
const __VLS_46 = __VLS_45({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_45));
__VLS_47.slots.default;
if (__VLS_ctx.showTemplateModal) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showTemplateModal))
                    return;
                __VLS_ctx.showTemplateModal = false;
            } },
        ...{ class: "tmpl-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "tmpl-modal" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    for (const [t] of __VLS_getVForSourceType((__VLS_ctx.memoTemplates))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showTemplateModal))
                        return;
                    __VLS_ctx.applyTemplate(t);
                } },
            key: (t.id),
            ...{ class: "tmpl-item" },
        });
        (t.icon || '📝');
        (t.name);
    }
    if (!__VLS_ctx.memoTemplates.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "tmpl-empty" },
        });
    }
}
var __VLS_47;
/** @type {__VLS_StyleScopedClasses['memos-page']} */ ;
/** @type {__VLS_StyleScopedClasses['memos-header']} */ ;
/** @type {__VLS_StyleScopedClasses['new-memo-card']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['channel-select']} */ ;
/** @type {__VLS_StyleScopedClasses['new-memo-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['assignee-multi']} */ ;
/** @type {__VLS_StyleScopedClasses['assignee-tags']} */ ;
/** @type {__VLS_StyleScopedClasses['assignee-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['tag-remove']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-back']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-card']} */ ;
/** @type {__VLS_StyleScopedClasses['detail-card']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-id']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-status']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-author']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-date']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-assigned']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--convert']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--initiative']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-presence-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['presence-now']} */ ;
/** @type {__VLS_StyleScopedClasses['presence-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['presence-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['readers-list']} */ ;
/** @type {__VLS_StyleScopedClasses['typing-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['linked-docs']} */ ;
/** @type {__VLS_StyleScopedClasses['linked-docs-title']} */ ;
/** @type {__VLS_StyleScopedClasses['linked-doc-item']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['replies-section']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-card']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-author']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-type']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-date']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-content']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-delete-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['channel-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['channel-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['channel-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['unread-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-view-select']} */ ;
/** @type {__VLS_StyleScopedClasses['graph-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-list']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-search-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-input']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-search-open']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-search']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-new-memo']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-card']} */ ;
/** @type {__VLS_StyleScopedClasses['list-card']} */ ;
/** @type {__VLS_StyleScopedClasses['unread']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-id']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-status']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-author']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-date']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-count']} */ ;
/** @type {__VLS_StyleScopedClasses['resolve-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['load-more']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-count']} */ ;
/** @type {__VLS_StyleScopedClasses['tmpl-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['tmpl-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['tmpl-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tmpl-empty']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Icon: Icon,
            MentionInput: MentionInput,
            renderMarkdown: renderMarkdown,
            MemoRelations: MemoRelations,
            MemoTimeline: MemoTimeline,
            MemoChecklist: MemoChecklist,
            MemoGraph: MemoGraph,
            authUser: authUser,
            memos: memos,
            replies: replies,
            loading: loading,
            searchKeyword: searchKeyword,
            filterStatus: filterStatus,
            filterAuthor: filterAuthor,
            memberList: memberList,
            showNewMemo: showNewMemo,
            newMemoContent: newMemoContent,
            newMemoChannel: newMemoChannel,
            memoTemplates: memoTemplates,
            showTemplateModal: showTemplateModal,
            applyTemplate: applyTemplate,
            newMemoType: newMemoType,
            newMemoAssignees: newMemoAssignees,
            totalMemos: totalMemos,
            hasMore: hasMore,
            loadingMore: loadingMore,
            loadMemos: loadMemos,
            loadMore: loadMore,
            activeTab: activeTab,
            showGraph: showGraph,
            channels: channels,
            activeChannel: activeChannel,
            readers: readers,
            presentUsers: presentUsers,
            readMemoIds: readMemoIds,
            typingUsers: typingUsers,
            unreadCounts: unreadCounts,
            showMobileSearch: showMobileSearch,
            filterAssignedTo: filterAssignedTo,
            filterDateFrom: filterDateFrom,
            filteredMemos: filteredMemos,
            presetMyMemos: presetMyMemos,
            presetOpen: presetOpen,
            presetThisWeek: presetThisWeek,
            clearFilters: clearFilters,
            savedViews: savedViews,
            saveView: saveView,
            applyView: applyView,
            linkedDocs: linkedDocs,
            createDocFromMemo: createDocFromMemo,
            selectedMemo: selectedMemo,
            selectedReplies: selectedReplies,
            selectMemo: selectMemo,
            goBack: goBack,
            formatDate: formatDate,
            statusLabel: statusLabel,
            statusClass: statusClass,
            replyContent: replyContent,
            submitReply: submitReply,
            highlightMentions: highlightMentions,
            deleteReply: deleteReply,
            quickResolve: quickResolve,
            resolveMemo: resolveMemo,
            reopenMemo: reopenMemo,
            convertToStory: convertToStory,
            convertToInitiative: convertToInitiative,
            createMemo: createMemo,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
