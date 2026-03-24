<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sprints, getActiveSprint, type SprintConfig } from '../composables/useNavStore'
import { getNavItems } from '@/features'
import { useAuth } from '@/composables/useAuth'
import { useTheme } from '@/composables/useTheme'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useNotification, type NotificationItem, shouldOpenMemoSidebar, pendingNotificationPageId } from '@/composables/useNotification'
import NotificationDropdown from './NotificationDropdown.vue'
import SearchModal from './SearchModal.vue'

const route = useRoute()
const router = useRouter()
const { isAuthenticated, authUser, logout } = useAuth()
const { theme, toggle: toggleTheme } = useTheme()
const isMobile = useMediaQuery('(max-width: 767px)')

const {
  notifications, unreadCount,
  markAsRead, markAllAsRead,
  startPolling, stopPolling,
} = useNotification()

const navItems = computed(() => getNavItems())
const currentSprint = computed(() => (route.params.sprint as string) || getActiveSprint().id)

const activeSprintLabel = computed(() => {
  const s = sprints.value.find(s => s.id === currentSprint.value)
  return s?.label ?? currentSprint.value.toUpperCase()
})

// Dropdown state
const sprintOpen = ref(false)
const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)
const notifOpen = ref(false)
const searchVisible = ref(false)

function toggleSprint() {
  sprintOpen.value = !sprintOpen.value
}

function selectSprint(s: SprintConfig) {
  sprintOpen.value = false
  router.push(`${route.path.replace(/\/[^/]+$/, '')}/${s.id}`)
}

function goHome() {
  router.push('/')
  mobileMenuOpen.value = false
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function openSearch() {
  searchVisible.value = true
}

function handleLogout() {
  userMenuOpen.value = false
  logout()
  router.push('/')
}

function navigateTo(path: string) {
  mobileMenuOpen.value = false
  router.push(path)
}

function handleNotifToggle() {
  notifOpen.value = !notifOpen.value
}

function handleNotifClick(n: NotificationItem) {
  markAsRead(n.id)
  notifOpen.value = false
  if (n.sourceType === 'memo' && n.pageId) {
    pendingNotificationPageId.value = n.pageId
    shouldOpenMemoSidebar.value = true
    router.push(`/${n.pageId}`)
  } else {
    router.push('/inbox')
  }
}

function handleMarkAllRead() {
  markAllAsRead()
}

const themeIcon = computed(() => {
  if (theme.value === 'dark') return 'Dark'
  if (theme.value === 'system') return 'Auto'
  return 'Light'
})

// Ctrl+K shortcut
function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    searchVisible.value = !searchVisible.value
  }
}

// Close dropdowns on outside click
function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.dropdown')) sprintOpen.value = false
  if (!target.closest('.user-menu')) userMenuOpen.value = false
  if (!target.closest('.notification-bell')) notifOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onGlobalKeydown)
  startPolling()
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onGlobalKeydown)
  stopPolling()
})
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <!-- Mobile hamburger -->
      <button v-if="isMobile" class="hamburger-btn" @click="toggleMobileMenu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <template v-if="!mobileMenuOpen">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </template>
          <template v-else>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </template>
        </svg>
      </button>

      <!-- Logo -->
      <div class="header-logo" @click="goHome">
        <span class="logo-mark">SPEC</span>
        <span class="logo-sub">SITE</span>
      </div>

      <!-- Desktop navigation -->
      <nav v-if="!isMobile" class="page-tabs">
        <router-link
          v-for="item in navItems"
          :key="item.id"
          :to="item.path"
          class="page-tab"
          :class="{ active: route.path === item.path || route.path.startsWith(item.path + '/') }"
        >
          {{ item.label }}
        </router-link>
      </nav>
    </div>

    <div class="header-right">
      <!-- Search trigger -->
      <button class="icon-btn" @click="openSearch" title="Search (Ctrl+K)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <kbd v-if="!isMobile" class="kbd-hint">Ctrl+K</kbd>
      </button>

      <!-- Theme toggle -->
      <button class="icon-btn" @click="toggleTheme" :title="`Theme: ${themeIcon}`">
        <svg v-if="theme === 'light'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        <svg v-else-if="theme === 'dark'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      </button>

      <!-- Notifications -->
      <div class="notif-wrapper" :class="{ open: notifOpen }">
        <NotificationDropdown
          :notifications="notifications"
          :unread-count="unreadCount"
          @toggle="handleNotifToggle"
          @click="handleNotifClick"
          @mark-all-read="handleMarkAllRead"
        />
      </div>

      <!-- Sprint selector -->
      <div class="dropdown" :class="{ open: sprintOpen }">
        <button class="dropdown-trigger" @click.stop="toggleSprint">
          {{ activeSprintLabel }}
          <span class="chevron">&#9662;</span>
        </button>
        <div v-if="sprintOpen" class="dropdown-menu">
          <div
            v-for="s in sprints"
            :key="s.id"
            class="dropdown-item"
            :class="{ active: s.id === currentSprint }"
            @click="selectSprint(s)"
          >
            {{ s.label }}
            <span class="sprint-theme">{{ s.theme }}</span>
            <span v-if="s.active" class="dot-active"></span>
          </div>
        </div>
      </div>

      <!-- User menu -->
      <div v-if="isAuthenticated" class="user-menu" :class="{ open: userMenuOpen }">
        <button class="user-btn" @click.stop="toggleUserMenu">
          <span class="user-avatar">{{ (authUser || '?').charAt(0).toUpperCase() }}</span>
          <span v-if="!isMobile" class="user-name">{{ authUser }}</span>
        </button>
        <div v-if="userMenuOpen" class="dropdown-menu user-dropdown">
          <div class="dropdown-item" @click="navigateTo('/my-page')">My Page</div>
          <div class="dropdown-item" @click="handleLogout">Log out</div>
        </div>
      </div>
    </div>
  </header>

  <!-- Mobile navigation drawer -->
  <Teleport to="body">
    <div v-if="isMobile && mobileMenuOpen" class="mobile-overlay" @click="mobileMenuOpen = false">
      <nav class="mobile-drawer" @click.stop>
        <router-link
          v-for="item in navItems"
          :key="item.id"
          :to="item.path"
          class="mobile-nav-item"
          :class="{ active: route.path === item.path || route.path.startsWith(item.path + '/') }"
          @click="mobileMenuOpen = false"
        >
          {{ item.label }}
        </router-link>
      </nav>
    </div>
  </Teleport>

  <!-- Search modal -->
  <SearchModal :visible="searchVisible" @close="searchVisible = false" />
