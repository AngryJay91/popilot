/**
 * Dashboard composable — aggregates data from multiple dashboard APIs.
 *
 * In static mode, returns empty state gracefully.
 */
import { ref } from 'vue';
import { apiGet, isStaticMode } from '@/api/client';
export function useDashboard() {
    const unreadMemos = ref([]);
    const pendingReviews = ref([]);
    const myRequests = ref([]);
    const activeDecisions = ref([]);
    const sprintProgress = ref(null);
    const mySprintProgress = ref(null);
    const standupStatus = ref(null);
    const loading = ref(false);
    const errors = ref([]);
    const nudgeLog = ref([]);
    const teamInitiatives = ref([]);
    function todayStr() {
        return new Date().toISOString().split('T')[0];
    }
    async function loadAll(sprint, userName) {
        if (isStaticMode()) {
            loading.value = false;
            return;
        }
        loading.value = true;
        errors.value = [];
        const fetches = [
            apiGet('/api/v2/dashboard/unread-memos'),
            apiGet('/api/v2/dashboard/unread-memos', { review_required: '1' }),
            apiGet('/api/v2/dashboard/sprint-progress', { sprint }),
            apiGet('/api/v2/dashboard/standup-status', { sprint, date: todayStr() }),
            apiGet('/api/v2/dashboard/my-requests'),
            apiGet('/api/v2/dashboard/active-decisions'),
        ];
        if (userName) {
            fetches.push(apiGet('/api/v2/dashboard/sprint-progress', { sprint, user: userName }));
        }
        const results = await Promise.all(fetches);
        if (results[0].error)
            errors.value.push(results[0].error);
        else if (results[0].data)
            unreadMemos.value = (results[0].data.unreadMemos ?? []).map(mapMemo);
        if (results[1].error)
            errors.value.push(results[1].error);
        else if (results[1].data)
            pendingReviews.value = (results[1].data.unreadMemos ?? []).map(mapMemo);
        if (results[2].error)
            errors.value.push(results[2].error);
        else if (results[2].data)
            sprintProgress.value = results[2].data;
        if (results[3].error)
            errors.value.push(results[3].error);
        else if (results[3].data)
            standupStatus.value = results[3].data;
        if (results[4].error)
            errors.value.push(results[4].error);
        else if (results[4].data)
            myRequests.value = (results[4].data.myRequests ?? []).map(mapRequest);
        if (results[5].error)
            errors.value.push(results[5].error);
        else if (results[5].data)
            activeDecisions.value = (results[5].data.decisions ?? []).map(mapDecision);
        if (userName && results[6]) {
            if (results[6].error)
                errors.value.push(results[6].error);
            else if (results[6].data)
                mySprintProgress.value = results[6].data;
        }
        loading.value = false;
    }
    async function loadNudgeLog() {
        if (isStaticMode())
            return;
        const { data } = await apiGet('/api/v2/dashboard/nudge-log', { limit: '10' });
        if (data?.nudges) {
            nudgeLog.value = data.nudges.map(r => ({
                id: r.id,
                ruleId: r.rule_id ?? '',
                title: r.title ?? '',
                body: r.body ?? '',
                createdAt: r.created_at ?? '',
            }));
        }
    }
    async function loadTeamInitiatives() {
        if (isStaticMode())
            return;
        const { data } = await apiGet('/api/v2/initiatives', { limit: '20' });
        if (data?.initiatives) {
            teamInitiatives.value = data.initiatives.map(r => ({
                id: r.id,
                title: r.title ?? null,
                content: r.content ?? '',
                memoType: r.status ?? 'pending',
                createdBy: r.author ?? '',
                createdAt: r.created_at ?? '',
            }));
        }
        else {
            // Fallback: memo-based (when initiatives table is unavailable)
            const { data: memoData } = await apiGet('/api/v2/memos/all', { limit: '10', status: 'open' });
            if (memoData?.memos) {
                teamInitiatives.value = memoData.memos
                    .filter(r => r.memo_type === 'feature_request')
                    .map(r => ({
                    id: r.id,
                    title: r.title ?? null,
                    content: r.content ?? '',
                    memoType: r.memo_type ?? '',
                    createdBy: r.created_by ?? '',
                    createdAt: r.created_at ?? '',
                }));
            }
        }
    }
    return {
        unreadMemos, pendingReviews, myRequests, activeDecisions,
        sprintProgress, mySprintProgress, standupStatus, nudgeLog, teamInitiatives,
        loading, errors, loadAll, loadNudgeLog, loadTeamInitiatives,
    };
}
function mapMemo(r) {
    return {
        id: r.id, content: r.content ?? '', memoType: r.memo_type ?? 'memo',
        createdBy: r.created_by ?? '', createdAt: r.created_at ?? '',
        reviewRequired: r.review_required ?? 0, pageId: r.page_id ?? '',
        replyCount: r.reply_count ?? 0, title: r.title ?? null,
        supersedesId: r.supersedes_id ?? null,
    };
}
function mapRequest(r) {
    return {
        id: r.id, title: r.title ?? null, content: r.content ?? '',
        memoType: r.memo_type ?? '', assignedTo: r.assigned_to ?? null,
        status: r.status ?? 'open', createdAt: r.created_at ?? '',
        supersedesId: r.supersedes_id ?? null,
    };
}
function mapDecision(r) {
    return {
        id: r.id, title: r.title ?? null, content: r.content ?? '',
        createdBy: r.created_by ?? '', assignedTo: r.assigned_to ?? null,
        createdAt: r.created_at ?? '', supersedesId: r.supersedes_id ?? null,
    };
}
