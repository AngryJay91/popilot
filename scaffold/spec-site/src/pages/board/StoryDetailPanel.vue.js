import { computed, ref, nextTick, onMounted, onUnmounted } from 'vue';
import { getActiveSprint } from '@/composables/useNavStore';
import { getTasksForStory, getEpicById, updateStoryStatus, updateStory, addTask, STORY_STATUSES, STORY_STATUS_LABELS, PRIORITY_LABELS, } from '@/composables/usePmStore';
import { useAuth } from '@/composables/useAuth';
import StatusBadge from './StatusBadge.vue';
import BoardTaskItem from './BoardTaskItem.vue';
const props = defineProps();
const emit = defineEmits();
const { authUser } = useAuth();
// Inline task add
const showAddTask = ref(false);
const newTaskTitle = ref('');
const addingTask = ref(false);
const taskInput = ref(null);
async function openAddTask() {
    showAddTask.value = true;
    await nextTick();
    taskInput.value?.focus();
}
async function handleAddTask() {
    const title = newTaskTitle.value.trim();
    if (!title || addingTask.value)
        return;
    addingTask.value = true;
    await addTask({ storyId: props.story.id, title });
    newTaskTitle.value = '';
    addingTask.value = false;
    emit('updated');
    await nextTick();
    taskInput.value?.focus();
}
function cancelAddTask() {
    showAddTask.value = false;
    newTaskTitle.value = '';
}
const storyTasks = computed(() => getTasksForStory(props.story.id));
const doneCount = computed(() => storyTasks.value.filter(t => t.status === 'done').length);
const epicTitle = computed(() => props.story.epicId ? getEpicById(props.story.epicId)?.title ?? null : null);
function parseAcItems(raw) {
    if (!raw)
        return [];
    const lines = raw.includes('\n')
        ? raw.split('\n').map(l => l.trim()).filter(Boolean)
        : [raw.trim()];
    return lines.map(line => {
        if (line.startsWith('[x] ') || line.startsWith('[X] '))
            return { text: line.slice(4), checked: true };
        if (line.startsWith('[ ] '))
            return { text: line.slice(4), checked: false };
        return { text: line, checked: false };
    });
}
function serializeAc(items) {
    return items.map(i => `${i.checked ? '[x]' : '[ ]'} ${i.text}`).join('\n');
}
const acItems = computed(() => parseAcItems(props.story.acceptanceCriteria));
const acDoneCount = computed(() => acItems.value.filter(i => i.checked).length);
async function handleMergeOk() {
    if (!confirm('Mark as Merge OK? Story status will change to done.'))
        return;
    await updateStory(props.story.id, { status: 'done' });
    emit('updated');
}
async function toggleAc(idx) {
    const items = [...acItems.value];
    items[idx] = { ...items[idx], checked: !items[idx].checked };
    await updateStory(props.story.id, { acceptanceCriteria: serializeAc(items) });
    emit('updated');
}
// DoR checklist (gate for ready-for-dev)
const showDorModal = ref(false);
const dorChecks = ref({ specDone: false, acExists: false, mockupReady: false });
const pendingStatus = ref(null);
function resetDor() { dorChecks.value = { specDone: false, acExists: false, mockupReady: false }; }
const dorAllChecked = computed(() => dorChecks.value.specDone && dorChecks.value.acExists && dorChecks.value.mockupReady);
async function confirmDor() {
    if (!dorAllChecked.value || !pendingStatus.value)
        return;
    await updateStoryStatus(props.story.id, pendingStatus.value);
    showDorModal.value = false;
    pendingStatus.value = null;
    resetDor();
    emit('updated');
}
// Status dropdown
const statusDropOpen = ref(false);
const statusTrigger = ref(null);
const STATUS_COLORS = {
    draft: '#94a3b8', backlog: '#a78bfa', ready: '#3b82f6',
    'in-progress': '#f59e0b', review: '#8b5cf6', done: '#22c55e',
};
async function selectStatus(status) {
    statusDropOpen.value = false;
    if (status === props.story.status)
        return;
    if (status === 'ready' && props.story.status !== 'ready') {
        pendingStatus.value = status;
        resetDor();
        showDorModal.value = true;
        return;
    }
    await updateStoryStatus(props.story.id, status);
    emit('updated');
}
// Assignee multi-select
const assigneeDropOpen = ref(false);
const assigneeTrigger = ref(null);
const assigneeList = computed(() => props.story.assignee ? props.story.assignee.split(',').map(s => s.trim()).filter(Boolean) : []);
const assigneeDisplay = computed(() => assigneeList.value.length === 0 ? 'Unassigned' : assigneeList.value.join(', '));
async function toggleAssignee(name) {
    const current = new Set(assigneeList.value);
    if (current.has(name))
        current.delete(name);
    else
        current.add(name);
    const value = current.size > 0 ? [...current].join(',') : null;
    await updateStory(props.story.id, { assignee: value });
    emit('updated');
}
// Dropdown position
function menuStyle(trigger) {
    if (!trigger)
        return {};
    const rect = trigger.getBoundingClientRect();
    return { position: 'fixed', top: `${rect.bottom + 4}px`, left: `${rect.left}px`, width: `${rect.width}px`, zIndex: '9999' };
}
// Figma link editing
const editingFigma = ref(false);
const figmaUrlDraft = ref('');
const figmaInput = ref(null);
const figmaLabel = computed(() => {
    if (!props.story.figmaUrl)
        return '';
    try {
        const url = new URL(props.story.figmaUrl);
        const parts = url.pathname.split('/');
        return parts[parts.length - 1]?.replace(/-/g, ' ') || 'Figma';
    }
    catch {
        return 'Figma';
    }
});
async function startEditFigma() {
    figmaUrlDraft.value = props.story.figmaUrl ?? '';
    editingFigma.value = true;
    await nextTick();
    figmaInput.value?.focus();
}
async function saveFigma() {
    const url = figmaUrlDraft.value.trim() || null;
    editingFigma.value = false;
    if (url === props.story.figmaUrl)
        return;
    await updateStory(props.story.id, { figmaUrl: url });
    emit('updated');
}
// Close dropdown on outside click
function onDocClick(e) {
    const target = e.target;
    if (!target.closest('.field-dropdown') && !target.closest('.field-menu-portal')) {
        statusDropOpen.value = false;
        assigneeDropOpen.value = false;
    }
}
const panelBodyRef = ref(null);
async function updateDate(field, value) {
    await updateStory(props.story.id, { [field]: value || null });
    emit('updated');
}
async function assignToSprint() {
    const activeSprint = getActiveSprint().id;
    await updateStory(props.story.id, { sprint: activeSprint });
    emit('updated');
}
async function unassignFromSprint() {
    await updateStory(props.story.id, { sprint: null });
    emit('updated');
}
onMounted(async () => {
    document.addEventListener('click', onDocClick);
    const { pmEpics, loadEpics } = await import('@/composables/usePmStore');
    if (!pmEpics.value.length)
        await loadEpics();
    nextTick(() => { if (panelBodyRef.value)
        panelBodyRef.value.scrollTop = 0; });
});
onUnmounted(() => document.removeEventListener('click', onDocClick));
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['field-value--clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['field-menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['field-menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['figma-link']} */ ;
/** @type {__VLS_StyleScopedClasses['figma-input']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-section']} */ ;
/** @type {__VLS_StyleScopedClasses['task-header']} */ ;
/** @type {__VLS_StyleScopedClasses['add-task-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['add-task-input']} */ ;
/** @type {__VLS_StyleScopedClasses['add-task-submit']} */ ;
/** @type {__VLS_StyleScopedClasses['ac-item']} */ ;
/** @type {__VLS_StyleScopedClasses['ac-item--done']} */ ;
/** @type {__VLS_StyleScopedClasses['ac-text']} */ ;
/** @type {__VLS_StyleScopedClasses['pr-link']} */ ;
/** @type {__VLS_StyleScopedClasses['merge-ok-active']} */ ;
/** @type {__VLS_StyleScopedClasses['dor-check']} */ ;
/** @type {__VLS_StyleScopedClasses['dor-confirm']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('close');
        } },
    ...{ class: "panel-overlay" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-header-top" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-badges" },
});
/** @type {[typeof StatusBadge, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(StatusBadge, new StatusBadge({
    label: (__VLS_ctx.PRIORITY_LABELS[__VLS_ctx.story.priority]),
    type: "priority",
    value: (__VLS_ctx.story.priority),
}));
const __VLS_1 = __VLS_0({
    label: (__VLS_ctx.PRIORITY_LABELS[__VLS_ctx.story.priority]),
    type: "priority",
    value: (__VLS_ctx.story.priority),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "panel-area" },
});
(__VLS_ctx.story.area);
if (__VLS_ctx.story.storyPoints) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "panel-points" },
    });
    (__VLS_ctx.story.storyPoints);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('close');
        } },
    ...{ class: "close-btn" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "panel-title" },
});
(__VLS_ctx.story.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "panelBodyRef",
    ...{ class: "panel-body" },
});
/** @type {typeof __VLS_ctx.panelBodyRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "field-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "field-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "field-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.statusDropOpen = !__VLS_ctx.statusDropOpen;
            __VLS_ctx.assigneeDropOpen = false;
        } },
    ref: "statusTrigger",
    ...{ class: "field-dropdown" },
});
/** @type {typeof __VLS_ctx.statusTrigger} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "field-value field-value--clickable" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "status-dot" },
    ...{ style: ({ background: __VLS_ctx.STATUS_COLORS[__VLS_ctx.story.status] }) },
});
(__VLS_ctx.STORY_STATUS_LABELS[__VLS_ctx.story.status]);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "field-chevron" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "field-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "field-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.assigneeDropOpen = !__VLS_ctx.assigneeDropOpen;
            __VLS_ctx.statusDropOpen = false;
        } },
    ref: "assigneeTrigger",
    ...{ class: "field-dropdown" },
});
/** @type {typeof __VLS_ctx.assigneeTrigger} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ class: "field-value field-value--clickable" },
});
(__VLS_ctx.assigneeDisplay);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "field-chevron" },
});
if (__VLS_ctx.epicTitle) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "field-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "field-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "field-value" },
    });
    (__VLS_ctx.epicTitle);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "field-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "field-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.updateDate('startDate', $event.target.value);
        } },
    type: "date",
    ...{ class: "field-date-input" },
    value: (__VLS_ctx.story.startDate ?? ''),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "field-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "field-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (...[$event]) => {
            __VLS_ctx.updateDate('dueDate', $event.target.value);
        } },
    type: "date",
    ...{ class: "field-date-input" },
    value: (__VLS_ctx.story.dueDate ?? ''),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "field-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "field-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "field-value sprint-assign" },
});
if (__VLS_ctx.story.sprint) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.story.sprint);
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "field-placeholder" },
    });
}
if (__VLS_ctx.story.sprint) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.unassignFromSprint) },
        ...{ class: "sprint-btn sprint-btn--remove" },
        title: "Remove from sprint",
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.assignToSprint) },
        ...{ class: "sprint-btn sprint-btn--assign" },
        title: "Assign to current sprint",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "field-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "field-label" },
});
if (!__VLS_ctx.editingFigma) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.startEditFigma) },
        ...{ class: "field-value field-value--clickable" },
    });
    if (__VLS_ctx.story.figmaUrl) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            ...{ onClick: () => { } },
            href: (__VLS_ctx.story.figmaUrl),
            target: "_blank",
            rel: "noopener",
            ...{ class: "figma-link" },
        });
        (__VLS_ctx.figmaLabel);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "field-placeholder" },
        });
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "figma-edit" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onKeydown: (__VLS_ctx.saveFigma) },
        ...{ onKeydown: (...[$event]) => {
                if (!!(!__VLS_ctx.editingFigma))
                    return;
                __VLS_ctx.editingFigma = false;
            } },
        ref: "figmaInput",
        ...{ class: "figma-input" },
        placeholder: "https://www.figma.com/...",
    });
    (__VLS_ctx.figmaUrlDraft);
    /** @type {typeof __VLS_ctx.figmaInput} */ ;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.saveFigma) },
        ...{ class: "figma-save" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.editingFigma))
                    return;
                __VLS_ctx.editingFigma = false;
            } },
        ...{ class: "figma-cancel" },
    });
}
const __VLS_3 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
    to: "body",
}));
const __VLS_5 = __VLS_4({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
__VLS_6.slots.default;
if (__VLS_ctx.statusDropOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: () => { } },
        ...{ class: "field-menu-portal" },
        ...{ style: (__VLS_ctx.menuStyle(__VLS_ctx.statusTrigger)) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "field-menu" },
    });
    for (const [s] of __VLS_getVForSourceType((__VLS_ctx.STORY_STATUSES))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.statusDropOpen))
                        return;
                    __VLS_ctx.selectStatus(s);
                } },
            key: (s),
            ...{ class: "field-menu-item" },
            ...{ class: ({ active: s === __VLS_ctx.story.status }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "status-dot" },
            ...{ style: ({ background: __VLS_ctx.STATUS_COLORS[s] }) },
        });
        (__VLS_ctx.STORY_STATUS_LABELS[s]);
    }
}
if (__VLS_ctx.assigneeDropOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: () => { } },
        ...{ class: "field-menu-portal" },
        ...{ style: (__VLS_ctx.menuStyle(__VLS_ctx.assigneeTrigger)) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "field-menu" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.assigneeDropOpen))
                    return;
                __VLS_ctx.toggleAssignee('');
            } },
        ...{ class: "field-menu-item" },
        ...{ style: {} },
    });
}
var __VLS_6;
if (__VLS_ctx.story.description) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "panel-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "desc-text" },
    });
    (__VLS_ctx.story.description);
}
if (__VLS_ctx.acItems.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "panel-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "task-counter" },
    });
    (__VLS_ctx.acDoneCount);
    (__VLS_ctx.acItems.length);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "ac-list" },
    });
    for (const [ac, i] of __VLS_getVForSourceType((__VLS_ctx.acItems))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            key: (i),
            ...{ class: "ac-item" },
            ...{ class: ({ 'ac-item--done': ac.checked }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onChange: (...[$event]) => {
                    if (!(__VLS_ctx.acItems.length > 0))
                        return;
                    __VLS_ctx.toggleAc(i);
                } },
            type: "checkbox",
            checked: (ac.checked),
            ...{ class: "ac-check" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "ac-text" },
        });
        (ac.text);
    }
    if ((__VLS_ctx.story.status === 'review' || __VLS_ctx.story.status === 'qa') && __VLS_ctx.acItems.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.handleMergeOk) },
            ...{ class: "btn merge-ok-btn" },
            ...{ class: ({ 'merge-ok-active': __VLS_ctx.acDoneCount === __VLS_ctx.acItems.length }) },
            disabled: (__VLS_ctx.acDoneCount !== __VLS_ctx.acItems.length),
        });
        (__VLS_ctx.acDoneCount === __VLS_ctx.acItems.length ? 'Merge OK -- All AC passed' : `AC ${__VLS_ctx.acDoneCount}/${__VLS_ctx.acItems.length} passed`);
    }
}
if (__VLS_ctx.acItems.length === 0 && (__VLS_ctx.story.status === 'review' || __VLS_ctx.story.status === 'qa')) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "panel-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "qa-note" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.handleMergeOk) },
        ...{ class: "btn merge-ok-btn merge-ok-active" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
    ...{ class: "panel-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "task-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
if (__VLS_ctx.storyTasks.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "task-counter" },
    });
    (__VLS_ctx.doneCount);
    (__VLS_ctx.storyTasks.length);
}
if (!__VLS_ctx.showAddTask) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.openAddTask) },
        ...{ class: "add-task-btn" },
    });
}
if (__VLS_ctx.story.relatedPrs?.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-prs" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-section-title" },
    });
    for (const [pr] of __VLS_getVForSourceType((__VLS_ctx.story.relatedPrs))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (pr.prNumber),
            ...{ class: "pr-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            href: (pr.prUrl),
            target: "_blank",
            ...{ class: "pr-link" },
        });
        (pr.prNumber);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "pr-title-text" },
        });
        (pr.prTitle);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "pr-status" },
            ...{ class: ('pr--' + pr.status) },
        });
        (pr.status);
    }
}
if (__VLS_ctx.storyTasks.length === 0 && !__VLS_ctx.showAddTask) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-empty" },
    });
}
if (__VLS_ctx.storyTasks.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-tasks" },
    });
    for (const [t] of __VLS_getVForSourceType((__VLS_ctx.storyTasks))) {
        /** @type {[typeof BoardTaskItem, ]} */ ;
        // @ts-ignore
        const __VLS_7 = __VLS_asFunctionalComponent(BoardTaskItem, new BoardTaskItem({
            ...{ 'onUpdated': {} },
            key: (t.id),
            task: (t),
        }));
        const __VLS_8 = __VLS_7({
            ...{ 'onUpdated': {} },
            key: (t.id),
            task: (t),
        }, ...__VLS_functionalComponentArgsRest(__VLS_7));
        let __VLS_10;
        let __VLS_11;
        let __VLS_12;
        const __VLS_13 = {
            onUpdated: (...[$event]) => {
                if (!(__VLS_ctx.storyTasks.length > 0))
                    return;
                __VLS_ctx.emit('updated');
            }
        };
        var __VLS_9;
    }
}
if (__VLS_ctx.showAddTask) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "add-task-form" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onKeydown: (__VLS_ctx.handleAddTask) },
        ...{ onKeydown: (__VLS_ctx.cancelAddTask) },
        ref: "taskInput",
        ...{ class: "add-task-input" },
        placeholder: "Task title (Enter to add)",
        disabled: (__VLS_ctx.addingTask),
    });
    (__VLS_ctx.newTaskTitle);
    /** @type {typeof __VLS_ctx.taskInput} */ ;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "add-task-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.handleAddTask) },
        ...{ class: "add-task-submit" },
        disabled: (!__VLS_ctx.newTaskTitle.trim() || __VLS_ctx.addingTask),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.cancelAddTask) },
        ...{ class: "add-task-cancel" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "panel-meta" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.story.createdAt?.split('T')[0] ?? '-');
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.story.updatedAt?.split('T')[0] ?? '-');
if (__VLS_ctx.showDorModal) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDorModal))
                    return;
                __VLS_ctx.showDorModal = false;
            } },
        ...{ class: "dor-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "dor-modal" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "dor-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "dor-desc" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "dor-checks" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "dor-check" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "checkbox",
    });
    (__VLS_ctx.dorChecks.specDone);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "dor-check" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "checkbox",
    });
    (__VLS_ctx.dorChecks.acExists);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "dor-check" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "checkbox",
    });
    (__VLS_ctx.dorChecks.mockupReady);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "dor-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.confirmDor) },
        ...{ class: "dor-confirm" },
        disabled: (!__VLS_ctx.dorAllChecked),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDorModal))
                    return;
                __VLS_ctx.showDorModal = false;
            } },
        ...{ class: "dor-cancel" },
    });
}
/** @type {__VLS_StyleScopedClasses['panel-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header-top']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-badges']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-area']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-points']} */ ;
/** @type {__VLS_StyleScopedClasses['close-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-body']} */ ;
/** @type {__VLS_StyleScopedClasses['field-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['field-row']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['field-dropdown']} */ ;
/** @type {__VLS_StyleScopedClasses['field-value']} */ ;
/** @type {__VLS_StyleScopedClasses['field-value--clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['field-chevron']} */ ;
/** @type {__VLS_StyleScopedClasses['field-row']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['field-dropdown']} */ ;
/** @type {__VLS_StyleScopedClasses['field-value']} */ ;
/** @type {__VLS_StyleScopedClasses['field-value--clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['field-chevron']} */ ;
/** @type {__VLS_StyleScopedClasses['field-row']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['field-value']} */ ;
/** @type {__VLS_StyleScopedClasses['field-row']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['field-date-input']} */ ;
/** @type {__VLS_StyleScopedClasses['field-row']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['field-date-input']} */ ;
/** @type {__VLS_StyleScopedClasses['field-row']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['field-value']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-assign']} */ ;
/** @type {__VLS_StyleScopedClasses['field-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-btn--remove']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-btn--assign']} */ ;
/** @type {__VLS_StyleScopedClasses['field-row']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['field-value']} */ ;
/** @type {__VLS_StyleScopedClasses['field-value--clickable']} */ ;
/** @type {__VLS_StyleScopedClasses['figma-link']} */ ;
/** @type {__VLS_StyleScopedClasses['field-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['figma-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['figma-input']} */ ;
/** @type {__VLS_StyleScopedClasses['figma-save']} */ ;
/** @type {__VLS_StyleScopedClasses['figma-cancel']} */ ;
/** @type {__VLS_StyleScopedClasses['field-menu-portal']} */ ;
/** @type {__VLS_StyleScopedClasses['field-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['field-menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['status-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['field-menu-portal']} */ ;
/** @type {__VLS_StyleScopedClasses['field-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['field-menu-item']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-section']} */ ;
/** @type {__VLS_StyleScopedClasses['desc-text']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-section']} */ ;
/** @type {__VLS_StyleScopedClasses['task-counter']} */ ;
/** @type {__VLS_StyleScopedClasses['ac-list']} */ ;
/** @type {__VLS_StyleScopedClasses['ac-item']} */ ;
/** @type {__VLS_StyleScopedClasses['ac-item--done']} */ ;
/** @type {__VLS_StyleScopedClasses['ac-check']} */ ;
/** @type {__VLS_StyleScopedClasses['ac-text']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['merge-ok-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['merge-ok-active']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-section']} */ ;
/** @type {__VLS_StyleScopedClasses['qa-note']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['merge-ok-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['merge-ok-active']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-section']} */ ;
/** @type {__VLS_StyleScopedClasses['task-header']} */ ;
/** @type {__VLS_StyleScopedClasses['task-counter']} */ ;
/** @type {__VLS_StyleScopedClasses['add-task-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-prs']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['pr-item']} */ ;
/** @type {__VLS_StyleScopedClasses['pr-link']} */ ;
/** @type {__VLS_StyleScopedClasses['pr-title-text']} */ ;
/** @type {__VLS_StyleScopedClasses['pr-status']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-tasks']} */ ;
/** @type {__VLS_StyleScopedClasses['add-task-form']} */ ;
/** @type {__VLS_StyleScopedClasses['add-task-input']} */ ;
/** @type {__VLS_StyleScopedClasses['add-task-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['add-task-submit']} */ ;
/** @type {__VLS_StyleScopedClasses['add-task-cancel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['dor-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['dor-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['dor-title']} */ ;
/** @type {__VLS_StyleScopedClasses['dor-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['dor-checks']} */ ;
/** @type {__VLS_StyleScopedClasses['dor-check']} */ ;
/** @type {__VLS_StyleScopedClasses['dor-check']} */ ;
/** @type {__VLS_StyleScopedClasses['dor-check']} */ ;
/** @type {__VLS_StyleScopedClasses['dor-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['dor-confirm']} */ ;
/** @type {__VLS_StyleScopedClasses['dor-cancel']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            STORY_STATUSES: STORY_STATUSES,
            STORY_STATUS_LABELS: STORY_STATUS_LABELS,
            PRIORITY_LABELS: PRIORITY_LABELS,
            StatusBadge: StatusBadge,
            BoardTaskItem: BoardTaskItem,
            emit: emit,
            showAddTask: showAddTask,
            newTaskTitle: newTaskTitle,
            addingTask: addingTask,
            taskInput: taskInput,
            openAddTask: openAddTask,
            handleAddTask: handleAddTask,
            cancelAddTask: cancelAddTask,
            storyTasks: storyTasks,
            doneCount: doneCount,
            epicTitle: epicTitle,
            acItems: acItems,
            acDoneCount: acDoneCount,
            handleMergeOk: handleMergeOk,
            toggleAc: toggleAc,
            showDorModal: showDorModal,
            dorChecks: dorChecks,
            dorAllChecked: dorAllChecked,
            confirmDor: confirmDor,
            statusDropOpen: statusDropOpen,
            statusTrigger: statusTrigger,
            STATUS_COLORS: STATUS_COLORS,
            selectStatus: selectStatus,
            assigneeDropOpen: assigneeDropOpen,
            assigneeTrigger: assigneeTrigger,
            assigneeDisplay: assigneeDisplay,
            toggleAssignee: toggleAssignee,
            menuStyle: menuStyle,
            editingFigma: editingFigma,
            figmaUrlDraft: figmaUrlDraft,
            figmaInput: figmaInput,
            figmaLabel: figmaLabel,
            startEditFigma: startEditFigma,
            saveFigma: saveFigma,
            panelBodyRef: panelBodyRef,
            updateDate: updateDate,
            assignToSprint: assignToSprint,
            unassignFromSprint: unassignFromSprint,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
