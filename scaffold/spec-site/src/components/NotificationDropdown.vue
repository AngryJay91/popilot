<script setup lang="ts">
import { type NotificationItem } from '@/composables/useNotification'

defineProps<{
  notifications: NotificationItem[]
  unreadCount: number
}>()

const emit = defineEmits<{
  toggle: []
  click: [n: NotificationItem]
  markAllRead: []
}>()

function getNotifIcon(type: string): string {
  if (type === 'memo_assigned') return '📩'
  if (type === 'memo_mention_all') return '📢'
  if (type === 'reply_received') return '💬'
  return '🔔'
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}hr ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
</script>

<template>
  <div class="notification-bell">
    <button class="bell-trigger" @click.stop="emit('toggle')">
      <span class="bell-icon">&#128276;</span>
      <span v-if="unreadCount > 0" class="bell-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>
    <div class="notif-dropdown">
      <div class="notif-header">
        <span class="notif-header-title">Notifications</span>
        <button v-if="unreadCount > 0" class="notif-mark-all" @click="emit('markAllRead')">Mark all read</button>
      </div>
      <div class="notif-list">
        <div
          v-for="n in notifications"
          :key="n.id"
          class="notif-item"
          :class="{ unread: !n.isRead }"
          @click="emit('click', n)"
        >
          <span class="notif-item-icon">{{ getNotifIcon(n.type) }}</span>
          <div class="notif-item-content">
            <div class="notif-item-title">{{ n.title }}</div>
            <div v-if="n.body" class="notif-item-body">{{ n.body }}</div>
            <div class="notif-item-meta">
              <span class="notif-item-page">{{ n.pageId }}</span>
              <span class="notif-item-time">{{ formatTimeAgo(n.createdAt) }}</span>
            </div>
          </div>
        </div>
        <div v-if="notifications.length === 0" class="notif-empty">No notifications</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notification-bell { position: relative; }
.bell-trigger {
  position: relative; display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 6px; border: none; background: none;
  cursor: pointer; transition: background 0.15s;
}
.bell-trigger:hover { background: var(--bg); }
.bell-icon { font-size: 18px; }
.bell-badge {
  position: absolute; top: 2px; right: 2px; min-width: 16px; height: 16px;
  padding: 0 4px; border-radius: 8px; background: #ef4444; color: #fff;
  font-size: 10px; font-weight: 700; display: flex; align-items: center;
  justify-content: center; line-height: 1; animation: pulse-notif 2s infinite;
}
@keyframes pulse-notif { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
.notif-dropdown {
  position: absolute; top: calc(100% + 4px); right: 0; width: 340px; max-height: 440px;
  background: #fff; border: 1px solid var(--border); border-radius: 8px;
  box-shadow: var(--shadow-md); z-index: 1000; display: flex; flex-direction: column; overflow: hidden;
}
.notif-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.notif-header-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.notif-mark-all {
  background: none; border: none; color: #3b82f6; font-size: 12px; font-weight: 500;
  cursor: pointer; padding: 2px 6px; border-radius: 4px;
}
.notif-mark-all:hover { background: #eff6ff; }
.notif-list { flex: 1; overflow-y: auto; }
.notif-item {
  display: flex; gap: 10px; padding: 10px 16px; cursor: pointer;
  transition: background 0.1s; border-bottom: 1px solid #f1f5f9;
}
.notif-item:hover { background: #f8fafc; }
.notif-item.unread { background: #eff6ff; }
.notif-item.unread:hover { background: #dbeafe; }
.notif-item-icon { font-size: 16px; flex-shrink: 0; padding-top: 2px; }
.notif-item-content { flex: 1; min-width: 0; }
.notif-item-title { font-size: 13px; font-weight: 500; color: var(--text-primary); line-height: 1.3; }
.notif-item-body { font-size: 12px; color: var(--text-secondary); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.notif-item-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; font-size: 11px; color: var(--text-muted); }
.notif-item-page { background: #f1f5f9; padding: 1px 6px; border-radius: 3px; font-size: 10px; }
.notif-empty { padding: 32px 16px; text-align: center; color: var(--text-muted); font-size: 13px; }
@media (max-width: 767px) { .notif-dropdown { width: 300px; right: -8px; } }
</style>
