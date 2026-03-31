import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { sprints, getActiveSprint } from '../composables/useNavStore';
import { getNavItems, isFeatureEnabled } from '@/features';
import { useAuth } from '@/composables/useAuth';
import { useTheme } from '@/composables/useTheme';
import { useMediaQuery } from '@/composables/useMediaQuery';
import { useNotification, shouldOpenMemoSidebar, pendingNotificationPageId } from '@/composables/useNotification';
import NotificationDropdown from './NotificationDropdown.vue';
import SearchModal from './SearchModal.vue';
const route = useRoute();
const router = useRouter();
const { isAuthenticated, authUser, logout } = useAuth();
const { theme, toggle: toggleTheme } = useTheme();
const isMobile = useMediaQuery('(max-width: 767px)');
const { notifications, unreadCount, markAsRead, markAllAsRead, startPolling, stopPolling, } = useNotification();
const navItems = computed(() => getNavItems());
const currentSprint = computed(() => route.params.sprint || getActiveSprint().id);
const activeSprintLabel = computed(() => {
    const s = sprints.value.find(s => s.id === currentSprint.value);
    return s?.label ?? currentSprint.value.toUpperCase();
});
// Sprint-level page detection
const isBoardPage = computed(() => route.path.startsWith('/board') && route.path !== '/board/backlog');
const isBacklogPage = computed(() => route.path === '/board/backlog');
const isStandupPage = computed(() => route.path.startsWith('/standup'));
const isRetroPage = computed(() => route.path.startsWith('/retro'));
const isMyTasksPage = computed(() => route.path.startsWith('/my-tasks'));
// Dropdown state
const sprintOpen = ref(false);
const sprintMenuOpen = ref(false);
const mobileMenuOpen = ref(false);
const userMenuOpen = ref(false);
const notifOpen = ref(false);
const searchVisible = ref(false);
function toggleSprint() {
    sprintOpen.value = !sprintOpen.value;
}
function selectSprint(s) {
    sprintOpen.value = false;
    if (isBoardPage.value) {
        router.push(`/board/${s.id}`);
    }
    else if (isStandupPage.value) {
        router.push(`/standup/${s.id}`);
    }
    else if (isRetroPage.value) {
        router.push(`/retro/${s.id}`);
    }
    else if (isMyTasksPage.value) {
        router.push(`/my-tasks/${s.id}`);
    }
    else {
        const basePath = route.path.replace(/\/[^/]+$/, '');
        router.push(`${basePath}/${s.id}`);
    }
}
function goHome() {
    router.push('/');
    mobileMenuOpen.value = false;
}
function toggleMobileMenu() {
    mobileMenuOpen.value = !mobileMenuOpen.value;
}
function toggleUserMenu() {
    userMenuOpen.value = !userMenuOpen.value;
}
function openSearch() {
    searchVisible.value = true;
}
function handleLogout() {
    userMenuOpen.value = false;
    logout();
    router.push('/');
}
function navigateTo(path) {
    mobileMenuOpen.value = false;
    sprintMenuOpen.value = false;
    router.push(path);
}
function handleNotifToggle() {
    notifOpen.value = !notifOpen.value;
}
function handleNotifClick(n) {
    markAsRead(n.id);
    notifOpen.value = false;
    if (n.sourceType === 'memo' && n.pageId) {
        pendingNotificationPageId.value = n.pageId;
        shouldOpenMemoSidebar.value = true;
        router.push(`/${n.pageId}`);
    }
    else {
        router.push('/inbox');
    }
}
function handleMarkAllRead() {
    markAllAsRead();
}
const themeIcon = computed(() => {
    if (theme.value === 'dark')
        return 'Dark';
    if (theme.value === 'system')
        return 'Auto';
    return 'Light';
});
// Ctrl+K shortcut
function onGlobalKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchVisible.value = !searchVisible.value;
    }
}
// Close dropdowns on outside click
function onDocClick(e) {
    const target = e.target;
    if (!target.closest('.dropdown'))
        sprintOpen.value = false;
    if (!target.closest('.user-menu'))
        userMenuOpen.value = false;
    if (!target.closest('.notification-bell'))
        notifOpen.value = false;
    if (!target.closest('.sprint-dropdown'))
        sprintMenuOpen.value = false;
}
onMounted(() => {
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onGlobalKeydown);
    startPolling();
});
onUnmounted(() => {
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onGlobalKeydown);
    stopPolling();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['hamburger-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['header-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['page-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['page-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-dropdown-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-dropdown-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-dropdown']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-trigger']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown']} */ ;
/** @type {__VLS_StyleScopedClasses['open']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-trigger']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown']} */ ;
/** @type {__VLS_StyleScopedClasses['open']} */ ;
/** @type {__VLS_StyleScopedClasses['chevron']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-theme']} */ ;
/** @type {__VLS_StyleScopedClasses['user-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "app-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header-left" },
});
if (__VLS_ctx.isMobile) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.toggleMobileMenu) },
        ...{ class: "hamburger-btn" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    if (!__VLS_ctx.mobileMenuOpen) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
            x1: "3",
            y1: "6",
            x2: "21",
            y2: "6",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
            x1: "3",
            y1: "12",
            x2: "21",
            y2: "12",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
            x1: "3",
            y1: "18",
            x2: "21",
            y2: "18",
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
            x1: "18",
            y1: "6",
            x2: "6",
            y2: "18",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
            x1: "6",
            y1: "6",
            x2: "18",
            y2: "18",
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.goHome) },
    ...{ class: "header-logo" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "logo-mark" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "logo-sub" },
});
if (!__VLS_ctx.isMobile) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
        ...{ class: "page-tabs" },
    });
    if (__VLS_ctx.isFeatureEnabled('board')) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "sprint-dropdown" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.isMobile))
                        return;
                    if (!(__VLS_ctx.isFeatureEnabled('board')))
                        return;
                    __VLS_ctx.sprintMenuOpen = !__VLS_ctx.sprintMenuOpen;
                } },
            ...{ class: "page-tab" },
            ...{ class: ({ active: __VLS_ctx.route.path === '/' || __VLS_ctx.isBoardPage || __VLS_ctx.isBacklogPage || __VLS_ctx.isStandupPage || __VLS_ctx.isRetroPage || __VLS_ctx.isMyTasksPage }) },
        });
        if (__VLS_ctx.sprintMenuOpen) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "sprint-dropdown-menu" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.isMobile))
                            return;
                        if (!(__VLS_ctx.isFeatureEnabled('board')))
                            return;
                        if (!(__VLS_ctx.sprintMenuOpen))
                            return;
                        __VLS_ctx.navigateTo('/');
                    } },
                ...{ class: "dropdown-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.isMobile))
                            return;
                        if (!(__VLS_ctx.isFeatureEnabled('board')))
                            return;
                        if (!(__VLS_ctx.sprintMenuOpen))
                            return;
                        __VLS_ctx.navigateTo(`/board/${__VLS_ctx.currentSprint}`);
                    } },
                ...{ class: "dropdown-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.isMobile))
                            return;
                        if (!(__VLS_ctx.isFeatureEnabled('board')))
                            return;
                        if (!(__VLS_ctx.sprintMenuOpen))
                            return;
                        __VLS_ctx.navigateTo(`/standup/${__VLS_ctx.currentSprint}`);
                    } },
                ...{ class: "dropdown-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.isMobile))
                            return;
                        if (!(__VLS_ctx.isFeatureEnabled('board')))
                            return;
                        if (!(__VLS_ctx.sprintMenuOpen))
                            return;
                        __VLS_ctx.navigateTo(`/retro/${__VLS_ctx.currentSprint}`);
                    } },
                ...{ class: "dropdown-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                ...{ class: "menu-divider" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.isMobile))
                            return;
                        if (!(__VLS_ctx.isFeatureEnabled('board')))
                            return;
                        if (!(__VLS_ctx.sprintMenuOpen))
                            return;
                        __VLS_ctx.navigateTo(`/board/${__VLS_ctx.currentSprint}?view=timeline`);
                    } },
                ...{ class: "dropdown-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.isMobile))
                            return;
                        if (!(__VLS_ctx.isFeatureEnabled('board')))
                            return;
                        if (!(__VLS_ctx.sprintMenuOpen))
                            return;
                        __VLS_ctx.navigateTo(`/board/${__VLS_ctx.currentSprint}?view=roadmap`);
                    } },
                ...{ class: "dropdown-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.isMobile))
                            return;
                        if (!(__VLS_ctx.isFeatureEnabled('board')))
                            return;
                        if (!(__VLS_ctx.sprintMenuOpen))
                            return;
                        __VLS_ctx.navigateTo('/board/backlog');
                    } },
                ...{ class: "dropdown-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.isMobile))
                            return;
                        if (!(__VLS_ctx.isFeatureEnabled('board')))
                            return;
                        if (!(__VLS_ctx.sprintMenuOpen))
                            return;
                        __VLS_ctx.navigateTo(`/my-tasks/${__VLS_ctx.currentSprint}`);
                    } },
                ...{ class: "dropdown-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                ...{ class: "menu-divider" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.isMobile))
                            return;
                        if (!(__VLS_ctx.isFeatureEnabled('board')))
                            return;
                        if (!(__VLS_ctx.sprintMenuOpen))
                            return;
                        __VLS_ctx.navigateTo('/kickoff/new');
                    } },
                ...{ class: "dropdown-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.isMobile))
                            return;
                        if (!(__VLS_ctx.isFeatureEnabled('board')))
                            return;
                        if (!(__VLS_ctx.sprintMenuOpen))
                            return;
                        __VLS_ctx.navigateTo(`/close/${__VLS_ctx.currentSprint}`);
                    } },
                ...{ class: "dropdown-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(!__VLS_ctx.isMobile))
                            return;
                        if (!(__VLS_ctx.isFeatureEnabled('board')))
                            return;
                        if (!(__VLS_ctx.sprintMenuOpen))
                            return;
                        __VLS_ctx.navigateTo('/admin/board');
                    } },
                ...{ class: "dropdown-item" },
            });
        }
    }
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.navItems.filter(n => !['board', 'standup', 'retro', 'dashboard'].includes(n.id))))) {
        const __VLS_0 = {}.RouterLink;
        /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
            key: (item.id),
            to: (item.path),
            ...{ class: "page-tab" },
            ...{ class: ({ active: __VLS_ctx.route.path === item.path || __VLS_ctx.route.path.startsWith(item.path + '/') }) },
        }));
        const __VLS_2 = __VLS_1({
            key: (item.id),
            to: (item.path),
            ...{ class: "page-tab" },
            ...{ class: ({ active: __VLS_ctx.route.path === item.path || __VLS_ctx.route.path.startsWith(item.path + '/') }) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        __VLS_3.slots.default;
        (item.label);
        var __VLS_3;
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "header-right" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openSearch) },
    ...{ class: "icon-btn" },
    title: "Search (Ctrl+K)",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    'stroke-width': "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "11",
    cy: "11",
    r: "8",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "m21 21-4.35-4.35",
});
if (!__VLS_ctx.isMobile) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.kbd, __VLS_intrinsicElements.kbd)({
        ...{ class: "kbd-hint" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.toggleTheme) },
    ...{ class: "icon-btn" },
    title: (`Theme: ${__VLS_ctx.themeIcon}`),
});
if (__VLS_ctx.theme === 'light') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
        cx: "12",
        cy: "12",
        r: "5",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "12",
        y1: "1",
        x2: "12",
        y2: "3",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "12",
        y1: "21",
        x2: "12",
        y2: "23",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "4.22",
        y1: "4.22",
        x2: "5.64",
        y2: "5.64",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "18.36",
        y1: "18.36",
        x2: "19.78",
        y2: "19.78",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "1",
        y1: "12",
        x2: "3",
        y2: "12",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "21",
        y1: "12",
        x2: "23",
        y2: "12",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "4.22",
        y1: "19.78",
        x2: "5.64",
        y2: "18.36",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "18.36",
        y1: "5.64",
        x2: "19.78",
        y2: "4.22",
    });
}
else if (__VLS_ctx.theme === 'dark') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        'stroke-width': "2",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
        x: "2",
        y: "3",
        width: "20",
        height: "14",
        rx: "2",
        ry: "2",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "8",
        y1: "21",
        x2: "16",
        y2: "21",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "12",
        y1: "17",
        x2: "12",
        y2: "21",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "notif-wrapper" },
    ...{ class: ({ open: __VLS_ctx.notifOpen }) },
});
/** @type {[typeof NotificationDropdown, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(NotificationDropdown, new NotificationDropdown({
    ...{ 'onToggle': {} },
    ...{ 'onClick': {} },
    ...{ 'onMarkAllRead': {} },
    notifications: (__VLS_ctx.notifications),
    unreadCount: (__VLS_ctx.unreadCount),
}));
const __VLS_5 = __VLS_4({
    ...{ 'onToggle': {} },
    ...{ 'onClick': {} },
    ...{ 'onMarkAllRead': {} },
    notifications: (__VLS_ctx.notifications),
    unreadCount: (__VLS_ctx.unreadCount),
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
let __VLS_7;
let __VLS_8;
let __VLS_9;
const __VLS_10 = {
    onToggle: (__VLS_ctx.handleNotifToggle)
};
const __VLS_11 = {
    onClick: (__VLS_ctx.handleNotifClick)
};
const __VLS_12 = {
    onMarkAllRead: (__VLS_ctx.handleMarkAllRead)
};
var __VLS_6;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "dropdown" },
    ...{ class: ({ open: __VLS_ctx.sprintOpen }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.toggleSprint) },
    ...{ class: "dropdown-trigger" },
});
(__VLS_ctx.activeSprintLabel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "chevron" },
});
if (__VLS_ctx.sprintOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "dropdown-menu" },
    });
    for (const [s] of __VLS_getVForSourceType((__VLS_ctx.sprints))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.sprintOpen))
                        return;
                    __VLS_ctx.selectSprint(s);
                } },
            key: (s.id),
            ...{ class: "dropdown-item" },
            ...{ class: ({ active: s.id === __VLS_ctx.currentSprint }) },
        });
        (s.label);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "sprint-theme" },
        });
        (s.theme);
        if (s.active) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "dot-active" },
            });
        }
    }
}
if (__VLS_ctx.isAuthenticated) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "user-menu" },
        ...{ class: ({ open: __VLS_ctx.userMenuOpen }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.toggleUserMenu) },
        ...{ class: "user-btn" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "user-avatar" },
    });
    ((__VLS_ctx.authUser || '?').charAt(0).toUpperCase());
    if (!__VLS_ctx.isMobile) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "user-name" },
        });
        (__VLS_ctx.authUser);
    }
    if (__VLS_ctx.userMenuOpen) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "dropdown-menu user-dropdown" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.isAuthenticated))
                        return;
                    if (!(__VLS_ctx.userMenuOpen))
                        return;
                    __VLS_ctx.navigateTo('/my');
                } },
            ...{ class: "dropdown-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (__VLS_ctx.handleLogout) },
            ...{ class: "dropdown-item" },
        });
    }
}
const __VLS_13 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    to: "body",
}));
const __VLS_15 = __VLS_14({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
__VLS_16.slots.default;
if (__VLS_ctx.isMobile && __VLS_ctx.mobileMenuOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.isMobile && __VLS_ctx.mobileMenuOpen))
                    return;
                __VLS_ctx.mobileMenuOpen = false;
            } },
        ...{ class: "mobile-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
        ...{ onClick: () => { } },
        ...{ class: "mobile-drawer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mobile-section-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.isMobile && __VLS_ctx.mobileMenuOpen))
                    return;
                __VLS_ctx.navigateTo('/');
            } },
        ...{ class: "mobile-nav-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.isMobile && __VLS_ctx.mobileMenuOpen))
                    return;
                __VLS_ctx.navigateTo(`/board/${__VLS_ctx.currentSprint}`);
            } },
        ...{ class: "mobile-nav-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.isMobile && __VLS_ctx.mobileMenuOpen))
                    return;
                __VLS_ctx.navigateTo(`/standup/${__VLS_ctx.currentSprint}`);
            } },
        ...{ class: "mobile-nav-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.isMobile && __VLS_ctx.mobileMenuOpen))
                    return;
                __VLS_ctx.navigateTo(`/retro/${__VLS_ctx.currentSprint}`);
            } },
        ...{ class: "mobile-nav-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.isMobile && __VLS_ctx.mobileMenuOpen))
                    return;
                __VLS_ctx.navigateTo(`/my-tasks/${__VLS_ctx.currentSprint}`);
            } },
        ...{ class: "mobile-nav-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.isMobile && __VLS_ctx.mobileMenuOpen))
                    return;
                __VLS_ctx.navigateTo('/board/backlog');
            } },
        ...{ class: "mobile-nav-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.isMobile && __VLS_ctx.mobileMenuOpen))
                    return;
                __VLS_ctx.navigateTo('/kickoff/new');
            } },
        ...{ class: "mobile-nav-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "mobile-divider" },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.navItems.filter(n => !['board', 'standup', 'retro', 'dashboard'].includes(n.id))))) {
        const __VLS_17 = {}.RouterLink;
        /** @type {[typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, typeof __VLS_components.RouterLink, typeof __VLS_components.routerLink, ]} */ ;
        // @ts-ignore
        const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({
            ...{ 'onClick': {} },
            key: (item.id),
            to: (item.path),
            ...{ class: "mobile-nav-item" },
            ...{ class: ({ active: __VLS_ctx.route.path === item.path || __VLS_ctx.route.path.startsWith(item.path + '/') }) },
        }));
        const __VLS_19 = __VLS_18({
            ...{ 'onClick': {} },
            key: (item.id),
            to: (item.path),
            ...{ class: "mobile-nav-item" },
            ...{ class: ({ active: __VLS_ctx.route.path === item.path || __VLS_ctx.route.path.startsWith(item.path + '/') }) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_18));
        let __VLS_21;
        let __VLS_22;
        let __VLS_23;
        const __VLS_24 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.isMobile && __VLS_ctx.mobileMenuOpen))
                    return;
                __VLS_ctx.mobileMenuOpen = false;
            }
        };
        __VLS_20.slots.default;
        (item.label);
        var __VLS_20;
    }
    if (__VLS_ctx.isAuthenticated) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "mobile-divider" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.isMobile && __VLS_ctx.mobileMenuOpen))
                        return;
                    if (!(__VLS_ctx.isAuthenticated))
                        return;
                    __VLS_ctx.navigateTo('/my');
                } },
            ...{ class: "mobile-nav-item" },
        });
    }
}
var __VLS_16;
/** @type {[typeof SearchModal, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(SearchModal, new SearchModal({
    ...{ 'onClose': {} },
    visible: (__VLS_ctx.searchVisible),
}));
const __VLS_26 = __VLS_25({
    ...{ 'onClose': {} },
    visible: (__VLS_ctx.searchVisible),
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_28;
let __VLS_29;
let __VLS_30;
const __VLS_31 = {
    onClose: (...[$event]) => {
        __VLS_ctx.searchVisible = false;
    }
};
var __VLS_27;
/** @type {__VLS_StyleScopedClasses['app-header']} */ ;
/** @type {__VLS_StyleScopedClasses['header-left']} */ ;
/** @type {__VLS_StyleScopedClasses['hamburger-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['header-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['logo-mark']} */ ;
/** @type {__VLS_StyleScopedClasses['logo-sub']} */ ;
/** @type {__VLS_StyleScopedClasses['page-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-dropdown']} */ ;
/** @type {__VLS_StyleScopedClasses['page-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-dropdown-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-divider']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-divider']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['page-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['header-right']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['kbd-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['notif-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['open']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown']} */ ;
/** @type {__VLS_StyleScopedClasses['open']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-trigger']} */ ;
/** @type {__VLS_StyleScopedClasses['chevron']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['sprint-theme']} */ ;
/** @type {__VLS_StyleScopedClasses['dot-active']} */ ;
/** @type {__VLS_StyleScopedClasses['user-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['open']} */ ;
/** @type {__VLS_StyleScopedClasses['user-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['user-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['user-name']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['user-dropdown']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-drawer']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-section-label']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-divider']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-divider']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-nav-item']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            sprints: sprints,
            isFeatureEnabled: isFeatureEnabled,
            NotificationDropdown: NotificationDropdown,
            SearchModal: SearchModal,
            route: route,
            isAuthenticated: isAuthenticated,
            authUser: authUser,
            theme: theme,
            toggleTheme: toggleTheme,
            isMobile: isMobile,
            notifications: notifications,
            unreadCount: unreadCount,
            navItems: navItems,
            currentSprint: currentSprint,
            activeSprintLabel: activeSprintLabel,
            isBoardPage: isBoardPage,
            isBacklogPage: isBacklogPage,
            isStandupPage: isStandupPage,
            isRetroPage: isRetroPage,
            isMyTasksPage: isMyTasksPage,
            sprintOpen: sprintOpen,
            sprintMenuOpen: sprintMenuOpen,
            mobileMenuOpen: mobileMenuOpen,
            userMenuOpen: userMenuOpen,
            notifOpen: notifOpen,
            searchVisible: searchVisible,
            toggleSprint: toggleSprint,
            selectSprint: selectSprint,
            goHome: goHome,
            toggleMobileMenu: toggleMobileMenu,
            toggleUserMenu: toggleUserMenu,
            openSearch: openSearch,
            handleLogout: handleLogout,
            navigateTo: navigateTo,
            handleNotifToggle: handleNotifToggle,
            handleNotifClick: handleNotifClick,
            handleMarkAllRead: handleMarkAllRead,
            themeIcon: themeIcon,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
