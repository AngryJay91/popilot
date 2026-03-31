import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiGet } from '@/api/client';
const props = defineProps();
const emit = defineEmits();
const router = useRouter();
const query = ref('');
const results = ref([]);
const loading = ref(false);
let debounceTimer;
watch(query, (q) => {
    clearTimeout(debounceTimer);
    if (q.length < 2) {
        results.value = [];
        return;
    }
    debounceTimer = setTimeout(() => search(q), 300);
});
async function search(q) {
    loading.value = true;
    const { data } = await apiGet(`/api/v2/search?q=${encodeURIComponent(q)}`);
    if (data?.results)
        results.value = data.results;
    loading.value = false;
}
function navigate(r) {
    router.push(r.url);
    emit('close');
}
function typeIcon(t) {
    return { story: '📋', memo: '💬', doc: '📄', meeting: '🎙️' }[t] || '📌';
}
function typeLabel(t) {
    return { story: 'Story', memo: 'Memo', doc: 'Document', meeting: 'Meeting' }[t] || t;
}
const grouped = ref({});
watch(results, (r) => {
    const g = {};
    for (const item of r) {
        if (!g[item.type])
            g[item.type] = [];
        g[item.type].push(item);
    }
    grouped.value = g;
});
function onKeydown(e) {
    if (e.key === 'Escape')
        emit('close');
}
onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['search-item']} */ ;
/** @type {__VLS_StyleScopedClasses['search-modal']} */ ;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    to: "body",
}));
const __VLS_2 = __VLS_1({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
if (__VLS_ctx.visible) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.visible))
                    return;
                __VLS_ctx.emit('close');
            } },
        ...{ class: "search-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "search-modal" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ class: "search-input" },
        placeholder: "Search stories, memos, documents... (Esc to close)",
        autofocus: true,
    });
    (__VLS_ctx.query);
    if (__VLS_ctx.loading) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "search-loading" },
        });
    }
    else if (__VLS_ctx.query.length >= 2 && !__VLS_ctx.results.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "search-empty" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "search-results" },
        });
        for (const [items, type] of __VLS_getVForSourceType((__VLS_ctx.grouped))) {
            (type);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "search-group-title" },
            });
            (__VLS_ctx.typeIcon(type));
            (__VLS_ctx.typeLabel(type));
            for (const [r] of __VLS_getVForSourceType((items))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.visible))
                                return;
                            if (!!(__VLS_ctx.loading))
                                return;
                            if (!!(__VLS_ctx.query.length >= 2 && !__VLS_ctx.results.length))
                                return;
                            __VLS_ctx.navigate(r);
                        } },
                    key: (r.type + r.id),
                    ...{ class: "search-item" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "search-item-title" },
                });
                (r.title || r.id);
                if (r.preview) {
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                        ...{ class: "search-item-preview" },
                    });
                    (r.preview);
                }
            }
        }
    }
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['search-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['search-modal']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['search-loading']} */ ;
/** @type {__VLS_StyleScopedClasses['search-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['search-results']} */ ;
/** @type {__VLS_StyleScopedClasses['search-group-title']} */ ;
/** @type {__VLS_StyleScopedClasses['search-item']} */ ;
/** @type {__VLS_StyleScopedClasses['search-item-title']} */ ;
/** @type {__VLS_StyleScopedClasses['search-item-preview']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            emit: emit,
            query: query,
            results: results,
            loading: loading,
            navigate: navigate,
            typeIcon: typeIcon,
            typeLabel: typeLabel,
            grouped: grouped,
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
