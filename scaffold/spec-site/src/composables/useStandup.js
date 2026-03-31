/**
 * Standup composable — fetch and save daily standup entries.
 *
 * Singleton pattern for team entries; instance pattern for polling.
 * In static mode, returns empty state gracefully.
 */
import { ref, onUnmounted } from 'vue';
import { apiGet, apiPut, apiPost, isStaticMode } from '@/api/client';
function mapEntry(r) {
    return {
        id: r.id,
        sprint: r.sprint,
        userName: r.user_name,
        entryDate: r.entry_date,
        doneText: r.done_text,
        planText: r.plan_text,
        planStoryIds: r.plan_story_ids ? JSON.parse(r.plan_story_ids) : [],
        blockers: r.blockers,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}
function mapFeedback(r) {
    return {
        id: r.id,
        standupEntryId: r.standup_entry_id,
        sprint: r.sprint,
        targetUser: r.target_user,
        feedbackBy: r.feedback_by,
        feedbackText: r.feedback_text,
        reviewType: r.review_type,
        createdAt: r.created_at,
    };
}
const POLL_INTERVAL_MS = 30000;
export function useStandup() {
    const entries = ref([]);
    const loading = ref(false);
    const error = ref(null);
    async function fetchEntries(date) {
        if (isStaticMode())
            return;
        const { data, error: apiError } = await apiGet('/api/v2/standup/entries', { date });
        if (apiError) {
            error.value = apiError;
        }
        else if (data) {
            entries.value = data.entries.map(mapEntry);
        }
    }
    async function loadEntries(date) {
        loading.value = true;
        error.value = null;
        await fetchEntries(date);
        loading.value = false;
    }
    async function saveEntry(userName, date, sprint, data) {
        if (isStaticMode())
            return { error: 'Not available in static mode' };
        const { error: apiError } = await apiPut('/api/v2/standup/entries', {
            sprint,
            userName,
            date,
            doneText: data.doneText ?? null,
            planText: data.planText ?? null,
            planStoryIds: data.planStoryIds ?? null,
            blockers: data.blockers ?? null,
        });
        if (apiError)
            return { error: apiError };
        await fetchEntries(date);
        return {};
    }
    function getEntryForUser(userName, date) {
        return entries.value.find(e => e.userName === userName && e.entryDate === date);
    }
    // Polling
    let pollTimer = null;
    let _pollDate = '';
    function startPolling(date) {
        _pollDate = date;
        stopPolling();
        pollTimer = setInterval(() => fetchEntries(_pollDate), POLL_INTERVAL_MS);
    }
    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }
    // Feedback
    const feedback = ref([]);
    async function loadFeedback(entryId) {
        if (isStaticMode())
            return;
        const { data } = await apiGet('/api/v2/standup/feedback', { standup_entry_id: String(entryId) });
        if (data) {
            feedback.value = data.feedback.map(mapFeedback);
        }
    }
    async function submitFeedback(entryId, sprint, targetUser, feedbackBy, feedbackText, reviewType) {
        if (isStaticMode())
            return { error: 'Not available in static mode' };
        const { error: apiError } = await apiPost('/api/v2/standup/feedback', {
            standupEntryId: entryId,
            sprint,
            targetUser,
            feedbackBy,
            feedbackText,
            reviewType,
        });
        if (apiError)
            return { error: apiError };
        await loadFeedback(entryId);
        return {};
    }
    onUnmounted(stopPolling);
    return {
        entries,
        loading,
        error,
        feedback,
        loadEntries,
        saveEntry,
        getEntryForUser,
        loadFeedback,
        submitFeedback,
        startPolling,
        stopPolling,
    };
}
