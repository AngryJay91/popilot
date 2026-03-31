import { ref, onMounted } from 'vue';
import { apiGet } from '@/api/client';
const props = defineProps();
const emit = defineEmits();
const members = ref([]);
function toggle(name) {
    const current = new Set(props.modelValue);
    if (current.has(name))
        current.delete(name);
    else
        current.add(name);
    emit('update:modelValue', [...current]);
}
onMounted(async () => {
    const { data } = await apiGet('/api/v2/admin/members');
    if (data?.members)
        members.value = data.members.filter(m => m.is_active);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['member-tag']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "member-select" },
});
for (const [m] of __VLS_getVForSourceType((__VLS_ctx.members))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.toggle(m.display_name);
            } },
        key: (m.id),
        ...{ class: "member-tag" },
        ...{ class: ({ selected: __VLS_ctx.modelValue.includes(m.display_name) }) },
    });
    (m.display_name);
}
/** @type {__VLS_StyleScopedClasses['member-select']} */ ;
/** @type {__VLS_StyleScopedClasses['member-tag']} */ ;
/** @type {__VLS_StyleScopedClasses['selected']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            members: members,
            toggle: toggle,
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
