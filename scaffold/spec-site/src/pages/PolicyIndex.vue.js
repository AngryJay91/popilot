import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { sprints, getPagesByCategory } from '../composables/useNavStore';
function badgeClass(badge) {
    if (badge === 'P0')
        return 'badge-red';
    if (badge === 'P1')
        return 'badge-yellow';
    if (badge === 'out')
        return 'badge-muted';
    return 'badge-blue';
}
debugger; /* PartiallyEnd: #3632/both.vue */
export default await (async () => {
    const route = useRoute();
    const router = useRouter();
    const sprintId = computed(() => route.params.sprint || sprints.value[0]?.id || '');
    const sprintConfig = computed(() => sprints.value.find(s => s.id === sprintId.value));
    const epicList = computed(() => getPagesByCategory(sprintId.value, 'policy'));
    debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    /** @type {__VLS_StyleScopedClasses['epic-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    // CSS variable injection 
    // CSS variable injection end 
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "policy-index" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "policy-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    (__VLS_ctx.sprintConfig?.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "policy-subtitle" },
    });
    (__VLS_ctx.sprintConfig?.theme);
    (__VLS_ctx.epicList.length);
    if (__VLS_ctx.epicList.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "epic-grid" },
        });
        for (const [epic] of __VLS_getVForSourceType((__VLS_ctx.epicList))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.epicList.length > 0))
                            return;
                        __VLS_ctx.router.push(`/policy/${__VLS_ctx.sprintId}/${epic.id}`);
                    } },
                key: (epic.id),
                ...{ class: "epic-card" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "epic-card-header" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "epic-id" },
            });
            (epic.id);
            if (epic.badge) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "epic-badge" },
                    ...{ class: (__VLS_ctx.badgeClass(epic.badge)) },
                });
                (epic.badge);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "epic-title" },
            });
            (epic.label);
            if (epic.description) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "epic-desc" },
                });
                (epic.description);
            }
        }
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-state" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-icon" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.code, __VLS_intrinsicElements.code)({});
        (__VLS_ctx.sprintId);
    }
    /** @type {__VLS_StyleScopedClasses['policy-index']} */ ;
    /** @type {__VLS_StyleScopedClasses['policy-header']} */ ;
    /** @type {__VLS_StyleScopedClasses['policy-subtitle']} */ ;
    /** @type {__VLS_StyleScopedClasses['epic-grid']} */ ;
    /** @type {__VLS_StyleScopedClasses['epic-card']} */ ;
    /** @type {__VLS_StyleScopedClasses['epic-card-header']} */ ;
    /** @type {__VLS_StyleScopedClasses['epic-id']} */ ;
    /** @type {__VLS_StyleScopedClasses['epic-badge']} */ ;
    /** @type {__VLS_StyleScopedClasses['epic-title']} */ ;
    /** @type {__VLS_StyleScopedClasses['epic-desc']} */ ;
    /** @type {__VLS_StyleScopedClasses['empty-state']} */ ;
    /** @type {__VLS_StyleScopedClasses['empty-icon']} */ ;
    var __VLS_dollars;
    const __VLS_self = (await import('vue')).defineComponent({
        setup() {
            return {
                router: router,
                sprintId: sprintId,
                sprintConfig: sprintConfig,
                epicList: epicList,
                badgeClass: badgeClass,
            };
        },
    });
    return (await import('vue')).defineComponent({
        setup() {
            return {};
        },
    });
})(); /* PartiallyEnd: #4569/main.vue */
