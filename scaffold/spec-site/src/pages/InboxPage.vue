<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { apiGet, apiPost, apiPatch } from '@/api/client'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { authUser: currentUser } = useAuth()

interface Notification {
  id: number
  user_name: string
  type: string
  title: string
  body: string | null
  source_type: string
  source_id: string
  page_id: string
  actor: string
  is_read: number
  created_at: string
}

const notifications = ref<Notification[]>([])
const loading = ref(true)

const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length)

async function loadNotifications() {
  loading.value = true
  const user = currentUser.value
  if (!user) { loading.value = false; return }
  const { data } = await apiGet(`/api/v2/notifications?user=${encodeURIComponent(user)}`)
  if (data?.notifications) notifications.value = data.notifications as Notification[]
  loading.value = false
}

async function markRead(n: Notification) {
  if (!n.is_read) {
    await apiPatch(`/api/v2/notifications/${n.id}/read`, {})
    n.is_read = 1
  }
  navigate(n)
}

async function markAllRead() {
  const user = currentUser.value
  if (!user) return
  await apiPost('/api/v2/notifications/mark-all-read', { user })
  notifications.value.forEach(n => { n.is_read = 1 })
}

function navigate(n: Notification) {
  if (n.source_type === 'story') {
    router.push(`/board?story=${n.source_id}`)
  } else if (n.source_type === 'nudge') {
    router.push('/')
  } else if (n.page_id) {
    router.push(`/${n.page_id}`)
  }
}

function typeIcon(type: string) {
  const map: Record<string, string> = {
    mention: '@', assign: '📋', review: '👀',
    nudge: '🔔', memo: '💬', comment: '💬',
  }
  return map[type] || '📬'
}

function typeColor(type: string) {
  const map: Record<string, string> = {
    mention: '#3b82f6', assign: '#f59e0b', review: '#8b5cf6',
    nudge: '#ef4444', memo: '#10b981',
  }
  return map[type] || '#6b7280'
}

function formatDate(d: string) {
  const date = new Date(d.endsWith('Z') ? d : d + 'Z')
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(loadNotifications)
</script>

<template>
  <div class="inbox-page">
    <div class="inbox-header">
      <h1>Inbox</h1>
      <div class="inbox-actions">
        <span v-if="unreadCount" class="unread-badge">{{ unreadCount }} unread</span>
        <button v-if="unreadCount" class="btn btn--primary btn--sm" @click="markAllRead">Mark All Read</button>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="!notifications.length" class="empty">No notifications.</div>

    <div v-else class="notification-list">
      <div
        v-for="n in notifications"
        :key="n.id"
        class="notification-item"
        :class="{ unread: !n.is_read }"
        @click="markRead(n)"
      >
        <span class="notif-icon" :style="{ background: typeColor(n.type) }">{{ typeIcon(n.type) }}</span>
        <div class="notif-content">
          <div class="notif-title">{{ n.title }}</div>
          <div v-if="n.body" class="notif-body">{{ n.body.slice(0, 100) }}{{ n.body.length > 100 ? '...' : '' }}</div>
          <div class="notif-meta">
            <span class="notif-actor">{{ n.actor }}</span>
            <span class="notif-date">{{ formatDate(n.created_at) }}</span>
          </div>
        </div>
        <span v-if="!n.is_read" class="notif-dot" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.inbox-page { max-width: 700px; margin: 0 auto; padding: 24px 16px; }
.inbox-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.inbox-header h1 { font-size: 20px; font-weight: 700; }
.inbox-actions { display: flex; align-items: center; gap: 8px; }
.unread-badge { background: #ef4444; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; }

.notification-list { display: flex; flex-direction: column; gap: 4px; }
.notification-item {
  display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px;
  background: var(--card-bg, #fff); border: 1px solid var(--border-light, #e2e8f0);
  border-radius: 12px; cursor: pointer; transition: transform 0.1s;
}
.notification-item:hover { transform: translateY(-1px); }
.notification-item.unread { background: rgba(59,130,246,0.08); border-left: 3px solid #3b82f6; }

.notif-icon {
  width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.notif-content { flex: 1; min-width: 0; }
.notif-title { font-size: 14px; font-weight: 600; margin-bottom: 2px; }
.notif-body { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }
.notif-meta { display: flex; gap: 8px; font-size: 11px; color: var(--text-muted); }
.notif-actor { font-weight: 500; }
.notif-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; margin-top: 6px; }

.btn { padding: 8px 16px; border: 1px solid var(--border-light, #e2e8f0); border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; background: var(--card-bg, #fff); color: var(--text-secondary); transition: all 0.15s; }
.btn--primary { background: #1e293b; color: #fff; border-color: #1e293b; }
.btn--primary:hover { background: #334155; }
.btn--sm { padding: 4px 10px; font-size: 11px; }

.loading, .empty { text-align: center; color: var(--text-muted); padding: 40px; }
</style>
