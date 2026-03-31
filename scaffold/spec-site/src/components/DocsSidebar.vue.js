import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiGet, apiPut, apiPatch } from '@/composables/useTurso';
import TreeNode from './TreeNode.vue';
import Icon from './Icon.vue';
const props = defineProps();
const emit = defineEmits();
const router = useRouter();
const tree = ref([]);
const expanded = ref(new Set());
const searchQuery = ref('');
const searchResults = ref([]);
const selectedTag = ref('');
let searchTimer = null;
async function onSearch() {
    if (searchTimer)
        clearTimeout(searchTimer);
    if (!searchQuery.value.trim()) {
        searchResults.value = [];
        return;
    }
    searchTimer = setTimeout(async () => {
        const { data } = await apiGet(`/api/v2/docs/search?q=${encodeURIComponent(searchQuery.value)}`);
        searchResults.value = data?.results || [];
    }, 300);
}
const allTags = computed(() => {
    const tags = new Set();
    function collect(nodes) {
        for (const n of nodes) {
            if (n.tags) {
                try {
                    JSON.parse(n.tags).forEach((t) => tags.add(t));
                }
                catch { }
            }
            if (n.children)
                collect(n.children);
        }
    }
    collect(tree.value);
    return Array.from(tags);
});
const creatingFolder = ref(false);
const newFolderName = ref('');
const dragId = ref('');
const ctxMenu = ref(null);
const renamingId = ref(null);
const renameText = ref('');
function onCtxMenu(e, node) {
    // Adjust scroll position + prevent overflow off-screen
    const menuH = 120; // estimated menu height
    const y = Math.min(e.clientY, window.innerHeight - menuH);
    const x = Math.min(e.clientX, window.innerWidth - 160);
    ctxMenu.value = { x, y, node };
}
function closeCtxMenu() { ctxMenu.value = null; }
// Bulk MD file upload
const uploadProgress = ref({ current: 0, total: 0 });
async function bulkUploadMd(e) {
    const input = e.target;
    const files = input.files;
    if (!files?.length)
        return;
    const fileArr = Array.from(files);
    uploadProgress.value = { current: 0, total: fileArr.length };
    // Parent ID of current selected folder
    const parentId = props.activeDocId || null;
    let count = 0;
    // Fetch existing sibling titles from BE
    const { data: sibData } = await apiGet(`/api/v2/docs/children?parentId=${parentId || ''}`);
    const existingTitles = new Set((sibData?.docs || []).map((d) => d.title));
    for (const file of fileArr) {
        const text = await file.text();
        let title = file.name.replace(/\.(md|txt)$/i, '');
        // Duplicate title suffix
        let suffix = 1;
        while (existingTitles.has(title)) {
            title = `${file.name.replace(/\.(md|txt)$/i, '')} (${suffix++})`;
        }
        existingTitles.add(title);
        const slug = `upload-${Date.now()}-${count}`;
        const { error } = await apiPut(`/api/v2/docs/${slug}`, { title, content: text, contentFormat: 'markdown', parentId });
        if (!error)
            count++;
        uploadProgress.value.current = uploadProgress.value.current + 1;
    }
    input.value = '';
    const failed = fileArr.length - count;
    uploadProgress.value = { current: 0, total: 0 };
    alert(`${count} uploaded successfully${failed ? `, ${failed} failed` : ''}`);
    await loadTree();
}
async function ctxDelete() {
    if (!ctxMenu.value || !confirm('Delete this document?'))
        return;
    await apiPatch(`/api/v2/docs/${ctxMenu.value.node.id}`, { archived: 1 });
    closeCtxMenu();
    await loadTree();
}
function ctxRename() {
    if (!ctxMenu.value)
        return;
    renamingId.value = ctxMenu.value.node.id;
    renameText.value = ctxMenu.value.node.title;
    closeCtxMenu();
}
async function submitRename() {
    if (!renamingId.value || !renameText.value.trim())
        return;
    await apiPatch(`/api/v2/docs/${renamingId.value}`, { title: renameText.value.trim() });
    renamingId.value = null;
    await loadTree();
}
async function ctxNewChild() {
    if (!ctxMenu.value)
        return;
    const slug = `doc-${Date.now()}`;
    await apiPut(`/api/v2/docs/${slug}`, { title: 'New Document', content: '' });
    await apiPatch(`/api/v2/docs/${slug}/move`, { parentId: ctxMenu.value.node.id });
    closeCtxMenu();
    await loadTree();
    router.push(`/docs/${slug}`);
}
async function loadTree() {
    const { data } = await apiGet('/api/v2/docs/tree');
    tree.value = data?.tree || [];
    // Auto-expand: parents of the current document
    if (props.activeDocId)
        expandParents(tree.value, props.activeDocId);
}
function expandParents(nodes, targetId) {
    for (const n of nodes) {
        if (n.id === targetId)
            return true;
        if (n.children.length && expandParents(n.children, targetId)) {
            expanded.value.add(n.id);
            return true;
        }
    }
    return false;
}
function toggle(id) {
    if (expanded.value.has(id))
        expanded.value.delete(id);
    else
        expanded.value.add(id);
}
function navigate(id) {
    router.push(`/docs/${id}`);
}
async function createFolder() {
    if (!newFolderName.value.trim())
        return;
    const slug = newFolderName.value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await apiPut('/api/v2/docs/' + slug, { title: newFolderName.value.trim(), content: '' });
    newFolderName.value = '';
    creatingFolder.value = false;
    await loadTree();
}
function onDragStart(e, id) {
    dragId.value = id;
    e.dataTransfer?.setData('doc-id', id);
}
async function onDropRoot(e) {
    e.preventDefault();
    const sourceId = e.dataTransfer?.getData('doc-id') || dragId.value;
    if (!sourceId)
        return;
    await apiPatch(`/api/v2/docs/${sourceId}/move`, { parentId: null });
    await loadTree();
    dragId.value = '';
}
async function onDrop(e, target) {
    e.preventDefault();
    const sourceId = e.dataTransfer?.getData('doc-id') || dragId.value;
    if (!sourceId || sourceId === target.id)
        return;
    await apiPatch(`/api/v2/docs/${sourceId}/move`, { parentId: target.id });
    await loadTree();
    dragId.value = '';
}
// Sidebar tree polling (60s)
let treePollTimer = null;
onMounted(() => { loadTree(); treePollTimer = setInterval(loadTree, 60000); });
onUnmounted(() => { if (treePollTimer)
    clearInterval(treePollTimer); });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['sidebar-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-list']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-item']} */ ;
