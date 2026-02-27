<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sprints, featurePages, type SprintConfig } from '../data/navigation'

const route = useRoute()
const router = useRouter()

const currentPageId = computed(() => (route.params.pageId as string) || '')
const currentSprint = computed(() => (route.params.sprint as string) || sprints[0]?.id || '')

const activeSprintLabel = computed(() => {
  const s = sprints.find(s => s.id === currentSprint.value)
  return s?.label ?? currentSprint.value.toUpperCase()
})

const isPolicyPage = computed(() => route.path.startsWith('/policy'))
const isRetroPage = computed(() => route.path.startsWith('/retro'))

// Dropdown state
const sprintOpen = ref(false)

function toggleSprint() {
  sprintOpen.value = !sprintOpen.value
}

function selectSprint(s: SprintConfig) {
  sprintOpen.value = false
  if (isPolicyPage.value) {
    router.push(`/policy/${s.id}`)
  } else if (isRetroPage.value) {
    router.push(`/retro/${s.id}`)
  } else {
    router.push(`/${currentPageId.value}/${s.id}`)
  }
}

function goHome() {
  router.push('/')
}

// Close dropdown on outside click
function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.dropdown')) {
    sprintOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <!-- Logo -->
      <div class="header-logo" @click="goHome">
        <!-- TODO: Change logo text to your project name -->
        <span class="logo-mark">SPEC</span>
        <span class="logo-sub">SITE</span>
      </div>

      <!-- Feature page tabs -->
      <nav class="page-tabs">
        <router-link
          v-for="fp in featurePages"
          :key="fp.id"
          :to="`/${fp.id}/${currentSprint}`"
          class="page-tab"
          :class="{ active: !isPolicyPage && !isRetroPage && currentPageId === fp.id }"
        >
          {{ fp.label }}
        </router-link>
      </nav>
    </div>

    <div class="header-right">
      <!-- Sprint version selector -->
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

      <!-- Sprint-level links -->
      <div class="sprint-links">
        <router-link
          :to="`/policy/${currentSprint}`"
          class="sprint-link"
          :class="{ active: isPolicyPage }"
        >
          Policy
        </router-link>
        <span class="sprint-link-sep">|</span>
        <router-link
          :to="`/retro/${currentSprint}`"
          class="sprint-link"
          :class="{ active: isRetroPage }"
        >
          Retro
        </router-link>
      </div>
    </div>
  </header>
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
  font-family: var(--font-kr);
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
  min-width: 240px;
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

/* ---- Sprint-level links ---- */
.sprint-links {
  display: flex;
  align-items: center;
  gap: 2px;
}

.sprint-link {
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.15s;
}
.sprint-link:hover { background: var(--bg); color: var(--text-primary); }
.sprint-link.active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
}

.sprint-link-sep {
  color: var(--border);
  font-size: 12px;
  user-select: none;
}
</style>
