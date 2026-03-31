const __VLS_props = defineProps();
const emit = defineEmits();
function getNotifIcon(type) {
    if (type === 'memo_assigned')
        return '📩';
    if (type === 'memo_mention_all')
        return '📢';
    if (type === 'reply_received')
        return '💬';
    return '🔔';
}
function formatTimeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1)
        return 'just now';
    if (mins < 60)
        return `${mins}min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24)
        return `${hours}hr ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['bell-trigger']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-mark-all']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-item']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-item']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-item']} */ ;
/** @type {__VLS_StyleScopedClasses['unread']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-dropdown']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "notification-bell" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.emit('toggle');
        } },
    ...{ class: "bell-trigger" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "bell-icon" },
});
if (__VLS_ctx.unreadCount > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "bell-badge" },
    });
    (__VLS_ctx.unreadCount > 9 ? '9+' : __VLS_ctx.unreadCount);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "notif-dropdown" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "notif-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "notif-header-title" },
});
if (__VLS_ctx.unreadCount > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.unreadCount > 0))
                    return;
                __VLS_ctx.emit('markAllRead');
            } },
        ...{ class: "notif-mark-all" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "notif-list" },
});
for (const [n] of __VLS_getVForSourceType((__VLS_ctx.notifications))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('click', n);
            } },
        key: (n.id),
        ...{ class: "notif-item" },
        ...{ class: ({ unread: !n.isRead }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "notif-item-icon" },
    });
    (__VLS_ctx.getNotifIcon(n.type));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "notif-item-content" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "notif-item-title" },
    });
    (n.title);
    if (n.body) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "notif-item-body" },
        });
        (n.body);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "notif-item-meta" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "notif-item-page" },
    });
    (n.pageId);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "notif-item-time" },
    });
    (__VLS_ctx.formatTimeAgo(n.createdAt));
}
if (__VLS_ctx.notifications.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "notif-empty" },
    });
}
/** @type {__VLS_StyleScopedClasses['notification-bell']} */ ;
/** @type {__VLS_StyleScopedClasses['bell-trigger']} */ ;
/** @type {__VLS_StyleScopedClasses['bell-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['bell-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-dropdown']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-header']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-header-title']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-mark-all']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-list']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-item']} */ ;
/** @type {__VLS_StyleScopedClasses['unread']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-item-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-item-content']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-item-title']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-item-body']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-item-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-item-page']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-item-time']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-empty']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            emit: emit,
            getNotifIcon: getNotifIcon,
            formatTimeAgo: formatTimeAgo,
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
