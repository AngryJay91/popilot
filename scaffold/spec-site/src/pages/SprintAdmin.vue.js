import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { sprints, epics, loaded, loadNavData, addSprint, updateSprint, deleteSprint, setActiveSprint, addEpic, updateEpic, deleteEpic, carryOverEpic, } from '@/composables/useNavStore';
const router = useRouter();
const statusMsg = ref('');
const loading = ref(true);
// -- Sprint form --
const showSprintForm = ref(false);
const sprintForm = ref({ id: '', label: '', theme: '', startDate: '', endDate: '' });
// -- Epic form (per sprint) --
const epicFormSprint = ref(null);
const epicForm = ref({ epicId: '', label: '', badge: '', category: 'policy', description: '' });
// -- Inline edit --
const editingSprint = ref(null);
const editSprintData = ref({ label: '', theme: '', startDate: '', endDate: '' });
const editingEpic = ref(null); // "sprint:epicId"
const editEpicData = ref({ label: '', badge: '', category: 'policy', description: '' });
// -- Carryover form --
const carryoverEpic = ref(null); // uid
const carryoverForm = ref({ targetSprint: '', newEpicId: '', newLabel: '', newBadge: '' });
function startCarryover(e) {
    const uid = e.uid ?? `${e.sprint}:${e.id}`;
    carryoverEpic.value = uid;
    carryoverForm.value = { targetSprint: '', newEpicId: '', newLabel: e.label, newBadge: e.badge ?? '' };
}
async function handleCarryover() {
    if (!carryoverEpic.value || !carryoverForm.value.targetSprint || !carryoverForm.value.newEpicId)
        return;
    const f = carryoverForm.value;
    const r = await carryOverEpic(carryoverEpic.value, f.targetSprint, f.newEpicId, f.newLabel || undefined, f.newBadge || undefined);
    if (r.error) {
        statusMsg.value = `Error: ${r.error}`;
    }
    else {
        statusMsg.value = `Carryover complete -> ${f.targetSprint}`;
        carryoverEpic.value = null;
    }
    clearStatus();
}
function clearStatus() {
    setTimeout(() => { statusMsg.value = ''; }, 3000);
}
function epicsForSprint(sprintId) {
    return epics.value
        .filter(e => e.sprint === sprintId)
        .sort((a, b) => a.sortOrder - b.sortOrder);
}
// -- Sprint CRUD --
async function handleAddSprint() {
    const { id, label, theme, startDate, endDate } = sprintForm.value;
    if (!id.trim() || !label.trim() || !theme.trim())
        return;
    const r = await addSprint({
        id: id.trim(),
        label: label.trim(),
        theme: theme.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
    });
    if (r.error) {
        statusMsg.value = `Error: ${r.error}`;
    }
    else {
        statusMsg.value = `${label} added`;
        sprintForm.value = { id: '', label: '', theme: '', startDate: '', endDate: '' };
        showSprintForm.value = false;
    }
    clearStatus();
}
function startEditSprint(s) {
    editingSprint.value = s.id;
    editSprintData.value = {
        label: s.label,
        theme: s.theme,
        startDate: s.startDate ?? '',
        endDate: s.endDate ?? '',
    };
}
async function saveEditSprint(id) {
    const d = editSprintData.value;
    const r = await updateSprint(id, {
        label: d.label,
        theme: d.theme,
        startDate: d.startDate || null,
        endDate: d.endDate || null,
    });
    if (r.error) {
        statusMsg.value = `Error: ${r.error}`;
    }
    else {
        statusMsg.value = 'Sprint updated';
        editingSprint.value = null;
    }
    clearStatus();
}
async function handleSetActive(id) {
    const r = await setActiveSprint(id);
    if (!r.error)
        statusMsg.value = `${id} activated`;
    clearStatus();
}
async function handleDeleteSprint(id, label) {
    if (!confirm(`Delete sprint "${label}" and all its epics? This cannot be undone.`))
        return;
    const r = await deleteSprint(id);
    if (r.error) {
        statusMsg.value = `Error: ${r.error}`;
    }
    else {
        statusMsg.value = `${label} deleted`;
    }
    clearStatus();
}
// -- Epic CRUD --
function showEpicForm(sprintId) {
    epicFormSprint.value = sprintId;
    epicForm.value = { epicId: '', label: '', badge: '', category: 'policy', description: '' };
}
async function handleAddEpic() {
    if (!epicFormSprint.value)
        return;
    const { epicId, label, badge, category, description } = epicForm.value;
    if (!epicId.trim() || !label.trim())
        return;
    const r = await addEpic(epicFormSprint.value, {
        epicId: epicId.trim(),
        label: label.trim(),
        badge: badge.trim() || null,
        category,
        description: description.trim() || null,
    });
    if (r.error) {
        statusMsg.value = `Error: ${r.error}`;
    }
    else {
        statusMsg.value = `${epicId} added`;
        epicFormSprint.value = null;
    }
    clearStatus();
}
function startEditEpic(e) {
    editingEpic.value = `${e.sprint}:${e.id}`;
    editEpicData.value = {
        label: e.label,
        badge: e.badge ?? '',
        category: e.category,
        description: e.description ?? '',
    };
}
async function saveEditEpic(sprint, epicId) {
    const d = editEpicData.value;
    const r = await updateEpic(sprint, epicId, {
        label: d.label,
        badge: d.badge || null,
        category: d.category,
        description: d.description || null,
    });
    if (r.error) {
        statusMsg.value = `Error: ${r.error}`;
    }
    else {
        statusMsg.value = `${epicId} updated`;
        editingEpic.value = null;
    }
    clearStatus();
}
async function handleDeleteEpic(sprint, epicId) {
    if (!confirm(`Delete ${epicId}? This cannot be undone.`))
        return;
    const r = await deleteEpic(sprint, epicId);
    if (r.error) {
        statusMsg.value = `Error: ${r.error}`;
    }
    else {
        statusMsg.value = `${epicId} deleted`;
    }
    clearStatus();
}
onMounted(async () => {
    if (!loaded.value)
        await loadNavData();
    loading.value = false;
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['admin-header']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-table']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-table']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-table']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--ok']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--danger']} */ ;
/** @type {__VLS_StyleScopedClasses['admin']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['input--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['td-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-table']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--lifecycle']} */ ;
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
    ...{ class: "top-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showSprintForm = !__VLS_ctx.showSprintForm;
        } },
    ...{ class: "btn btn--primary" },
});
(__VLS_ctx.showSprintForm ? 'Cancel' : '+ New Sprint');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin/board');
        } },
    ...{ class: "btn" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/admin');
        } },
    ...{ class: "btn" },
});
if (__VLS_ctx.showSprintForm) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-grid" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ class: "input" },
        placeholder: "ID (e.g. s55)",
    });
    (__VLS_ctx.sprintForm.id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ class: "input" },
        placeholder: "Label (e.g. S55)",
    });
    (__VLS_ctx.sprintForm.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ class: "input input--wide" },
        placeholder: "Theme (e.g. Impact Feature Launch)",
    });
    (__VLS_ctx.sprintForm.theme);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ class: "input" },
        type: "date",
        placeholder: "Start date",
    });
    (__VLS_ctx.sprintForm.startDate);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ class: "input" },
        type: "date",
        placeholder: "End date",
    });
    (__VLS_ctx.sprintForm.endDate);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.handleAddSprint) },
        ...{ class: "btn btn--primary" },
        disabled: (!__VLS_ctx.sprintForm.id.trim() || !__VLS_ctx.sprintForm.label.trim()),
    });
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-loading" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "sprint-list" },
    });
    for (const [s] of __VLS_getVForSourceType((__VLS_ctx.sprints))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (s.id),
            ...{ class: "sprint-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "sprint-card-header" },
        });
        if (__VLS_ctx.editingSprint === s.id) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "edit-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "input input--sm" },
                placeholder: "Label",
            });
            (__VLS_ctx.editSprintData.label);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "input" },
                placeholder: "Theme",
            });
            (__VLS_ctx.editSprintData.theme);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "input input--sm" },
                type: "date",
            });
            (__VLS_ctx.editSprintData.startDate);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "input input--sm" },
                type: "date",
            });
            (__VLS_ctx.editSprintData.endDate);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.editingSprint === s.id))
                            return;
                        __VLS_ctx.saveEditSprint(s.id);
                    } },
                ...{ class: "btn btn--sm btn--primary" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.editingSprint === s.id))
                            return;
                        __VLS_ctx.editingSprint = null;
                    } },
                ...{ class: "btn btn--sm" },
            });
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "sprint-info" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "sprint-label" },
            });
            (s.label);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "sprint-theme-text" },
            });
            (s.theme);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "lifecycle-badge" },
                ...{ class: ('lc--' + (s.status || (s.active ? 'active' : 'planning'))) },
            });
            (s.status === 'closed' ? 'Closed' : s.status === 'active' || s.active ? 'Active' : 'Planning');
            if (s.startDate || s.endDate) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "sprint-dates" },
                });
                (s.startDate ?? '?');
                (s.endDate ?? '?');
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "sprint-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.editingSprint === s.id))
                            return;
                        __VLS_ctx.startEditSprint(s);
                    } },
                ...{ class: "btn btn--sm" },
            });
            if (!s.active) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.editingSprint === s.id))
                                return;
                            if (!(!s.active))
                                return;
                            __VLS_ctx.handleSetActive(s.id);
                        } },
                    ...{ class: "btn btn--sm btn--ok" },
                });
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ class: "btn btn--sm" },
                    disabled: true,
                });
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.editingSprint === s.id))
                            return;
                        __VLS_ctx.handleDeleteSprint(s.id, s.label);
                    } },
                ...{ class: "btn btn--sm btn--danger" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "sprint-lifecycle" },
            });
            if (s.status === 'planning' || (!s.status && !s.active)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.editingSprint === s.id))
                                return;
                            if (!(s.status === 'planning' || (!s.status && !s.active)))
                                return;
                            __VLS_ctx.router.push(`/kickoff/${s.id}`);
                        } },
                    ...{ class: "btn btn--sm btn--lifecycle" },
                });
            }
            if (s.status === 'active' || s.active) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.editingSprint === s.id))
                                return;
                            if (!(s.status === 'active' || s.active))
                                return;
                            __VLS_ctx.router.push(`/close/${s.id}`);
                        } },
                    ...{ class: "btn btn--sm btn--lifecycle" },
                });
            }
            if (s.status === 'closed') {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.editingSprint === s.id))
                                return;
                            if (!(s.status === 'closed'))
                                return;
                            __VLS_ctx.router.push(`/retro/${s.id}`);
                        } },
                    ...{ class: "btn btn--sm btn--lifecycle" },
                });
            }
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "epic-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
            ...{ class: "epic-table" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
        for (const [e] of __VLS_getVForSourceType((__VLS_ctx.epicsForSprint(s.id)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
                key: (e.id),
            });
            if (__VLS_ctx.editingEpic === `${s.id}:${e.id}`) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                    ...{ class: "td-id" },
                });
                (e.id);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    ...{ class: "input input--sm" },
                });
                (__VLS_ctx.editEpicData.label);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    ...{ class: "input input--xs" },
                    placeholder: "-",
                });
                (__VLS_ctx.editEpicData.badge);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                    value: (__VLS_ctx.editEpicData.category),
                    ...{ class: "input input--xs" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "policy",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    value: "wireframe",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    ...{ class: "input input--sm" },
                });
                (__VLS_ctx.editEpicData.description);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                    ...{ class: "td-actions" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!(__VLS_ctx.editingEpic === `${s.id}:${e.id}`))
                                return;
                            __VLS_ctx.saveEditEpic(s.id, e.id);
                        } },
                    ...{ class: "btn btn--sm btn--primary" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!(__VLS_ctx.editingEpic === `${s.id}:${e.id}`))
                                return;
                            __VLS_ctx.editingEpic = null;
                        } },
                    ...{ class: "btn btn--sm" },
                });
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                    ...{ class: "td-id" },
                });
                (e.id);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                    ...{ class: "td-label" },
                });
                (e.label);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
                if (e.badge) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                        ...{ class: "epic-badge" },
                    });
                    (e.badge);
                }
                __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                    ...{ class: "td-cat" },
                });
                (e.category);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                    ...{ class: "td-desc" },
                });
                (e.description);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
                    ...{ class: "td-actions" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.editingEpic === `${s.id}:${e.id}`))
                                return;
                            __VLS_ctx.startEditEpic(e);
                        } },
                    ...{ class: "btn btn--sm" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.editingEpic === `${s.id}:${e.id}`))
                                return;
                            __VLS_ctx.startCarryover(e);
                        } },
                    ...{ class: "btn btn--sm btn--ok" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.editingEpic === `${s.id}:${e.id}`))
                                return;
                            __VLS_ctx.handleDeleteEpic(s.id, e.id);
                        } },
                    ...{ class: "btn btn--sm btn--danger" },
                });
            }
        }
        if (__VLS_ctx.carryoverEpic && __VLS_ctx.epicsForSprint(s.id).some(e => (e.uid ?? `${e.sprint}:${e.id}`) === __VLS_ctx.carryoverEpic)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "add-epic-form" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "carryover-label" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                value: (__VLS_ctx.carryoverForm.targetSprint),
                ...{ class: "input input--sm" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "",
                disabled: true,
            });
            for (const [sp] of __VLS_getVForSourceType((__VLS_ctx.sprints.filter(x => x.id !== s.id)))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: (sp.id),
                    value: (sp.id),
                });
                (sp.label);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "input input--xs" },
                placeholder: "New ID (E-01)",
            });
            (__VLS_ctx.carryoverForm.newEpicId);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "input input--sm" },
                placeholder: "Label",
            });
            (__VLS_ctx.carryoverForm.newLabel);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "input input--xs" },
                placeholder: "Badge",
            });
            (__VLS_ctx.carryoverForm.newBadge);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.handleCarryover) },
                ...{ class: "btn btn--sm btn--primary" },
                disabled: (!__VLS_ctx.carryoverForm.targetSprint || !__VLS_ctx.carryoverForm.newEpicId),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.carryoverEpic && __VLS_ctx.epicsForSprint(s.id).some(e => (e.uid ?? `${e.sprint}:${e.id}`) === __VLS_ctx.carryoverEpic)))
                            return;
                        __VLS_ctx.carryoverEpic = null;
                    } },
                ...{ class: "btn btn--sm" },
            });
        }
        if (__VLS_ctx.epicFormSprint === s.id) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "add-epic-form" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "input input--xs" },
                placeholder: "ID (E-07)",
            });
            (__VLS_ctx.epicForm.epicId);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "input input--sm" },
                placeholder: "Label",
            });
            (__VLS_ctx.epicForm.label);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "input input--xs" },
                placeholder: "Badge",
            });
            (__VLS_ctx.epicForm.badge);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                value: (__VLS_ctx.epicForm.category),
                ...{ class: "input input--xs" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "policy",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: "wireframe",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "input" },
                placeholder: "Description",
            });
            (__VLS_ctx.epicForm.description);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.handleAddEpic) },
                ...{ class: "btn btn--sm btn--primary" },
                disabled: (!__VLS_ctx.epicForm.epicId.trim() || !__VLS_ctx.epicForm.label.trim()),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.epicFormSprint === s.id))
                            return;
                        __VLS_ctx.epicFormSprint = null;
                    } },
                ...{ class: "btn btn--sm" },
            });
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.epicFormSprint === s.id))
                            return;
                        __VLS_ctx.showEpicForm(s.id);
                    } },
                ...{ class: "btn btn--sm add-epic-btn" },
            });
        }
    }
}
/** @type {__VLS_StyleScopedClasses['admin']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-header']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-status']} */ ;
/** @type {__VLS_StyleScopedClasses['top-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--wide']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-loading']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-list']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-card']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['edit-row']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-info']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-label']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-theme-text']} */ ;
/** @type {__VLS_StyleScopedClasses['lifecycle-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-dates']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--ok']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--danger']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-lifecycle']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--lifecycle']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--lifecycle']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--lifecycle']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-section']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-table']} */ ;
/** @type {__VLS_StyleScopedClasses['td-id']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['td-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['td-id']} */ ;
/** @type {__VLS_StyleScopedClasses['td-label']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['td-cat']} */ ;
/** @type {__VLS_StyleScopedClasses['td-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['td-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--ok']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--danger']} */ ;
/** @type {__VLS_StyleScopedClasses['add-epic-form']} */ ;
/** @type {__VLS_StyleScopedClasses['carryover-label']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['add-epic-form']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['add-epic-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            sprints: sprints,
            router: router,
            statusMsg: statusMsg,
            loading: loading,
            showSprintForm: showSprintForm,
            sprintForm: sprintForm,
            epicFormSprint: epicFormSprint,
            epicForm: epicForm,
            editingSprint: editingSprint,
            editSprintData: editSprintData,
            editingEpic: editingEpic,
            editEpicData: editEpicData,
            carryoverEpic: carryoverEpic,
            carryoverForm: carryoverForm,
            startCarryover: startCarryover,
            handleCarryover: handleCarryover,
            epicsForSprint: epicsForSprint,
            handleAddSprint: handleAddSprint,
            startEditSprint: startEditSprint,
            saveEditSprint: saveEditSprint,
            handleSetActive: handleSetActive,
            handleDeleteSprint: handleDeleteSprint,
            showEpicForm: showEpicForm,
            handleAddEpic: handleAddEpic,
            startEditEpic: startEditEpic,
            saveEditEpic: saveEditEpic,
            handleDeleteEpic: handleDeleteEpic,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
