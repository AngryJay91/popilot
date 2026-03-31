import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiGet, apiPost } from '@/api/client';
import { useUser } from '@/composables/useUser';
const route = useRoute();
const router = useRouter();
const { dynamicMembers, loadMembers } = useUser();
const sprintId = computed(() => route.params.sprintId);
// ── State ──
const step = ref('create');
const loading = ref(false);
const error = ref('');
const retroActions = ref([]);
// Step 1: Create
const newSprint = ref({ id: '', label: '', theme: '', startDate: '', endDate: '' });
const totalWorkingDays = ref(0);
const allMembers = ref([]);
const absences = ref({});
const absenceInput = ref({});
// Step 3: Plan
const planData = ref(null);
// Backlog stories for selection
const backlogStories = ref([]);
const selectedStoryIds = ref(new Set());
const selectedSP = computed(() => {
    return backlogStories.value
        .filter(s => selectedStoryIds.value.has(s.id))
        .reduce((sum, s) => sum + (s.story_points ?? 0), 0);
});
// ── Actions ──
async function createSprint() {
    if (!newSprint.value.id || !newSprint.value.startDate || !newSprint.value.endDate) {
        error.value = 'ID, start date, and end date are required';
        return;
    }
    loading.value = true;
    error.value = '';
    const { data, error: e } = await apiPost('/api/v2/kickoff/create', newSprint.value);
    loading.value = false;
    if (e) {
        error.value = e;
        return;
    }
    totalWorkingDays.value = data.totalWorkingDays;
    step.value = 'checkin';
}
async function loadMemberList() {
    const { data } = await apiGet('/api/v2/admin/members');
    if (data?.members) {
        allMembers.value = data.members.map(m => ({ ...m, checked: false }));
    }
}
async function addAbsence(memberId) {
    const date = absenceInput.value[memberId];
    if (!date)
        return;
    loading.value = true;
    await apiPost(`/api/v2/kickoff/${newSprint.value.id || sprintId.value}/absence`, {
        memberId, dates: [date]
    });
    if (!absences.value[memberId])
        absences.value[memberId] = [];
    absences.value[memberId].push(date);
    absenceInput.value[memberId] = '';
    loading.value = false;
}
async function submitCheckin() {
    const checkedIds = allMembers.value.filter(m => m.checked).map(m => m.id);
    if (!checkedIds.length) {
        error.value = 'Please select participants';
        return;
    }
    loading.value = true;
    error.value = '';
    const sid = newSprint.value.id || sprintId.value;
    const { error: e } = await apiPost(`/api/v2/kickoff/${sid}/checkin`, { memberIds: checkedIds });
    loading.value = false;
    if (e) {
        error.value = e;
        return;
    }
    await loadPlan();
    step.value = 'plan';
}
async function loadPlan() {
    const sid = newSprint.value.id || sprintId.value;
    const { data } = await apiGet(`/api/v2/kickoff/${sid}/plan`);
    if (data)
        planData.value = data;
    // Load backlog stories
    const { data: blData } = await apiGet('/api/v2/pm/data?sprint=backlog');
    if (blData?.stories)
        backlogStories.value = blData.stories;
}
function toggleStory(id) {
    if (selectedStoryIds.value.has(id))
        selectedStoryIds.value.delete(id);
    else
        selectedStoryIds.value.add(id);
}
async function doKickoff() {
    const sid = newSprint.value.id || sprintId.value;
    loading.value = true;
    error.value = '';
    const { error: e } = await apiPost(`/api/v2/nav/sprints/${sid}/kickoff`, {
        storyIds: [...selectedStoryIds.value],
        velocity: planData.value?.velocity,
    });
    loading.value = false;
    if (e) {
        error.value = e;
        return;
    }
    step.value = 'done';
}
onMounted(async () => {
    await loadMembers();
    await loadMemberList();
    // Load retro action items from the most recently closed sprint
    try {
        const { data: navData } = await apiGet('/api/v2/nav');
        const lastClosed = navData?.sprints?.filter((s) => s.status === 'closed')?.[0];
        if (lastClosed) {
            const { data: actData } = await apiGet(`/api/v2/retro/${lastClosed.id}/actions`);
            if (actData?.actions)
                retroActions.value = actData.actions;
        }
    }
    catch (_) { /* ignore if no retro data */ }
    // If sprintId in URL, check existing sprint status
    if (sprintId.value && sprintId.value !== 'new') {
        newSprint.value.id = sprintId.value;
        const { data } = await apiGet(`/api/v2/kickoff/${sprintId.value}/plan`);
        if (data?.sprint) {
            if (data.sprint.status === 'planning') {
                await loadPlan();
                step.value = 'plan';
            }
            else if (data.sprint.status === 'active') {
                error.value = `${sprintId.value} is already an active sprint. Navigate to /kickoff/new to create a new sprint.`;
            }
            else {
                error.value = `${sprintId.value} is already a closed sprint.`;
            }
        }
    }
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['step-item']} */ ;
/** @type {__VLS_StyleScopedClasses['step-item']} */ ;
/** @type {__VLS_StyleScopedClasses['step-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['step-num']} */ ;
/** @type {__VLS_StyleScopedClasses['step-item']} */ ;
/** @type {__VLS_StyleScopedClasses['done']} */ ;
/** @type {__VLS_StyleScopedClasses['step-num']} */ ;
/** @type {__VLS_StyleScopedClasses['kickoff-section']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['member-card']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-value']} */ ;
/** @type {__VLS_StyleScopedClasses['story-card']} */ ;
/** @type {__VLS_StyleScopedClasses['story-card']} */ ;
/** @type {__VLS_StyleScopedClasses['assigned-stories']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['retro-actions-info']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['steps']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "kickoff" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "steps" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "step-item" },
    ...{ class: ({ active: __VLS_ctx.step === 'create', done: __VLS_ctx.step !== 'create' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "step-num" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "step-line" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "step-item" },
    ...{ class: ({ active: __VLS_ctx.step === 'checkin', done: __VLS_ctx.step === 'plan' || __VLS_ctx.step === 'done' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "step-num" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "step-line" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "step-item" },
    ...{ class: ({ active: __VLS_ctx.step === 'plan', done: __VLS_ctx.step === 'done' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "step-num" },
});
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "error-msg" },
    });
    (__VLS_ctx.error);
}
if (__VLS_ctx.retroActions.length && __VLS_ctx.step === 'create') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "retro-actions-info" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    for (const [a] of __VLS_getVForSourceType((__VLS_ctx.retroActions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (a.id),
            ...{ class: "retro-action-item" },
        });
        (a.content);
        if (a.assignee) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "retro-assignee" },
            });
            (a.assignee);
        }
    }
}
if (__VLS_ctx.step === 'create' && !__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "kickoff-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-grid" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ class: "input" },
        placeholder: "s56",
    });
    (__VLS_ctx.newSprint.id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ class: "input" },
        placeholder: "S56",
    });
    (__VLS_ctx.newSprint.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field full" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ class: "input" },
        placeholder: "Sprint goal / theme",
    });
    (__VLS_ctx.newSprint.theme);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "date",
        ...{ class: "input" },
    });
    (__VLS_ctx.newSprint.startDate);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "date",
        ...{ class: "input" },
    });
    (__VLS_ctx.newSprint.endDate);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.createSprint) },
        ...{ class: "btn btn--primary" },
        disabled: (__VLS_ctx.loading),
    });
}
if (__VLS_ctx.step === 'checkin') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "kickoff-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "section-desc" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "info-badge" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
    (__VLS_ctx.totalWorkingDays);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "member-list" },
    });
    for (const [m] of __VLS_getVForSourceType((__VLS_ctx.allMembers))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (m.id),
            ...{ class: "member-card" },
            ...{ class: ({ checked: m.checked }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "member-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "member-check" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "checkbox",
        });
        (m.checked);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "member-name" },
        });
        (m.display_name);
        if (m.checked) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "absence-section" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "absence-tags" },
            });
            for (const [d, i] of __VLS_getVForSourceType(((__VLS_ctx.absences[m.id] || [])))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    key: (i),
                    ...{ class: "absence-tag" },
                });
                (d);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "absence-input-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                type: "date",
                ...{ class: "input input--sm" },
                placeholder: "Absence date",
            });
            (__VLS_ctx.absenceInput[m.id]);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.step === 'checkin'))
                            return;
                        if (!(m.checked))
                            return;
                        __VLS_ctx.addAbsence(m.id);
                    } },
                ...{ class: "btn btn--sm" },
                disabled: (!__VLS_ctx.absenceInput[m.id]),
            });
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.submitCheckin) },
        ...{ class: "btn btn--primary" },
        disabled: (__VLS_ctx.loading || !__VLS_ctx.allMembers.some(m => m.checked)),
    });
}
if (__VLS_ctx.step === 'plan' && __VLS_ctx.planData) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "kickoff-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "velocity-summary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "velocity-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "velocity-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "velocity-value" },
    });
    (__VLS_ctx.planData.velocity);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "velocity-sub" },
    });
    (__VLS_ctx.planData.members.length);
    (__VLS_ctx.planData.totalWorkingDays);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "velocity-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "velocity-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "velocity-value" },
        ...{ class: ({ over: __VLS_ctx.selectedSP > __VLS_ctx.planData.velocity }) },
    });
    (__VLS_ctx.selectedSP);
    if (__VLS_ctx.selectedSP > __VLS_ctx.planData.velocity) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "velocity-warn" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "wd-grid" },
    });
    for (const [m] of __VLS_getVForSourceType((__VLS_ctx.planData.members))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (m.member_id),
            ...{ class: "wd-chip" },
        });
        (m.display_name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (m.working_days);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    if (!__VLS_ctx.backlogStories.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "story-list" },
        });
        for (const [s] of __VLS_getVForSourceType((__VLS_ctx.backlogStories))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.step === 'plan' && __VLS_ctx.planData))
                            return;
                        if (!!(!__VLS_ctx.backlogStories.length))
                            return;
                        __VLS_ctx.toggleStory(s.id);
                    } },
                key: (s.id),
                ...{ class: "story-card" },
                ...{ class: ({ selected: __VLS_ctx.selectedStoryIds.has(s.id) }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.step === 'plan' && __VLS_ctx.planData))
                            return;
                        if (!!(!__VLS_ctx.backlogStories.length))
                            return;
                        __VLS_ctx.toggleStory(s.id);
                    } },
                type: "checkbox",
                checked: (__VLS_ctx.selectedStoryIds.has(s.id)),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "story-title" },
            });
            (s.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "story-sp" },
            });
            (s.story_points ?? '-');
        }
    }
    if (__VLS_ctx.planData.stories.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "assigned-stories" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        (__VLS_ctx.planData.stories.length);
        (__VLS_ctx.planData.totalSP);
        for (const [s] of __VLS_getVForSourceType((__VLS_ctx.planData.stories))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (s.id),
                ...{ class: "story-card assigned" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "story-title" },
            });
            (s.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "story-sp" },
            });
            (s.story_points ?? '-');
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.doKickoff) },
        ...{ class: "btn btn--primary btn--lg" },
        disabled: (__VLS_ctx.loading),
    });
    (__VLS_ctx.selectedSP + __VLS_ctx.planData.totalSP);
}
if (__VLS_ctx.step === 'done') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "kickoff-section done-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.step === 'done'))
                    return;
                __VLS_ctx.router.push('/board/' + (__VLS_ctx.newSprint.id || __VLS_ctx.sprintId));
            } },
        ...{ class: "btn btn--primary" },
    });
}
/** @type {__VLS_StyleScopedClasses['kickoff']} */ ;
/** @type {__VLS_StyleScopedClasses['steps']} */ ;
/** @type {__VLS_StyleScopedClasses['step-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['done']} */ ;
/** @type {__VLS_StyleScopedClasses['step-num']} */ ;
/** @type {__VLS_StyleScopedClasses['step-line']} */ ;
/** @type {__VLS_StyleScopedClasses['step-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['done']} */ ;
/** @type {__VLS_StyleScopedClasses['step-num']} */ ;
/** @type {__VLS_StyleScopedClasses['step-line']} */ ;
/** @type {__VLS_StyleScopedClasses['step-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['done']} */ ;
/** @type {__VLS_StyleScopedClasses['step-num']} */ ;
/** @type {__VLS_StyleScopedClasses['error-msg']} */ ;
/** @type {__VLS_StyleScopedClasses['retro-actions-info']} */ ;
/** @type {__VLS_StyleScopedClasses['retro-action-item']} */ ;
/** @type {__VLS_StyleScopedClasses['retro-assignee']} */ ;
/** @type {__VLS_StyleScopedClasses['kickoff-section']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['full']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['kickoff-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['info-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['member-list']} */ ;
/** @type {__VLS_StyleScopedClasses['member-card']} */ ;
/** @type {__VLS_StyleScopedClasses['checked']} */ ;
/** @type {__VLS_StyleScopedClasses['member-header']} */ ;
/** @type {__VLS_StyleScopedClasses['member-check']} */ ;
/** @type {__VLS_StyleScopedClasses['member-name']} */ ;
/** @type {__VLS_StyleScopedClasses['absence-section']} */ ;
/** @type {__VLS_StyleScopedClasses['absence-tags']} */ ;
/** @type {__VLS_StyleScopedClasses['absence-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['absence-input-row']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['kickoff-section']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-summary']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-card']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-label']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-value']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-card']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-label']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-value']} */ ;
/** @type {__VLS_StyleScopedClasses['over']} */ ;
/** @type {__VLS_StyleScopedClasses['velocity-warn']} */ ;
/** @type {__VLS_StyleScopedClasses['wd-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['wd-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['story-list']} */ ;
/** @type {__VLS_StyleScopedClasses['story-card']} */ ;
/** @type {__VLS_StyleScopedClasses['selected']} */ ;
/** @type {__VLS_StyleScopedClasses['story-title']} */ ;
/** @type {__VLS_StyleScopedClasses['story-sp']} */ ;
/** @type {__VLS_StyleScopedClasses['assigned-stories']} */ ;
/** @type {__VLS_StyleScopedClasses['story-card']} */ ;
/** @type {__VLS_StyleScopedClasses['assigned']} */ ;
/** @type {__VLS_StyleScopedClasses['story-title']} */ ;
/** @type {__VLS_StyleScopedClasses['story-sp']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--lg']} */ ;
/** @type {__VLS_StyleScopedClasses['kickoff-section']} */ ;
/** @type {__VLS_StyleScopedClasses['done-section']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            sprintId: sprintId,
            step: step,
            loading: loading,
            error: error,
            retroActions: retroActions,
            newSprint: newSprint,
            totalWorkingDays: totalWorkingDays,
            allMembers: allMembers,
            absences: absences,
            absenceInput: absenceInput,
            planData: planData,
            backlogStories: backlogStories,
            selectedStoryIds: selectedStoryIds,
            selectedSP: selectedSP,
            createSprint: createSprint,
            addAbsence: addAbsence,
            submitCheckin: submitCheckin,
            toggleStory: toggleStory,
            doKickoff: doKickoff,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
