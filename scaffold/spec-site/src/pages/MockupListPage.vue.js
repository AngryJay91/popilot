import Icon from '@/components/Icon.vue';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiGet, apiPost, apiDelete } from '@/composables/useTurso';
const router = useRouter();
const mockups = ref([]);
const searchQuery = ref('');
const filteredMockups = computed(() => {
    if (!searchQuery.value)
        return mockups.value;
    const q = searchQuery.value.toLowerCase();
    return mockups.value.filter(m => m.title.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
});
const loading = ref(true);
async function deleteMockup(slug) {
    if (!confirm('Are you sure you want to delete this?'))
        return;
    await apiDelete(`/api/v2/mockups/${slug}`);
    await loadMockups();
}
const showCreate = ref(false);
const newSlug = ref('');
const newTitle = ref('');
const newViewport = ref('desktop');
async function loadMockups() {
    loading.value = true;
    const { data } = await apiGet('/api/v2/mockups');
    if (data?.mockups)
        mockups.value = data.mockups;
    loading.value = false;
}
async function createMockup() {
    if (!newSlug.value || !newTitle.value)
        return;
    const targetSlug = newSlug.value;
    await apiPost('/api/v2/mockups', { slug: targetSlug, title: newTitle.value, viewport: newViewport.value });
    newSlug.value = '';
    newTitle.value = '';
    showCreate.value = false;
    router.push(`/mockup-editor/${targetSlug}`);
}
function formatDate(d) {
    if (!d)
        return '';
    const date = new Date(d.endsWith('Z') ? d : d + 'Z');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
onMounted(loadMockups);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['list-header']} */ ;
/** @type {__VLS_StyleScopedClasses['mockup-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-delete']} */ ;
/** @type {__VLS_StyleScopedClasses['card-info']} */ ;
/** @type {__VLS_StyleScopedClasses['mockup-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['create-form']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mockup-list-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "list-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showCreate = !__VLS_ctx.showCreate;
        } },
    ...{ class: "btn-new" },
});
(__VLS_ctx.showCreate ? 'Cancel' : '+ New Mockup');
if (__VLS_ctx.showCreate) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "create-form" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ class: "input" },
        placeholder: "Mockup title",
    });
    (__VLS_ctx.newTitle);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ class: "input" },
        placeholder: "Path (slug)",
    });
    (__VLS_ctx.newSlug);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.newViewport),
        ...{ class: "input" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "desktop",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "mobile",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.createMockup) },
        ...{ class: "btn btn--primary" },
        disabled: (!__VLS_ctx.newSlug || !__VLS_ctx.newTitle),
    });
}
if (__VLS_ctx.mockups.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ class: "search-input" },
        placeholder: "Search by title or category...",
    });
    (__VLS_ctx.searchQuery);
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading" },
    });
}
else if (!__VLS_ctx.mockups.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "empty" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mockup-grid" },
    });
    for (const [m] of __VLS_getVForSourceType((__VLS_ctx.filteredMockups))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.mockups.length))
                        return;
                    __VLS_ctx.router.push(`/mockup-viewer/${m.slug}`);
                } },
            key: (m.id),
            ...{ class: "mockup-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-viewport" },
        });
        (m.viewport === 'mobile' ? '📱' : '<Icon name="monitor" :size="14" />');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-info" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        (m.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-meta" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (m.category);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (m.version);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.formatDate(m.updated_at));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.mockups.length))
                        return;
                    __VLS_ctx.router.push(`/mockup-editor/${m.slug}`);
                } },
            ...{ class: "card-edit" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(!__VLS_ctx.mockups.length))
                        return;
                    __VLS_ctx.deleteMockup(m.slug);
                } },
            ...{ class: "card-delete" },
        });
        /** @type {[typeof Icon, ]} */ ;
        // @ts-ignore
        const __VLS_0 = __VLS_asFunctionalComponent(Icon, new Icon({
            name: "trash",
            size: (14),
        }));
        const __VLS_1 = __VLS_0({
            name: "trash",
            size: (14),
        }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    }
}
/** @type {__VLS_StyleScopedClasses['mockup-list-page']} */ ;
/** @type {__VLS_StyleScopedClasses['list-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn-new']} */ ;
/** @type {__VLS_StyleScopedClasses['create-form']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['empty']} */ ;
/** @type {__VLS_StyleScopedClasses['mockup-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['mockup-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-viewport']} */ ;
/** @type {__VLS_StyleScopedClasses['card-info']} */ ;
/** @type {__VLS_StyleScopedClasses['card-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['card-edit']} */ ;
/** @type {__VLS_StyleScopedClasses['card-delete']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Icon: Icon,
            router: router,
            mockups: mockups,
            searchQuery: searchQuery,
            filteredMockups: filteredMockups,
            loading: loading,
            deleteMockup: deleteMockup,
            showCreate: showCreate,
            newSlug: newSlug,
            newTitle: newTitle,
            newViewport: newViewport,
            createMockup: createMockup,
            formatDate: formatDate,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
