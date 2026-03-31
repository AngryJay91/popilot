import { onBeforeUnmount, watch } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import { SlashCommand } from './SlashCommand';
export default await (async () => {
    const props = defineProps();
    const emit = defineEmits();
    const editor = useEditor({
        content: props.modelValue,
        editable: props.editable !== false,
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: false }),
            Image,
            Table.configure({ resizable: true }),
            TableRow, TableCell, TableHeader,
            Placeholder.configure({ placeholder: 'Start writing... Type / to open the block menu.' }),
            SlashCommand,
        ],
        onUpdate: ({ editor: e }) => {
            emit('update:modelValue', e.getHTML());
        },
        onFocus: () => emit('focus'),
        onBlur: () => emit('blur'),
    });
    watch(() => props.modelValue, (val) => {
        if (editor.value && editor.value.getHTML() !== val) {
            editor.value.commands.setContent(val, false);
        }
    });
    onBeforeUnmount(() => { editor.value?.destroy(); });
    debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    /** @type {__VLS_StyleScopedClasses['editor-toolbar']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-toolbar']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-toolbar']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    /** @type {__VLS_StyleScopedClasses['ProseMirror']} */ ;
    // CSS variable injection 
    // CSS variable injection end 
    if (__VLS_ctx.editor) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "doc-editor" },
        });
        if (__VLS_ctx.editable !== false) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "editor-toolbar" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.editor))
                            return;
                        if (!(__VLS_ctx.editable !== false))
                            return;
                        __VLS_ctx.editor.chain().focus().toggleBold().run();
                    } },
                ...{ class: ({ active: __VLS_ctx.editor.isActive('bold') }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.editor))
                            return;
                        if (!(__VLS_ctx.editable !== false))
                            return;
                        __VLS_ctx.editor.chain().focus().toggleItalic().run();
                    } },
                ...{ class: ({ active: __VLS_ctx.editor.isActive('italic') }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
                ...{ class: "toolbar-sep" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.editor))
                            return;
                        if (!(__VLS_ctx.editable !== false))
                            return;
                        __VLS_ctx.editor.chain().focus().toggleHeading({ level: 1 }).run();
                    } },
                ...{ class: ({ active: __VLS_ctx.editor.isActive('heading', { level: 1 }) }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.editor))
                            return;
                        if (!(__VLS_ctx.editable !== false))
                            return;
                        __VLS_ctx.editor.chain().focus().toggleHeading({ level: 2 }).run();
                    } },
                ...{ class: ({ active: __VLS_ctx.editor.isActive('heading', { level: 2 }) }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.editor))
                            return;
                        if (!(__VLS_ctx.editable !== false))
                            return;
                        __VLS_ctx.editor.chain().focus().toggleHeading({ level: 3 }).run();
                    } },
                ...{ class: ({ active: __VLS_ctx.editor.isActive('heading', { level: 3 }) }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
                ...{ class: "toolbar-sep" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.editor))
                            return;
                        if (!(__VLS_ctx.editable !== false))
                            return;
                        __VLS_ctx.editor.chain().focus().toggleBulletList().run();
                    } },
                ...{ class: ({ active: __VLS_ctx.editor.isActive('bulletList') }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.editor))
                            return;
                        if (!(__VLS_ctx.editable !== false))
                            return;
                        __VLS_ctx.editor.chain().focus().toggleOrderedList().run();
                    } },
                ...{ class: ({ active: __VLS_ctx.editor.isActive('orderedList') }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.editor))
                            return;
                        if (!(__VLS_ctx.editable !== false))
                            return;
                        __VLS_ctx.editor.chain().focus().toggleCodeBlock().run();
                    } },
                ...{ class: ({ active: __VLS_ctx.editor.isActive('codeBlock') }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.editor))
                            return;
                        if (!(__VLS_ctx.editable !== false))
                            return;
                        __VLS_ctx.editor.chain().focus().toggleBlockquote().run();
                    } },
                ...{ class: ({ active: __VLS_ctx.editor.isActive('blockquote') }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
                ...{ class: "toolbar-sep" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.addLink) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.addImage) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.editor))
                            return;
                        if (!(__VLS_ctx.editable !== false))
                            return;
                        __VLS_ctx.editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                    } },
            });
        }
        const __VLS_0 = {}.EditorContent;
        /** @type {[typeof __VLS_components.EditorContent, ]} */ ;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
            editor: (__VLS_ctx.editor),
            ...{ class: "editor-content" },
        }));
        const __VLS_2 = __VLS_1({
            editor: (__VLS_ctx.editor),
            ...{ class: "editor-content" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    }
    /** @type {__VLS_StyleScopedClasses['doc-editor']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-toolbar']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    /** @type {__VLS_StyleScopedClasses['toolbar-sep']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    /** @type {__VLS_StyleScopedClasses['toolbar-sep']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    /** @type {__VLS_StyleScopedClasses['active']} */ ;
    /** @type {__VLS_StyleScopedClasses['toolbar-sep']} */ ;
    /** @type {__VLS_StyleScopedClasses['editor-content']} */ ;
    var __VLS_dollars;
    const __VLS_self = (await import('vue')).defineComponent({
        setup() {
            return {
                EditorContent: EditorContent,
                editor: editor,
            };
        },
        __typeEmits: {},
        __typeProps: {},
        methods: {
            addLink() {
                const url = prompt('Enter URL:');
                if (url)
                    this.editor?.chain().focus().setLink({ href: url }).run();
            },
            addImage() {
                const url = prompt('Enter image URL:');
                if (url)
                    this.editor?.chain().focus().setImage({ src: url }).run();
            },
        },
    });
    return (await import('vue')).defineComponent({
        setup() {
            return {};
        },
        __typeEmits: {},
        __typeProps: {},
        methods: {
            addLink() {
                const url = prompt('Enter URL:');
                if (url)
                    this.editor?.chain().focus().setLink({ href: url }).run();
            },
            addImage() {
                const url = prompt('Enter image URL:');
                if (url)
                    this.editor?.chain().focus().setImage({ src: url }).run();
            },
        },
    });
})(); /* PartiallyEnd: #4569/main.vue */
