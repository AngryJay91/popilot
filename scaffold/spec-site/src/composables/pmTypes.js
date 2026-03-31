/**
 * PM Store — Type definitions, DB row mappers, and constants
 */
export function mapEpic(r) {
    return {
        id: r.id,
        title: r.title,
        description: r.description,
        status: (r.status ?? 'active'),
        owner: r.owner,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}
export function mapStory(r) {
    return {
        id: r.id,
        epicId: r.epic_id,
        sprint: r.sprint ?? '',
        title: r.title,
        description: r.description,
        acceptanceCriteria: r.acceptance_criteria,
        assignee: r.assignee,
        status: r.status,
        priority: (r.priority ?? 'medium'),
        area: r.area ?? 'FE',
        storyPoints: r.story_points,
        startDate: r.start_date ?? null,
        dueDate: r.due_date ?? null,
        figmaUrl: r.figma_url ?? null,
        relatedPrs: r.related_prs ? JSON.parse(r.related_prs) : [],
        sortOrder: r.sort_order,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}
export function mapTask(r) {
    return {
        id: r.id,
        storyId: r.story_id,
        title: r.title,
        assignee: r.assignee,
        status: r.status,
        description: r.description,
        storyPoints: r.story_points ?? null,
        dueDate: r.due_date ?? null,
        sortOrder: r.sort_order,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
}
// ── Status constants ──
export const STORY_STATUSES = ['draft', 'backlog', 'ready', 'in-progress', 'review', 'qa', 'done'];
export const TASK_STATUSES = ['todo', 'in-progress', 'done'];
export const PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const AREAS = ['FE', 'BE', 'Design', 'Data', 'Infra', 'PO'];
export const EPIC_STATUSES = ['active', 'completed', 'archived'];
export const STORY_STATUS_LABELS = {
    'draft': 'Draft',
    'backlog': 'Backlog',
    'ready': 'Ready',
    'in-progress': 'In Progress',
    'review': 'Review',
    'qa': 'QA',
    'done': 'Done',
};
export const TASK_STATUS_LABELS = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'done': 'Done',
};
export const PRIORITY_LABELS = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'critical': 'Critical',
};
export const EPIC_STATUS_LABELS = {
    'active': 'Active',
    'completed': 'Completed',
    'archived': 'Archived',
};
