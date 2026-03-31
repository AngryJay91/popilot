import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { pmEpics, loadEpics, loadPmData, stories, getStoriesForSprint, getBacklogStories, getEpicById, updateStoryStatus, updateStory, moveToSprint, loadBacklog, STORY_STATUSES, STORY_STATUS_LABELS, } from '@/composables/usePmStore';
import { getActiveSprint } from '@/composables/useNavStore';
import BoardEpicSection from './BoardEpicSection.vue';
import BoardStoryCard from './BoardStoryCard.vue';
import StoryDetailPanel from './StoryDetailPanel.vue';
const route = useRoute();
const router = useRouter();
const loading = ref(true);
const loadError = ref('');
const selectedStory = ref(null);
const sprint = computed(() => route.params.sprint || (route.path === '/board/backlog' ? 'backlog' : getActiveSprint().id));
// Sync viewMode with URL query
const viewMode = computed({
    get: () => {
        const v = route.query.view;
        if (v === 'kanban')
            return 'kanban';
        if (v === 'timeline')
            return 'timeline';
        if (v === 'roadmap')
            return 'roadmap';
        return 'epic';
    },
    set: (v) => {
        router.replace({ query: v === 'epic' ? {} : { view: v } });
    },
});
// Reload data on sprint change
watch(() => route.params.sprint, async (newSprint, oldSprint) => {
    if (newSprint && newSprint !== oldSprint) {
        loading.value = true;
        loadError.value = '';
        try {
            await refresh();
        }
        catch (e) {
            loadError.value = 'Failed to load data';
        }
        loading.value = false;
    }
});
const isBacklog = computed(() => sprint.value === 'backlog');
// Timeline view
const timelineStories = computed(() => sprintStories.value.filter((s) => s.startDate || s.dueDate));
const sprintRange = computed(() => {
    const dates = timelineStories.value.flatMap((s) => [s.startDate, s.dueDate].filter(Boolean));
    if (!dates.length)
        return { start: new Date(), end: new Date() };
    const sorted = dates.sort();
    return { start: new Date(sorted[0]), end: new Date(sorted[sorted.length - 1]) };
});
const tlChartRef = ref(null);
const timelineDates = computed(() => {
    const activeSprint = getActiveSprint();
    const spStart = activeSprint.startDate ? new Date(activeSprint.startDate) : sprintRange.value.start;
    const spEnd = activeSprint.endDate ? new Date(activeSprint.endDate) : sprintRange.value.end;
    const dates = [];
    const d = new Date(spStart);
    d.setDate(d.getDate() - 1);
    const endDate = new Date(spEnd);
    endDate.setDate(endDate.getDate() + 1);
    const todayStr = new Date().toISOString().split('T')[0];
    while (d <= endDate) {
        const key = d.toISOString().split('T')[0];
        const day = d.getDay();
        dates.push({
            key,
            label: `${d.getMonth() + 1}/${d.getDate()}`,
            isWeekend: day === 0 || day === 6,
            isToday: key === todayStr,
        });
        d.setDate(d.getDate() + 1);
    }
    return dates;
});
const cellWidth = 40; // px per day
function timelineBarStyle(story) {
    if (!timelineDates.value.length)
        return {};
    const firstDate = timelineDates.value[0].key;
    const sDate = story.startDate ?? firstDate;
    const eDate = story.dueDate ?? sDate;
    const startIdx = timelineDates.value.findIndex(d => d.key >= sDate);
    const endIdx = timelineDates.value.findIndex(d => d.key > eDate);
    const left = (startIdx >= 0 ? startIdx : 0) * cellWidth;
    const width = Math.max(cellWidth, ((endIdx >= 0 ? endIdx : timelineDates.value.length) - (startIdx >= 0 ? startIdx : 0)) * cellWidth);
    return { left: `${left}px`, width: `${width}px` };
}
const tlGroupBy = ref('none');
const tlDisplayStories = computed(() => {
    const items = timelineStories.value;
    if (tlGroupBy.value === 'none')
        return items;
    if (tlGroupBy.value === 'assignee') {
        const groups = new Map();
        for (const s of items) {
            const key = s.assignee ?? 'Unassigned';
            if (!groups.has(key))
                groups.set(key, []);
            groups.get(key).push(s);
        }
        return [...groups.values()].flat();
    }
    if (tlGroupBy.value === 'epic') {
        const groups = new Map();
        for (const s of items) {
            if (!groups.has(s.epicId))
                groups.set(s.epicId, []);
            groups.get(s.epicId).push(s);
        }
        return [...groups.values()].flat();
    }
    return items;
});
// Roadmap view
const roadmapStatusFilter = ref('');
const expandedEpics = ref(new Set());
const filteredEpics = computed(() => {
    const epics = pmEpics.value;
    if (!roadmapStatusFilter.value)
        return epics;
    return epics.filter(e => e.status === roadmapStatusFilter.value);
});
function toggleEpicExpand(id) {
    if (expandedEpics.value.has(id))
        expandedEpics.value.delete(id);
    else
        expandedEpics.value.add(id);
}
function epicStories(epicId) {
    return sprintStories.value.filter((s) => s.epicId === epicId);
}
function epicDoneCount(epicId) { return epicStories(epicId).filter((s) => s.status === 'done').length; }
function epicTotalCount(epicId) { return epicStories(epicId).length; }
function epicDoneSP(epicId) { return epicStories(epicId).filter((s) => s.status === 'done').reduce((sum, s) => sum + (s.storyPoints ?? 0), 0); }
function epicTotalSP(epicId) { return epicStories(epicId).reduce((sum, s) => sum + (s.storyPoints ?? 0), 0); }
function epicProgress(epicId) {
    const total = epicTotalCount(epicId);
    return total ? Math.round((epicDoneCount(epicId) / total) * 100) : 0;
}
// Backlog drawer
const backlogOpen = ref(false);
const backlogStoryList = computed(() => getBacklogStories());
async function assignToCurrentSprint(storyId) {
    await updateStory(storyId, { sprint: getActiveSprint().id });
    await refresh();
    await loadBacklog();
}
// Sprint stories grouped by epicId
const sprintStories = computed(() => isBacklog.value ? getBacklogStories() : getStoriesForSprint(sprint.value));
const epicGroups = computed(() => {
    const groups = new Map();
    for (const s of sprintStories.value) {
        const key = s.epicId;
        if (!groups.has(key))
            groups.set(key, []);
        groups.get(key).push(s);
    }
    return groups;
});
const sortedEpicKeys = computed(() => {
    const keys = [...epicGroups.value.keys()];
    return keys.sort((a, b) => {
        if (a === null)
            return 1;
        if (b === null)
            return -1;
        return a - b;
    });
});
// Kanban: group by status
const kanbanColumns = computed(() => {
    const cols = [];
    for (const status of STORY_STATUSES) {
        cols.push({
            status,
            label: STORY_STATUS_LABELS[status],
            stories: sprintStories.value.filter((s) => s.status === status),
        });
    }
    return cols;
});
// Summary stats
const statsSummary = computed(() => {
    const all = sprintStories.value;
    return {
        total: all.length,
        done: all.filter((s) => s.status === 'done').length,
        inProgress: all.filter((s) => s.status === 'in-progress').length,
        review: all.filter((s) => s.status === 'review').length,
    };
});
async function refresh() {
    await loadPmData(isBacklog.value ? 'backlog' : sprint.value);
    if (selectedStory.value) {
        const fresh = stories.value.find((s) => s.id === selectedStory.value.id);
        if (fresh)
            selectedStory.value = fresh;
    }
}
async function handleMoveToSprint(story) {
    const active = getActiveSprint();
    if (!active)
        return;
    await moveToSprint(story.id, active.id);
    await refresh();
}
async function handleMoveToBacklog(story) {
    await moveToSprint(story.id, null);
    await refresh();
}
function openDetail(story) {
    selectedStory.value = story;
}
function onPanelUpdated() {
    refresh();
}
// Drag and drop
const dragStoryId = ref(null);
const dragOverCol = ref(null);
function onDragStart(e, story) {
    dragStoryId.value = story.id;
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(story.id));
    }
}
function onDragOver(e, status) {
    e.preventDefault();
    if (e.dataTransfer)
        e.dataTransfer.dropEffect = 'move';
    dragOverCol.value = status;
}
function onDragLeave(status) {
    if (dragOverCol.value === status)
        dragOverCol.value = null;
}
async function onDrop(e, targetStatus) {
    e.preventDefault();
    dragOverCol.value = null;
    const storyId = dragStoryId.value;
    dragStoryId.value = null;
    if (!storyId)
        return;
    const story = stories.value.find((s) => s.id === storyId);
    if (!story || story.status === targetStatus)
        return;
    // optimistic update
    const prevStatus = story.status;
    story.status = targetStatus;
    try {
        await updateStoryStatus(storyId, targetStatus);
    }
    catch {
        // rollback
        story.status = prevStatus;
        alert('Status update failed. Reverted to previous status.');
    }
}
function onDragEnd() {
    dragStoryId.value = null;
    dragOverCol.value = null;
}
onMounted(async () => {
    await loadEpics();
    await refresh();
    loading.value = false;
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['board-title-row']} */ ;
/** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-num']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-num']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-num']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-list']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-card-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-body']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-filter-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-label']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-date-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-date-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-weekend']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-today']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['backlog-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['backlog-story-row']} */ ;
/** @type {__VLS_StyleScopedClasses['backlog-assign-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-card']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-story']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['board-page']} */ ;
/** @type {__VLS_StyleScopedClasses['board-header']} */ ;
/** @type {__VLS_StyleScopedClasses['board-header']} */ ;
/** @type {__VLS_StyleScopedClasses['board-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['board-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-board']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-header']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "board-scroll" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "board-page" },
    ...{ class: ({ 'board-page--kanban': __VLS_ctx.viewMode === 'kanban' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "board-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "board-title-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
(__VLS_ctx.isBacklog ? 'Backlog' : __VLS_ctx.sprint.toUpperCase() + ' Board');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "board-title-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "view-toggle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.viewMode = 'epic';
        } },
    ...{ class: "view-btn" },
    ...{ class: ({ active: __VLS_ctx.viewMode === 'epic' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.viewMode = 'kanban';
        } },
    ...{ class: "view-btn" },
    ...{ class: ({ active: __VLS_ctx.viewMode === 'kanban' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.viewMode = 'timeline';
        } },
    ...{ class: "view-btn" },
    ...{ class: ({ active: __VLS_ctx.viewMode === 'timeline' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.viewMode = 'roadmap';
        } },
    ...{ class: "view-btn" },
    ...{ class: ({ active: __VLS_ctx.viewMode === 'roadmap' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/board');
        } },
    ...{ class: "btn btn--sm" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "board-stats" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "stat" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "stat-num" },
});
(__VLS_ctx.statsSummary.total);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "stat stat--done" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "stat-num" },
});
(__VLS_ctx.statsSummary.done);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "stat stat--progress" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "stat-num" },
});
(__VLS_ctx.statsSummary.inProgress);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "stat stat--review" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "stat-num" },
});
(__VLS_ctx.statsSummary.review);
if (__VLS_ctx.statsSummary.total > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "progress-bar-wrap" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "progress-bar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "progress-seg progress-seg--done" },
        ...{ style: ({ width: (__VLS_ctx.statsSummary.done / __VLS_ctx.statsSummary.total * 100) + '%' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "progress-seg progress-seg--review" },
        ...{ style: ({ width: (__VLS_ctx.statsSummary.review / __VLS_ctx.statsSummary.total * 100) + '%' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "progress-seg progress-seg--progress" },
        ...{ style: ({ width: (__VLS_ctx.statsSummary.inProgress / __VLS_ctx.statsSummary.total * 100) + '%' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "progress-pct" },
    });
    (Math.round(__VLS_ctx.statsSummary.done / __VLS_ctx.statsSummary.total * 100));
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading" },
    });
}
else if (__VLS_ctx.loadError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "error-banner" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.loadError);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.refresh) },
        ...{ class: "btn btn--sm" },
    });
}
else if (__VLS_ctx.sprintStories.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    (__VLS_ctx.isBacklog ? 'Backlog is empty' : 'No stories');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.isBacklog ? 'Add new stories to the backlog' : 'No stories registered for this sprint');
}
else if (__VLS_ctx.viewMode === 'epic') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "epic-list" },
    });
    for (const [epicId] of __VLS_getVForSourceType((__VLS_ctx.sortedEpicKeys))) {
        /** @type {[typeof BoardEpicSection, ]} */ ;
        // @ts-ignore
        const __VLS_0 = __VLS_asFunctionalComponent(BoardEpicSection, new BoardEpicSection({
            ...{ 'onUpdated': {} },
            ...{ 'onSelectStory': {} },
            key: (epicId ?? 'unassigned'),
            epic: (epicId !== null ? __VLS_ctx.getEpicById(epicId) ?? null : null),
            stories: (__VLS_ctx.epicGroups.get(epicId) ?? []),
        }));
        const __VLS_1 = __VLS_0({
            ...{ 'onUpdated': {} },
            ...{ 'onSelectStory': {} },
            key: (epicId ?? 'unassigned'),
            epic: (epicId !== null ? __VLS_ctx.getEpicById(epicId) ?? null : null),
            stories: (__VLS_ctx.epicGroups.get(epicId) ?? []),
        }, ...__VLS_functionalComponentArgsRest(__VLS_0));
        let __VLS_3;
        let __VLS_4;
        let __VLS_5;
        const __VLS_6 = {
            onUpdated: (__VLS_ctx.refresh)
        };
        const __VLS_7 = {
            onSelectStory: (__VLS_ctx.openDetail)
        };
        var __VLS_2;
    }
    if (__VLS_ctx.isBacklog && __VLS_ctx.sprintStories.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "backlog-hint-bar" },
        });
    }
}
else if (__VLS_ctx.viewMode === 'kanban') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "kanban-board" },
    });
    for (const [col] of __VLS_getVForSourceType((__VLS_ctx.kanbanColumns))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onDragover: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.loadError))
                        return;
                    if (!!(__VLS_ctx.sprintStories.length === 0))
                        return;
                    if (!!(__VLS_ctx.viewMode === 'epic'))
                        return;
                    if (!(__VLS_ctx.viewMode === 'kanban'))
                        return;
                    __VLS_ctx.onDragOver($event, col.status);
                } },
            ...{ onDragleave: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.loadError))
                        return;
                    if (!!(__VLS_ctx.sprintStories.length === 0))
                        return;
                    if (!!(__VLS_ctx.viewMode === 'epic'))
                        return;
                    if (!(__VLS_ctx.viewMode === 'kanban'))
                        return;
                    __VLS_ctx.onDragLeave(col.status);
                } },
            ...{ onDrop: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.loadError))
                        return;
                    if (!!(__VLS_ctx.sprintStories.length === 0))
                        return;
                    if (!!(__VLS_ctx.viewMode === 'epic'))
                        return;
                    if (!(__VLS_ctx.viewMode === 'kanban'))
                        return;
                    __VLS_ctx.onDrop($event, col.status);
                } },
            key: (col.status),
            ...{ class: "kanban-col" },
            ...{ class: ({ 'kanban-col--dragover': __VLS_ctx.dragOverCol === col.status }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "kanban-col-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "kanban-col-dot" },
            'data-status': (col.status),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "kanban-col-label" },
        });
        (col.label);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "kanban-col-count" },
        });
        (col.stories.length);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "kanban-col-body" },
        });
        for (const [story] of __VLS_getVForSourceType((col.stories))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onDragstart: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.loadError))
                            return;
                        if (!!(__VLS_ctx.sprintStories.length === 0))
                            return;
                        if (!!(__VLS_ctx.viewMode === 'epic'))
                            return;
                        if (!(__VLS_ctx.viewMode === 'kanban'))
                            return;
                        __VLS_ctx.onDragStart($event, story);
                    } },
                ...{ onDragend: (__VLS_ctx.onDragEnd) },
                key: (story.id),
                ...{ class: "kanban-card-wrap" },
                ...{ class: ({ 'kanban-card--dragging': __VLS_ctx.dragStoryId === story.id }) },
                draggable: "true",
            });
            /** @type {[typeof BoardStoryCard, ]} */ ;
            // @ts-ignore
            const __VLS_8 = __VLS_asFunctionalComponent(BoardStoryCard, new BoardStoryCard({
                ...{ 'onSelect': {} },
                ...{ 'onUpdated': {} },
                story: (story),
            }));
            const __VLS_9 = __VLS_8({
                ...{ 'onSelect': {} },
                ...{ 'onUpdated': {} },
                story: (story),
            }, ...__VLS_functionalComponentArgsRest(__VLS_8));
            let __VLS_11;
            let __VLS_12;
            let __VLS_13;
            const __VLS_14 = {
                onSelect: (__VLS_ctx.openDetail)
            };
            const __VLS_15 = {
                onUpdated: (__VLS_ctx.refresh)
            };
            var __VLS_10;
        }
        if (col.stories.length === 0) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "kanban-empty" },
            });
        }
    }
}
else if (__VLS_ctx.viewMode === 'timeline') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "timeline-view" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "tl-filter" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(__VLS_ctx.loadError))
                    return;
                if (!!(__VLS_ctx.sprintStories.length === 0))
                    return;
                if (!!(__VLS_ctx.viewMode === 'epic'))
                    return;
                if (!!(__VLS_ctx.viewMode === 'kanban'))
                    return;
                if (!(__VLS_ctx.viewMode === 'timeline'))
                    return;
                __VLS_ctx.tlGroupBy = 'none';
            } },
        ...{ class: "tl-filter-btn" },
        ...{ class: ({ active: __VLS_ctx.tlGroupBy === 'none' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(__VLS_ctx.loadError))
                    return;
                if (!!(__VLS_ctx.sprintStories.length === 0))
                    return;
                if (!!(__VLS_ctx.viewMode === 'epic'))
                    return;
                if (!!(__VLS_ctx.viewMode === 'kanban'))
                    return;
                if (!(__VLS_ctx.viewMode === 'timeline'))
                    return;
                __VLS_ctx.tlGroupBy = 'assignee';
            } },
        ...{ class: "tl-filter-btn" },
        ...{ class: ({ active: __VLS_ctx.tlGroupBy === 'assignee' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!!(__VLS_ctx.loadError))
                    return;
                if (!!(__VLS_ctx.sprintStories.length === 0))
                    return;
                if (!!(__VLS_ctx.viewMode === 'epic'))
                    return;
                if (!!(__VLS_ctx.viewMode === 'kanban'))
                    return;
                if (!(__VLS_ctx.viewMode === 'timeline'))
                    return;
                __VLS_ctx.tlGroupBy = 'epic';
            } },
        ...{ class: "tl-filter-btn" },
        ...{ class: ({ active: __VLS_ctx.tlGroupBy === 'epic' }) },
    });
    if (__VLS_ctx.tlDisplayStories.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "timeline-empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "tl-container" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "tl-labels" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "tl-label-header" },
        });
        for (const [s] of __VLS_getVForSourceType((__VLS_ctx.tlDisplayStories))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.loadError))
                            return;
                        if (!!(__VLS_ctx.sprintStories.length === 0))
                            return;
                        if (!!(__VLS_ctx.viewMode === 'epic'))
                            return;
                        if (!!(__VLS_ctx.viewMode === 'kanban'))
                            return;
                        if (!(__VLS_ctx.viewMode === 'timeline'))
                            return;
                        if (!!(__VLS_ctx.tlDisplayStories.length === 0))
                            return;
                        __VLS_ctx.openDetail(s);
                    } },
                key: ('l' + s.id),
                ...{ class: "tl-label" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "tl-label-title" },
            });
            (s.title);
            if (s.assignee) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "tl-label-assignee" },
                });
                (s.assignee);
            }
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "tl-chart" },
            ref: "tlChartRef",
        });
        /** @type {typeof __VLS_ctx.tlChartRef} */ ;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "tl-date-header" },
        });
        for (const [d] of __VLS_getVForSourceType((__VLS_ctx.timelineDates))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (d.key),
                ...{ class: "tl-date-cell" },
                ...{ class: ({ 'tl-weekend': d.isWeekend, 'tl-today': d.isToday }) },
            });
            (d.label);
        }
        for (const [s] of __VLS_getVForSourceType((__VLS_ctx.tlDisplayStories))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: ('b' + s.id),
                ...{ class: "tl-bar-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "tl-grid" },
            });
            for (const [d] of __VLS_getVForSourceType((__VLS_ctx.timelineDates))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                    key: (d.key),
                    ...{ class: "tl-grid-cell" },
                    ...{ class: ({ 'tl-weekend': d.isWeekend, 'tl-today': d.isToday }) },
                });
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "tl-bar" },
                ...{ style: (__VLS_ctx.timelineBarStyle(s)) },
                title: (`${s.title} (${s.storyPoints ?? 0} SP)`),
            });
            (s.storyPoints ?? '');
        }
    }
}
if (!__VLS_ctx.isBacklog) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "backlog-drawer" },
        ...{ class: ({ 'backlog-drawer--open': __VLS_ctx.backlogOpen }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.isBacklog))
                    return;
                __VLS_ctx.backlogOpen = !__VLS_ctx.backlogOpen;
            } },
        ...{ class: "backlog-toggle" },
    });
    (__VLS_ctx.backlogOpen ? '&#9660;' : '&#9654;');
    (__VLS_ctx.backlogStoryList.length);
    if (__VLS_ctx.backlogOpen) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "backlog-content" },
        });
        if (__VLS_ctx.backlogStoryList.length === 0) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "backlog-empty" },
            });
        }
        for (const [s] of __VLS_getVForSourceType((__VLS_ctx.backlogStoryList))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.isBacklog))
                            return;
                        if (!(__VLS_ctx.backlogOpen))
                            return;
                        __VLS_ctx.openDetail(s);
                    } },
                key: (s.id),
                ...{ class: "backlog-story-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "backlog-story-title" },
            });
            (s.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "backlog-story-sp" },
            });
            (s.storyPoints ?? '-');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.isBacklog))
                            return;
                        if (!(__VLS_ctx.backlogOpen))
                            return;
                        __VLS_ctx.assignToCurrentSprint(s.id);
                    } },
                ...{ class: "backlog-assign-btn" },
                title: "Assign to current sprint",
            });
        }
    }
}
if (__VLS_ctx.viewMode === 'roadmap') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "roadmap-view" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "roadmap-filters" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.roadmapStatusFilter),
        ...{ class: "filter-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "active",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "completed",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "archived",
    });
    for (const [epic] of __VLS_getVForSourceType((__VLS_ctx.filteredEpics))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.viewMode === 'roadmap'))
                        return;
                    __VLS_ctx.toggleEpicExpand(epic.id);
                } },
            key: (epic.id),
            ...{ class: "roadmap-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "roadmap-card-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "roadmap-epic-info" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "roadmap-epic-title" },
        });
        (epic.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "roadmap-epic-status" },
            ...{ class: ('es--' + epic.status) },
        });
        (epic.status);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "roadmap-progress" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "roadmap-progress-bar" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "roadmap-progress-fill" },
            ...{ style: ({ width: __VLS_ctx.epicProgress(epic.id) + '%' }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "roadmap-progress-text" },
        });
        (__VLS_ctx.epicDoneCount(epic.id));
        (__VLS_ctx.epicTotalCount(epic.id));
        (__VLS_ctx.epicProgress(epic.id));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "roadmap-sp" },
        });
        (__VLS_ctx.epicDoneSP(epic.id));
        (__VLS_ctx.epicTotalSP(epic.id));
        if (__VLS_ctx.expandedEpics.has(epic.id)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "roadmap-stories" },
            });
            for (const [s] of __VLS_getVForSourceType((__VLS_ctx.epicStories(epic.id)))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.viewMode === 'roadmap'))
                                return;
                            if (!(__VLS_ctx.expandedEpics.has(epic.id)))
                                return;
                            __VLS_ctx.openDetail(s);
                        } },
                    key: (s.id),
                    ...{ class: "roadmap-story" },
                    ...{ class: ('rs--' + s.status) },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "roadmap-story-title" },
                });
                (s.id);
                (s.title);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "roadmap-story-sp" },
                });
                (s.storyPoints ?? '-');
            }
        }
    }
}
const __VLS_16 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    to: "body",
}));
const __VLS_18 = __VLS_17({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
if (__VLS_ctx.selectedStory) {
    /** @type {[typeof StoryDetailPanel, ]} */ ;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent(StoryDetailPanel, new StoryDetailPanel({
        ...{ 'onClose': {} },
        ...{ 'onUpdated': {} },
        story: (__VLS_ctx.selectedStory),
    }));
    const __VLS_21 = __VLS_20({
        ...{ 'onClose': {} },
        ...{ 'onUpdated': {} },
        story: (__VLS_ctx.selectedStory),
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
    let __VLS_23;
    let __VLS_24;
    let __VLS_25;
    const __VLS_26 = {
        onClose: (...[$event]) => {
            if (!(__VLS_ctx.selectedStory))
                return;
            __VLS_ctx.selectedStory = null;
        }
    };
    const __VLS_27 = {
        onUpdated: (__VLS_ctx.onPanelUpdated)
    };
    var __VLS_22;
}
var __VLS_19;
/** @type {__VLS_StyleScopedClasses['board-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['board-page']} */ ;
/** @type {__VLS_StyleScopedClasses['board-page--kanban']} */ ;
/** @type {__VLS_StyleScopedClasses['board-header']} */ ;
/** @type {__VLS_StyleScopedClasses['board-title-row']} */ ;
/** @type {__VLS_StyleScopedClasses['board-title-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['view-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['view-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['board-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-num']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat--done']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-num']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat--progress']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-num']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat--review']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-num']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bar-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-seg']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-seg--done']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-seg']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-seg--review']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-seg']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-seg--progress']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-pct']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['error-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-list']} */ ;
/** @type {__VLS_StyleScopedClasses['backlog-hint-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-board']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col--dragover']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-header']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-label']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-count']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-col-body']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-card-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-card--dragging']} */ ;
/** @type {__VLS_StyleScopedClasses['kanban-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-view']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-filter-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-filter-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-filter-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['timeline-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-container']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-labels']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-label-header']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-label']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-label-title']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-label-assignee']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-chart']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-date-header']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-date-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-weekend']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-today']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-bar-row']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-weekend']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-today']} */ ;
/** @type {__VLS_StyleScopedClasses['tl-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['backlog-drawer']} */ ;
/** @type {__VLS_StyleScopedClasses['backlog-drawer--open']} */ ;
/** @type {__VLS_StyleScopedClasses['backlog-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['backlog-content']} */ ;
/** @type {__VLS_StyleScopedClasses['backlog-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['backlog-story-row']} */ ;
/** @type {__VLS_StyleScopedClasses['backlog-story-title']} */ ;
/** @type {__VLS_StyleScopedClasses['backlog-story-sp']} */ ;
/** @type {__VLS_StyleScopedClasses['backlog-assign-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-view']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-filters']} */ ;
/** @type {__VLS_StyleScopedClasses['filter-select']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-card']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-epic-info']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-epic-title']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-epic-status']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-progress']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-progress-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-progress-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-progress-text']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-sp']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-stories']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-story']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-story-title']} */ ;
/** @type {__VLS_StyleScopedClasses['roadmap-story-sp']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            getEpicById: getEpicById,
            BoardEpicSection: BoardEpicSection,
            BoardStoryCard: BoardStoryCard,
            StoryDetailPanel: StoryDetailPanel,
            router: router,
            loading: loading,
            loadError: loadError,
            selectedStory: selectedStory,
            sprint: sprint,
            viewMode: viewMode,
            isBacklog: isBacklog,
            tlChartRef: tlChartRef,
            timelineDates: timelineDates,
            timelineBarStyle: timelineBarStyle,
            tlGroupBy: tlGroupBy,
            tlDisplayStories: tlDisplayStories,
            roadmapStatusFilter: roadmapStatusFilter,
            expandedEpics: expandedEpics,
            filteredEpics: filteredEpics,
            toggleEpicExpand: toggleEpicExpand,
            epicStories: epicStories,
            epicDoneCount: epicDoneCount,
            epicTotalCount: epicTotalCount,
            epicDoneSP: epicDoneSP,
            epicTotalSP: epicTotalSP,
            epicProgress: epicProgress,
            backlogOpen: backlogOpen,
            backlogStoryList: backlogStoryList,
            assignToCurrentSprint: assignToCurrentSprint,
            sprintStories: sprintStories,
            epicGroups: epicGroups,
            sortedEpicKeys: sortedEpicKeys,
            kanbanColumns: kanbanColumns,
            statsSummary: statsSummary,
            refresh: refresh,
            openDetail: openDetail,
            onPanelUpdated: onPanelUpdated,
            dragStoryId: dragStoryId,
            dragOverCol: dragOverCol,
            onDragStart: onDragStart,
            onDragOver: onDragOver,
            onDragLeave: onDragLeave,
            onDrop: onDrop,
            onDragEnd: onDragEnd,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
