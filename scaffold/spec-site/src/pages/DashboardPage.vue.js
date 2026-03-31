import { onMounted, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useDashboard } from '@/composables/useDashboard';
import { apiPatch, apiPost, apiGet } from '@/api/client';
import { getActiveSprint } from '@/composables/useNavStore';
import { useUser, TEAM_MEMBERS } from '@/composables/useUser';
import { Bell, Rocket, BarChart3, Sun, Zap, FileText, ClipboardList, ScrollText } from 'lucide-vue-next';
const memoTypeComponentMap = {
    decision: Zap,
    feature_request: Rocket,
    policy_request: ScrollText,
    request: ClipboardList,
    memo: FileText
};
const router = useRouter();
const { currentUser, dynamicMembers, loadMembers } = useUser();
const dashboard = useDashboard();
const sprint = computed(() => getActiveSprint().id);
const members = computed(() => {
    return dynamicMembers.value.length > 0 ? dynamicMembers.value : [...TEAM_MEMBERS];
});
const standupNotWritten = computed(() => {
    if (!dashboard.standupStatus.value)
        return [];
    const written = new Set(dashboard.standupStatus.value.written);
    return members.value.filter((m) => !written.has(m));
});
function formatTime(ts) {
    if (!ts)
        return '';
    const d = new Date(ts + (ts.includes('Z') ? '' : 'Z'));
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}
function truncate(text, max) {
    return text.length > max ? text.slice(0, max) + '...' : text;
}
function nudgeRuleLabel(ruleId) {
    const labels = {
        review_overdue: 'Review Overdue',
        sprint_deadline: 'Sprint Deadline',
        standup_missing: 'Standup Missing',
        task_stale: 'Task Stale',
        blocker_unresolved: 'Blocker Unresolved',
        daily_report: 'Daily Report',
    };
    return labels[ruleId] ?? ruleId;
}
function formatDate(ts) {
    if (!ts)
        return '';
    const d = new Date(ts + (ts.includes('Z') ? '' : 'Z'));
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
}
function initiativeStatusLabel(status) {
    return { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', deferred: 'Deferred' }[status] ?? status;
}
async function handleInitiative(id, status) {
    await apiPatch(`/api/v2/initiatives/${id}/status`, { status });
    await dashboard.loadTeamInitiatives();
}
async function convertToEpic(item) {
    const title = item.title || item.content?.split('\n')[0]?.slice(0, 100) || 'New Epic';
    if (!confirm(`Create epic "${title}"?`))
        return;
    const { error } = await apiPost('/api/v2/pm/epics', { title, description: item.content });
    if (error) {
        alert(error);
        return;
    }
    await handleInitiative(item.id, 'approved');
    alert('Epic created');
}
async function convertToStory(item) {
    const title = item.title || item.content?.split('\n')[0]?.slice(0, 100) || 'New Story';
    if (!confirm(`Create story "${title}"?`))
        return;
    const { error } = await apiPost('/api/v2/pm/stories', {
        title,
        description: item.content,
        status: 'backlog',
    });
    if (error) {
        alert(error);
        return;
    }
    await handleInitiative(item.id, 'approved');
    alert('Story created');
}
async function resolveFromNudge(nudge) {
    await dashboard.loadAll(sprint.value, currentUser.value ?? undefined);
    await dashboard.loadNudgeLog();
}
async function handleReview(memoId, action) {
    const endpoint = action === 'approve' ? 'resolve' : 'reopen';
    await apiPatch(`/api/v2/memos/${memoId}/${endpoint}`, { userName: currentUser.value ?? '' });
    await dashboard.loadAll(sprint.value, currentUser.value ?? undefined);
}
const mySummary = ref(null);
const activities = ref([]);
async function loadActivities() {
    const { data } = await apiGet('/api/v2/activity?limit=20');
    if (data?.activities)
        activities.value = data.activities;
}
function formatActivityTime(d) {
    if (!d)
        return '';
    const date = new Date(d.endsWith('Z') ? d : d + 'Z');
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
function activityIcon(type) {
    const map = {
        story_status_change: '🔄', pr_merged: '🔀', memo_created: '📝',
        memo_reply: '💬', initiative_created: '💡', standup_saved: '📋',
    };
    return map[type] || '📌';
}
function activityDesc(a) {
    const meta = a.metadata ? JSON.parse(a.metadata) : {};
    if (a.action_type === 'story_status_change')
        return `${a.target_title} → ${meta.status || ''}`;
    if (a.action_type === 'pr_merged')
        return `PR merged: ${a.target_title}`;
    if (a.action_type === 'memo_created')
        return `Memo: ${a.target_title?.slice(0, 40)}`;
    return a.target_title || a.action_type;
}
async function loadMySummary() {
    const user = currentUser.value;
    if (!user)
        return;
    const { data } = await apiGet(`/api/v2/dashboard/my-summary?user=${encodeURIComponent(user)}`);
    if (data)
        mySummary.value = data;
}
const sprintSummary = ref(null);
const velocityData = ref([]);
const sprintHistory = ref([]);
const maxHistorySP = computed(() => Math.max(...sprintHistory.value.map(s => s.doneSP), 1));
async function loadSprintHistory() {
    const { data: navData } = await apiGet('/api/v2/nav');
    if (!navData?.sprints)
        return;
    const allSprints = navData.sprints.sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? ''));
    const sprints = allSprints.slice(-5);
    const history = [];
    for (const sp of sprints) {
        const { data: preview } = await apiGet(`/api/v2/kickoff/${sp.id}/close-preview`);
        history.push({
            id: sp.id,
            label: sp.label || sp.id,
            doneSP: preview?.summary?.doneSP ?? 0,
            isActive: sp.status === 'active' || sp.active === 1,
        });
    }
    sprintHistory.value = history;
}
async function loadSprintStats() {
    const { data } = await apiGet(`/api/v2/kickoff/${sprint.value}/close-preview`);
    if (data?.summary)
        sprintSummary.value = data.summary;
    if (data?.velocity)
        velocityData.value = data.velocity;
}
onMounted(async () => {
    await loadMembers();
    await Promise.all([
        dashboard.loadAll(sprint.value, currentUser.value ?? undefined),
        dashboard.loadNudgeLog(),
        dashboard.loadTeamInitiatives(),
        loadSprintStats(),
        loadSprintHistory(),
        loadMySummary(),
        loadActivities(),
    ]);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['dashboard']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-row']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-row']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-row']} */ ;
/** @type {__VLS_StyleScopedClasses['clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--approve']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--reject']} */ ;
/** @type {__VLS_StyleScopedClasses['clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['my-progress']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bar-container']} */ ;
/** @type {__VLS_StyleScopedClasses['section-divider']} */ ;
/** @type {__VLS_StyleScopedClasses['section-divider']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-section']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-item']} */ ;
/** @type {__VLS_StyleScopedClasses['my-section']} */ ;
/** @type {__VLS_StyleScopedClasses['my-card']} */ ;
/** @type {__VLS_StyleScopedClasses['my-card']} */ ;
/** @type {__VLS_StyleScopedClasses['my-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-progress-card']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-progress-card']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['burndown-chart']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-history-chart']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-header']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-header']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card--nudge']} */ ;
/** @type {__VLS_StyleScopedClasses['card--initiatives']} */ ;
/** @type {__VLS_StyleScopedClasses['section-divider']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dashboard-wrapper" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dashboard" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dashboard-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header-top" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "sprint-badge" },
});
(__VLS_ctx.sprint);
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "header-subtitle" },
});
if (__VLS_ctx.dashboard.loading.value) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading" },
    });
}
if (__VLS_ctx.mySummary) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "my-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "my-cards" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mySummary))
                    return;
                __VLS_ctx.$router.push('/board');
            } },
        ...{ class: "my-card" },
        ...{ class: ({ warn: (__VLS_ctx.mySummary.myStories || []).some((s) => s.daysInProgress >= 3) }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "my-card-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "my-card-count" },
    });
    ((__VLS_ctx.mySummary.myStories || []).length);
    for (const [s] of __VLS_getVForSourceType(((__VLS_ctx.mySummary.myStories || []).slice(0, 3)))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (s.id),
            ...{ class: "my-story-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (s.title?.slice(0, 30));
        if (s.daysInProgress >= 3) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "days-warn" },
            });
            (s.daysInProgress);
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mySummary))
                    return;
                __VLS_ctx.$router.push('/board');
            } },
        ...{ class: "my-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "my-card-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "my-card-count" },
    });
    ((__VLS_ctx.mySummary.myReviews || []).length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mySummary))
                    return;
                __VLS_ctx.$router.push('/inbox');
            } },
        ...{ class: "my-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "my-card-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "my-card-count" },
    });
    (__VLS_ctx.mySummary.unreadMentions || 0);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.mySummary))
                    return;
                __VLS_ctx.$router.push('/memos');
            } },
        ...{ class: "my-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "my-card-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "my-card-count" },
    });
    (__VLS_ctx.mySummary.unansweredMemos || 0);
}
if (__VLS_ctx.sprintSummary) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "sprint-progress-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "progress-stats" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "progress-stat" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stat-value" },
    });
    (__VLS_ctx.sprintSummary.completedCount);
    (__VLS_ctx.sprintSummary.totalStories);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stat-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "progress-stat" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stat-value" },
    });
    (__VLS_ctx.sprintSummary.doneSP);
    (__VLS_ctx.sprintSummary.totalSP);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stat-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "progress-stat" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stat-value" },
    });
    (__VLS_ctx.sprintSummary.completionRate);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stat-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "progress-bar-wrap" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "progress-bar-fill" },
        ...{ style: ({ width: __VLS_ctx.sprintSummary.completionRate + '%' }) },
    });
    if (__VLS_ctx.velocityData.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "velocity-chart" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        for (const [v] of __VLS_getVForSourceType((__VLS_ctx.velocityData))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (v.assignee),
                ...{ class: "velocity-bar-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "velocity-label" },
            });
            (v.assignee);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "velocity-bar-bg" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                ...{ class: "velocity-bar-done" },
                ...{ style: ({ width: v.totalSP > 0 ? (v.doneSP / v.totalSP * 100) + '%' : '0%' }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "velocity-sp" },
            });
            (v.doneSP);
            (v.totalSP);
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "burndown-chart" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        viewBox: "0 0 400 200",
        ...{ class: "burndown-svg" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "40",
        y1: "20",
        x2: "380",
        y2: "180",
        stroke: "#d1d5db",
        'stroke-width': "2",
        'stroke-dasharray': "6,4",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
        x: "350",
        y: "170",
        'font-size': "11",
        fill: "#9ca3af",
        'font-weight': "600",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "40",
        y1: "180",
        x2: "380",
        y2: "180",
        stroke: "#9ca3af",
        'stroke-width': "1",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "40",
        y1: "20",
        x2: "40",
        y2: "180",
        stroke: "#9ca3af",
        'stroke-width': "1",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
        cx: (40 + (__VLS_ctx.sprintSummary.completionRate / 100) * 340),
        cy: (20 + ((1 - ((__VLS_ctx.sprintSummary.totalSP - __VLS_ctx.sprintSummary.doneSP) / (__VLS_ctx.sprintSummary.totalSP || 1))) * 160)),
        r: "6",
        fill: "#3b82f6",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "40",
        y1: "20",
        x2: (40 + (__VLS_ctx.sprintSummary.completionRate / 100) * 340),
        y2: (20 + ((1 - ((__VLS_ctx.sprintSummary.totalSP - __VLS_ctx.sprintSummary.doneSP) / (__VLS_ctx.sprintSummary.totalSP || 1))) * 160)),
        stroke: "#3b82f6",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
        x: "40",
        y: "195",
        'font-size': "10",
        fill: "#888",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
        x: "360",
        y: "195",
        'font-size': "10",
        fill: "#888",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
        x: "5",
        y: "25",
        'font-size': "10",
        fill: "#888",
    });
    (__VLS_ctx.sprintSummary.totalSP);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
        x: "5",
        y: "185",
        'font-size': "10",
        fill: "#888",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "burndown-note" },
    });
    ((__VLS_ctx.sprintSummary.totalSP ?? 0) - (__VLS_ctx.sprintSummary.doneSP ?? 0));
    (__VLS_ctx.sprintSummary.totalSP ?? 0);
    if (__VLS_ctx.sprintHistory.length > 1) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "sprint-history-chart" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "history-bars" },
        });
        for (const [sh] of __VLS_getVForSourceType((__VLS_ctx.sprintHistory))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (sh.id),
                ...{ class: "history-bar-col" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "history-bar-bg" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                ...{ class: "history-bar-fill" },
                ...{ style: ({ height: __VLS_ctx.maxHistorySP > 0 ? (sh.doneSP / __VLS_ctx.maxHistorySP * 100) + '%' : '0%' }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "history-bar-label" },
            });
            (sh.label);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "history-bar-sp" },
            });
            (sh.doneSP);
            (sh.isActive ? ' (active)' : '');
        }
    }
}
if (__VLS_ctx.activities.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "activity-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "activity-list" },
    });
    for (const [a] of __VLS_getVForSourceType((__VLS_ctx.activities.slice(0, 10)))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (a.id),
            ...{ class: "activity-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "activity-time" },
        });
        (__VLS_ctx.formatActivityTime(a.created_at));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "activity-icon" },
        });
        (__VLS_ctx.activityIcon(a.action_type));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "activity-actor" },
        });
        (a.actor);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "activity-desc" },
        });
        (__VLS_ctx.activityDesc(a));
    }
}
if (!__VLS_ctx.dashboard.loading.value) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "dashboard-grid" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-divider" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "card card--nudge" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-title" },
    });
    const __VLS_0 = {}.Bell;
    /** @type {[typeof __VLS_components.Bell, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        size: (16),
        ...{ class: "card-icon" },
    }));
    const __VLS_2 = __VLS_1({
        size: (16),
        ...{ class: "card-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    if (__VLS_ctx.dashboard.nudgeLog.value.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "count-badge count--amber" },
        });
        (__VLS_ctx.dashboard.nudgeLog.value.length);
    }
    if (__VLS_ctx.dashboard.nudgeLog.value.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-list" },
        });
        for (const [n] of __VLS_getVForSourceType((__VLS_ctx.dashboard.nudgeLog.value))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.dashboard.loading.value))
                            return;
                        if (!!(__VLS_ctx.dashboard.nudgeLog.value.length === 0))
                            return;
                        __VLS_ctx.router.push(`/board/${__VLS_ctx.sprint}`);
                    } },
                key: (n.id),
                ...{ class: "nudge-row clickable" },
                ...{ class: ('nudge--' + n.ruleId) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "nudge-rule-badge" },
                ...{ class: ('rule--' + n.ruleId) },
            });
            (__VLS_ctx.nudgeRuleLabel(n.ruleId));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "nudge-text" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "nudge-title" },
            });
            (n.title);
            if (n.body) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "nudge-body" },
                });
                (__VLS_ctx.truncate(n.body, 80));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-time" },
            });
            (__VLS_ctx.formatDate(n.createdAt));
            (__VLS_ctx.formatTime(n.createdAt));
            if (n.ruleId === 'review_overdue') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!__VLS_ctx.dashboard.loading.value))
                                return;
                            if (!!(__VLS_ctx.dashboard.nudgeLog.value.length === 0))
                                return;
                            if (!(n.ruleId === 'review_overdue'))
                                return;
                            __VLS_ctx.resolveFromNudge(n);
                        } },
                    ...{ class: "btn-action btn--approve" },
                    title: "Approve",
                });
            }
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "card card--initiatives" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-title" },
    });
    const __VLS_4 = {}.Rocket;
    /** @type {[typeof __VLS_components.Rocket, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        size: (16),
        ...{ class: "card-icon" },
    }));
    const __VLS_6 = __VLS_5({
        size: (16),
        ...{ class: "card-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    if (__VLS_ctx.dashboard.teamInitiatives.value.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "count-badge count--blue" },
        });
        (__VLS_ctx.dashboard.teamInitiatives.value.length);
    }
    if (__VLS_ctx.dashboard.teamInitiatives.value.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-list" },
        });
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.dashboard.teamInitiatives.value))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (item.id),
                ...{ class: "memo-row initiative-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "initiative-status-badge" },
                ...{ class: ('ist--' + item.memoType) },
            });
            (__VLS_ctx.initiativeStatusLabel(item.memoType));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-content" },
            });
            (item.title || __VLS_ctx.truncate(item.content, 50));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-author" },
            });
            (item.createdBy);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-time" },
            });
            (__VLS_ctx.formatDate(item.createdAt));
            if (item.memoType === 'pending') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "initiative-actions" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!__VLS_ctx.dashboard.loading.value))
                                return;
                            if (!!(__VLS_ctx.dashboard.teamInitiatives.value.length === 0))
                                return;
                            if (!(item.memoType === 'pending'))
                                return;
                            __VLS_ctx.handleInitiative(item.id, 'approved');
                        } },
                    ...{ class: "btn-action btn--approve" },
                    title: "Approve",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!__VLS_ctx.dashboard.loading.value))
                                return;
                            if (!!(__VLS_ctx.dashboard.teamInitiatives.value.length === 0))
                                return;
                            if (!(item.memoType === 'pending'))
                                return;
                            __VLS_ctx.handleInitiative(item.id, 'rejected');
                        } },
                    ...{ class: "btn-action btn--reject" },
                    title: "Reject",
                });
            }
            if (item.memoType === 'approved') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "initiative-actions" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!__VLS_ctx.dashboard.loading.value))
                                return;
                            if (!!(__VLS_ctx.dashboard.teamInitiatives.value.length === 0))
                                return;
                            if (!(item.memoType === 'approved'))
                                return;
                            __VLS_ctx.convertToEpic(item);
                        } },
                    ...{ class: "btn-action btn--convert-epic" },
                    title: "Convert to Epic",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(!__VLS_ctx.dashboard.loading.value))
                                return;
                            if (!!(__VLS_ctx.dashboard.teamInitiatives.value.length === 0))
                                return;
                            if (!(item.memoType === 'approved'))
                                return;
                            __VLS_ctx.convertToStory(item);
                        } },
                    ...{ class: "btn-action btn--convert-story" },
                    title: "Convert to Story",
                });
            }
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "card card--progress" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-title" },
    });
    const __VLS_8 = {}.BarChart3;
    /** @type {[typeof __VLS_components.BarChart3, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        size: (16),
        ...{ class: "card-icon" },
    }));
    const __VLS_10 = __VLS_9({
        size: (16),
        ...{ class: "card-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    if (__VLS_ctx.dashboard.sprintProgress.value) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.dashboard.loading.value))
                        return;
                    if (!(__VLS_ctx.dashboard.sprintProgress.value))
                        return;
                    __VLS_ctx.router.push(`/board/${__VLS_ctx.sprint}`);
                } },
            ...{ class: "progress-content clickable" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "progress-bar-container" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "progress-bar-fill" },
            ...{ style: ({ width: __VLS_ctx.dashboard.sprintProgress.value.progressPercent + '%' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "progress-stats" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "progress-percent" },
        });
        (__VLS_ctx.dashboard.sprintProgress.value.progressPercent);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "progress-detail" },
        });
        (__VLS_ctx.dashboard.sprintProgress.value.done);
        (__VLS_ctx.dashboard.sprintProgress.value.total);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "status-breakdown" },
        });
        for (const [cnt, status] of __VLS_getVForSourceType((__VLS_ctx.dashboard.sprintProgress.value.byStatus))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                key: (status),
                ...{ class: "status-chip" },
                ...{ class: ('status--' + status) },
            });
            (status);
            (cnt);
        }
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-empty" },
        });
    }
    if (__VLS_ctx.dashboard.mySprintProgress.value) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "my-progress" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "my-progress-label" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "progress-bar-container" },
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "progress-bar-fill" },
            ...{ style: ({ width: __VLS_ctx.dashboard.mySprintProgress.value.progressPercent + '%' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "progress-detail" },
        });
        (__VLS_ctx.dashboard.mySprintProgress.value.done);
        (__VLS_ctx.dashboard.mySprintProgress.value.total);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "card card--standup" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-title" },
    });
    const __VLS_12 = {}.Sun;
    /** @type {[typeof __VLS_components.Sun, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        size: (16),
        ...{ class: "card-icon" },
    }));
    const __VLS_14 = __VLS_13({
        size: (16),
        ...{ class: "card-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    if (__VLS_ctx.dashboard.standupStatus.value) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "standup-content" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "standup-stat" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "standup-count" },
        });
        (__VLS_ctx.dashboard.standupStatus.value.count);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "standup-label" },
        });
        (__VLS_ctx.members.length);
        if (__VLS_ctx.standupNotWritten.length > 0) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "standup-missing" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "missing-label" },
            });
            for (const [name] of __VLS_getVForSourceType((__VLS_ctx.standupNotWritten))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    key: (name),
                    ...{ class: "missing-name" },
                });
                (name);
            }
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "card-empty" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.dashboard.loading.value))
                        return;
                    if (!(__VLS_ctx.dashboard.standupStatus.value))
                        return;
                    __VLS_ctx.router.push(`/standup/${__VLS_ctx.sprint}`);
                } },
            ...{ class: "btn btn--sm" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-empty" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section-divider" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "card card--pending" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-title" },
    });
    const __VLS_16 = {}.Bell;
    /** @type {[typeof __VLS_components.Bell, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        size: (16),
        ...{ class: "card-icon" },
    }));
    const __VLS_18 = __VLS_17({
        size: (16),
        ...{ class: "card-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    if (__VLS_ctx.dashboard.pendingReviews.value.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "count-badge" },
        });
        (__VLS_ctx.dashboard.pendingReviews.value.length);
    }
    if (__VLS_ctx.dashboard.pendingReviews.value.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-list" },
        });
        for (const [memo] of __VLS_getVForSourceType((__VLS_ctx.dashboard.pendingReviews.value))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (memo.id),
                ...{ class: "memo-row review-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-author" },
            });
            (memo.createdBy);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-content" },
            });
            (__VLS_ctx.truncate(memo.content, 60));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-time" },
            });
            (__VLS_ctx.formatTime(memo.createdAt));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "review-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.dashboard.loading.value))
                            return;
                        if (!!(__VLS_ctx.dashboard.pendingReviews.value.length === 0))
                            return;
                        __VLS_ctx.handleReview(memo.id, 'approve');
                    } },
                ...{ class: "btn-action btn--approve" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.dashboard.loading.value))
                            return;
                        if (!!(__VLS_ctx.dashboard.pendingReviews.value.length === 0))
                            return;
                        __VLS_ctx.handleReview(memo.id, 'reject');
                    } },
                ...{ class: "btn-action btn--reject" },
            });
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "card card--memos" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-title" },
    });
    const __VLS_20 = {}.FileText;
    /** @type {[typeof __VLS_components.FileText, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        size: (16),
        ...{ class: "card-icon" },
    }));
    const __VLS_22 = __VLS_21({
        size: (16),
        ...{ class: "card-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    if (__VLS_ctx.dashboard.unreadMemos.value.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "count-badge" },
        });
        (__VLS_ctx.dashboard.unreadMemos.value.length);
    }
    if (__VLS_ctx.dashboard.unreadMemos.value.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-list" },
        });
        for (const [memo] of __VLS_getVForSourceType((__VLS_ctx.dashboard.unreadMemos.value))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.dashboard.loading.value))
                            return;
                        if (!!(__VLS_ctx.dashboard.unreadMemos.value.length === 0))
                            return;
                        __VLS_ctx.router.push(`/board/${__VLS_ctx.sprint}`);
                    } },
                key: (memo.id),
                ...{ class: "memo-row clickable" },
                ...{ class: ({ 'review-required': memo.reviewRequired }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-author" },
            });
            (memo.createdBy);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-content" },
            });
            (__VLS_ctx.truncate(memo.content, 60));
            if (memo.reviewRequired) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "review-badge" },
                });
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-time" },
            });
            (__VLS_ctx.formatTime(memo.createdAt));
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "card card--requests" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-title" },
    });
    const __VLS_24 = {}.Rocket;
    /** @type {[typeof __VLS_components.Rocket, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        size: (16),
        ...{ class: "card-icon" },
    }));
    const __VLS_26 = __VLS_25({
        size: (16),
        ...{ class: "card-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    if (__VLS_ctx.dashboard.myRequests.value.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "count-badge count--blue" },
        });
        (__VLS_ctx.dashboard.myRequests.value.length);
    }
    if (__VLS_ctx.dashboard.myRequests.value.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-list" },
        });
        for (const [req] of __VLS_getVForSourceType((__VLS_ctx.dashboard.myRequests.value))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (req.id),
                ...{ class: "memo-row" },
            });
            const __VLS_28 = ((__VLS_ctx.memoTypeComponentMap[req.memoType] || __VLS_ctx.FileText));
            // @ts-ignore
            const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
                size: (14),
                ...{ class: "memo-type-icon" },
            }));
            const __VLS_30 = __VLS_29({
                size: (14),
                ...{ class: "memo-type-icon" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_29));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-content" },
            });
            (req.title || __VLS_ctx.truncate(req.content, 50));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "status-chip" },
                ...{ class: ('status--' + req.status) },
            });
            (req.status);
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "card card--decisions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-title" },
    });
    const __VLS_32 = {}.Zap;
    /** @type {[typeof __VLS_components.Zap, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        size: (16),
        ...{ class: "card-icon" },
    }));
    const __VLS_34 = __VLS_33({
        size: (16),
        ...{ class: "card-icon" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    if (__VLS_ctx.dashboard.activeDecisions.value.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "count-badge count--purple" },
        });
        (__VLS_ctx.dashboard.activeDecisions.value.length);
    }
    if (__VLS_ctx.dashboard.activeDecisions.value.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-list" },
        });
        for (const [dec] of __VLS_getVForSourceType((__VLS_ctx.dashboard.activeDecisions.value))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (dec.id),
                ...{ class: "memo-row decision-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-content" },
            });
            (dec.title || __VLS_ctx.truncate(dec.content, 50));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-author" },
            });
            (dec.createdBy);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-time" },
            });
            (__VLS_ctx.formatTime(dec.createdAt));
        }
    }
}
if (__VLS_ctx.dashboard.errors.value.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-list" },
    });
    for (const [err, i] of __VLS_getVForSourceType((__VLS_ctx.dashboard.errors.value))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (i),
            ...{ class: "error-msg" },
        });
        (err);
    }
}
/** @type {__VLS_StyleScopedClasses['dashboard-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-top']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['header-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['my-section']} */ ;
/** @type {__VLS_StyleScopedClasses['my-cards']} */ ;
/** @type {__VLS_StyleScopedClasses['my-card']} */ ;
/** @type {__VLS_StyleScopedClasses['warn']} */ ;
/** @type {__VLS_StyleScopedClasses['my-card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['my-card-count']} */ ;
/** @type {__VLS_StyleScopedClasses['my-story-item']} */ ;
/** @type {__VLS_StyleScopedClasses['days-warn']} */ ;
/** @type {__VLS_StyleScopedClasses['my-card']} */ ;
/** @type {__VLS_StyleScopedClasses['my-card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['my-card-count']} */ ;
/** @type {__VLS_StyleScopedClasses['my-card']} */ ;
/** @type {__VLS_StyleScopedClasses['my-card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['my-card-count']} */ ;
/** @type {__VLS_StyleScopedClasses['my-card']} */ ;
/** @type {__VLS_StyleScopedClasses['my-card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['my-card-count']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-progress-card']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-value']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bar-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-chart']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-bar-row']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-label']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-bar-bg']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-bar-done']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-sp']} */ ;
/** @type {__VLS_StyleScopedClasses['burndown-chart']} */ ;
/** @type {__VLS_StyleScopedClasses['burndown-svg']} */ ;
/** @type {__VLS_StyleScopedClasses['burndown-note']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-history-chart']} */ ;
/** @type {__VLS_StyleScopedClasses['history-bars']} */ ;
/** @type {__VLS_StyleScopedClasses['history-bar-col']} */ ;
/** @type {__VLS_StyleScopedClasses['history-bar-bg']} */ ;
/** @type {__VLS_StyleScopedClasses['history-bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['history-bar-label']} */ ;
/** @type {__VLS_StyleScopedClasses['history-bar-sp']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-section']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-list']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-item']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-time']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-actor']} */ ;
/** @type {__VLS_StyleScopedClasses['activity-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['dashboard-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['section-divider']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card--nudge']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['count-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['count--amber']} */ ;
/** @type {__VLS_StyleScopedClasses['card-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['card-list']} */ ;
/** @type {__VLS_StyleScopedClasses['nudge-row']} */ ;
/** @type {__VLS_StyleScopedClasses['clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['nudge-rule-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['nudge-text']} */ ;
/** @type {__VLS_StyleScopedClasses['nudge-title']} */ ;
/** @type {__VLS_StyleScopedClasses['nudge-body']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-time']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-action']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--approve']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card--initiatives']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['count-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['count--blue']} */ ;
/** @type {__VLS_StyleScopedClasses['card-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['card-list']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-row']} */ ;
/** @type {__VLS_StyleScopedClasses['initiative-row']} */ ;
/** @type {__VLS_StyleScopedClasses['initiative-status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-author']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-time']} */ ;
/** @type {__VLS_StyleScopedClasses['initiative-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-action']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--approve']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-action']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--reject']} */ ;
/** @type {__VLS_StyleScopedClasses['initiative-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-action']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--convert-epic']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-action']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--convert-story']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card--progress']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-content']} */ ;
/** @type {__VLS_StyleScopedClasses['clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bar-container']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-percent']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['status-breakdown']} */ ;
/** @type {__VLS_StyleScopedClasses['status-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['card-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['my-progress']} */ ;
/** @type {__VLS_StyleScopedClasses['my-progress-label']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bar-container']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bar-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-detail']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card--standup']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['standup-content']} */ ;
/** @type {__VLS_StyleScopedClasses['standup-stat']} */ ;
/** @type {__VLS_StyleScopedClasses['standup-count']} */ ;
/** @type {__VLS_StyleScopedClasses['standup-label']} */ ;
/** @type {__VLS_StyleScopedClasses['standup-missing']} */ ;
/** @type {__VLS_StyleScopedClasses['missing-label']} */ ;
/** @type {__VLS_StyleScopedClasses['missing-name']} */ ;
/** @type {__VLS_StyleScopedClasses['card-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['card-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['section-divider']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card--pending']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['count-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['card-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['card-list']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-row']} */ ;
/** @type {__VLS_StyleScopedClasses['review-row']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-author']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-time']} */ ;
/** @type {__VLS_StyleScopedClasses['review-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-action']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--approve']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-action']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--reject']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card--memos']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['count-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['card-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['card-list']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-row']} */ ;
/** @type {__VLS_StyleScopedClasses['clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['review-required']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-author']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['review-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-time']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card--requests']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['count-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['count--blue']} */ ;
/** @type {__VLS_StyleScopedClasses['card-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['card-list']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-row']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-type-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['status-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['card--decisions']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['count-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['count--purple']} */ ;
/** @type {__VLS_StyleScopedClasses['card-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['card-list']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-row']} */ ;
/** @type {__VLS_StyleScopedClasses['decision-row']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-author']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-time']} */ ;
/** @type {__VLS_StyleScopedClasses['error-list']} */ ;
/** @type {__VLS_StyleScopedClasses['error-msg']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Bell: Bell,
            Rocket: Rocket,
            BarChart3: BarChart3,
            Sun: Sun,
            Zap: Zap,
            FileText: FileText,
            memoTypeComponentMap: memoTypeComponentMap,
            router: router,
            dashboard: dashboard,
            sprint: sprint,
            members: members,
            standupNotWritten: standupNotWritten,
            formatTime: formatTime,
            truncate: truncate,
            nudgeRuleLabel: nudgeRuleLabel,
            formatDate: formatDate,
            initiativeStatusLabel: initiativeStatusLabel,
            handleInitiative: handleInitiative,
            convertToEpic: convertToEpic,
            convertToStory: convertToStory,
            resolveFromNudge: resolveFromNudge,
            handleReview: handleReview,
            mySummary: mySummary,
            activities: activities,
            formatActivityTime: formatActivityTime,
            activityIcon: activityIcon,
            activityDesc: activityDesc,
            sprintSummary: sprintSummary,
            velocityData: velocityData,
            sprintHistory: sprintHistory,
            maxHistorySP: maxHistorySP,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
