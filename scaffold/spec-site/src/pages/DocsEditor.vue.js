import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiGet, apiPut } from '@/composables/useTurso';
import { renderMarkdown } from '@/utils/markdown';
const route = useRoute();
const router = useRouter();
const docId = computed(() => route.params.docId);
const isNew = computed(() => !docId.value);
const title = ref('');
const content = ref('');
const saving = ref(false);
onMounted(async () => {
    if (docId.value) {
        const { data } = await apiGet(`/api/v2/docs/${docId.value}`);
        if (data?.doc) {
            title.value = data.doc.title;
            content.value = data.doc.content;
        }
    }
});
function generateId(title) {
    return title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'untitled';
}
async function save() {
    if (!title.value.trim()) {
        alert('Please enter a title');
        return;
    }
    saving.value = true;
    const id = docId.value || generateId(title.value);
    const { error } = await apiPut(`/api/v2/docs/${id}`, { title: title.value, content: content.value });
    saving.value = false;
    if (error) {
        alert(error);
        return;
    }
    router.push(`/docs/${id}`);
}
// renderMarkdown imported from @/utils/markdown
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['editor-header']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-content']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-content']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-content']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-content']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-content']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-content']} */ ;
/** @type {__VLS_StyleScopedClasses['code-block']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-content']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-content']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-content']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-content']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-split']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-page" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
(__VLS_ctx.isNew ? 'New Document' : 'Edit Document');
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.back();
        } },
    ...{ class: "btn" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.save) },
    ...{ class: "btn btn--primary" },
    disabled: (__VLS_ctx.saving || !__VLS_ctx.title.trim()),
});
(__VLS_ctx.saving ? 'Saving...' : 'Save');
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ class: "editor-title" },
    placeholder: "Document title",
});
(__VLS_ctx.title);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-split" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-pane" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pane-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
    value: (__VLS_ctx.content),
    ...{ class: "editor-textarea" },
    placeholder: "Write in markdown...",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "preview-pane" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "pane-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
    ...{ class: "preview-content" },
});
__VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.renderMarkdown(__VLS_ctx.content)) }, null, null);
/** @type {__VLS_StyleScopedClasses['editor-page']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-header']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-title']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-split']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['pane-label']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-pane']} */ ;
/** @type {__VLS_StyleScopedClasses['pane-label']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-content']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            renderMarkdown: renderMarkdown,
            router: router,
            isNew: isNew,
            title: title,
            content: content,
            saving: saving,
            save: save,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
