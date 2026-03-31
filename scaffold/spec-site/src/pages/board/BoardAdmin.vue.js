import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { sprints, loaded, loadNavData } from '@/composables/useNavStore';
import { pmEpics, stories, loadEpics, loadPmData, addEpic as addPmEpic, updateEpic as updatePmEpic, deleteEpic as deletePmEpic, addStory, updateStory, deleteStory, addTask, updateTask, deleteTask, getStoriesForSprint, getTasksForStory, getEpicById, STORY_STATUSES, TASK_STATUSES, PRIORITIES, AREAS, EPIC_STATUSES, STORY_STATUS_LABELS, TASK_STATUS_LABELS, PRIORITY_LABELS, EPIC_STATUS_LABELS, } from '@/composables/usePmStore';
const router = useRouter();
const loading = ref(true);
const statusMsg = ref('');
const selectedSprint = ref('');
const activeTab = ref('stories');
function clearStatus() { setTimeout(() => { statusMsg.value = ''; }, 3000); }
// Epic management
const epicForm = ref({ title: '', description: '', status: 'active', owner: '' });
const showEpicForm = ref(false);
const editingEpic = ref(null);
const editEpicData = ref({ title: '', description: '', status: 'active', owner: '' });
async function handleAddEpic() {
    if (!epicForm.value.title.trim())
        return;
    const f = epicForm.value;
    const r = await addPmEpic({ title: f.title.trim(), description: f.description.trim() || null, status: f.status, owner: f.owner || null });
    if (r.error) {
        statusMsg.value = `Error: ${r.error}`;
    }
    else {
        statusMsg.value = 'Epic added';
        showEpicForm.value = false;
        epicForm.value = { title: '', description: '', status: 'active', owner: '' };
    }
    clearStatus();
}
function startEditEpic(e) {
    editingEpic.value = e.id;
    editEpicData.value = { title: e.title, description: e.description ?? '', status: e.status, owner: e.owner ?? '' };
}
async function saveEditEpic(id) {
    const d = editEpicData.value;
    const r = await updatePmEpic(id, { title: d.title, description: d.description || null, status: d.status, owner: d.owner || null });
    if (r.error) {
        statusMsg.value = `Error: ${r.error}`;
    }
    else {
        statusMsg.value = 'Epic updated';
        editingEpic.value = null;
    }
    clearStatus();
}
async function handleDeleteEpic(id, title) {
    if (!confirm(`Delete "${title}" epic? Child stories will become unassigned.`))
        return;
    const r = await deletePmEpic(id);
    if (r.error) {
        statusMsg.value = `Error: ${r.error}`;
    }
    else {
        statusMsg.value = 'Epic deleted';
    }
    clearStatus();
}
function epicStoryCount(epicId) {
    const s = stories.value.filter(st => st.epicId === epicId);
    return { total: s.length, done: s.filter(st => st.status === 'done').length };
}
// Sprint stories
const sprintStories = computed(() => getStoriesForSprint(selectedSprint.value));
const epicGroupedStories = computed(() => {
    const groups = new Map();
    for (const s of sprintStories.value) {
        if (!groups.has(s.epicId))
            groups.set(s.epicId, []);
        groups.get(s.epicId).push(s);
    }
    return [...groups.entries()].sort(([a], [b]) => { if (a === null)
        return 1; if (b === null)
        return -1; return a - b; });
});
// Story form
const storyFormEpicId = ref(null);
const storyForm = ref({
    title: '', description: '', acceptanceCriteria: '',
    assignee: '', status: 'draft', priority: 'medium',
    area: 'FE', storyPoints: '', epicId: null,
});
function showStoryForm() {
    storyFormEpicId.value = 'show';
    storyForm.value = { title: '', description: '', acceptanceCriteria: '', assignee: '', status: 'draft', priority: 'medium', area: 'FE', storyPoints: '', epicId: null };
}
async function handleAddStory() {
    if (!storyForm.value.title.trim())
        return;
    const f = storyForm.value;
    const r = await addStory({ epicId: f.epicId, sprint: selectedSprint.value, title: f.title.trim(), description: f.description.trim() || null, acceptanceCriteria: f.acceptanceCriteria.trim() || null, assignee: f.assignee || null, status: f.status, priority: f.priority, area: f.area, storyPoints: f.storyPoints ? Number(f.storyPoints) : null });
    if (r.error) {
        statusMsg.value = `Error: ${r.error}`;
    }
    else {
        statusMsg.value = 'Story added';
        storyFormEpicId.value = null;
    }
    clearStatus();
}
// Story edit
const editingStory = ref(null);
const editStoryData = ref({ title: '', description: '', acceptanceCriteria: '', assignee: '', status: 'draft', priority: 'medium', area: 'FE', storyPoints: '', epicId: null, sprint: '' });
function startEditStory(s) {
    editingStory.value = s.id;
    editStoryData.value = { title: s.title, description: s.description ?? '', acceptanceCriteria: s.acceptanceCriteria ?? '', assignee: s.assignee ?? '', status: s.status, priority: s.priority, area: s.area, storyPoints: s.storyPoints?.toString() ?? '', epicId: s.epicId, sprint: s.sprint };
}
async function saveEditStory(id) {
    const d = editStoryData.value;
    const r = await updateStory(id, { title: d.title, description: d.description || null, acceptanceCriteria: d.acceptanceCriteria || null, assignee: d.assignee || null, status: d.status, priority: d.priority, area: d.area, storyPoints: d.storyPoints ? Number(d.storyPoints) : null, epicId: d.epicId, sprint: d.sprint });
    if (r.error) {
        statusMsg.value = `Error: ${r.error}`;
    }
    else {
        statusMsg.value = 'Story updated';
        editingStory.value = null;
        await loadPmData(selectedSprint.value);
    }
    clearStatus();
}
async function handleDeleteStory(id, title) {
    if (!confirm(`Delete "${title}" story and all its tasks?`))
        return;
    const r = await deleteStory(id);
    if (r.error) {
        statusMsg.value = `Error: ${r.error}`;
    }
    else {
        statusMsg.value = 'Story deleted';
        await loadPmData(selectedSprint.value);
    }
    clearStatus();
}
// Task form
const taskFormStoryId = ref(null);
const taskForm = ref({ title: '', assignee: '', description: '' });
function showTaskForm(storyId) { taskFormStoryId.value = storyId; taskForm.value = { title: '', assignee: '', description: '' }; }
async function handleAddTask() {
    if (!taskFormStoryId.value || !taskForm.value.title.trim())
        return;
    const f = taskForm.value;
    const r = await addTask({ storyId: taskFormStoryId.value, title: f.title.trim(), assignee: f.assignee || null, description: f.description.trim() || null });
    if (r.error) {
        statusMsg.value = `Error: ${r.error}`;
    }
    else {
        statusMsg.value = 'Task added';
        taskFormStoryId.value = null;
    }
    clearStatus();
}
// Task edit
const editingTask = ref(null);
const editTaskData = ref({ title: '', assignee: '', description: '', status: 'todo' });
function startEditTask(t) {
    editingTask.value = t.id;
    editTaskData.value = { title: t.title, assignee: t.assignee ?? '', description: t.description ?? '', status: t.status };
}
async function saveEditTask(id) {
    const d = editTaskData.value;
    const r = await updateTask(id, { title: d.title, assignee: d.assignee || null, description: d.description || null, status: d.status });
    if (r.error) {
        statusMsg.value = `Error: ${r.error}`;
    }
    else {
        statusMsg.value = 'Task updated';
        editingTask.value = null;
    }
    clearStatus();
}
async function handleDeleteTask(id) {
    if (!confirm('Delete this task?'))
        return;
    const r = await deleteTask(id);
    if (r.error) {
        statusMsg.value = `Error: ${r.error}`;
    }
    else {
        statusMsg.value = 'Task deleted';
    }
    clearStatus();
}
async function onSprintChange() { await loadPmData(selectedSprint.value); }
onMounted(async () => {
    if (!loaded.value)
        await loadNavData();
    await loadEpics();
    const active = sprints.value.find(s => s.active);
    selectedSprint.value = active?.id ?? sprints.value[0]?.id ?? '';
    await loadPmData(selectedSprint.value);
    loading.value = false;
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['admin-header']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['story-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['task-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['story-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['story-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['story-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['task-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['in-progress']} */ ;
/** @type {__VLS_StyleScopedClasses['story-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['story-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['task-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['done']} */ ;
/** @type {__VLS_StyleScopedClasses['add-form']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--danger']} */ ;
/** @type {__VLS_StyleScopedClasses['admin']} */ ;
/** @type {__VLS_StyleScopedClasses['story-row']} */ ;
/** @type {__VLS_StyleScopedClasses['story-actions']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "admin-subtitle" },
});
const __VLS_0 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    name: "fade",
}));
const __VLS_2 = __VLS_1({
    name: "fade",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
if (__VLS_ctx.statusMsg) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-status" },
    });
    (__VLS_ctx.statusMsg);
}
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tab-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.activeTab = 'stories';
        } },
    ...{ class: "tab-btn" },
    ...{ class: ({ active: __VLS_ctx.activeTab === 'stories' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.activeTab = 'epics';
        } },
    ...{ class: "tab-btn" },
    ...{ class: ({ active: __VLS_ctx.activeTab === 'epics' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "tab-spacer" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push(`/board/${__VLS_ctx.selectedSprint}`);
        } },
    ...{ class: "btn" },
});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-loading" },
    });
}
else if (__VLS_ctx.activeTab === 'epics') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "epics-tab" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "top-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                if (!(__VLS_ctx.activeTab === 'epics'))
                    return;
                __VLS_ctx.showEpicForm = !__VLS_ctx.showEpicForm;
            } },
        ...{ class: "btn btn--primary" },
    });
    (__VLS_ctx.showEpicForm ? 'Cancel' : '+ New Epic');
    if (__VLS_ctx.showEpicForm) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "admin-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "epic-add-form" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ class: "input" },
            placeholder: "Epic title",
        });
        (__VLS_ctx.epicForm.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
            value: (__VLS_ctx.epicForm.description),
            ...{ class: "input" },
            rows: "2",
            placeholder: "Description",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "edit-form-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
            value: (__VLS_ctx.epicForm.status),
            ...{ class: "input input--xs" },
        });
        for (const [st] of __VLS_getVForSourceType((__VLS_ctx.EPIC_STATUSES))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                key: (st),
                value: (st),
            });
            (__VLS_ctx.EPIC_STATUS_LABELS[st]);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.handleAddEpic) },
            ...{ class: "btn btn--primary" },
            disabled: (!__VLS_ctx.epicForm.title.trim()),
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "epic-list" },
    });
    for (const [e] of __VLS_getVForSourceType((__VLS_ctx.pmEpics))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (e.id),
            ...{ class: "epic-card" },
        });
        if (__VLS_ctx.editingEpic === e.id) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "epic-edit-form" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "input" },
                placeholder: "Title",
            });
            (__VLS_ctx.editEpicData.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
                value: (__VLS_ctx.editEpicData.description),
                ...{ class: "input" },
                rows: "2",
                placeholder: "Description",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "edit-form-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                value: (__VLS_ctx.editEpicData.status),
                ...{ class: "input input--xs" },
            });
            for (const [st] of __VLS_getVForSourceType((__VLS_ctx.EPIC_STATUSES))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: (st),
                    value: (st),
                });
                (__VLS_ctx.EPIC_STATUS_LABELS[st]);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.activeTab === 'epics'))
                            return;
                        if (!(__VLS_ctx.editingEpic === e.id))
                            return;
                        __VLS_ctx.saveEditEpic(e.id);
                    } },
                ...{ class: "btn btn--sm btn--primary" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.activeTab === 'epics'))
                            return;
                        if (!(__VLS_ctx.editingEpic === e.id))
                            return;
                        __VLS_ctx.editingEpic = null;
                    } },
                ...{ class: "btn btn--sm" },
            });
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "epic-card-header" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "epic-title" },
            });
            (e.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "epic-status-badge" },
                ...{ class: (e.status) },
            });
            (__VLS_ctx.EPIC_STATUS_LABELS[e.status]);
            if (e.owner) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "epic-owner" },
                });
                (e.owner);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "epic-progress" },
            });
            (__VLS_ctx.epicStoryCount(e.id).done);
            (__VLS_ctx.epicStoryCount(e.id).total);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "epic-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.activeTab === 'epics'))
                            return;
                        if (!!(__VLS_ctx.editingEpic === e.id))
                            return;
                        __VLS_ctx.startEditEpic(e);
                    } },
                ...{ class: "btn btn--sm" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.activeTab === 'epics'))
                            return;
                        if (!!(__VLS_ctx.editingEpic === e.id))
                            return;
                        __VLS_ctx.handleDeleteEpic(e.id, e.title);
                    } },
                ...{ class: "btn btn--sm btn--danger" },
            });
            if (e.description) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "epic-desc" },
                });
                (e.description);
            }
        }
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stories-tab" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "top-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        ...{ onChange: (__VLS_ctx.onSprintChange) },
        value: (__VLS_ctx.selectedSprint),
        ...{ class: "input" },
    });
    for (const [s] of __VLS_getVForSourceType((__VLS_ctx.sprints))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (s.id),
            value: (s.id),
        });
        (s.label);
        (s.theme);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.showStoryForm) },
        ...{ class: "btn btn--primary btn--sm" },
    });
    if (__VLS_ctx.storyFormEpicId === 'show') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "add-story-form admin-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ class: "input" },
            placeholder: "Story title",
        });
        (__VLS_ctx.storyForm.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "edit-form-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
            value: (__VLS_ctx.storyForm.epicId),
            ...{ class: "input input--sm" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            value: (null),
        });
        for (const [e] of __VLS_getVForSourceType((__VLS_ctx.pmEpics))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                key: (e.id),
                value: (e.id),
            });
            (e.title);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
            value: (__VLS_ctx.storyForm.status),
            ...{ class: "input input--xs" },
        });
        for (const [st] of __VLS_getVForSourceType((__VLS_ctx.STORY_STATUSES))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                key: (st),
                value: (st),
            });
            (__VLS_ctx.STORY_STATUS_LABELS[st]);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
            value: (__VLS_ctx.storyForm.priority),
            ...{ class: "input input--xs" },
        });
        for (const [p] of __VLS_getVForSourceType((__VLS_ctx.PRIORITIES))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                key: (p),
                value: (p),
            });
            (__VLS_ctx.PRIORITY_LABELS[p]);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
            value: (__VLS_ctx.storyForm.area),
            ...{ class: "input input--xs" },
        });
        for (const [a] of __VLS_getVForSourceType((__VLS_ctx.AREAS))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                key: (a),
                value: (a),
            });
            (a);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ class: "input input--xs" },
            type: "number",
            placeholder: "SP",
        });
        (__VLS_ctx.storyForm.storyPoints);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
            value: (__VLS_ctx.storyForm.description),
            ...{ class: "input" },
            rows: "2",
            placeholder: "Description",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
            value: (__VLS_ctx.storyForm.acceptanceCriteria),
            ...{ class: "input" },
            rows: "2",
            placeholder: "Acceptance criteria",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "edit-form-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.handleAddStory) },
            ...{ class: "btn btn--sm btn--primary" },
            disabled: (!__VLS_ctx.storyForm.title.trim()),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.activeTab === 'epics'))
                        return;
                    if (!(__VLS_ctx.storyFormEpicId === 'show'))
                        return;
                    __VLS_ctx.storyFormEpicId = null;
                } },
            ...{ class: "btn btn--sm" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "epic-list" },
    });
    for (const [[epicId, groupStories]] of __VLS_getVForSourceType((__VLS_ctx.epicGroupedStories))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (epicId ?? 'unassigned'),
            ...{ class: "epic-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "epic-card-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "epic-label" },
        });
        (epicId !== null ? (__VLS_ctx.getEpicById(epicId)?.title ?? `Epic #${epicId}`) : 'Unassigned');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "story-section" },
        });
        for (const [s] of __VLS_getVForSourceType((groupStories))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (s.id),
                ...{ class: "story-block" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "story-row" },
            });
            if (__VLS_ctx.editingStory === s.id) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "edit-form" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    ...{ class: "input" },
                    placeholder: "Title",
                });
                (__VLS_ctx.editStoryData.title);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "edit-form-row" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    value: (__VLS_ctx.editStoryData.epicId),
                    ...{ class: "input input--sm" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: (null),
                });
                for (const [e] of __VLS_getVForSourceType((__VLS_ctx.pmEpics))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                        key: (e.id),
                        value: (e.id),
                    });
                    (e.title);
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    value: (__VLS_ctx.editStoryData.sprint),
                    ...{ class: "input input--xs" },
                });
                for (const [sp] of __VLS_getVForSourceType((__VLS_ctx.sprints))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                        key: (sp.id),
                        value: (sp.id),
                    });
                    (sp.label);
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    value: (__VLS_ctx.editStoryData.status),
                    ...{ class: "input input--xs" },
                });
                for (const [st] of __VLS_getVForSourceType((__VLS_ctx.STORY_STATUSES))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                        key: (st),
                        value: (st),
                    });
                    (__VLS_ctx.STORY_STATUS_LABELS[st]);
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    value: (__VLS_ctx.editStoryData.priority),
                    ...{ class: "input input--xs" },
                });
                for (const [p] of __VLS_getVForSourceType((__VLS_ctx.PRIORITIES))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                        key: (p),
                        value: (p),
                    });
                    (__VLS_ctx.PRIORITY_LABELS[p]);
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    value: (__VLS_ctx.editStoryData.area),
                    ...{ class: "input input--xs" },
                });
                for (const [a] of __VLS_getVForSourceType((__VLS_ctx.AREAS))) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                        key: (a),
                        value: (a),
                    });
                    (a);
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    ...{ class: "input input--xs" },
                    type: "number",
                    placeholder: "SP",
                });
                (__VLS_ctx.editStoryData.storyPoints);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
                    value: (__VLS_ctx.editStoryData.description),
                    ...{ class: "input" },
                    rows: "2",
                    placeholder: "Description",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
                    value: (__VLS_ctx.editStoryData.acceptanceCriteria),
                    ...{ class: "input" },
                    rows: "2",
                    placeholder: "Acceptance criteria",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "edit-form-row" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.activeTab === 'epics'))
                                return;
                            if (!(__VLS_ctx.editingStory === s.id))
                                return;
                            __VLS_ctx.saveEditStory(s.id);
                        } },
                    ...{ class: "btn btn--sm btn--primary" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.activeTab === 'epics'))
                                return;
                            if (!(__VLS_ctx.editingStory === s.id))
                                return;
                            __VLS_ctx.editingStory = null;
                        } },
                    ...{ class: "btn btn--sm" },
                });
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "story-info" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
                    ...{ class: "story-status-dot" },
                    ...{ class: (s.status) },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "story-title" },
                });
                (s.title);
                if (s.assignee) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: "story-assignee" },
                    });
                    (s.assignee);
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "story-meta" },
                });
                (s.area);
                (__VLS_ctx.PRIORITY_LABELS[s.priority]);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "story-actions" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.activeTab === 'epics'))
                                return;
                            if (!!(__VLS_ctx.editingStory === s.id))
                                return;
                            __VLS_ctx.startEditStory(s);
                        } },
                    ...{ class: "btn btn--sm" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.activeTab === 'epics'))
                                return;
                            if (!!(__VLS_ctx.editingStory === s.id))
                                return;
                            __VLS_ctx.handleDeleteStory(s.id, s.title);
                        } },
                    ...{ class: "btn btn--sm btn--danger" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.activeTab === 'epics'))
                                return;
                            if (!!(__VLS_ctx.editingStory === s.id))
                                return;
                            __VLS_ctx.showTaskForm(s.id);
                        } },
                    ...{ class: "btn btn--sm" },
                });
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "task-list" },
            });
            for (const [t] of __VLS_getVForSourceType((__VLS_ctx.getTasksForStory(s.id)))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: (t.id),
                    ...{ class: "task-row" },
                });
                if (__VLS_ctx.editingTask === t.id) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "edit-form edit-form--inline" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                        ...{ class: "input input--sm" },
                        placeholder: "Title",
                    });
                    (__VLS_ctx.editTaskData.title);
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                        value: (__VLS_ctx.editTaskData.status),
                        ...{ class: "input input--xs" },
                    });
                    for (const [st] of __VLS_getVForSourceType((__VLS_ctx.TASK_STATUSES))) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                            key: (st),
                            value: (st),
                        });
                        (__VLS_ctx.TASK_STATUS_LABELS[st]);
                    }
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!!(__VLS_ctx.activeTab === 'epics'))
                                    return;
                                if (!(__VLS_ctx.editingTask === t.id))
                                    return;
                                __VLS_ctx.saveEditTask(t.id);
                            } },
                        ...{ class: "btn btn--sm btn--primary" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!!(__VLS_ctx.activeTab === 'epics'))
                                    return;
                                if (!(__VLS_ctx.editingTask === t.id))
                                    return;
                                __VLS_ctx.editingTask = null;
                            } },
                        ...{ class: "btn btn--sm" },
                    });
                }
                else {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
                        ...{ class: "task-status-dot" },
                        ...{ class: (t.status) },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: "task-title" },
                    });
                    (t.title);
                    if (t.assignee) {
                        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                            ...{ class: "task-assignee" },
                        });
                        (t.assignee);
                    }
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "task-actions" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!!(__VLS_ctx.activeTab === 'epics'))
                                    return;
                                if (!!(__VLS_ctx.editingTask === t.id))
                                    return;
                                __VLS_ctx.startEditTask(t);
                            } },
                        ...{ class: "btn btn--sm" },
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                        ...{ onClick: (...[$event]) => {
                                if (!!(__VLS_ctx.loading))
                                    return;
                                if (!!(__VLS_ctx.activeTab === 'epics'))
                                    return;
                                if (!!(__VLS_ctx.editingTask === t.id))
                                    return;
                                __VLS_ctx.handleDeleteTask(t.id);
                            } },
                        ...{ class: "btn btn--sm btn--danger" },
                    });
                }
            }
            if (__VLS_ctx.taskFormStoryId === s.id) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "add-form" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    ...{ class: "input input--sm" },
                    placeholder: "Task title",
                });
                (__VLS_ctx.taskForm.title);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.handleAddTask) },
                    ...{ class: "btn btn--sm btn--primary" },
                    disabled: (!__VLS_ctx.taskForm.title.trim()),
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.activeTab === 'epics'))
                                return;
                            if (!(__VLS_ctx.taskFormStoryId === s.id))
                                return;
                            __VLS_ctx.taskFormStoryId = null;
                        } },
                    ...{ class: "btn btn--sm" },
                });
            }
        }
    }
}
/** @type {__VLS_StyleScopedClasses['admin']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-header']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-status']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-spacer']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-loading']} */ ;
/** @type {__VLS_StyleScopedClasses['epics-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['top-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-add-form']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-list']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-card']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-edit-form']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-title']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-status-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-owner']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-progress']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--danger']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['stories-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['top-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['add-story-form']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-list']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-card']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-label']} */ ;
/** @type {__VLS_StyleScopedClasses['story-section']} */ ;
/** @type {__VLS_StyleScopedClasses['story-block']} */ ;
/** @type {__VLS_StyleScopedClasses['story-row']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-form']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-form-row']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['story-info']} */ ;
/** @type {__VLS_StyleScopedClasses['story-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['story-title']} */ ;
/** @type {__VLS_StyleScopedClasses['story-assignee']} */ ;
/** @type {__VLS_StyleScopedClasses['story-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['story-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--danger']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['task-list']} */ ;
/** @type {__VLS_StyleScopedClasses['task-row']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-form']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-form--inline']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['task-status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['task-title']} */ ;
/** @type {__VLS_StyleScopedClasses['task-assignee']} */ ;
/** @type {__VLS_StyleScopedClasses['task-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--danger']} */ ;
/** @type {__VLS_StyleScopedClasses['add-form']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            sprints: sprints,
            pmEpics: pmEpics,
            getTasksForStory: getTasksForStory,
            getEpicById: getEpicById,
            STORY_STATUSES: STORY_STATUSES,
            TASK_STATUSES: TASK_STATUSES,
            PRIORITIES: PRIORITIES,
            AREAS: AREAS,
            EPIC_STATUSES: EPIC_STATUSES,
            STORY_STATUS_LABELS: STORY_STATUS_LABELS,
            TASK_STATUS_LABELS: TASK_STATUS_LABELS,
            PRIORITY_LABELS: PRIORITY_LABELS,
            EPIC_STATUS_LABELS: EPIC_STATUS_LABELS,
            router: router,
            loading: loading,
            statusMsg: statusMsg,
            selectedSprint: selectedSprint,
            activeTab: activeTab,
            epicForm: epicForm,
            showEpicForm: showEpicForm,
            editingEpic: editingEpic,
            editEpicData: editEpicData,
            handleAddEpic: handleAddEpic,
            startEditEpic: startEditEpic,
            saveEditEpic: saveEditEpic,
            handleDeleteEpic: handleDeleteEpic,
            epicStoryCount: epicStoryCount,
            epicGroupedStories: epicGroupedStories,
            storyFormEpicId: storyFormEpicId,
            storyForm: storyForm,
            showStoryForm: showStoryForm,
            handleAddStory: handleAddStory,
            editingStory: editingStory,
            editStoryData: editStoryData,
            startEditStory: startEditStory,
            saveEditStory: saveEditStory,
            handleDeleteStory: handleDeleteStory,
            taskFormStoryId: taskFormStoryId,
            taskForm: taskForm,
            showTaskForm: showTaskForm,
            handleAddTask: handleAddTask,
            editingTask: editingTask,
            editTaskData: editTaskData,
            startEditTask: startEditTask,
            saveEditTask: saveEditTask,
            handleDeleteTask: handleDeleteTask,
            onSprintChange: onSprintChange,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
