import { createRouter, createWebHistory } from 'vue-router'
import { isValidFeaturePage, getActiveSprint, featurePages } from './data/navigation'
import { getWireframe, getAvailableSprints } from './data/wireframeRegistry'

const activeSprint = getActiveSprint().id

const routes = [
  { path: '/', component: () => import('./pages/IndexPage.vue') },

  // -- Policy documents --
  {
    path: '/policy',
    redirect: `/policy/${activeSprint}`,
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

  // -- Retro (Turso-based team collaboration) --
  {
    path: '/retro',
    redirect: `/retro/${activeSprint}`,
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
      const sprints = getAvailableSprints(id)
      const best = sprints.includes(activeSprint) ? activeSprint : sprints[0] ?? activeSprint
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
