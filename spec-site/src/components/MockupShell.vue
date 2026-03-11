<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useActiveSection } from '@/composables/useActiveSection'

const route = useRoute()
const router = useRouter()
const { clearActiveSection } = useActiveSection()

const currentSprint = computed(() => (route.params.sprint as string) || '')
const currentPageId = computed(() => (route.params.pageId as string) || '')

interface SidebarItem {
  id: string
  icon: string
  label: string
  pageId: string | null
}

// TODO: Replace with your project's sidebar items
const sidebarItems: SidebarItem[] = [
  { id: 'home', icon: '🏠', label: 'Home', pageId: 'home' },
]

function navigate(item: SidebarItem) {
  if (!item.pageId || item.pageId === currentPageId.value) return
  router.push(`/${item.pageId}/${currentSprint.value}`)
}

watch(currentPageId, () => {
  clearActiveSection()
})
</script>

<template>
  <div class="mockup-shell">
    <nav class="app-sidebar">
      <div class="sidebar-logo">APP</div>
      <div class="sidebar-menu">
        <a
          v-for="item in sidebarItems"
          :key="item.id"
          class="sidebar-item"
          :class="{
            active: item.pageId === currentPageId,
            disabled: !item.pageId,
          }"
          @click="navigate(item)"
        >
          <span class="sidebar-icon">{{ item.icon }}</span>{{ item.label }}
        </a>
      </div>
    </nav>
    <div class="mockup-main">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.mockup-shell {
  display: flex;
  min-height: 100%;
  height: 100%;
  background: var(--bg);
}

.app-sidebar {
  width: var(--sidebar-width);
  background: var(--text-primary);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  flex-shrink: 0;
}
.sidebar-logo {
  width: 44px; height: 44px; background: var(--primary); border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 11px; margin-bottom: 24px; letter-spacing: -0.5px;
}
.sidebar-menu { display: flex; flex-direction: column; gap: 4px; width: 100%; padding: 0 8px; }
.sidebar-item {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 10px 4px; border-radius: 8px; font-size: 10px; color: #9ca3af;
  cursor: pointer; transition: all 0.15s; text-decoration: none;
}
.sidebar-item:hover:not(.disabled) { background: rgba(255,255,255,0.08); color: #fff; }
.sidebar-item.active { background: rgba(255,255,255,0.12); color: #fff; }
.sidebar-item.disabled { opacity: 0.35; cursor: default; }
.sidebar-icon { font-size: 18px; height: 20px; }

.mockup-main {
  flex: 1;
  min-width: 0;
  background: var(--bg);
  overflow-y: auto;
}
</style>
