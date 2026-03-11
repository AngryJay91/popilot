import { createRouter, createWebHistory } from 'vue-router'
import { isValidFeaturePage, featurePages } from './data/navigation'
import { getWireframe, getAvailableSprints } from './data/wireframeRegistry'
import { getActiveSprint, sprints } from './composables/useNavStore'

function currentActiveSprint(): string {
  return getActiveSprint().id
}

const routes = [
  { path: '/', component: () => import('./pages/IndexPage.vue') },

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

  // -- PoC --
  {
    path: '/poc',
    component: () => import('./pages/poc/PocIndex.vue'),
    meta: { title: 'PoC' },
  },
  {
    path: '/poc/board',
    component: () => import('./pages/poc/KanbanBoard.vue'),
    meta: { title: 'Task Board — PoC' },
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