/** @type {__VLS_StyleScopedClasses['root-drop']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['search-item']} */ ;
/** @type {__VLS_StyleScopedClasses['tag-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['ctx-item']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "docs-sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "sidebar-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.creatingFolder = true;
        } },
    ...{ class: "sidebar-btn" },
    title: "New folder",
});
/** @type {[typeof Icon, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(Icon, new Icon({
    name: "folderPlus",
    size: (16),
}));
const __VLS_1 = __VLS_0({
    name: "folderPlus",
    size: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push('/docs/new');
        } },
    ...{ class: "sidebar-btn" },
    title: "New document",
});
/** @type {[typeof Icon, ]} */ ;
// @ts-ignore
const __VLS_3 = __VLS_asFunctionalComponent(Icon, new Icon({
    name: "filePlus",
    size: (16),
}));
const __VLS_4 = __VLS_3({
    name: "filePlus",
    size: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_3));
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
    ...{ class: "sidebar-btn" },
    title: "Upload MD files",
});
/** @type {[typeof Icon, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(Icon, new Icon({
    name: "upload",
    size: (16),
}));
const __VLS_7 = __VLS_6({
    name: "upload",
    size: (16),
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (__VLS_ctx.bulkUploadMd) },
    type: "file",
    accept: ".md,.txt",
    multiple: true,
    hidden: true,
});
if (__VLS_ctx.uploadProgress.total) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "upload-prog" },
    });
    (__VLS_ctx.uploadProgress.current);
    (__VLS_ctx.uploadProgress.total);
}
if (__VLS_ctx.creatingFolder) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "folder-input-wrap" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onKeyup: (__VLS_ctx.createFolder) },
        ...{ class: "folder-input" },
        placeholder: "Folder name",
        autofocus: true,
    });
    (__VLS_ctx.newFolderName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.createFolder) },
        ...{ class: "sidebar-btn" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-search" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onInput: (__VLS_ctx.onSearch) },
    ...{ class: "search-input" },
    placeholder: "Search...",
});
(__VLS_ctx.searchQuery);
if (__VLS_ctx.searchResults.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "search-results" },
    });
    for (const [r] of __VLS_getVForSourceType((__VLS_ctx.searchResults))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.searchResults.length))
                        return;
                    __VLS_ctx.navigate(r.id);
                } },
            key: (r.id),
            ...{ class: "search-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "search-icon" },
        });
        ((r.icon && !r.icon.startsWith('Icon') && !r.icon.startsWith('<')) ? r.icon : '📄');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "search-title" },
        });
        (r.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "search-snippet" },
        });
        (r.snippet);
    }
}
if (__VLS_ctx.allTags.length && !__VLS_ctx.searchQuery) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "tag-filter" },
    });
    for (const [tag] of __VLS_getVForSourceType((__VLS_ctx.allTags))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.allTags.length && !__VLS_ctx.searchQuery))
                        return;
                    __VLS_ctx.selectedTag = __VLS_ctx.selectedTag === tag ? '' : tag;
                } },
            key: (tag),
            ...{ class: "tag-chip" },
            ...{ class: ({ active: __VLS_ctx.selectedTag === tag }) },
        });
        (tag);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onDragover: () => { } },
    ...{ onDrop: (__VLS_ctx.onDropRoot) },
    ...{ class: "root-drop" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tree-list" },
});
for (const [node] of __VLS_getVForSourceType((__VLS_ctx.tree))) {
    /** @type {[typeof TreeNode, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(TreeNode, new TreeNode({
        ...{ 'onToggle': {} },
        ...{ 'onDragstart': {} },
        ...{ 'onDrop': {} },
        ...{ 'onContextmenu': {} },
        key: (node.id),
        node: (node),
        activeDocId: (__VLS_ctx.activeDocId),
        expanded: (__VLS_ctx.expanded),
        depth: (0),
    }));
    const __VLS_10 = __VLS_9({
        ...{ 'onToggle': {} },
        ...{ 'onDragstart': {} },
        ...{ 'onDrop': {} },
        ...{ 'onContextmenu': {} },
        key: (node.id),
        node: (node),
        activeDocId: (__VLS_ctx.activeDocId),
        expanded: (__VLS_ctx.expanded),
        depth: (0),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    let __VLS_12;
    let __VLS_13;
    let __VLS_14;
    const __VLS_15 = {
        onToggle: (__VLS_ctx.toggle)
    };
    const __VLS_16 = {
        onDragstart: (__VLS_ctx.onDragStart)
    };
    const __VLS_17 = {
        onDrop: (__VLS_ctx.onDrop)
    };
    const __VLS_18 = {
        onContextmenu: (__VLS_ctx.onCtxMenu)
    };
    var __VLS_11;
}
if (__VLS_ctx.ctxMenu) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeCtxMenu) },
        ...{ class: "ctx-overlay" },
    });
}
if (__VLS_ctx.ctxMenu) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "ctx-menu" },
        ...{ style: ({ left: __VLS_ctx.ctxMenu.x + 'px', top: __VLS_ctx.ctxMenu.y + 'px' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.ctxNewChild) },
        ...{ class: "ctx-item" },
    });
    /** @type {[typeof Icon, ]} */ ;
    // @ts-ignore
    const __VLS_19 = __VLS_asFunctionalComponent(Icon, new Icon({
        name: "filePlus",
        size: (14),
    }));
    const __VLS_20 = __VLS_19({
        name: "filePlus",
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_19));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.ctxRename) },
        ...{ class: "ctx-item" },
    });
    /** @type {[typeof Icon, ]} */ ;
    // @ts-ignore
    const __VLS_22 = __VLS_asFunctionalComponent(Icon, new Icon({
        name: "pencil",
        size: (14),
    }));
    const __VLS_23 = __VLS_22({
        name: "pencil",
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.ctxDelete) },
        ...{ class: "ctx-item ctx-danger" },
    });
    /** @type {[typeof Icon, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(Icon, new Icon({
        name: "trash",
        size: (14),
    }));
    const __VLS_26 = __VLS_25({
        name: "trash",
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
}
if (__VLS_ctx.renamingId) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.renamingId))
                    return;
                __VLS_ctx.renamingId = null;
            } },
        ...{ class: "rename-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rename-box" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onKeyup: (__VLS_ctx.submitRename) },
        ...{ class: "rename-input" },
        autofocus: true,
    });
    (__VLS_ctx.renameText);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.submitRename) },
        ...{ class: "btn btn--xs btn--primary" },
    });
}
/** @type {__VLS_StyleScopedClasses['docs-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-title']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['upload-prog']} */ ;
/** @type {__VLS_StyleScopedClasses['folder-input-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['folder-input']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-search']} */ ;
/** @type {__VLS_StyleScopedClasses['search-input']} */ ;
/** @type {__VLS_StyleScopedClasses['search-results']} */ ;
/** @type {__VLS_StyleScopedClasses['search-item']} */ ;
/** @type {__VLS_StyleScopedClasses['search-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['search-title']} */ ;
/** @type {__VLS_StyleScopedClasses['search-snippet']} */ ;
/** @type {__VLS_StyleScopedClasses['tag-filter']} */ ;
/** @type {__VLS_StyleScopedClasses['tag-chip']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['root-drop']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-list']} */ ;
/** @type {__VLS_StyleScopedClasses['ctx-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['ctx-menu']} */ ;
/** @type {__VLS_StyleScopedClasses['ctx-item']} */ ;
/** @type {__VLS_StyleScopedClasses['ctx-item']} */ ;
/** @type {__VLS_StyleScopedClasses['ctx-item']} */ ;
/** @type {__VLS_StyleScopedClasses['ctx-danger']} */ ;
/** @type {__VLS_StyleScopedClasses['rename-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['rename-box']} */ ;
/** @type {__VLS_StyleScopedClasses['rename-input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--xs']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            TreeNode: TreeNode,
            Icon: Icon,
            router: router,
            tree: tree,
            expanded: expanded,
            searchQuery: searchQuery,
            searchResults: searchResults,
            selectedTag: selectedTag,
            onSearch: onSearch,
            allTags: allTags,
            creatingFolder: creatingFolder,
            newFolderName: newFolderName,
            ctxMenu: ctxMenu,
            renamingId: renamingId,
            renameText: renameText,
            onCtxMenu: onCtxMenu,
            closeCtxMenu: closeCtxMenu,
            uploadProgress: uploadProgress,
            bulkUploadMd: bulkUploadMd,
            ctxDelete: ctxDelete,
            ctxRename: ctxRename,
            submitRename: submitRename,
            ctxNewChild: ctxNewChild,
            toggle: toggle,
            navigate: navigate,
            createFolder: createFolder,
            onDragStart: onDragStart,
            onDropRoot: onDropRoot,
            onDrop: onDrop,
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
