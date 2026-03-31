import { ref, computed } from 'vue';
import BoardStoryCard from './BoardStoryCard.vue';
const props = defineProps();
const emit = defineEmits();
const collapsed = ref(false);
const doneStories = computed(() => props.stories.filter(s => s.status === 'done').length);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['epic-header']} */ ;
/** @type {__VLS_StyleScopedClasses['stories-grid']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "epic-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.collapsed = !__VLS_ctx.collapsed;
        } },
    ...{ class: "epic-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "collapse-icon" },
});
(__VLS_ctx.collapsed ? '&#9654;' : '&#9660;');
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "epic-label" },
});
(__VLS_ctx.epic ? __VLS_ctx.epic.title : 'Unassigned');
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "epic-story-count" },
});
(__VLS_ctx.doneStories);
(__VLS_ctx.stories.length);
if (!__VLS_ctx.collapsed) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "epic-stories" },
    });
    if (__VLS_ctx.stories.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "no-stories" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "stories-grid" },
        });
        for (const [story] of __VLS_getVForSourceType((__VLS_ctx.stories))) {
            /** @type {[typeof BoardStoryCard, ]} */ ;
            // @ts-ignore
            const __VLS_0 = __VLS_asFunctionalComponent(BoardStoryCard, new BoardStoryCard({
                ...{ 'onSelect': {} },
                ...{ 'onUpdated': {} },
                key: (story.id),
                story: (story),
            }));
            const __VLS_1 = __VLS_0({
                ...{ 'onSelect': {} },
                ...{ 'onUpdated': {} },
                key: (story.id),
                story: (story),
            }, ...__VLS_functionalComponentArgsRest(__VLS_0));
            let __VLS_3;
            let __VLS_4;
            let __VLS_5;
            const __VLS_6 = {
                onSelect: ((s) => __VLS_ctx.emit('selectStory', s))
            };
            const __VLS_7 = {
                onUpdated: (...[$event]) => {
                    if (!(!__VLS_ctx.collapsed))
                        return;
                    if (!!(__VLS_ctx.stories.length === 0))
                        return;
                    __VLS_ctx.emit('updated');
                }
            };
            var __VLS_2;
        }
    }
}
/** @type {__VLS_StyleScopedClasses['epic-section']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-header']} */ ;
/** @type {__VLS_StyleScopedClasses['collapse-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-label']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-story-count']} */ ;
/** @type {__VLS_StyleScopedClasses['epic-stories']} */ ;
/** @type {__VLS_StyleScopedClasses['no-stories']} */ ;
/** @type {__VLS_StyleScopedClasses['stories-grid']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            BoardStoryCard: BoardStoryCard,
            emit: emit,
            collapsed: collapsed,
            doneStories: doneStories,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
