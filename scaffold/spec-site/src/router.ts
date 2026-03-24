import { createRouter, createWebHistory } from 'vue-router'
import { isValidFeaturePage, featurePages } from './data/navigation'
import { getWireframe, getAvailableSprints } from './data/wireframeRegistry'
import { getActiveSprint, sprints } from './composables/useNavStore'
import { isFeatureEnabled } from './features'

function currentActiveSprint(): string {
  return getActiveSprint().id
}

/** Guard: redirect to '/' if feature is disabled */
function featureGuard(featureId: string) {
  return () => {
    if (!isFeatureEnabled(featureId as any)) return '/'
  }
}

const routes = [
  { path: '/', component: () => import('./pages/IndexPage.vue') },

  // -- Tier 2: Dashboard --
  {
    path: '/dashboard',
    component: () => import('./pages/DashboardPage.vue'),
    meta: { title: 'Dashboard' },
    beforeEnter: featureGuard('dashboard'),
  },

  // -- Tier 2: Board --
  {
    path: '/board',
    component: () => import('./pages/board/BoardPage.vue'),
    meta: { title: 'Board' },
    beforeEnter: featureGuard('board'),
  },

  // -- Tier 2: Standup --
  {
    path: '/standup',
    component: () => import('./pages/standup/StandupPage.vue'),
    meta: { title: 'Standup' },
    beforeEnter: featureGuard('standup'),
  },

  // -- Tier 2: Inbox --
  {
    path: '/inbox',
    component: () => import('./pages/InboxPage.vue'),
    meta: { title: 'Inbox' },
    beforeEnter: featureGuard('inbox'),
  },

  // -- Tier 2: My Page --
  {
    path: '/my',
    component: () => import('./pages/MyPage.vue'),
    meta: { title: 'My Page' },
    beforeEnter: featureGuard('my-page'),
  },

  // -- Tier 2: Admin --
  {
    path: '/admin',
    component: () => import('./pages/AdminPage.vue'),
    meta: { title: 'Admin' },
    beforeEnter: featureGuard('admin'),
  },

  // -- Tier 2: Optional modules --
  {
    path: '/rewards',
    component: () => import('./pages/RewardsPage.vue'),
    meta: { title: 'Rewards' },
    beforeEnter: featureGuard('rewards'),
  },
  {
    path: '/meetings',
    component: () => import('./pages/MeetingsPage.vue'),
    meta: { title: 'Meetings' },
    beforeEnter: featureGuard('meetings'),
  },
  {
    path: '/docs',
    component: () => import('./pages/DocsHub.vue'),
    meta: { title: 'Docs' },
    beforeEnter: featureGuard('docs'),
  },

  // -- Policy documents --
  {
    path: '/policy',
    redirect: () => `/policy/${currentActiveSprint()}`,
  },
  {
    path: '/policy/:sprint',
    component: () => import('./pages/PolicyIndex.vue'),
    meta: { title: 'Policy' },
  },
  {
    path: '/policy/:sprint/:epicId',
    component: () => import('./pages/PolicyDetail.vue'),
    meta: { title: 'Policy' },
  },

  // -- Retro --
  {
    path: '/retro',
    redirect: () => `/retro/${currentActiveSprint()}`,
  },
  {
    path: '/retro/:sprint',
    component: () => import('./pages/retro/RetroPage.vue'),
    meta: { title: 'Retro' },
    beforeEnter: featureGuard('retro'),
  },

  // -- Feature pages (wireframe shell) --
  {
    path: '/:pageId',
    redirect: (to: any) => {
      const id = to.params.pageId as string
      if (!isValidFeaturePage(id)) return '/'
      const activeSprint = currentActiveSprint()
      const available = getAvailableSprints(id)
      const best = available.includes(activeSprint) ? activeSprint : available[0] ?? activeSprint
      return `/${id}/${best}`
    },
  },
  {
    path: '/:pageId/:sprint',
    component: () => import('./pages/wireframe/WireframeShell.vue'),
    beforeEnter: (to: any) => {
      if (!isValidFeaturePage(to.params.pageId as string)) return '/'
    },
  },

  // Catch-all
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  const pageId = to.params.pageId as string
  const sprint = to.params.sprint as string

  if (pageId && sprint) {
    const config = getWireframe(pageId, sprint)
    if (config) {
      document.title = config.routeTitle ?? 'Spec Site'
    } else {
      const fp = featurePages.find(p => p.id === pageId)
      document.title = fp ? `${fp.label} — Spec Site` : 'Spec Site'
    }
  } else {
    document.title = (to.meta.title as string) ?? 'Spec Site'
  }
})

export default router
