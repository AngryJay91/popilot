import { ref, onMounted } from 'vue';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/composables/useTurso';
const props = defineProps();
const comments = ref([]);
const newComment = ref('');
const replyTo = ref(null);
const editingId = ref(null);
const editingText = ref('');
async function load() {
    const { data } = await apiGet(`/api/v2/docs/${props.docId}/comments`);
    comments.value = data?.comments || [];
}
const rootComments = () => comments.value.filter(c => !c.parent_id);
const replies = (parentId) => comments.value.filter(c => c.parent_id === parentId);
async function submit() {
    const trimmed = newComment.value.trim();
    if (!trimmed)
        return;
    await apiPost(`/api/v2/docs/${props.docId}/comments`, { content: trimmed, parentId: replyTo.value });
    // @mention notification for doc comments
    if (trimmed.includes('@')) {
        apiPost('/api/v2/notifications/mention', {
            content: trimmed,
            sourceType: 'doc',
            sourceId: props.docId,
            pageId: `/docs/${props.docId}`,
            actor: props.currentUser,
        }).catch(() => { });
    }
    newComment.value = '';
    replyTo.value = null;
    await load();
}
async function startEdit(c) { editingId.value = c.id; editingText.value = c.content; }
async function saveEdit() {
    if (!editingId.value)
        return;
    await apiPatch(`/api/v2/docs/comments/${editingId.value}`, { content: editingText.value });
    editingId.value = null;
    await load();
}
async function remove(id) {
    if (!confirm('Delete this comment?'))
        return;
    await apiDelete(`/api/v2/docs/comments/${id}`);
    await load();
}
onMounted(load);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['comment-action']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-action']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "doc-comments" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "comments-title" },
});
(__VLS_ctx.comments.length);
for (const [c] of __VLS_getVForSourceType((__VLS_ctx.rootComments()))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (c.id),
        ...{ class: "comment-thread" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "comment-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "comment-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "comment-author" },
    });
    (c.author);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "comment-time" },
    });
    (c.created_at);
    if (__VLS_ctx.editingId === c.id) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "comment-edit" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
            value: (__VLS_ctx.editingText),
            ...{ class: "comment-textarea" },
            rows: "2",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.saveEdit) },
            ...{ class: "btn btn--xs btn--primary" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.editingId === c.id))
                        return;
                    __VLS_ctx.editingId = null;
                } },
            ...{ class: "btn btn--xs" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "comment-body" },
        });
        (c.content);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "comment-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.replyTo = c.id;
            } },
        ...{ class: "comment-action" },
    });
    if (c.author === __VLS_ctx.currentUser) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(c.author === __VLS_ctx.currentUser))
                        return;
                    __VLS_ctx.startEdit(c);
                } },
            ...{ class: "comment-action" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(c.author === __VLS_ctx.currentUser))
                        return;
                    __VLS_ctx.remove(c.id);
                } },
            ...{ class: "comment-action danger" },
        });
    }
    for (const [r] of __VLS_getVForSourceType((__VLS_ctx.replies(c.id)))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (r.id),
            ...{ class: "comment-reply" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "comment-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "comment-author" },
        });
        (r.author);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "comment-time" },
        });
        (r.created_at);
        if (__VLS_ctx.editingId === r.id) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "comment-edit" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
                value: (__VLS_ctx.editingText),
                ...{ class: "comment-textarea" },
                rows: "2",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.saveEdit) },
                ...{ class: "btn btn--xs btn--primary" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.editingId === r.id))
                            return;
                        __VLS_ctx.editingId = null;
                    } },
                ...{ class: "btn btn--xs" },
            });
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "comment-body" },
            });
            (r.content);
        }
        if (r.author === __VLS_ctx.currentUser) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "comment-actions" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(r.author === __VLS_ctx.currentUser))
                            return;
                        __VLS_ctx.startEdit(r);
                    } },
                ...{ class: "comment-action" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(r.author === __VLS_ctx.currentUser))
                            return;
                        __VLS_ctx.remove(r.id);
                    } },
                ...{ class: "comment-action danger" },
            });
        }
    }
    if (__VLS_ctx.replyTo === c.id) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "reply-form" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
            value: (__VLS_ctx.newComment),
            ...{ class: "comment-textarea" },
            rows: "2",
            placeholder: "Reply...",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.submit) },
            ...{ class: "btn btn--xs btn--primary" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.replyTo === c.id))
                        return;
                    __VLS_ctx.replyTo = null;
                } },
            ...{ class: "btn btn--xs" },
        });
    }
}
if (!__VLS_ctx.replyTo) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "new-comment" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.newComment),
        ...{ class: "comment-textarea" },
        rows: "2",
        placeholder: "Write a comment...",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.submit) },
        ...{ class: "btn btn--sm btn--primary" },
        disabled: (!__VLS_ctx.newComment.trim()),
    });
}
/** @type {__VLS_StyleScopedClasses['doc-comments']} */ ;
/** @type {__VLS_StyleScopedClasses['comments-title']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-thread']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-item']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-header']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-author']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-time']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-body']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-action']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-action']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-action']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-reply']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-header']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-author']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-time']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-body']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-action']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-action']} */ ;
/** @type {__VLS_StyleScopedClasses['danger']} */ ;
/** @type {__VLS_StyleScopedClasses['reply-form']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['new-comment']} */ ;
/** @type {__VLS_StyleScopedClasses['comment-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            comments: comments,
            newComment: newComment,
            replyTo: replyTo,
            editingId: editingId,
            editingText: editingText,
            rootComments: rootComments,
            replies: replies,
            submit: submit,
            startEdit: startEdit,
            saveEdit: saveEdit,
            remove: remove,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
