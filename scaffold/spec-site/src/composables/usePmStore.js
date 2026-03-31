/**
 * PM Store — API-backed epics, stories & tasks
 *
 * Singleton pattern: refs are module-level, shared across all consumers.
 * In static mode, all data is empty and CRUD operations are disabled.
 */
import { ref } from 'vue';
import { apiGet, apiPost, apiPatch, apiDelete, isStaticMode } from '@/api/client';
import { mapEpic, mapStory, mapTask, } from './pmTypes';
export { STORY_STATUSES, TASK_STATUSES, PRIORITIES, AREAS, EPIC_STATUSES, STORY_STATUS_LABELS, TASK_STATUS_LABELS, PRIORITY_LABELS, EPIC_STATUS_LABELS, } from './pmTypes';
// ── Singleton state ──
export const pmEpics = ref([]);
export const stories = ref([]);
export const tasks = ref([]);
export const pmLoaded = ref(false);
// ── Load ──
export async function loadEpics() {
    if (isStaticMode())
        return;
    const { data, error } = await apiGet('/api/v2/pm/epics');
    if (!error && data) {
        pmEpics.value = data.epics.map(mapEpic);
    }
}
export async function loadPmData(sprint) {
    if (isStaticMode()) {
        pmLoaded.value = true;
        return;
    }
    const params = {};
    if (sprint)
        params.sprint = sprint;
    const { data, error } = await apiGet('/api/v2/pm/data', params);
    if (!error && data) {
        stories.value = data.stories.map(mapStory);
        tasks.value = data.tasks.map(mapTask);
    }
    pmLoaded.value = true;
}
// ── Epic CRUD ──
export async function addEpic(data) {
    if (isStaticMode())
        return { error: 'CRUD not available in static mode' };
    const { data: resp, error } = await apiPost('/api/v2/pm/epics', {
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? 'active',
        owner: data.owner ?? null,
    });
    if (error)
        return { error };
    await loadEpics();
    return { id: resp?.id };
}
export async function updateEpic(id, data) {
    if (isStaticMode())
        return { error: 'CRUD not available in static mode' };
    const { error } = await apiPatch(`/api/v2/pm/epics/${id}`, data);
    if (error)
        return { error };
    await loadEpics();
    return {};
}
export async function deleteEpic(id) {
    if (isStaticMode())
        return { error: 'CRUD not available in static mode' };
    const { error } = await apiDelete(`/api/v2/pm/epics/${id}`);
    if (error)
        return { error };
    await loadEpics();
    return {};
}
// ── Story CRUD ──
export async function addStory(data) {
    if (isStaticMode())
        return { error: 'CRUD not available in static mode' };
    const maxOrder = stories.value
        .filter(s => s.sprint === data.sprint)
        .reduce((max, s) => Math.max(max, s.sortOrder), -1);
    const { data: resp, error } = await apiPost('/api/v2/pm/stories', {
        epicId: data.epicId,
        sprint: data.sprint,
        title: data.title,
        description: data.description ?? null,
        acceptanceCriteria: data.acceptanceCriteria ?? null,
        assignee: data.assignee ?? null,
        status: data.status ?? 'draft',
        priority: data.priority ?? 'medium',
        area: data.area ?? 'FE',
        storyPoints: data.storyPoints ?? null,
        sortOrder: maxOrder + 1,
    });
    if (error)
        return { error };
    await loadPmData(data.sprint);
    return { id: resp?.id };
}
export async function updateStory(id, data) {
    if (isStaticMode())
        return { error: 'CRUD not available in static mode' };
    const { error } = await apiPatch(`/api/v2/pm/stories/${id}`, data);
    if (error)
        return { error };
    await loadPmData();
    return {};
}
export async function deleteStory(id) {
    if (isStaticMode())
        return { error: 'CRUD not available in static mode' };
    const { error } = await apiDelete(`/api/v2/pm/stories/${id}`);
    if (error)
        return { error };
    await loadPmData();
    return {};
}
// ── Task CRUD ──
export async function addTask(data) {
    if (isStaticMode())
        return { error: 'CRUD not available in static mode' };
    const maxOrder = tasks.value
        .filter(t => t.storyId === data.storyId)
        .reduce((max, t) => Math.max(max, t.sortOrder), -1);
    const { data: resp, error } = await apiPost('/api/v2/pm/tasks', {
        storyId: data.storyId,
        title: data.title,
        assignee: data.assignee ?? null,
        description: data.description ?? null,
        sortOrder: maxOrder + 1,
    });
    if (error)
        return { error };
    await loadPmData();
    return { id: resp?.id };
}
export async function updateTask(id, data) {
    if (isStaticMode())
        return { error: 'CRUD not available in static mode' };
    const { error } = await apiPatch(`/api/v2/pm/tasks/${id}`, data);
    if (error)
        return { error };
    await loadPmData();
    return {};
}
export async function deleteTask(id) {
    if (isStaticMode())
        return { error: 'CRUD not available in static mode' };
    const { error } = await apiDelete(`/api/v2/pm/tasks/${id}`);
    if (error)
        return { error };
    await loadPmData();
    return {};
}
// ── Helpers ──
export function getStoriesForEpic(epicId) {
    return stories.value.filter(s => s.epicId === epicId);
}
export function getStoriesForSprint(sprint) {
    return stories.value.filter(s => s.sprint === sprint);
}
export function getEpicById(id) {
    return pmEpics.value.find(e => e.id === id);
}
export function getTasksForStory(storyId) {
    return tasks.value.filter(t => t.storyId === storyId);
}
export function getBacklogStories() {
    return stories.value.filter(s => s.status === 'backlog');
}
export function getMyStories(user) {
    return stories.value.filter(s => s.assignee === user);
}
export function getMyTasks(user) {
    return tasks.value.filter(t => t.assignee === user);
}
export async function updateStoryStatus(id, status) {
    return updateStory(id, { status });
}
export async function updateTaskStatus(id, status) {
    return updateTask(id, { status });
}
export async function moveToSprint(storyId, sprint) {
    return updateStory(storyId, { sprint });
}
export async function loadBacklog() {
    if (isStaticMode())
        return;
    const { data, error } = await apiGet('/api/v2/pm/data', { status: 'backlog' });
    if (!error && data) {
        // Merge backlog stories into existing list (avoid duplicates)
        const existingIds = new Set(stories.value.map(s => s.id));
        for (const row of data.stories) {
            if (!existingIds.has(row.id)) {
                stories.value.push(mapStory(row));
            }
        }
        const existingTaskIds = new Set(tasks.value.map(t => t.id));
        for (const row of data.tasks) {
            if (!existingTaskIds.has(row.id)) {
                tasks.value.push(mapTask(row));
            }
        }
    }
}
