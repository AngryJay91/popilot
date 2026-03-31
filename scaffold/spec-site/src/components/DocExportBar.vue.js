import { ref } from 'vue';
const props = defineProps();
const copied = ref(false);
function getContent() {
    if (props.rawMarkdown)
        return props.rawMarkdown;
    if (props.domRef)
        return props.domRef.innerText;
    return '';
}
async function handleCopy() {
    const content = getContent();
    if (!content)
        return;
    try {
        await navigator.clipboard.writeText(content);
        copied.value = true;
        setTimeout(() => { copied.value = false; }, 2000);
    }
    catch {
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = content;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        copied.value = true;
        setTimeout(() => { copied.value = false; }, 2000);
    }
}
function handleDownload() {
    const content = getContent();
    if (!content)
        return;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (props.fileName || 'document') + '.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['export-btn']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "doc-export-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.handleCopy) },
    ...{ class: "export-btn" },
    title: (__VLS_ctx.copied ? 'Copied!' : 'Copy to clipboard'),
});
if (__VLS_ctx.copied) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "export-icon" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "export-icon" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "export-label" },
});
(__VLS_ctx.copied ? 'Copied' : 'Copy');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.handleDownload) },
    ...{ class: "export-btn" },
    title: "Download .md file",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "export-icon" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "export-label" },
});
/** @type {__VLS_StyleScopedClasses['doc-export-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['export-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['export-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['export-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['export-label']} */ ;
/** @type {__VLS_StyleScopedClasses['export-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['export-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['export-label']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            copied: copied,
            handleCopy: handleCopy,
            handleDownload: handleDownload,
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
