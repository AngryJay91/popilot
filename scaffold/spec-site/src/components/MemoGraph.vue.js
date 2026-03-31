import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { apiGet } from '@/composables/useTurso';
const props = defineProps();
const router = useRouter();
const allRelations = ref([]);
async function loadAllRelations() {
    // Batch-load relations for recent 20 memos
    const recent = props.memos.slice(0, 20);
    const results = [];
    for (const m of recent) {
        const { data } = await apiGet(`/api/v2/memos/${m.id}/relations`);
        if (data?.relations)
            results.push(...data.relations);
    }
    // Deduplicate
    const seen = new Set();
    allRelations.value = results.filter(r => { if (seen.has(r.id))
        return false; seen.add(r.id); return true; });
}
const nodes = computed(() => {
    const ids = new Set();
    for (const r of allRelations.value) {
        ids.add(r.source_memo_id);
        ids.add(r.target_memo_id);
    }
    return props.memos.filter(m => ids.has(m.id)).map((m, i) => ({
        ...m,
        x: 80 + (i % 5) * 140,
        y: 60 + Math.floor(i / 5) * 100,
        title: m.content.split('\n')[0].slice(0, 30),
    }));
});
const edges = computed(() => {
    return allRelations.value.map(r => {
        const s = nodes.value.find(n => n.id === r.source_memo_id);
        const t = nodes.value.find(n => n.id === r.target_memo_id);
        if (!s || !t)
            return null;
        return { id: r.id, x1: s.x + 60, y1: s.y + 20, x2: t.x + 60, y2: t.y + 20, type: r.relation_type };
    }).filter(Boolean);
});
const svgWidth = computed(() => Math.max(700, ...nodes.value.map(n => n.x + 140)));
const svgHeight = computed(() => Math.max(300, ...nodes.value.map(n => n.y + 80)));
const statusColors = { open: '#3b82f6', resolved: '#22c55e', 'request-changes': '#f59e0b' };
onMounted(loadAllRelations);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "memo-graph" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    width: (__VLS_ctx.svgWidth),
    height: (__VLS_ctx.svgHeight),
});
for (const [e] of __VLS_getVForSourceType((__VLS_ctx.edges))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        key: (e.id),
        x1: (e.x1),
        y1: (e.y1),
        x2: (e.x2),
        y2: (e.y2),
        stroke: "#d1d5db",
        'stroke-width': "2",
    });
}
for (const [n] of __VLS_getVForSourceType((__VLS_ctx.nodes))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.g, __VLS_intrinsicElements.g)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.router.push({ query: { memo: String(n.id) } });
            } },
        key: (n.id),
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
        x: (n.x),
        y: (n.y),
        width: "120",
        height: "40",
        rx: "8",
        fill: (__VLS_ctx.statusColors[n.status] || '#e5e7eb'),
        opacity: "0.15",
        stroke: "#d1d5db",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
        x: (n.x + 60),
        y: (n.y + 16),
        'text-anchor': "middle",
        'font-size': "11",
        'font-weight': "600",
        fill: "#374151",
    });
    (n.id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
        x: (n.x + 60),
        y: (n.y + 30),
        'text-anchor': "middle",
        'font-size': "9",
        fill: "#6b7280",
    });
    (n.title);
}
if (!__VLS_ctx.nodes.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "graph-empty" },
    });
}
/** @type {__VLS_StyleScopedClasses['memo-graph']} */ ;
/** @type {__VLS_StyleScopedClasses['graph-empty']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            router: router,
            nodes: nodes,
            edges: edges,
            svgWidth: svgWidth,
            svgHeight: svgHeight,
            statusColors: statusColors,
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
