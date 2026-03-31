import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiGet, apiPost, apiDelete } from '@/composables/useTurso';
const props = defineProps();
const router = useRouter();
const relations = ref([]);
const showModal = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);
const selectedRelType = ref('related');
let searchTimer = null;
async function loadRelations() {
    const { data } = await apiGet(`/api/v2/memos/${props.memoId}/relations`);
    relations.value = data?.relations || [];
}
async function searchMemos() {
    if (searchTimer)
        clearTimeout(searchTimer);
    if (!searchQuery.value.trim()) {
        searchResults.value = [];
        return;
    }
    searchTimer = setTimeout(async () => {
        const { data } = await apiGet(`/api/v2/search?q=${encodeURIComponent(searchQuery.value)}&type=memo`);
        searchResults.value = (data?.results || []).filter((r) => r.id !== props.memoId);
    }, 300);
}
async function addRelation(targetId) {
    await apiPost(`/api/v2/memos/${props.memoId}/relations`, { targetMemoId: targetId, relationType: selectedRelType.value });
    showModal.value = false;
    searchQuery.value = '';
    searchResults.value = [];
    await loadRelations();
}
async function removeRelation(relId) {
    if (!confirm('Delete this relation?'))
        return;
    await apiDelete(`/api/v2/memos/relations/${relId}`);
    await loadRelations();
}
function getLinkedMemoId(r) {
    return r.source_memo_id === props.memoId ? r.target_memo_id : r.source_memo_id;
}
const typeLabels = { related: 'Related', blocks: 'Blocks', duplicate: 'Duplicate' };
onMounted(loadRelations);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['rel-link']} */ ;
/** @type {__VLS_StyleScopedClasses['rel-remove']} */ ;
/** @type {__VLS_StyleScopedClasses['rel-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['rel-search-item']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "memo-relations" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "rel-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "rel-title" },
});
(__VLS_ctx.relations.length);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showModal = true;
        } },
    ...{ class: "btn btn--xs btn--ghost" },
});
for (const [r] of __VLS_getVForSourceType((__VLS_ctx.relations))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (r.id),
        ...{ class: "rel-item" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "rel-type-badge" },
    });
    (__VLS_ctx.typeLabels[r.relation_type] || r.relation_type);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.router.push({ query: { memo: String(__VLS_ctx.getLinkedMemoId(r)) } });
            } },
        ...{ class: "rel-link" },
    });
    (__VLS_ctx.getLinkedMemoId(r));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.removeRelation(r.id);
            } },
        ...{ class: "rel-remove" },
    });
}
if (__VLS_ctx.showModal) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showModal))
                    return;
                __VLS_ctx.showModal = false;
            } },
        ...{ class: "rel-modal-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rel-modal" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h4, __VLS_intrinsicElements.h4)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.selectedRelType),
        ...{ class: "rel-type-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "related",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "blocks",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "duplicate",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onInput: (__VLS_ctx.searchMemos) },
        ...{ class: "rel-search" },
        placeholder: "Search memos...",
        autofocus: true,
    });
    (__VLS_ctx.searchQuery);
    for (const [m] of __VLS_getVForSourceType((__VLS_ctx.searchResults))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showModal))
                        return;
                    __VLS_ctx.addRelation(m.id);
                } },
            key: (m.id),
            ...{ class: "rel-search-item" },
        });
        (m.id);
        (m.title || m.preview);
    }
}
/** @type {__VLS_StyleScopedClasses['memo-relations']} */ ;
/** @type {__VLS_StyleScopedClasses['rel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['rel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['rel-item']} */ ;
/** @type {__VLS_StyleScopedClasses['rel-type-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['rel-link']} */ ;
/** @type {__VLS_StyleScopedClasses['rel-remove']} */ ;
/** @type {__VLS_StyleScopedClasses['rel-modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['rel-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['rel-type-select']} */ ;
/** @type {__VLS_StyleScopedClasses['rel-search']} */ ;
/** @type {__VLS_StyleScopedClasses['rel-search-item']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            relations: relations,
            showModal: showModal,
            searchQuery: searchQuery,
            searchResults: searchResults,
            selectedRelType: selectedRelType,
            searchMemos: searchMemos,
            addRelation: addRelation,
            removeRelation: removeRelation,
            getLinkedMemoId: getLinkedMemoId,
            typeLabels: typeLabels,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