</template>

<style scoped>
.app-header {
  height: var(--header-height);
  background: #fff;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
  gap: 8px;
  z-index: 500;
}

/* ---- Left section ---- */
.header-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.hamburger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
}
.hamburger-btn:hover { background: var(--bg); }

.header-logo {
  display: flex;
  align-items: baseline;
  gap: 5px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  transition: background 0.15s;
  margin-right: 8px;
}
.header-logo:hover { background: var(--bg); }

.logo-mark {
  font-size: 14px;
  font-weight: 800;
  color: var(--primary);
  letter-spacing: -0.5px;
}
.logo-sub {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 2px;
}

/* ---- Page tabs ---- */
.page-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
}

.page-tab {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
  white-space: nowrap;
}
.page-tab:hover { background: var(--bg); color: var(--text-primary); }
.page-tab.active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
}

/* ---- Right section ---- */
.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ---- Icon buttons ---- */
.icon-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border: none;
  background: none;
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  font-family: var(--font-sans);
  transition: all 0.15s;
}
.icon-btn:hover { background: var(--bg); color: var(--text-primary); }

.kbd-hint {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-family: var(--font-sans);
}

/* ---- Notification wrapper ---- */
.notif-wrapper { position: relative; }
.notif-wrapper :deep(.notif-dropdown) { display: none; }
.notif-wrapper.open :deep(.notif-dropdown) { display: flex; }

/* ---- Dropdown ---- */
.dropdown { position: relative; }

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: none;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-sans);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.15s;
}
.dropdown-trigger:hover { background: var(--bg); }
.dropdown.open .dropdown-trigger {
  background: var(--bg);
  border-color: var(--border);
}

.chevron {
  font-size: 10px;
  color: var(--text-muted);
  transition: transform 0.15s;
}
.dropdown.open .chevron { transform: rotate(180deg); }

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 200px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  padding: 4px;
  z-index: 1000;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.1s;
}
.dropdown-item:hover { background: var(--bg); color: var(--text-primary); }
.dropdown-item.active { color: var(--primary); font-weight: 600; }

.sprint-theme {
  font-size: 11px;
  color: var(--text-muted);
  margin-left: auto;
  white-space: nowrap;
}
.dropdown-item.active .sprint-theme { color: var(--primary); opacity: 0.6; }

.dot-active {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--green);
  flex-shrink: 0;
}

/* ---- User menu ---- */
.user-menu {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
  font-family: var(--font-sans);
}
.user-btn:hover { background: var(--bg); }

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary-light, #e0e7ff);
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-dropdown {
  min-width: 140px;
}

/* ---- Mobile drawer ---- */
.mobile-overlay {
  position: fixed;
  inset: 0;
  top: var(--header-height);
  background: rgba(0, 0, 0, 0.3);
  z-index: 999;
}

.mobile-drawer {
  position: absolute;
  top: 0;
  left: 0;
  width: 260px;
  height: 100%;
  background: #fff;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.1);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.15s;
}
.mobile-nav-item:hover { background: var(--bg); color: var(--text-primary); }
.mobile-nav-item.active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
}
</style>
