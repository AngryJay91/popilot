import { ref, nextTick, onMounted } from 'vue';
import { apiGet } from '@/composables/useTurso';
const props = defineProps();
const emit = defineEmits();
const members = ref([]);
const showSuggestions = ref(false);
const suggestions = ref([]);
const cursorPos = ref(0);
const mentionStart = ref(-1);
const selectedIdx = ref(0);
const textareaRef = ref();
onMounted(() => loadMembers());
async function loadMembers() {
    if (members.value.length)
        return;
    const { data } = await apiGet('/api/v2/admin/members');
    if (data?.members) {
        members.value = data.members
            .filter((m) => m.is_active)
            .map((m) => ({ id: m.id, name: m.display_name || m.name || '', role: m.role || '' }));
    }
}
async function onInput(e) {
    const el = e.target;
    const val = el.value;
    emit('update:modelValue', val);
    cursorPos.value = el.selectionStart || 0;
    await checkMention(val, cursorPos.value);
}
async function checkMention(text, pos) {
    // Find text after @
    const before = text.slice(0, pos);
    const atIdx = before.lastIndexOf('@');
    if (atIdx === -1 || (atIdx > 0 && before[atIdx - 1] !== ' ' && before[atIdx - 1] !== '\n')) {
        showSuggestions.value = false;
        return;
    }
    const query = before.slice(atIdx + 1).toLowerCase();
    if (query.includes(' ') || query.includes('\n')) {
        showSuggestions.value = false;
        return;
    }
    mentionStart.value = atIdx;
    await loadMembers();
    suggestions.value = members.value.filter(m => m.name.toLowerCase().includes(query)).slice(0, 5);
    showSuggestions.value = suggestions.value.length > 0;
    selectedIdx.value = 0;
}
function selectMember(m) {
    const text = props.modelValue;
    const before = text.slice(0, mentionStart.value);
    const after = text.slice(cursorPos.value);
    const newText = `${before}@${m.name} ${after}`;
    emit('update:modelValue', newText);
    showSuggestions.value = false;
    nextTick(() => {
        if (textareaRef.value) {
            const newPos = mentionStart.value + m.name.length + 2;
            textareaRef.value.focus();
            textareaRef.value.setSelectionRange(newPos, newPos);
        }
    });
}
const isComposing = ref(false);
function onKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey && !showSuggestions.value && !isComposing.value) {
        e.preventDefault();
        emit('submit');
    }
    if (e.key === 'Escape') {
        showSuggestions.value = false;
    }
    // Keyboard navigation
    if (showSuggestions.value) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIdx.value = Math.min(selectedIdx.value + 1, suggestions.value.length - 1);
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIdx.value = Math.max(selectedIdx.value - 1, 0);
        }
        else if ((e.key === 'Tab' || e.key === 'Enter') && suggestions.value.length > 0) {
            e.preventDefault();
            selectMember(suggestions.value[selectedIdx.value]);
        }
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['mention-input-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['mention-item']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mention-input-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
    ...{ onInput: (__VLS_ctx.onInput) },
    ...{ onCompositionstart: (...[$event]) => {
            __VLS_ctx.isComposing = true;
        } },
    ...{ onCompositionend: (...[$event]) => {
            __VLS_ctx.isComposing = false;
            __VLS_ctx.onInput($event);
        } },
    ...{ onKeydown: (__VLS_ctx.onKeydown) },
    ref: "textareaRef",
    value: (__VLS_ctx.modelValue),
    placeholder: (__VLS_ctx.placeholder || 'Write a reply... (@ to mention)'),
    rows: (__VLS_ctx.rows || 3),
});
/** @type {typeof __VLS_ctx.textareaRef} */ ;
if (__VLS_ctx.showSuggestions) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mention-suggestions" },
    });
    for (const [m, i] of __VLS_getVForSourceType((__VLS_ctx.suggestions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onMousedown: (...[$event]) => {
                    if (!(__VLS_ctx.showSuggestions))
                        return;
                    __VLS_ctx.selectMember(m);
                } },
            ...{ onTouchend: (...[$event]) => {
                    if (!(__VLS_ctx.showSuggestions))
                        return;
                    __VLS_ctx.selectMember(m);
                } },
            key: (m.id),
            ...{ class: "mention-item" },
            ...{ class: ({ 'mention-item--selected': i === __VLS_ctx.selectedIdx }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "mention-name" },
        });
        (m.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "mention-role" },
        });
        (m.role);
    }
}
/** @type {__VLS_StyleScopedClasses['mention-input-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['mention-suggestions']} */ ;
/** @type {__VLS_StyleScopedClasses['mention-item']} */ ;
/** @type {__VLS_StyleScopedClasses['mention-item--selected']} */ ;
/** @type {__VLS_StyleScopedClasses['mention-name']} */ ;
/** @type {__VLS_StyleScopedClasses['mention-role']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            showSuggestions: showSuggestions,
            suggestions: suggestions,
            selectedIdx: selectedIdx,
            textareaRef: textareaRef,
            onInput: onInput,
            selectMember: selectMember,
            isComposing: isComposing,
            onKeydown: onKeydown,
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
