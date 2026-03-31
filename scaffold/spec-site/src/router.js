import { createRouter, createWebHistory } from 'vue-router';
import { isValidFeaturePage, featurePages } from './data/navigation';
import { getWireframe, getAvailableSprints } from './data/wireframeRegistry';
import { getActiveSprint } from './composables/useNavStore';
import { isFeatureEnabled } from './features';
import { isStaticMode } from './api/client';
const AUTH_STORAGE_KEY = 'spec-auth-token';
function currentActiveSprint() {
    return getActiveSprint().id;
}
/** Guard: redirect to '/' if feature is disabled */
function featureGuard(featureId) {
    return () => {
        if (!isFeatureEnabled(featureId))
            return '/';
    };
}
const routes = [
    // -- Public routes --
    {
        path: '/login',
        component: () => import('./pages/LoginPage.vue'),
        meta: { public: true },
    },
    { path: '/', component: () => import('./pages/IndexPage.vue'), meta: { public: true } },
    // -- Tier 2: Dashboard --
    {
        path: '/dashboard',
        component: () => import('./pages/DashboardPage.vue'),
        meta: { title: 'Dashboard', requiresAuth: true },
        beforeEnter: featureGuard('dashboard'),
    },
    // -- Tier 2: Board --
    {
        path: '/board',
        redirect: () => `/board/${currentActiveSprint()}`,
    },
    {
        path: '/board/backlog',
        component: () => import('./pages/board/BoardPage.vue'),
        meta: { title: 'Backlog' },
        beforeEnter: featureGuard('board'),
    },
    {
        path: '/board/:sprint',
        component: () => import('./pages/board/BoardPage.vue'),
        meta: { title: 'Board' },
        beforeEnter: featureGuard('board'),
    },
    // -- Board Admin --
    {
        path: '/admin/board',
        component: () => import('./pages/board/BoardAdmin.vue'),
        meta: { title: 'Board Admin' },
        beforeEnter: featureGuard('admin'),
    },
    // -- My Tasks --
    {
        path: '/my-tasks',
        redirect: () => `/my-tasks/${currentActiveSprint()}`,
    },
    {
        path: '/my-tasks/:sprint',
        component: () => import('./pages/board/MyTasksPage.vue'),
        meta: { title: 'My Tasks' },
        beforeEnter: featureGuard('board'),
    },
    // -- Sprint Kickoff --
    {
        path: '/kickoff/new',
        component: () => import('./pages/board/SprintKickoff.vue'),
        meta: { title: 'Sprint Kickoff' },
        beforeEnter: featureGuard('board'),
    },
    {
        path: '/kickoff/:sprintId',
        component: () => import('./pages/board/SprintKickoff.vue'),
        meta: { title: 'Sprint Kickoff' },
        beforeEnter: featureGuard('board'),
    },
    // -- Sprint Close --
    {
        path: '/close/:sprintId',
        component: () => import('./pages/board/SprintClose.vue'),
        meta: { title: 'Sprint Close' },
        beforeEnter: featureGuard('board'),
    },
    // -- Tier 2: Standup --
    {
        path: '/standup',
        redirect: () => `/standup/${currentActiveSprint()}`,
    },
    {
        path: '/standup/:sprint',
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
    {
        path: '/me',
        redirect: '/my',
    },
    {
        path: '/my-page',
        redirect: '/my',
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
        redirect: (to) => {
            const id = to.params.pageId;
            if (!isValidFeaturePage(id))
                return '/';
            const activeSprint = currentActiveSprint();
            const available = getAvailableSprints(id);
            const best = available.includes(activeSprint) ? activeSprint : available[0] ?? activeSprint;
            return `/${id}/${best}`;
        },
    },
    {
        path: '/:pageId/:sprint',
        component: () => import('./pages/wireframe/WireframeShell.vue'),
        beforeEnter: (to) => {
            if (!isValidFeaturePage(to.params.pageId))
                return '/';
        },
    },
    // Catch-all
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
    },
];
const router = createRouter({
    history: createWebHistory(),
    routes,
});
/**
 * Global auth guard.
 *
 * In static mode (no API), auth is always bypassed — the spec-site runs
 * as a public local/preview build.
 *
 * In API mode, all routes require authentication unless:
 *   - route.meta.public === true  (e.g. /login, /)
 *
 * Unauthenticated users are redirected to /login with the original path
 * preserved as ?redirect=... so they can be sent back after logging in.
 */
router.beforeEach((to) => {
    // Static mode: no auth required
    if (isStaticMode())
        return true;
    // Public routes: always accessible
    if (to.meta.public)
        return true;
    // Check for stored token
    const token = localStorage.getItem(AUTH_STORAGE_KEY);
    if (token)
        return true;
    // No token — redirect to login, preserving intended destination
    return {
        path: '/login',
        query: { redirect: to.fullPath },
    };
});
router.afterEach((to) => {
    const pageId = to.params.pageId;
    const sprint = to.params.sprint;
    if (pageId && sprint) {
        const config = getWireframe(pageId, sprint);
        if (config) {
            document.title = config.routeTitle ?? 'Spec Site';
        }
        else {
            const fp = featurePages.find(p => p.id === pageId);
            document.title = fp ? `${fp.label} — Spec Site` : 'Spec Site';
        }
    }
    else {
        document.title = to.meta.title ?? 'Spec Site';
    }
});
export default router;
