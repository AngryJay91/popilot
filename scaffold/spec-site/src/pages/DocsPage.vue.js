import Icon from '@/components/Icon.vue';
import { ref, onMounted, computed, nextTick, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { renderMarkdown } from '@/utils/markdown';
import DocsSidebar from '@/components/DocsSidebar.vue';
import DocEditor from '@/components/DocEditor.vue';
import DocComments from '@/components/DocComments.vue';
const route = useRoute();
const docId = computed(() => route.params.docId);
const content = ref('');
const title = ref('');
const author = ref('');
const updatedAt = ref('');
const contentFormat = ref('markdown');
const loading = ref(true);
const editing = ref(false); // skip polling while editing
const childDocs = ref([]);
const docIcon = ref('📄');
const sourceMemos = ref([]);
const showEmojiPicker = ref(false);
const DOC_EMOJIS = ['📄', '📋', '🏃', '📌', '🔖', '📊', '🎯', '💡', '🔧', '📦', '🚀', '⚡', '🎨', '📐', '🔒', '🌐', '📁', '📅', '💼', '🛠️'];
async function changeDocIcon(icon) {
    docIcon.value = icon;
    showEmojiPicker.value = false;
    const { apiPatch: ap } = await import('@/composables/useTurso');
    await ap(`/api/v2/docs/${docId.value}`, { icon });
}
const editContent = ref('');
const docTags = ref([]);
const newTag = ref('');
function addTag() {
    const tag = newTag.value.trim();
    if (!tag || docTags.value.includes(tag))
        return;
    docTags.value.push(tag);
    newTag.value = '';
    saveTags();
}
function removeTag(tag) {
    docTags.value = docTags.value.filter(t => t !== tag);
    saveTags();
}
async function onTitleBlur(e) {
    const newTitle = e.target.textContent?.trim() || '';
    if (newTitle && newTitle !== title.value) {
        title.value = newTitle;
        const { apiPatch: ap } = await import('@/composables/useTurso');
        await ap(`/api/v2/docs/${docId.value}`, { title: newTitle });
    }
}
async function saveTags() {
    const { apiPatch: ap } = await import('@/composables/useTurso');
    await ap(`/api/v2/docs/${docId.value}`, { tags: docTags.value });
}
const saveStatus = ref('saved');
let autoSaveTimer = null;
const showHistory = ref(false);
const revisions = ref([]);
const previewRevision = ref(null);
async function saveDoc() {
    saveStatus.value = 'saving';
    const { apiPut } = await import('@/composables/useTurso');
    await apiPut(`/api/v2/docs/${docId.value}`, { title: title.value, content: editContent.value, contentFormat: 'html' });
    saveStatus.value = 'saved';
    // Re-sync baseline after own save
    const { apiGet: ag2 } = await import('@/composables/useTurso');
    const { data: freshDoc } = await ag2(`/api/v2/docs/${docId.value}`);
    remoteUpdatedAt.value = freshDoc?.doc?.updated_at || '';
    hasRemoteUpdate.value = false;
}
function onEditorChange(val) {
    editContent.value = val;
    saveStatus.value = 'changed';
    if (autoSaveTimer)
        clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => saveDoc(), 3000);
}
function onBeforeUnload(e) {
    if (saveStatus.value === 'changed') {
        e.preventDefault();
        e.returnValue = '';
    }
}
async function loadRevisions() {
    const { apiGet: ag } = await import('@/composables/useTurso');
    const { data } = await ag(`/api/v2/docs/${docId.value}/revisions`);
    revisions.value = data?.revisions || [];
    showHistory.value = true;
}
async function previewRev(revId) {
    const { apiGet: ag } = await import('@/composables/useTurso');
    const { data } = await ag(`/api/v2/docs/${docId.value}/revisions/${revId}`);
    previewRevision.value = data?.revision || null;
}
async function restoreRev(revId) {
    if (!confirm('Restore this version?'))
        return;
    const { apiPost: ap } = await import('@/composables/useTurso');
    await ap(`/api/v2/docs/${docId.value}/revisions/restore/${revId}`, {});
    location.reload();
}
const toc = ref([]);
const activeHeading = ref('');
function formatDate(d) {
    if (!d)
        return '';
    const date = new Date(d.endsWith('Z') ? d : d + 'Z');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
async function loadDoc() {
    loading.value = true;
    try {
        const { apiGet } = await import('@/composables/useTurso');
        const { data } = await apiGet(`/api/v2/docs/${docId.value}`);
        if (data?.doc) {
            content.value = data.doc.content;
            title.value = data.doc.title;
            author.value = data.doc.created_by || '';
            updatedAt.value = data.doc.updated_at || '';
            remoteUpdatedAt.value = data.doc.updated_at || ''; // sync polling baseline
            contentFormat.value = data.doc.content_format || 'markdown';
            try {
                docTags.value = JSON.parse(data.doc.tags || '[]');
            }
            catch {
                docTags.value = [];
            }
            docIcon.value = data.doc.icon || '📄';
            // Source memos
            const { data: srcData } = await apiGet(`/api/v2/docs/${docId.value}/source-memos`);
            sourceMemos.value = srcData?.memos || [];
            // Markdown to HTML conversion
            if (contentFormat.value === 'markdown' || !contentFormat.value || contentFormat.value === 'null') {
                // One-time markdown to HTML conversion + update DB
                const html = renderMarkdown(content.value);
                editContent.value = html;
                content.value = html;
                contentFormat.value = 'html';
                // DB migration (one-time)
                const { apiPut: ap2 } = await import('@/composables/useTurso');
                await ap2(`/api/v2/docs/${docId.value}`, { title: title.value, content: html, contentFormat: 'html' });
            }
            else {
                editContent.value = content.value;
            }
            // Fetch child documents
            const { data: treeData } = await apiGet('/api/v2/docs/tree');
            if (treeData?.tree) {
                function findNode(nodes, id) {
                    for (const n of nodes) {
                        if (n.id === id)
                            return n;
                        const found = findNode(n.children || [], id);
                        if (found)
                            return found;
                    }
                    return null;
                }
                const node = findNode(treeData.tree, docId.value);
                childDocs.value = (node?.children || []).map((c) => ({ id: c.id, title: c.title, icon: c.icon }));
            }
        }
        else {
            // Document not found — auto-create new document
            const { apiPut } = await import('@/composables/useTurso');
            await apiPut(`/api/v2/docs/${docId.value}`, { title: 'New Document', content: '' });
            title.value = 'New Document';
            editContent.value = '';
        }
    }
    catch (_) {
        content.value = '# Failed to load document';
    }
    loading.value = false;
    await nextTick();
    buildToc();
    addCopyButtons();
    window.addEventListener('scroll', onScroll);
}
// Real-time document refresh (compare updated_at + visibility/focus polling)
let docPollTimer = null;
const remoteUpdatedAt = ref('');
const hasRemoteUpdate = ref(false);
async function checkForUpdates() {
    if (editing.value)
        return;
    const { apiGet } = await import('@/composables/useTurso');
    const { data } = await apiGet(`/api/v2/docs/${docId.value}`);
    const remote = data?.doc?.updated_at || '';
    if (remote && remoteUpdatedAt.value && remote !== remoteUpdatedAt.value) {
        hasRemoteUpdate.value = true;
    }
    if (!remoteUpdatedAt.value)
        remoteUpdatedAt.value = remote;
}
function onVisibilityChange() {
    if (!document.hidden)
        checkForUpdates();
}
function applyRemoteUpdate() {
    hasRemoteUpdate.value = false;
    loadDoc();
}
onMounted(() => {
    loadDoc();
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibilityChange);
    docPollTimer = setInterval(checkForUpdates, 30000);
});
watch(docId, () => { remoteUpdatedAt.value = ''; hasRemoteUpdate.value = false; loadDoc(); });
onUnmounted(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('beforeunload', onBeforeUnload);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (docPollTimer)
        clearInterval(docPollTimer);
});
function buildToc() {
    const el = document.querySelector('.docs-body');
    if (!el)
        return;
    const headings = el.querySelectorAll('h1, h2, h3');
    toc.value = Array.from(headings).map((h, i) => {
        const id = `h-${i}`;
        h.id = id;
        return { id, text: h.textContent || '', level: parseInt(h.tagName[1]) };
    });
}
function onScroll() {
    const headings = toc.value.map(t => document.getElementById(t.id)).filter(Boolean);
    for (let i = headings.length - 1; i >= 0; i--) {
        if (headings[i].getBoundingClientRect().top <= 80) {
            activeHeading.value = toc.value[i].id;
            return;
        }
    }
    if (toc.value.length)
        activeHeading.value = toc.value[0].id;
}
function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function addCopyButtons() {
    const el = document.querySelector('.docs-body');
    if (!el)
        return;
    el.querySelectorAll('pre').forEach(pre => {
        if (pre.querySelector('.code-copy-btn'))
            return;
        const btn = document.createElement('button');
        btn.className = 'code-copy-btn';
        btn.textContent = 'Copy';
        btn.addEventListener('click', () => {
            const code = pre.querySelector('code');
            navigator.clipboard.writeText(code?.textContent || pre.textContent || '');
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
        });
        pre.style.position = 'relative';
        pre.appendChild(btn);
    });
}
const renderedHtml = computed(() => renderMarkdown(content.value));
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['toc-link']} */ ;
/** @type {__VLS_StyleScopedClasses['toc-link']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['emoji-opt']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-title']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['code-copy-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-body']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-toc']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-main']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-title']} */ ;
/** @type {__VLS_StyleScopedClasses['source-memo-item']} */ ;
/** @type {__VLS_StyleScopedClasses['child-doc-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tag-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['history-item']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "docs-page-wrap" },
});
/** @type {[typeof DocsSidebar, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(DocsSidebar, new DocsSidebar({
    activeDocId: (__VLS_ctx.docId),
}));
const __VLS_1 = __VLS_0({
    activeDocId: (__VLS_ctx.docId),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "docs-layout" },
});
if (__VLS_ctx.toc.length > 2) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
        ...{ class: "docs-toc" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "toc-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({});
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.toc))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.toc.length > 2))
                        return;
                    __VLS_ctx.scrollTo(item.id);
                } },
            key: (item.id),
            ...{ class: (['toc-link', `toc-h${item.level}`, { active: __VLS_ctx.activeHeading === item.id }]) },
        });
        (item.text);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "docs-main" },
});
if (__VLS_ctx.hasRemoteUpdate) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "remote-update-banner" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.applyRemoteUpdate) },
    });
}
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "loading" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "docs-meta" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "docs-title-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.showEmojiPicker = !__VLS_ctx.showEmojiPicker;
            } },
        ...{ class: "doc-icon-btn" },
    });
    (__VLS_ctx.docIcon);
    if (__VLS_ctx.showEmojiPicker) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: () => { } },
            ...{ class: "doc-emoji-picker" },
        });
        for (const [e] of __VLS_getVForSourceType((__VLS_ctx.DOC_EMOJIS))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.showEmojiPicker))
                            return;
                        __VLS_ctx.changeDocIcon(e);
                    } },
                key: (e),
                ...{ class: "emoji-opt" },
            });
            (e);
        }
    }
    if (__VLS_ctx.title) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
            ...{ onBlur: (__VLS_ctx.onTitleBlur) },
            ...{ onKeydown: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.title))
                        return;
                    $event.target.blur();
                } },
            ...{ class: "docs-title" },
            contenteditable: true,
        });
        (__VLS_ctx.title);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "meta-info" },
    });
    if (__VLS_ctx.author) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "meta-author" },
        });
        (__VLS_ctx.author);
    }
    if (__VLS_ctx.updatedAt) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "meta-date" },
        });
        (__VLS_ctx.formatDate(__VLS_ctx.updatedAt));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "docs-actions" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "save-status" },
    });
    (__VLS_ctx.saveStatus === 'saving' ? 'Saving...' : __VLS_ctx.saveStatus === 'changed' ? 'Unsaved changes' : 'Saved <Icon name="check" :size="14" />');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.loadRevisions) },
        ...{ class: "btn btn--sm" },
    });
    if (__VLS_ctx.showHistory) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "history-panel" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "history-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!(__VLS_ctx.showHistory))
                        return;
                    __VLS_ctx.showHistory = false;
                } },
            ...{ class: "btn btn--xs" },
        });
        for (const [rev] of __VLS_getVForSourceType((__VLS_ctx.revisions))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.showHistory))
                            return;
                        __VLS_ctx.previewRev(rev.id);
                    } },
                key: (rev.id),
                ...{ class: "history-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (rev.edited_by);
            (rev.created_at);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.showHistory))
                            return;
                        __VLS_ctx.restoreRev(rev.id);
                    } },
                ...{ class: "btn btn--xs" },
            });
        }
        if (__VLS_ctx.previewRevision) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "history-preview" },
            });
            __VLS_asFunctionalDirective(__VLS_directives.vHtml)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.previewRevision.content) }, null, null);
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "tags-editor" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "tags-label" },
    });
    for (const [tag] of __VLS_getVForSourceType((__VLS_ctx.docTags))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            key: (tag),
            ...{ class: "tag-chip" },
        });
        (tag);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.removeTag(tag);
                } },
            ...{ class: "tag-remove" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onKeyup: (__VLS_ctx.addTag) },
        ...{ class: "tag-input" },
        placeholder: "Add tag...",
    });
    (__VLS_ctx.newTag);
    if (__VLS_ctx.childDocs.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "child-docs" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "child-docs-title" },
        });
        (__VLS_ctx.childDocs.length);
        for (const [c] of __VLS_getVForSourceType((__VLS_ctx.childDocs))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.childDocs.length))
                            return;
                        __VLS_ctx.$router.push(`/docs/${c.id}`);
                    } },
                key: (c.id),
                ...{ class: "child-doc-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (c.icon || '📄');
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (c.title);
        }
    }
    if (__VLS_ctx.sourceMemos.length) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "source-memos" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "source-memos-title" },
        });
        for (const [sm] of __VLS_getVForSourceType((__VLS_ctx.sourceMemos))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.sourceMemos.length))
                            return;
                        __VLS_ctx.$router.push(`/memos/${sm.memo_id}`);
                    } },
                key: (sm.memo_id),
                ...{ class: "source-memo-item" },
            });
            /** @type {[typeof Icon, ]} */ ;
            // @ts-ignore
            const __VLS_3 = __VLS_asFunctionalComponent(Icon, new Icon({
                name: "messageCircle",
                size: (14),
            }));
            const __VLS_4 = __VLS_3({
                name: "messageCircle",
                size: (14),
            }, ...__VLS_functionalComponentArgsRest(__VLS_3));
            (sm.memo_id);
            ((sm.content || '').split('\n')[0].slice(0, 50));
        }
    }
    /** @type {[typeof DocEditor, ]} */ ;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(DocEditor, new DocEditor({
        ...{ 'onUpdate:modelValue': {} },
        ...{ 'onFocus': {} },
        ...{ 'onBlur': {} },
        modelValue: (__VLS_ctx.editContent),
        editable: (true),
    }));
    const __VLS_7 = __VLS_6({
        ...{ 'onUpdate:modelValue': {} },
        ...{ 'onFocus': {} },
        ...{ 'onBlur': {} },
        modelValue: (__VLS_ctx.editContent),
        editable: (true),
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
    let __VLS_9;
    let __VLS_10;
    let __VLS_11;
    const __VLS_12 = {
        'onUpdate:modelValue': (__VLS_ctx.onEditorChange)
    };
    const __VLS_13 = {
        onFocus: (...[$event]) => {
            if (!!(__VLS_ctx.loading))
                return;
            __VLS_ctx.editing = true;
        }
    };
    const __VLS_14 = {
        onBlur: (...[$event]) => {
            if (!!(__VLS_ctx.loading))
                return;
            __VLS_ctx.editing = false;
        }
    };
    var __VLS_8;
    /** @type {[typeof DocComments, ]} */ ;
    // @ts-ignore
    const __VLS_15 = __VLS_asFunctionalComponent(DocComments, new DocComments({
        docId: (__VLS_ctx.docId),
        currentUser: (__VLS_ctx.author),
    }));
    const __VLS_16 = __VLS_15({
        docId: (__VLS_ctx.docId),
        currentUser: (__VLS_ctx.author),
    }, ...__VLS_functionalComponentArgsRest(__VLS_15));
}
/** @type {__VLS_StyleScopedClasses['docs-page-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-toc']} */ ;
/** @type {__VLS_StyleScopedClasses['toc-title']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['toc-link']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-main']} */ ;
/** @type {__VLS_StyleScopedClasses['remote-update-banner']} */ ;
/** @type {__VLS_StyleScopedClasses['loading']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-title-row']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-icon-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['doc-emoji-picker']} */ ;
/** @type {__VLS_StyleScopedClasses['emoji-opt']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-title']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-info']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-author']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-date']} */ ;
/** @type {__VLS_StyleScopedClasses['docs-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['save-status']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['history-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['history-header']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['history-item']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['history-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['tags-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['tags-label']} */ ;
/** @type {__VLS_StyleScopedClasses['tag-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['tag-remove']} */ ;
/** @type {__VLS_StyleScopedClasses['tag-input']} */ ;
/** @type {__VLS_StyleScopedClasses['child-docs']} */ ;
/** @type {__VLS_StyleScopedClasses['child-docs-title']} */ ;
/** @type {__VLS_StyleScopedClasses['child-doc-item']} */ ;
/** @type {__VLS_StyleScopedClasses['source-memos']} */ ;
/** @type {__VLS_StyleScopedClasses['source-memos-title']} */ ;
/** @type {__VLS_StyleScopedClasses['source-memo-item']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Icon: Icon,
            DocsSidebar: DocsSidebar,
            DocEditor: DocEditor,
            DocComments: DocComments,
            docId: docId,
            title: title,
            author: author,
            updatedAt: updatedAt,
            loading: loading,
            editing: editing,
            childDocs: childDocs,
            docIcon: docIcon,
            sourceMemos: sourceMemos,
            showEmojiPicker: showEmojiPicker,
            DOC_EMOJIS: DOC_EMOJIS,
            changeDocIcon: changeDocIcon,
            editContent: editContent,
            docTags: docTags,
            newTag: newTag,
            addTag: addTag,
            removeTag: removeTag,
            onTitleBlur: onTitleBlur,
            saveStatus: saveStatus,
            showHistory: showHistory,
            revisions: revisions,
            previewRevision: previewRevision,
            onEditorChange: onEditorChange,
            loadRevisions: loadRevisions,
            previewRev: previewRev,
            restoreRev: restoreRev,
            toc: toc,
            activeHeading: activeHeading,
            formatDate: formatDate,
            hasRemoteUpdate: hasRemoteUpdate,
            applyRemoteUpdate: applyRemoteUpdate,
            scrollTo: scrollTo,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
