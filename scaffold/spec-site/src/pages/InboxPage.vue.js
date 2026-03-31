import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { apiGet, apiPost, apiPatch } from '@/api/client';
import { useAuth } from '@/composables/useAuth';
const router = useRouter();
const { authUser: currentUser } = useAuth();
const notifications = ref([]);
const loading = ref(true);
const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length);
async function loadNotifications() {
    loading.value = true;
    const user = currentUser.value;
    if (!user) {
        loading.value = false;
        return;
    }
    const { data } = await apiGet(`/api/v2/notifications?user=${encodeURIComponent(user)}`);
    if (data?.notifications)
        notifications.value = data.notifications;
    loading.value = false;
}
async function markRead(n) {
    if (!n.is_read) {
        await apiPatch(`/api/v2/notifications/${n.id}/read`, {});
        n.is_read = 1;
    }
    navigate(n);
}
async function markAllRead() {
    const user = currentUser.value;
    if (!user)
        return;
    await apiPost('/api/v2/notifications/mark-all-read', { user });
    notifications.value.forEach(n => { n.is_read = 1; });
}
function navigate(n) {
    if (n.source_type === 'story') {
        router.push(`/board?story=${n.source_id}`);
    }
    else if (n.source_type === 'nudge') {
        router.push('/');
    }
    else if (n.page_id) {
        router.push(`/${n.page_id}`);
    }
}
function typeIcon(type) {
    const map = {
        mention: '@', assign: '📋', review: '👀',
        nudge: '🔔', memo: '💬', comment: '💬',
    };
    return map[type] || '📬';
}
function typeColor(type) {
    const map = {
        mention: '#3b82f6', assign: '#f59e0b', review: '#8b5cf6',
        nudge: '#ef4444', memo: '#10b981',
    };
    return map[type] || '#6b7280';
}
function formatDate(d) {
    const date = new Date(d.endsWith('Z') ? d : d + 'Z');
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
onMounted(loadNotifications);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['inbox-header']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-item']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-item']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "inbox-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "inbox-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "inbox-actions" },
});
if (__VLS_ctx.unreadCount) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "unread-badge" },
    });
    (__VLS_ctx.unreadCount);
}
if (__VLS_ctx.unreadCount) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.markAllRead) },
        ...{ class: "btn btn--primary btn--sm" },
    });
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading" },
    });
}
else if (!__VLS_ctx.notifications.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "notification-list" },
    });
    for (const [n] of __VLS_getVForSourceType((__VLS_ctx.notifications))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.notifications.length))
                        return;
                    __VLS_ctx.markRead(n);
                } },
            key: (n.id),
            ...{ class: "notification-item" },
            ...{ class: ({ unread: !n.is_read }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "notif-icon" },
            ...{ style: ({ background: __VLS_ctx.typeColor(n.type) }) },
        });
        (__VLS_ctx.typeIcon(n.type));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "notif-content" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "notif-title" },
        });
        (n.title);
        if (n.body) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "notif-body" },
            });
            (n.body.slice(0, 100));
            (n.body.length > 100 ? '...' : '');
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "notif-meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "notif-actor" },
        });
        (n.actor);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "notif-date" },
        });
        (__VLS_ctx.formatDate(n.created_at));
        if (!n.is_read) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
                ...{ class: "notif-dot" },
            });
        }
    }
}
/** @type {__VLS_StyleScopedClasses['inbox-page']} */ ;
/** @type {__VLS_StyleScopedClasses['inbox-header']} */ ;
/** @type {__VLS_StyleScopedClasses['inbox-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['unread-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-list']} */ ;
/** @type {__VLS_StyleScopedClasses['notification-item']} */ ;
/** @type {__VLS_StyleScopedClasses['unread']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-content']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-title']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-body']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-actor']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-date']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-dot']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            notifications: notifications,
            loading: loading,
            unreadCount: unreadCount,
            markRead: markRead,
            markAllRead: markAllRead,
            typeIcon: typeIcon,
            typeColor: typeColor,
            formatDate: formatDate,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
