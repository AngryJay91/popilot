import Icon from '@/components/Icon.vue';
import { MEMO_TYPES } from '@/composables/useMemo';
import { parseMentions } from '@/utils/parseMentions';
import { useRouter } from 'vue-router';
import MentionInput from '@/components/MentionInput.vue';
const props = defineProps();
const router = useRouter();
const emit = defineEmits();
function getMemoTypeInfo(type) {
    return MEMO_TYPES.find(t => t.value === type) ?? MEMO_TYPES[0];
}
function formatTime(ts) {
    const d = typeof ts === 'string' ? new Date(ts) : new Date(ts);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${mm}/${dd} ${hh}:${mi}`;
}
function handleMentionClick(e) {
    const target = e.target;
    if (target.classList.contains('memo-mention')) {
        e.preventDefault();
        const path = target.getAttribute('data-mention-page');
        if (path)
            router.push(path);
    }
}
const PAGE_LABELS = {
    home: 'Home', diagnosis: 'AI Diagnosis', worknote: 'Coaching Notes',
    onboarding: 'Onboarding', pricing: 'Pricing',
};
function getPageLabel(pageId) {
    if (PAGE_LABELS[pageId])
        return PAGE_LABELS[pageId];
    if (pageId.startsWith('policy/')) {
        const parts = pageId.split('/');
        return parts.length === 3 ? `Policy ${parts[2]}` : `Policy`;
    }
    if (pageId.startsWith('retro/'))
        return 'Retrospective';
    return pageId;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['memo-action-btn--resolve']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn--reopen']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn--delete']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn--reply']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn--convert']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn--initiative']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-item']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-item']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-send']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-send']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-cancel']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-page']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-text']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-text']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-mention']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-text']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-mention']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-text']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-mention']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-text']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-text']} */ ;
/** @type {__VLS_StyleScopedClasses['mention-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['review-type-option']} */ ;
/** @type {__VLS_StyleScopedClasses['review-type-option']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "memo-item" },
    ...{ class: ([`memo-item--${__VLS_ctx.memo.memo_type}`, { 'memo-item--resolved': __VLS_ctx.memo.status === 'resolved' }]) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "memo-item-type-bar" },
    ...{ style: ({ background: __VLS_ctx.getMemoTypeInfo(__VLS_ctx.memo.memo_type).color }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "memo-item-content" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "memo-item-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "memo-item-type-label" },
});
(__VLS_ctx.getMemoTypeInfo(__VLS_ctx.memo.memo_type).icon);
(__VLS_ctx.getMemoTypeInfo(__VLS_ctx.memo.memo_type).label);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "memo-item-time" },
});
(__VLS_ctx.formatTime(__VLS_ctx.memo.ts));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "memo-item-route" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "memo-item-author" },
});
(__VLS_ctx.memo.author);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "memo-item-arrow" },
});
if (__VLS_ctx.memo.assigned_to) {
    for (const [name] of __VLS_getVForSourceType((__VLS_ctx.memo.assigned_to.split(',').map((s) => s.trim()).filter(Boolean)))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            key: (name),
            ...{ class: "memo-item-recipient-tag" },
        });
        (name);
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "memo-item-assigned memo-item-assigned--all" },
    });
}
if (__VLS_ctx.showPageLabel && __VLS_ctx.memo.page_id) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showPageLabel && __VLS_ctx.memo.page_id))
                    return;
                __VLS_ctx.router.push('/' + __VLS_ctx.memo.page_id);
            } },
        ...{ class: "memo-item-page" },
    });
    (__VLS_ctx.getPageLabel(__VLS_ctx.memo.page_id));
}
if (__VLS_ctx.memo.title) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-item-title" },
    });
    (__VLS_ctx.memo.title);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.handleMentionClick) },
    ...{ class: "memo-item-text" },
    ...{ class: ({ 'memo-item-text--resolved': __VLS_ctx.memo.status === 'resolved' }) },
});
__VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.parseMentions(__VLS_ctx.memo.text)) }, null, null);
if (__VLS_ctx.replies.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-reply-list" },
    });
    for (const [r] of __VLS_getVForSourceType((__VLS_ctx.replies))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (r.id),
            ...{ class: "memo-reply-item" },
            ...{ class: (`reply-${(r.review_type || 'comment').replace('_', '-')}`) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "memo-reply-header" },
        });
        if (r.review_type === 'approve') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-review-badge badge-approve" },
            });
            /** @type {[typeof Icon, ]} */ ;
            // @ts-ignore
            const __VLS_0 = __VLS_asFunctionalComponent(Icon, new Icon({
                name: "check",
                size: (14),
            }));
            const __VLS_1 = __VLS_0({
                name: "check",
                size: (14),
            }, ...__VLS_functionalComponentArgsRest(__VLS_0));
        }
        else if (r.review_type === 'request_changes') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "memo-review-badge badge-changes" },
            });
            /** @type {[typeof Icon, ]} */ ;
            // @ts-ignore
            const __VLS_3 = __VLS_asFunctionalComponent(Icon, new Icon({
                name: "refreshCw",
                size: (14),
            }));
            const __VLS_4 = __VLS_3({
                name: "refreshCw",
                size: (14),
            }, ...__VLS_functionalComponentArgsRest(__VLS_3));
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "memo-reply-author" },
        });
        (r.created_by);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "memo-reply-time" },
        });
        (__VLS_ctx.formatTime(r.created_at));
        if (r.created_by === __VLS_ctx.authUser) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.replies.length))
                            return;
                        if (!(r.created_by === __VLS_ctx.authUser))
                            return;
                        __VLS_ctx.emit('deleteReply', r.id);
                    } },
                ...{ class: "memo-action-btn memo-action-btn--delete" },
                title: "Delete reply",
                ...{ style: {} },
            });
            /** @type {[typeof Icon, ]} */ ;
            // @ts-ignore
            const __VLS_6 = __VLS_asFunctionalComponent(Icon, new Icon({
                name: "trash",
                size: (14),
            }));
            const __VLS_7 = __VLS_6({
                name: "trash",
                size: (14),
            }, ...__VLS_functionalComponentArgsRest(__VLS_6));
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (__VLS_ctx.handleMentionClick) },
            ...{ class: "memo-reply-text" },
        });
        __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.parseMentions(r.content)) }, null, null);
    }
}
if (__VLS_ctx.replyOpenId === __VLS_ctx.memo.id) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-reply-input" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-review-type-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "review-type-option" },
        ...{ class: ({ active: __VLS_ctx.replyReviewType === 'comment' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onChange: (...[$event]) => {
                if (!(__VLS_ctx.replyOpenId === __VLS_ctx.memo.id))
                    return;
                __VLS_ctx.emit('update:replyReviewType', 'comment');
            } },
        type: "radio",
        name: "replyReviewType",
        checked: (__VLS_ctx.replyReviewType === 'comment'),
    });
    /** @type {[typeof Icon, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(Icon, new Icon({
        name: "messageCircle",
        size: (14),
    }));
    const __VLS_10 = __VLS_9({
        name: "messageCircle",
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "review-type-option" },
        ...{ class: ({ active: __VLS_ctx.replyReviewType === 'approve' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onChange: (...[$event]) => {
                if (!(__VLS_ctx.replyOpenId === __VLS_ctx.memo.id))
                    return;
                __VLS_ctx.emit('update:replyReviewType', 'approve');
            } },
        type: "radio",
        name: "replyReviewType",
        checked: (__VLS_ctx.replyReviewType === 'approve'),
    });
    /** @type {[typeof Icon, ]} */ ;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent(Icon, new Icon({
        name: "check",
        size: (14),
    }));
    const __VLS_13 = __VLS_12({
        name: "check",
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "review-type-option" },
        ...{ class: ({ active: __VLS_ctx.replyReviewType === 'request_changes' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onChange: (...[$event]) => {
                if (!(__VLS_ctx.replyOpenId === __VLS_ctx.memo.id))
                    return;
                __VLS_ctx.emit('update:replyReviewType', 'request_changes');
            } },
        type: "radio",
        name: "replyReviewType",
        checked: (__VLS_ctx.replyReviewType === 'request_changes'),
    });
    /** @type {[typeof Icon, ]} */ ;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent(Icon, new Icon({
        name: "refreshCw",
        size: (14),
    }));
    const __VLS_16 = __VLS_15({
        name: "refreshCw",
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_15));
    /** @type {[typeof MentionInput, ]} */ ;
    // @ts-ignore
    const __VLS_18 = __VLS_asFunctionalComponent(MentionInput, new MentionInput({
        ...{ 'onUpdate:modelValue': {} },
        ...{ 'onSubmit': {} },
        modelValue: (__VLS_ctx.replyText),
        placeholder: "Write a reply... (@ to mention)",
        rows: (2),
    }));
    const __VLS_19 = __VLS_18({
        ...{ 'onUpdate:modelValue': {} },
        ...{ 'onSubmit': {} },
        modelValue: (__VLS_ctx.replyText),
        placeholder: "Write a reply... (@ to mention)",
        rows: (2),
    }, ...__VLS_functionalComponentArgsRest(__VLS_18));
    let __VLS_21;
    let __VLS_22;
    let __VLS_23;
    const __VLS_24 = {
        'onUpdate:modelValue': (...[$event]) => {
            if (!(__VLS_ctx.replyOpenId === __VLS_ctx.memo.id))
                return;
            __VLS_ctx.emit('update:replyText', $event);
        }
    };
    const __VLS_25 = {
        onSubmit: (...[$event]) => {
            if (!(__VLS_ctx.replyOpenId === __VLS_ctx.memo.id))
                return;
            __VLS_ctx.emit('addReply', __VLS_ctx.memo.id);
        }
    };
    var __VLS_20;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "memo-reply-input-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.replyOpenId === __VLS_ctx.memo.id))
                    return;
                __VLS_ctx.emit('addReply', __VLS_ctx.memo.id);
            } },
        ...{ class: "memo-reply-send" },
        disabled: (!__VLS_ctx.replyText.trim()),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.replyOpenId === __VLS_ctx.memo.id))
                    return;
                __VLS_ctx.emit('toggleReply', __VLS_ctx.memo.id);
            } },
        ...{ class: "memo-reply-cancel" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "memo-item-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('toggleReply', __VLS_ctx.memo.id);
        } },
    ...{ class: "memo-action-btn memo-action-btn--reply" },
    title: "Reply",
});
/** @type {[typeof Icon, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(Icon, new Icon({
    name: "messageCircle",
    size: (14),
}));
const __VLS_27 = __VLS_26({
    name: "messageCircle",
    size: (14),
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
(__VLS_ctx.replies.length || '');
if (__VLS_ctx.memo.status === 'open') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.memo.status === 'open'))
                    return;
                __VLS_ctx.emit('convertToTask', __VLS_ctx.memo);
            } },
        ...{ class: "memo-action-btn memo-action-btn--convert" },
        title: "Convert to task",
    });
    /** @type {[typeof Icon, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(Icon, new Icon({
        name: "sprint",
        size: (14),
    }));
    const __VLS_30 = __VLS_29({
        name: "sprint",
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
}
if (__VLS_ctx.memo.status === 'open') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.memo.status === 'open'))
                    return;
                __VLS_ctx.emit('convertToInitiative', __VLS_ctx.memo);
            } },
        ...{ class: "memo-action-btn memo-action-btn--initiative" },
        title: "Convert to initiative",
    });
}
if (__VLS_ctx.memo.status === 'open') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.memo.status === 'open'))
                    return;
                __VLS_ctx.emit('resolve', __VLS_ctx.memo.id);
            } },
        ...{ class: "memo-action-btn memo-action-btn--resolve" },
        title: "Mark as resolved",
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.memo.status === 'open'))
                    return;
                __VLS_ctx.emit('reopen', __VLS_ctx.memo.id);
            } },
        ...{ class: "memo-action-btn memo-action-btn--reopen" },
        title: "Reopen",
    });
}
if (__VLS_ctx.memo.author === __VLS_ctx.authUser) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.memo.author === __VLS_ctx.authUser))
                    return;
                __VLS_ctx.emit('delete', __VLS_ctx.memo.id);
            } },
        ...{ class: "memo-action-btn memo-action-btn--delete" },
        title: "Delete",
    });
    /** @type {[typeof Icon, ]} */ ;
    // @ts-ignore
    const __VLS_32 = __VLS_asFunctionalComponent(Icon, new Icon({
        name: "trash",
        size: (14),
    }));
    const __VLS_33 = __VLS_32({
        name: "trash",
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_32));
}
/** @type {__VLS_StyleScopedClasses['memo-item']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item--resolved']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-type-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-content']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-header']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-type-label']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-time']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-route']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-author']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-recipient-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-assigned']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-assigned--all']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-page']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-title']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-text']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-text--resolved']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-list']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-item']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-header']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-review-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['badge-approve']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-review-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['badge-changes']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-author']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-time']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn--delete']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-text']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-input']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-review-type-select']} */ ;
/** @type {__VLS_StyleScopedClasses['review-type-option']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['review-type-option']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['review-type-option']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-input-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-send']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-reply-cancel']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-item-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn--reply']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn--convert']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn--initiative']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn--resolve']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn--reopen']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['memo-action-btn--delete']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Icon: Icon,
            parseMentions: parseMentions,
            MentionInput: MentionInput,
            router: router,
            emit: emit,
            getMemoTypeInfo: getMemoTypeInfo,
            formatTime: formatTime,
            handleMentionClick: handleMentionClick,
            getPageLabel: getPageLabel,
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
