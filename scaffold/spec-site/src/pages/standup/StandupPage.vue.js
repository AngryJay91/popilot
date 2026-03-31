import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStandup } from '@/composables/useStandup';
import { useUser, TEAM_MEMBERS } from '@/composables/useUser';
import { loadPmData, loadEpics, stories, tasks, addTask } from '@/composables/usePmStore';
import StandupEntryCard from './StandupEntryCard.vue';
const route = useRoute();
const { currentUser, dynamicMembers, loadMembers } = useUser();
const sprint = computed(() => route.params.sprint);
const { entries, loading, error, feedback, loadEntries, saveEntry, getEntryForUser, loadFeedback, submitFeedback, startPolling, stopPolling } = useStandup();
// Track feedback per entry
const feedbackByEntry = ref({});
async function loadAllFeedback() {
    const { apiGet } = await import('@/api/client');
    const results = await Promise.all(entries.value.map(async (entry) => {
        const { data } = await apiGet('/api/v2/standup/feedback', { standup_entry_id: String(entry.id) });
        const items = (data?.feedback ?? []).map(r => ({
            id: r.id, standupEntryId: r.standup_entry_id, sprint: r.sprint,
            targetUser: r.target_user, feedbackBy: r.feedback_by,
            feedbackText: r.feedback_text,
            reviewType: r.review_type || 'comment',
            createdAt: r.created_at,
        }));
        return { id: entry.id, items };
    }));
    const map = {};
    for (const r of results)
        map[r.id] = r.items;
    feedbackByEntry.value = map;
}
function getFeedbackForEntry(entryId) {
    if (!entryId)
        return [];
    return feedbackByEntry.value[entryId] ?? [];
}
function todayStr() {
    return new Date().toISOString().split('T')[0];
}
const selectedDate = ref(todayStr());
const members = computed(() => {
    return dynamicMembers.value.length > 0 ? dynamicMembers.value : [...TEAM_MEMBERS];
});
// PM data — sprint scoped (for story picker in edit mode)
const sprintStories = computed(() => stories.value.filter(s => s.sprint === sprint.value));
const sprintTasks = computed(() => {
    const storyIds = new Set(sprintStories.value.map(s => s.id));
    return tasks.value.filter(t => storyIds.has(t.storyId));
});
async function onDateChange() {
    await loadEntries(selectedDate.value);
    await loadAllFeedback();
    stopPolling();
    startPolling(selectedDate.value);
}
async function handleSave(userName, data) {
    await saveEntry(userName, selectedDate.value, sprint.value, data);
}
async function handleCreateTask(userName, data) {
    await addTask({ storyId: data.storyId, title: data.title, assignee: userName });
}
async function handleSubmitFeedback(userName, data) {
    const entry = getEntryForUser(userName, selectedDate.value);
    if (!entry)
        return;
    if (!currentUser.value)
        return;
    await submitFeedback(entry.id, sprint.value, userName, currentUser.value, data.feedbackText, data.reviewType);
    await loadAllFeedback();
}
function changeDate(delta) {
    const d = new Date(selectedDate.value);
    d.setDate(d.getDate() + delta);
    selectedDate.value = d.toISOString().split('T')[0];
}
watch(selectedDate, () => onDateChange());
onMounted(async () => {
    await loadMembers();
    await Promise.all([
        loadEntries(selectedDate.value),
        loadEpics(),
        loadPmData(sprint.value),
    ]);
    await loadAllFeedback();
    startPolling(selectedDate.value);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['date-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['date-input']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['error-msg']} */ ;
/** @type {__VLS_StyleScopedClasses['standup-page']} */ ;
/** @type {__VLS_StyleScopedClasses['standup-header']} */ ;
/** @type {__VLS_StyleScopedClasses['standup-header']} */ ;
/** @type {__VLS_StyleScopedClasses['entries-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['date-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['date-input']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "standup-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "standup-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "date-nav" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.changeDate(-1);
        } },
    ...{ class: "date-btn" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "date",
    ...{ class: "date-input" },
});
(__VLS_ctx.selectedDate);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.changeDate(1);
        } },
    ...{ class: "date-btn" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.selectedDate = __VLS_ctx.todayStr();
        } },
    ...{ class: "date-btn date-btn--today" },
});
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-msg" },
    });
    (__VLS_ctx.error);
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "entries-grid" },
    });
    for (const [member] of __VLS_getVForSourceType((__VLS_ctx.members))) {
        /** @type {[typeof StandupEntryCard, ]} */ ;
        // @ts-ignore
        const __VLS_0 = __VLS_asFunctionalComponent(StandupEntryCard, new StandupEntryCard({
            ...{ 'onSave': {} },
            ...{ 'onCreateTask': {} },
            ...{ 'onSubmitFeedback': {} },
            key: (member),
            entry: (__VLS_ctx.getEntryForUser(member, __VLS_ctx.selectedDate)),
            userName: (member),
            editable: (__VLS_ctx.currentUser === member),
            currentUser: (__VLS_ctx.currentUser ?? ''),
            sprintStories: (__VLS_ctx.sprintStories),
            sprintTasks: (__VLS_ctx.sprintTasks),
            feedback: (__VLS_ctx.getFeedbackForEntry(__VLS_ctx.getEntryForUser(member, __VLS_ctx.selectedDate)?.id)),
        }));
        const __VLS_1 = __VLS_0({
            ...{ 'onSave': {} },
            ...{ 'onCreateTask': {} },
            ...{ 'onSubmitFeedback': {} },
            key: (member),
            entry: (__VLS_ctx.getEntryForUser(member, __VLS_ctx.selectedDate)),
            userName: (member),
            editable: (__VLS_ctx.currentUser === member),
            currentUser: (__VLS_ctx.currentUser ?? ''),
            sprintStories: (__VLS_ctx.sprintStories),
            sprintTasks: (__VLS_ctx.sprintTasks),
            feedback: (__VLS_ctx.getFeedbackForEntry(__VLS_ctx.getEntryForUser(member, __VLS_ctx.selectedDate)?.id)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_0));
        let __VLS_3;
        let __VLS_4;
        let __VLS_5;
        const __VLS_6 = {
            onSave: ((data) => __VLS_ctx.handleSave(member, data))
        };
        const __VLS_7 = {
            onCreateTask: ((data) => __VLS_ctx.handleCreateTask(member, data))
        };
        const __VLS_8 = {
            onSubmitFeedback: ((data) => __VLS_ctx.handleSubmitFeedback(member, data))
        };
        var __VLS_2;
    }
}
/** @type {__VLS_StyleScopedClasses['standup-page']} */ ;
/** @type {__VLS_StyleScopedClasses['standup-header']} */ ;
/** @type {__VLS_StyleScopedClasses['date-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['date-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['date-input']} */ ;
/** @type {__VLS_StyleScopedClasses['date-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['date-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['date-btn--today']} */ ;
/** @type {__VLS_StyleScopedClasses['error-msg']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['entries-grid']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            StandupEntryCard: StandupEntryCard,
            currentUser: currentUser,
            loading: loading,
            error: error,
            getEntryForUser: getEntryForUser,
            getFeedbackForEntry: getFeedbackForEntry,
            todayStr: todayStr,
            selectedDate: selectedDate,
            members: members,
            sprintStories: sprintStories,
            sprintTasks: sprintTasks,
            handleSave: handleSave,
            handleCreateTask: handleCreateTask,
            handleSubmitFeedback: handleSubmitFeedback,
            changeDate: changeDate,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
