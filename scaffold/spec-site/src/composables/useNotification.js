/**
 * Notification composable — fetch, poll, and manage notifications.
 *
 * Singleton pattern: refs are module-level, shared across all consumers.
 * In static mode, returns empty state gracefully.
 */
import { ref, computed } from 'vue';
import { apiGet, apiPost, apiPatch, apiDelete, isStaticMode } from '@/api/client';
// Module-level singletons
const notifications = ref([]);
const _userName = ref(null);
let _pollTimer = null;
// Cross-component communication: notification click -> open memo sidebar
export const shouldOpenMemoSidebar = ref(false);
export const pendingNotificationPageId = ref(null);
export function useNotification() {
    const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length);
    function setUser(name) {
        _userName.value = name;
        if (name) {
            fetchNotifications();
        }
        else {
            notifications.value = [];
        }
    }
    async function fetchNotifications() {
        if (isStaticMode() || !_userName.value)
            return;
        try {
            const { data } = await apiGet('/api/v2/notifications', { user: _userName.value });
            if (data) {
                notifications.value = data.notifications.map(row => ({
                    id: Number(row.id),
                    type: String(row.type),
                    title: String(row.title),
                    body: row.body ? String(row.body) : null,
                    sourceType: String(row.source_type),
                    sourceId: Number(row.source_id),
                    pageId: String(row.page_id),
                    actor: String(row.actor),
                    isRead: Number(row.is_read) === 1,
                    createdAt: new Date(row.created_at + 'Z').getTime(),
                }));
            }
        }
        catch {
            // offline -- keep existing
        }
    }
    async function markAsRead(id) {
        if (isStaticMode())
            return;
        try {
            const { error } = await apiPatch(`/api/v2/notifications/${id}/read`, {});
            if (!error) {
                const item = notifications.value.find(n => n.id === id);
                if (item)
                    item.isRead = true;
            }
        }
        catch { /* ignore */ }
    }
    async function markAllAsRead() {
        if (isStaticMode() || !_userName.value)
            return;
        try {
            const { error } = await apiPost('/api/v2/notifications/mark-all-read', { user: _userName.value });
            if (!error) {
                notifications.value.forEach(n => { n.isRead = true; });
            }
            else {
                await fetchNotifications();
            }
        }
        catch { /* ignore */ }
    }
    function startPolling() {
        stopPolling();
        _pollTimer = setInterval(() => fetchNotifications(), 30000);
    }
    function stopPolling() {
        if (_pollTimer) {
            clearInterval(_pollTimer);
            _pollTimer = null;
        }
    }
    // Notification creation (called from useMemo)
    async function createMemoNotifications(memoId, pageId, author, assignedTo, content) {
        if (isStaticMode())
            return;
        const preview = content.length > 60 ? content.slice(0, 60) + '...' : content;
        if (assignedTo) {
            await _insertNotification(assignedTo, 'memo_assigned', `${author} left a memo`, preview, 'memo', memoId, pageId, author);
        }
        else {
            const members = await _getActiveMembers();
            for (const m of members) {
                if (m === author)
                    continue;
                await _insertNotification(m, 'memo_mention_all', `${author} left a team memo`, preview, 'memo', memoId, pageId, author);
            }
        }
    }
    async function createReplyNotification(memoId, pageId, replier, memoAuthor, content) {
        if (isStaticMode())
            return;
        if (replier === memoAuthor)
            return;
        const preview = content.length > 60 ? content.slice(0, 60) + '...' : content;
        await _insertNotification(memoAuthor, 'reply_received', `${replier} replied`, preview, 'memo', memoId, pageId, replier);
    }
    async function deleteNotificationsForMemo(memoId) {
        if (isStaticMode())
            return;
        try {
            await apiDelete('/api/v2/notifications/by-source', { sourceType: 'memo', sourceId: memoId });
        }
        catch { /* ignore */ }
    }
    // Internal helpers
    async function _insertNotification(userName, type, title, body, sourceType, sourceId, pageId, actor) {
        try {
            await apiPost('/api/v2/notifications', {
                userName, type, title, body, sourceType, sourceId, pageId, actor,
            });
        }
        catch { /* ignore */ }
    }
    async function _getActiveMembers() {
        try {
            const { data } = await apiGet('/api/v2/notifications/active-users');
            if (data)
                return data.users;
        }
        catch { /* ignore */ }
        return [];
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
    return {
        notifications,
        unreadCount,
        setUser,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        startPolling,
        stopPolling,
        createMemoNotifications,
        createReplyNotification,
        deleteNotificationsForMemo,
        formatTimeAgo,
        shouldOpenMemoSidebar,
        pendingNotificationPageId,
    };
}
