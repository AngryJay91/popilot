import { ref, computed, watch } from 'vue';
const props = defineProps();
const emit = defineEmits();
const doneText = ref(props.entry?.doneText ?? '');
const planText = ref(props.entry?.planText ?? '');
const blockers = ref(props.entry?.blockers ?? '');
const selectedStoryIds = ref([...(props.entry?.planStoryIds ?? [])]);
const editing = ref(false);
// Task creation state
const creatingTask = ref(false);
const newTaskTitle = ref('');
const newTaskStoryId = ref(null);
watch(() => props.entry, (e) => {
    if (e && !editing.value) {
        doneText.value = e.doneText ?? '';
        planText.value = e.planText ?? '';
        blockers.value = e.blockers ?? '';
        selectedStoryIds.value = [...(e.planStoryIds ?? [])];
    }
});
const myStories = computed(() => props.sprintStories.filter(s => s.assignee === props.userName && s.status !== 'done'));
const viewLinkedStories = computed(() => {
    const ids = props.entry?.planStoryIds ?? [];
    return ids.map(id => {
        const story = props.sprintStories.find(s => s.id === id);
        if (!story)
            return null;
        const storyTasks = props.sprintTasks.filter(t => t.storyId === id);
        const doneTasks = storyTasks.filter(t => t.status === 'done').length;
        return {
            story,
            totalTasks: storyTasks.length,
            doneTasks,
            progress: storyTasks.length > 0 ? doneTasks / storyTasks.length : 0,
        };
    }).filter((x) => x !== null);
});
function getStoryProgress(storyId) {
    const storyTasks = props.sprintTasks.filter(t => t.storyId === storyId);
    const done = storyTasks.filter(t => t.status === 'done').length;
    return storyTasks.length > 0 ? `${done}/${storyTasks.length}` : '-';
}
function startEdit() {
    selectedStoryIds.value = [...(props.entry?.planStoryIds ?? [])];
    editing.value = true;
}
function save() {
    emit('save', {
        doneText: doneText.value.trim() || null,
        planText: planText.value.trim() || null,
        planStoryIds: [...selectedStoryIds.value],
        blockers: blockers.value.trim() || null,
    });
    editing.value = false;
}
function cancel() {
    doneText.value = props.entry?.doneText ?? '';
    planText.value = props.entry?.planText ?? '';
    blockers.value = props.entry?.blockers ?? '';
    selectedStoryIds.value = [...(props.entry?.planStoryIds ?? [])];
    editing.value = false;
}
function startCreateTask() {
    newTaskTitle.value = props.entry?.planText ?? '';
    newTaskStoryId.value = myStories.value.length > 0 ? myStories.value[0].id : null;
    creatingTask.value = true;
}
function onCreateTask() {
    if (!newTaskStoryId.value || !newTaskTitle.value.trim())
        return;
    emit('createTask', { storyId: newTaskStoryId.value, title: newTaskTitle.value.trim() });
    creatingTask.value = false;
    newTaskTitle.value = '';
    newTaskStoryId.value = null;
}
// Feedback
const showFeedbackForm = ref(false);
const feedbackText = ref('');
const feedbackType = ref('comment');
function onSubmitFeedback() {
    if (!feedbackText.value.trim())
        return;
    emit('submitFeedback', { feedbackText: feedbackText.value.trim(), reviewType: feedbackType.value });
    feedbackText.value = '';
    feedbackType.value = 'comment';
    showFeedbackForm.value = false;
}
function feedbackIcon(type) {
    if (type === 'approve')
        return '&#10003;';
    if (type === 'request_changes')
        return '&#8634;';
    return '&#128172;';
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['standup-card']} */ ;
/** @type {__VLS_StyleScopedClasses['standup-card']} */ ;
/** @type {__VLS_StyleScopedClasses['section-text']} */ ;
/** @type {__VLS_StyleScopedClasses['textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['story-check']} */ ;
/** @type {__VLS_StyleScopedClasses['linked-story']} */ ;
/** @type {__VLS_StyleScopedClasses['linked-story']} */ ;
/** @type {__VLS_StyleScopedClasses['task-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['type-option']} */ ;
/** @type {__VLS_StyleScopedClasses['type-option']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "standup-card" },
    ...{ class: ({ 'has-blockers': __VLS_ctx.blockers.trim() }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "card-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "card-header-left" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "card-user" },
});
(__VLS_ctx.userName);
if (__VLS_ctx.entry?.sprint) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "sprint-badge" },
    });
    (__VLS_ctx.entry.sprint);
}
if (__VLS_ctx.editable && !__VLS_ctx.editing) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.startEdit) },
        ...{ class: "btn btn--sm" },
    });
}
if (__VLS_ctx.editing) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "section-label done-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.doneText),
        ...{ class: "textarea" },
        rows: "3",
        placeholder: "Work completed yesterday...",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "section-label plan-label" },
    });
    if (__VLS_ctx.myStories.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "story-picker" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "picker-header" },
        });
        for (const [s] of __VLS_getVForSourceType((__VLS_ctx.myStories))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                key: (s.id),
                ...{ class: "story-check" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                type: "checkbox",
                value: (s.id),
            });
            (__VLS_ctx.selectedStoryIds);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "story-check-title" },
            });
            (s.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "story-check-progress" },
            });
            (__VLS_ctx.getStoryProgress(s.id));
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.planText),
        ...{ class: "textarea" },
        rows: "3",
        placeholder: "Other plans...",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "section-label blocker-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.blockers),
        ...{ class: "textarea" },
        rows: "2",
        placeholder: "Blocking issues (leave empty if none)",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "card-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.save) },
        ...{ class: "btn btn--sm btn--primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.cancel) },
        ...{ class: "btn btn--sm" },
    });
}
else {
    if (__VLS_ctx.doneText) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section-label done-label" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section-text" },
        });
        (__VLS_ctx.doneText);
    }
    if (__VLS_ctx.viewLinkedStories.length > 0 || __VLS_ctx.planText) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section-label plan-label" },
        });
        for (const [ls] of __VLS_getVForSourceType((__VLS_ctx.viewLinkedStories))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (ls.story.id),
                ...{ class: "linked-story" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "linked-story-title" },
            });
            (ls.story.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "progress-row" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "progress-bar" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                ...{ class: "progress-fill" },
                ...{ style: ({ width: (ls.progress * 100) + '%' }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "progress-text" },
            });
            (ls.doneTasks);
            (ls.totalTasks);
        }
        if (__VLS_ctx.planText) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "section-text" },
                ...{ class: ({ 'has-linked': __VLS_ctx.viewLinkedStories.length > 0 }) },
            });
            (__VLS_ctx.planText);
        }
        if (__VLS_ctx.editable && __VLS_ctx.planText && !__VLS_ctx.creatingTask) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "create-task-cta" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.startCreateTask) },
                ...{ class: "btn btn--xs" },
            });
        }
        if (__VLS_ctx.creatingTask) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "create-task-form" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "task-input" },
                placeholder: "Task title",
            });
            (__VLS_ctx.newTaskTitle);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                value: (__VLS_ctx.newTaskStoryId),
                ...{ class: "story-select" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                value: (null),
                disabled: true,
            });
            for (const [s] of __VLS_getVForSourceType((__VLS_ctx.myStories))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: (s.id),
                    value: (s.id),
                });
                (s.title);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "create-task-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.onCreateTask) },
                ...{ class: "btn btn--xs btn--primary" },
                disabled: (!__VLS_ctx.newTaskStoryId || !__VLS_ctx.newTaskTitle.trim()),
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.editing))
                            return;
                        if (!(__VLS_ctx.viewLinkedStories.length > 0 || __VLS_ctx.planText))
                            return;
                        if (!(__VLS_ctx.creatingTask))
                            return;
                        __VLS_ctx.creatingTask = false;
                    } },
                ...{ class: "btn btn--xs" },
            });
        }
    }
    if (__VLS_ctx.blockers) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section-label blocker-label" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section-text blocker-text" },
        });
        (__VLS_ctx.blockers);
    }
    if (!__VLS_ctx.doneText && !__VLS_ctx.planText && __VLS_ctx.viewLinkedStories.length === 0 && !__VLS_ctx.blockers) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-entry" },
        });
        if (__VLS_ctx.editable) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ onClick: (__VLS_ctx.startEdit) },
                ...{ class: "empty-cta" },
            });
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
    }
    if (__VLS_ctx.entry && (__VLS_ctx.feedback.length > 0 || !__VLS_ctx.editable)) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "feedback-section" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "section-label feedback-label" },
        });
        (__VLS_ctx.feedback.length);
        for (const [fb] of __VLS_getVForSourceType((__VLS_ctx.feedback))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (fb.id),
                ...{ class: "feedback-item" },
                ...{ class: ('feedback--' + fb.reviewType.replace('_', '-')) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "feedback-header" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "feedback-icon" },
            });
            __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.feedbackIcon(fb.reviewType)) }, null, null);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "feedback-author" },
            });
            (fb.feedbackBy);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "feedback-type-badge" },
            });
            (fb.reviewType);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "feedback-text" },
            });
            (fb.feedbackText);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "feedback-time" },
            });
            (fb.createdAt);
        }
        if (__VLS_ctx.entry && !__VLS_ctx.editable) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            if (!__VLS_ctx.showFeedbackForm) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.editing))
                                return;
                            if (!(__VLS_ctx.entry && (__VLS_ctx.feedback.length > 0 || !__VLS_ctx.editable)))
                                return;
                            if (!(__VLS_ctx.entry && !__VLS_ctx.editable))
                                return;
                            if (!(!__VLS_ctx.showFeedbackForm))
                                return;
                            __VLS_ctx.showFeedbackForm = true;
                        } },
                    ...{ class: "btn btn--xs feedback-btn" },
                });
            }
            if (__VLS_ctx.showFeedbackForm) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "feedback-form" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "feedback-type-select" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "type-option" },
                    ...{ class: ({ active: __VLS_ctx.feedbackType === 'comment' }) },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    type: "radio",
                    value: "comment",
                });
                (__VLS_ctx.feedbackType);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "type-option" },
                    ...{ class: ({ active: __VLS_ctx.feedbackType === 'approve' }) },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    type: "radio",
                    value: "approve",
                });
                (__VLS_ctx.feedbackType);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                    ...{ class: "type-option" },
                    ...{ class: ({ active: __VLS_ctx.feedbackType === 'request_changes' }) },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    type: "radio",
                    value: "request_changes",
                });
                (__VLS_ctx.feedbackType);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
                    value: (__VLS_ctx.feedbackText),
                    ...{ class: "textarea" },
                    rows: "2",
                    placeholder: "Enter your feedback...",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "card-actions" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (__VLS_ctx.onSubmitFeedback) },
                    ...{ class: "btn btn--xs btn--primary" },
                    disabled: (!__VLS_ctx.feedbackText.trim()),
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!!(__VLS_ctx.editing))
                                return;
                            if (!(__VLS_ctx.entry && (__VLS_ctx.feedback.length > 0 || !__VLS_ctx.editable)))
                                return;
                            if (!(__VLS_ctx.entry && !__VLS_ctx.editable))
                                return;
                            if (!(__VLS_ctx.showFeedbackForm))
                                return;
                            __VLS_ctx.showFeedbackForm = false;
                        } },
                    ...{ class: "btn btn--xs" },
                });
            }
        }
    }
}
/** @type {__VLS_StyleScopedClasses['standup-card']} */ ;
/** @type {__VLS_StyleScopedClasses['has-blockers']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header']} */ ;
/** @type {__VLS_StyleScopedClasses['card-header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['card-user']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-label']} */ ;
/** @type {__VLS_StyleScopedClasses['done-label']} */ ;
/** @type {__VLS_StyleScopedClasses['textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-label']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-label']} */ ;
/** @type {__VLS_StyleScopedClasses['story-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['picker-header']} */ ;
/** @type {__VLS_StyleScopedClasses['story-check']} */ ;
/** @type {__VLS_StyleScopedClasses['story-check-title']} */ ;
/** @type {__VLS_StyleScopedClasses['story-check-progress']} */ ;
/** @type {__VLS_StyleScopedClasses['textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-label']} */ ;
/** @type {__VLS_StyleScopedClasses['blocker-label']} */ ;
/** @type {__VLS_StyleScopedClasses['textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['card-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-label']} */ ;
/** @type {__VLS_StyleScopedClasses['done-label']} */ ;
/** @type {__VLS_StyleScopedClasses['section-text']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-label']} */ ;
/** @type {__VLS_StyleScopedClasses['plan-label']} */ ;
/** @type {__VLS_StyleScopedClasses['linked-story']} */ ;
/** @type {__VLS_StyleScopedClasses['linked-story-title']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-row']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-fill']} */ ;
/** @type {__VLS_StyleScopedClasses['progress-text']} */ ;
/** @type {__VLS_StyleScopedClasses['section-text']} */ ;
/** @type {__VLS_StyleScopedClasses['has-linked']} */ ;
/** @type {__VLS_StyleScopedClasses['create-task-cta']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['create-task-form']} */ ;
/** @type {__VLS_StyleScopedClasses['task-input']} */ ;
/** @type {__VLS_StyleScopedClasses['story-select']} */ ;
/** @type {__VLS_StyleScopedClasses['create-task-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-label']} */ ;
/** @type {__VLS_StyleScopedClasses['blocker-label']} */ ;
/** @type {__VLS_StyleScopedClasses['section-text']} */ ;
/** @type {__VLS_StyleScopedClasses['blocker-text']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-entry']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-cta']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-label']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-label']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-item']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-header']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-author']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-text']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-time']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-form']} */ ;
/** @type {__VLS_StyleScopedClasses['feedback-type-select']} */ ;
/** @type {__VLS_StyleScopedClasses['type-option']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['type-option']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['type-option']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['card-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            doneText: doneText,
            planText: planText,
            blockers: blockers,
            selectedStoryIds: selectedStoryIds,
            editing: editing,
            creatingTask: creatingTask,
            newTaskTitle: newTaskTitle,
            newTaskStoryId: newTaskStoryId,
            myStories: myStories,
            viewLinkedStories: viewLinkedStories,
            getStoryProgress: getStoryProgress,
            startEdit: startEdit,
            save: save,
            cancel: cancel,
            startCreateTask: startCreateTask,
            onCreateTask: onCreateTask,
            showFeedbackForm: showFeedbackForm,
            feedbackText: feedbackText,
            feedbackType: feedbackType,
            onSubmitFeedback: onSubmitFeedback,
            feedbackIcon: feedbackIcon,
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
