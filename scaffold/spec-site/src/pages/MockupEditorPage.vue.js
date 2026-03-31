import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { apiGet, apiPut } from '@/composables/useTurso';
import ComponentPalette from '@/mockup/ComponentPalette.vue';
import MockupCanvas from '@/mockup/MockupCanvas.vue';
import PropertyPanel from '@/mockup/PropertyPanel.vue';
import { getComponentDef } from '@/mockup/componentCatalog';
import { useScenarios } from '@/mockup/useScenarios';
const route = useRoute();
const slug = computed(() => route.params.slug);
const components = ref([]);
const selectedId = ref(null);
const selectedIds = ref([]);
function onSelect(id, event) {
    if (event?.shiftKey || event?.metaKey || event?.ctrlKey) {
        // Shift+click: toggle multi-select
        const idx = selectedIds.value.indexOf(id);
        if (idx >= 0)
            selectedIds.value.splice(idx, 1);
        else
            selectedIds.value.push(id);
        selectedId.value = id;
    }
    else {
        selectedId.value = id;
        selectedIds.value = [id];
    }
}
// Multi-select delete
function onDeleteMulti() {
    if (selectedIds.value.length > 1) {
        saveUndo();
        for (const id of selectedIds.value) {
            components.value = removeComponent(components.value, id);
        }
        selectedIds.value = [];
        selectedId.value = null;
    }
}
// Ctrl+C / Ctrl+V
let clipboard = [];
function onCopy() {
    clipboard = selectedIds.value
        .map(id => findComponent(components.value, id))
        .filter(Boolean)
        .map(c => JSON.parse(JSON.stringify(c)));
}
function onPaste() {
    if (!clipboard.length)
        return;
    saveUndo();
    for (const orig of clipboard) {
        const copy = JSON.parse(JSON.stringify(orig));
        copy.id = `c-${++idCounter}`;
        if (typeof copy.props.x === 'number')
            copy.props.x += 20;
        if (typeof copy.props.y === 'number')
            copy.props.y += 20;
        components.value.push(copy);
    }
}
const pageTitle = ref('');
const pageDescription = ref('');
const viewport = ref('desktop');
const saving = ref(false);
const hasChanges = ref(false);
let autoSaveTimer = null;
const zoom = ref(100);
const showGrid = ref(false);
function onWheel(e) {
    if (!e.ctrlKey && !e.metaKey)
        return;
    e.preventDefault();
    zoom.value = Math.min(400, Math.max(25, zoom.value + (e.deltaY > 0 ? -25 : 25)));
}
const saveToast = ref(false);
let idCounter = 0;
// Scenarios
const token = localStorage.getItem('spec-auth-token') || '';
const { scenarios, activeScenarioId, fetchScenarios, selectScenario, createScenario, deleteScenario } = useScenarios(slug.value, token);
const showScenarioInput = ref(false);
const newScenarioName = ref('');
async function addScenario() {
    if (!newScenarioName.value.trim())
        return;
    await createScenario(newScenarioName.value.trim());
    newScenarioName.value = '';
    showScenarioInput.value = false;
}
// Custom component management
const showCompModal = ref(false);
const customDefs = ref([]);
const newDef = ref({ id: '', name: '', category: 'Custom', icon: '🧩', base_type: 'div' });
async function fetchCustomDefs() {
    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v2/mockups/component-defs`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
        const d = await res.json();
        customDefs.value = d.defs || [];
    }
}
async function addCustomDef() {
    if (!newDef.value.id || !newDef.value.name)
        return;
    await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v2/mockups/component-defs`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newDef.value),
    });
    newDef.value = { id: '', name: '', category: 'Custom', icon: '🧩', base_type: 'div' };
    await fetchCustomDefs();
}
async function deleteCustomDef(id) {
    await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v2/mockups/component-defs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    await fetchCustomDefs();
}
// Tree drag & drop (hierarchy change)
const treeDragOver = ref('');
let treeDragId = '';
function onTreeDragStart(e, id) {
    treeDragId = id;
    e.dataTransfer?.setData('tree-comp-id', id);
}
function onTreeDragOver(e, target) {
    if (treeDragId === target.id)
        return;
    if (getComponentDef(target.componentType)?.allowChildren) {
        treeDragOver.value = target.id;
    }
}
function onTreeDrop(e, target) {
    treeDragOver.value = '';
    const sourceId = e.dataTransfer?.getData('tree-comp-id') || treeDragId;
    if (!sourceId || sourceId === target.id)
        return;
    if (!getComponentDef(target.componentType)?.allowChildren)
        return;
    saveUndo();
    const comp = findComponent(components.value, sourceId);
    if (!comp)
        return;
    // Remove from source
    components.value = removeComponent(components.value, sourceId);
    // Add to target children
    const parent = findComponent(components.value, target.id);
    if (parent)
        parent.children.push(comp);
    treeDragId = '';
}
function onTreeDropToRoot(e, childId) {
    treeDragOver.value = '';
    const sourceId = childId || e.dataTransfer?.getData('tree-comp-id') || treeDragId;
    if (!sourceId)
        return;
    saveUndo();
    const comp = findComponent(components.value, sourceId);
    if (!comp)
        return;
    components.value = removeComponent(components.value, sourceId);
    components.value.push(comp);
    treeDragId = '';
}
// Layer z-index operations
function bringToFront(id) {
    const maxZ = Math.max(0, ...components.value.map(c => c.props.zIndex || 0));
    const comp = findComponent(components.value, id);
    if (comp)
        comp.props.zIndex = maxZ + 1;
}
function sendToBack(id) {
    const minZ = Math.min(0, ...components.value.map(c => c.props.zIndex || 0));
    const comp = findComponent(components.value, id);
    if (comp)
        comp.props.zIndex = minZ - 1;
}
function bringForward(id) {
    const comp = findComponent(components.value, id);
    if (comp)
        comp.props.zIndex = (comp.props.zIndex || 0) + 1;
}
function sendBackward(id) {
    const comp = findComponent(components.value, id);
    if (comp)
        comp.props.zIndex = (comp.props.zIndex || 0) - 1;
}
// Multi-select alignment
function alignSelected(axis) {
    if (selectedIds.value.length < 2)
        return;
    saveUndo();
    const comps = selectedIds.value.map(id => findComponent(components.value, id)).filter(Boolean);
    const xs = comps.map(c => c.props.x || 0);
    const ys = comps.map(c => c.props.y || 0);
    const ws = comps.map(c => c.props.w || 200);
    const hs = comps.map(c => c.props.h || 40);
    if (axis === 'left') {
        const min = Math.min(...xs);
        comps.forEach(c => c.props.x = min);
    }
    if (axis === 'right') {
        const max = Math.max(...xs.map((x, i) => x + ws[i]));
        comps.forEach((c, i) => c.props.x = max - (c.props.w || 200));
    }
    if (axis === 'top') {
        const min = Math.min(...ys);
        comps.forEach(c => c.props.y = min);
    }
    if (axis === 'bottom') {
        const max = Math.max(...ys.map((y, i) => y + hs[i]));
        comps.forEach((c, i) => c.props.y = max - (c.props.h || 40));
    }
    if (axis === 'centerH') {
        const avg = xs.reduce((a, x, i) => a + x + ws[i] / 2, 0) / comps.length;
        comps.forEach((c, i) => c.props.x = Math.round(avg - (c.props.w || 200) / 2));
    }
    if (axis === 'centerV') {
        const avg = ys.reduce((a, y, i) => a + y + hs[i] / 2, 0) / comps.length;
        comps.forEach((c, i) => c.props.y = Math.round(avg - (c.props.h || 40) / 2));
    }
}
const selectedComponent = computed(() => {
    if (!selectedId.value)
        return null;
    return findComponent(components.value, selectedId.value);
});
function findComponent(list, id) {
    for (const c of list) {
        if (c.id === id)
            return c;
        const found = findComponent(c.children, id);
        if (found)
            return found;
    }
    return null;
}
function onEditorKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
        return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        e.preventDefault();
        onCopy();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault();
        onPaste();
    }
    if (e.key === 'Delete' && selectedIds.value.length > 1) {
        e.preventDefault();
        onDeleteMulti();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        zoom.value = 100;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        zoom.value = 100;
    }
}
// Auto-save (2s debounce)
watch(components, () => {
    hasChanges.value = true;
    if (autoSaveTimer)
        clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => { save(); }, 2000);
}, { deep: true });
onMounted(async () => {
    document.addEventListener('keydown', onEditorKeydown);
    fetchScenarios();
    fetchCustomDefs();
    if (slug.value && slug.value !== 'new') {
        const { data } = await apiGet(`/api/v2/mockups/${slug.value}`);
        if (data?.page) {
            pageTitle.value = data.page.title || '';
            viewport.value = data.page.viewport === 'mobile' ? 'mobile' : 'desktop';
        }
        if (data?.components) {
            // flat -> tree conversion
            const flat = data.components;
            components.value = buildTree(flat);
        }
    }
});
function buildTree(flat) {
    const map = new Map();
    const roots = [];
    for (const f of flat) {
        const comp = {
            id: `c-${f.id}`,
            componentType: f.component_type,
            props: JSON.parse(f.props || '{}'),
            children: [],
        };
        map.set(f.id, comp);
        idCounter = Math.max(idCounter, f.id + 1);
    }
    for (const f of flat) {
        const comp = map.get(f.id);
        if (f.parent_id && map.has(f.parent_id)) {
            map.get(f.parent_id).children.push(comp);
        }
        else {
            roots.push(comp);
        }
    }
    return roots;
}
function onAddComponent(def) {
    components.value.push({
        id: `c-${++idCounter}`,
        componentType: def.id,
        props: { ...def.defaultProps },
        children: [],
    });
}
function onDrop(componentId, parentId, x, y) {
    saveUndo();
    const def = getComponentDef(componentId);
    if (!def)
        return;
    const newComp = {
        id: `c-${++idCounter}`,
        componentType: def.id,
        props: { ...def.defaultProps, x: x ?? 0, y: y ?? 0 },
        children: [],
    };
    if (parentId) {
        const parent = findComponent(components.value, parentId);
        if (parent && getComponentDef(parent.componentType)?.allowChildren) {
            parent.children.push(newComp);
            return;
        }
    }
    components.value.push(newComp);
}
// Undo
const undoStack = ref([]);
const redoStack = ref([]);
function saveUndo() {
    undoStack.value.push(JSON.stringify(components.value));
    if (undoStack.value.length > 20)
        undoStack.value.shift();
    redoStack.value = [];
}
function undo() {
    const prev = undoStack.value.pop();
    if (prev) {
        redoStack.value.push(JSON.stringify(components.value));
        components.value = JSON.parse(prev);
    }
}
function redo() {
    const next = redoStack.value.pop();
    if (next) {
        undoStack.value.push(JSON.stringify(components.value));
        components.value = JSON.parse(next);
    }
}
function onDelete(id) {
    if (!confirm('Are you sure you want to delete this?'))
        return;
    saveUndo();
    components.value = removeComponent(components.value, id);
    if (selectedId.value === id)
        selectedId.value = null;
}
function onReorder(id, direction) {
    saveUndo();
    const idx = components.value.findIndex(c => c.id === id);
    if (idx < 0)
        return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= components.value.length)
        return;
    const temp = components.value[idx];
    components.value[idx] = components.value[newIdx];
    components.value[newIdx] = temp;
    components.value = [...components.value];
}
function removeComponent(list, id) {
    return list.filter(c => {
        if (c.id === id)
            return false;
        c.children = removeComponent(c.children, id);
        return true;
    });
}
function onUpdateProp(key, value) {
    const comp = selectedComponent.value;
    if (comp)
        comp.props[key] = value;
}
function onUpdateSpec(desc) {
    const comp = selectedComponent.value;
    if (comp)
        comp.props.specDescription = desc;
}
// Save
async function save() {
    saving.value = true;
    const flatComps = flattenTree(components.value, null, 0);
    await apiPut(`/api/v2/mockups/${slug.value}`, {
        title: pageTitle.value,
        components: flatComps,
    });
    saving.value = false;
    hasChanges.value = false;
    saveToast.value = true;
    setTimeout(() => { saveToast.value = false; }, 2000);
}
function flattenTree(list, parentIdx, startOrder) {
    const result = [];
    let order = startOrder;
    for (const c of list) {
        const idx = result.length;
        result.push({
            componentType: c.componentType,
            props: c.props,
            parentId: parentIdx,
            specDescription: c.props.specDescription || null,
            sortOrder: order++,
        });
        if (c.children.length) {
            result.push(...flattenTree(c.children, idx, order));
            order += c.children.length;
        }
    }
    return result;
}
onUnmounted(() => document.removeEventListener("keydown", onEditorKeydown));
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['styled-btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['styled-btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-node']} */ ;
/** @type {__VLS_StyleScopedClasses['layer-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['align-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['save-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['scenario-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['scenario-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['scenario-del']} */ ;
/** @type {__VLS_StyleScopedClasses['palette-manage-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['custom-def-form']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['mobile-notice']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mobile-notice" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-layout" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-left" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "palette-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "palette-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showCompModal = true;
            __VLS_ctx.fetchCustomDefs();
        } },
    ...{ class: "palette-manage-btn" },
});
/** @type {[typeof ComponentPalette, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(ComponentPalette, new ComponentPalette({
    ...{ 'onAdd': {} },
}));
const __VLS_1 = __VLS_0({
    ...{ 'onAdd': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_0));
let __VLS_3;
let __VLS_4;
let __VLS_5;
const __VLS_6 = {
    onAdd: (__VLS_ctx.onAddComponent)
};
var __VLS_2;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tree-view" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tree-title" },
});
for (const [c] of __VLS_getVForSourceType((__VLS_ctx.components))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectedId = c.id;
            } },
        ...{ onDragstart: (...[$event]) => {
                __VLS_ctx.onTreeDragStart($event, c.id);
            } },
        ...{ onDragover: (...[$event]) => {
                __VLS_ctx.onTreeDragOver($event, c);
            } },
        ...{ onDragleave: (...[$event]) => {
                __VLS_ctx.treeDragOver = '';
            } },
        ...{ onDrop: (...[$event]) => {
                __VLS_ctx.onTreeDrop($event, c);
            } },
        key: (c.id),
        ...{ class: "tree-node" },
        ...{ class: ({ 'tree-selected': __VLS_ctx.selectedId === c.id, 'tree-drop-target': __VLS_ctx.treeDragOver === c.id }) },
        draggable: "true",
    });
    (__VLS_ctx.getComponentDef(c.componentType)?.icon);
    (__VLS_ctx.getComponentDef(c.componentType)?.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "layer-z" },
    });
    (c.props.zIndex || 0);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                c.props.locked = !c.props.locked;
            } },
        ...{ class: "layer-btn" },
        title: (c.props.locked ? 'Unlock' : 'Lock'),
    });
    (c.props.locked ? '<Icon name="unlock" :size="14" />' : '<Icon name="lock" :size="14" />');
    if (__VLS_ctx.selectedId === c.id) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "layer-controls" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.selectedId === c.id))
                        return;
                    __VLS_ctx.bringToFront(c.id);
                } },
            ...{ class: "layer-btn" },
            title: "Bring to front",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.selectedId === c.id))
                        return;
                    __VLS_ctx.bringForward(c.id);
                } },
            ...{ class: "layer-btn" },
            title: "Bring forward",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.selectedId === c.id))
                        return;
                    __VLS_ctx.sendBackward(c.id);
                } },
            ...{ class: "layer-btn" },
            title: "Send backward",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.selectedId === c.id))
                        return;
                    __VLS_ctx.sendToBack(c.id);
                } },
            ...{ class: "layer-btn" },
            title: "Send to back",
        });
    }
    for (const [child] of __VLS_getVForSourceType((c.children))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.selectedId = child.id;
                } },
            ...{ onDragstart: (...[$event]) => {
                    __VLS_ctx.onTreeDragStart($event, child.id);
                } },
            ...{ onDragover: () => { } },
            ...{ onDrop: (...[$event]) => {
                    __VLS_ctx.onTreeDrop($event, c);
                } },
            key: (child.id),
            ...{ class: "tree-child" },
            ...{ class: ({ 'tree-selected': __VLS_ctx.selectedId === child.id }) },
            draggable: "true",
        });
        (__VLS_ctx.getComponentDef(child.componentType)?.icon);
        (__VLS_ctx.getComponentDef(child.componentType)?.name);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onDragover: () => { } },
    ...{ onDrop: (...[$event]) => {
            __VLS_ctx.onTreeDropToRoot($event);
        } },
    ...{ class: "tree-root-drop" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-center" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "scenario-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.selectScenario(null);
        } },
    ...{ class: "scenario-tab" },
    ...{ class: ({ active: !__VLS_ctx.activeScenarioId }) },
});
for (const [s] of __VLS_getVForSourceType((__VLS_ctx.scenarios))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectScenario(s.id);
            } },
        key: (s.id),
        ...{ class: "scenario-tab" },
        ...{ class: ({ active: __VLS_ctx.activeScenarioId === s.id }) },
    });
    (s.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.deleteScenario(s.id);
            } },
        ...{ class: "scenario-del" },
    });
}
if (!__VLS_ctx.showScenarioInput) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(!__VLS_ctx.showScenarioInput))
                    return;
                __VLS_ctx.showScenarioInput = true;
            } },
        ...{ class: "scenario-add" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onKeyup: (__VLS_ctx.addScenario) },
        ...{ onBlur: (...[$event]) => {
                if (!!(!__VLS_ctx.showScenarioInput))
                    return;
                __VLS_ctx.showScenarioInput = false;
            } },
        ...{ class: "scenario-input" },
        placeholder: "Scenario name",
        autofocus: true,
    });
    (__VLS_ctx.newScenarioName);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-toolbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ class: "toolbar-title" },
    placeholder: "Mockup title",
});
(__VLS_ctx.pageTitle);
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.viewport),
    ...{ class: "toolbar-select" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "desktop",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "mobile",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "save-indicator" },
    ...{ class: ({ changed: __VLS_ctx.hasChanges }) },
});
(__VLS_ctx.saving ? 'Saving...' : __VLS_ctx.hasChanges ? 'Unsaved changes' : 'Saved');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.save) },
    ...{ class: "styled-btn styled-btn--primary" },
    disabled: (__VLS_ctx.saving),
});
(__VLS_ctx.saving ? 'Saving...' : 'Save');
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$router.push(`/mockup-viewer/${__VLS_ctx.slug}`);
        } },
    ...{ class: "styled-btn styled-btn--ghost" },
});
if (__VLS_ctx.selectedIds.length > 1) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedIds.length > 1))
                    return;
                __VLS_ctx.alignSelected('left');
            } },
        ...{ class: "align-btn" },
        title: "Align left",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedIds.length > 1))
                    return;
                __VLS_ctx.alignSelected('centerH');
            } },
        ...{ class: "align-btn" },
        title: "Center horizontally",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedIds.length > 1))
                    return;
                __VLS_ctx.alignSelected('right');
            } },
        ...{ class: "align-btn" },
        title: "Align right",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedIds.length > 1))
                    return;
                __VLS_ctx.alignSelected('top');
            } },
        ...{ class: "align-btn" },
        title: "Align top",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedIds.length > 1))
                    return;
                __VLS_ctx.alignSelected('centerV');
            } },
        ...{ class: "align-btn" },
        title: "Center vertically",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.selectedIds.length > 1))
                    return;
                __VLS_ctx.alignSelected('bottom');
            } },
        ...{ class: "align-btn" },
        title: "Align bottom",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showGrid = !__VLS_ctx.showGrid;
        } },
    ...{ class: "styled-btn styled-btn--ghost" },
});
(__VLS_ctx.showGrid ? 'Grid off' : 'Grid');
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "zoom-info" },
});
(__VLS_ctx.zoom);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "range",
    min: "25",
    max: "400",
    step: "25",
    ...{ class: "zoom-slider" },
});
(__VLS_ctx.zoom);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onWheel: (__VLS_ctx.onWheel) },
    ...{ class: ({ 'canvas-grid': __VLS_ctx.showGrid }) },
    ...{ style: ({ transform: `scale(${__VLS_ctx.zoom / 100})`, transformOrigin: 'top left' }) },
});
/** @type {[typeof MockupCanvas, ]} */ ;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent(MockupCanvas, new MockupCanvas({
    ...{ 'onSelect': {} },
    ...{ 'onDrop': {} },
    ...{ 'onDelete': {} },
    ...{ 'onReorder': {} },
    components: (__VLS_ctx.components),
    selectedId: (__VLS_ctx.selectedId),
    selectedIds: (__VLS_ctx.selectedIds),
    viewport: (__VLS_ctx.viewport),
}));
const __VLS_8 = __VLS_7({
    ...{ 'onSelect': {} },
    ...{ 'onDrop': {} },
    ...{ 'onDelete': {} },
    ...{ 'onReorder': {} },
    components: (__VLS_ctx.components),
    selectedId: (__VLS_ctx.selectedId),
    selectedIds: (__VLS_ctx.selectedIds),
    viewport: (__VLS_ctx.viewport),
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
let __VLS_10;
let __VLS_11;
let __VLS_12;
const __VLS_13 = {
    onSelect: ((id, ev) => __VLS_ctx.onSelect(id, ev))
};
const __VLS_14 = {
    onDrop: (__VLS_ctx.onDrop)
};
const __VLS_15 = {
    onDelete: (__VLS_ctx.onDelete)
};
const __VLS_16 = {
    onReorder: (__VLS_ctx.onReorder)
};
var __VLS_9;
/** @type {[typeof PropertyPanel, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(PropertyPanel, new PropertyPanel({
    ...{ 'onUpdateProp': {} },
    ...{ 'onUpdateSpec': {} },
    ...{ 'onUpdatePageTitle': {} },
    ...{ 'onUpdatePageDesc': {} },
    selected: (__VLS_ctx.selectedComponent),
    pageTitle: (__VLS_ctx.pageTitle),
    pageDescription: (__VLS_ctx.pageDescription),
}));
const __VLS_18 = __VLS_17({
    ...{ 'onUpdateProp': {} },
    ...{ 'onUpdateSpec': {} },
    ...{ 'onUpdatePageTitle': {} },
    ...{ 'onUpdatePageDesc': {} },
    selected: (__VLS_ctx.selectedComponent),
    pageTitle: (__VLS_ctx.pageTitle),
    pageDescription: (__VLS_ctx.pageDescription),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onUpdateProp: (__VLS_ctx.onUpdateProp)
};
const __VLS_24 = {
    onUpdateSpec: (__VLS_ctx.onUpdateSpec)
};
const __VLS_25 = {
    onUpdatePageTitle: (...[$event]) => {
        __VLS_ctx.pageTitle = $event;
    }
};
const __VLS_26 = {
    onUpdatePageDesc: (...[$event]) => {
        __VLS_ctx.pageDescription = $event;
    }
};
var __VLS_19;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "editor-statusbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.components.length);
if (__VLS_ctx.selectedIds.length > 1) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.selectedIds.length);
}
if (__VLS_ctx.saveToast) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "save-toast" },
    });
}
if (__VLS_ctx.showCompModal) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showCompModal))
                    return;
                __VLS_ctx.showCompModal = false;
            } },
        ...{ class: "modal-overlay" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-box" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showCompModal))
                    return;
                __VLS_ctx.showCompModal = false;
            } },
        ...{ class: "modal-close" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "modal-body" },
    });
    for (const [d] of __VLS_getVForSourceType((__VLS_ctx.customDefs))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (d.id),
            ...{ class: "custom-def-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (d.icon);
        (d.name);
        (d.category);
        if (!d.is_builtin) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.showCompModal))
                            return;
                        if (!(!d.is_builtin))
                            return;
                        __VLS_ctx.deleteCustomDef(d.id);
                    } },
                ...{ class: "css-remove" },
            });
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "custom-def-form" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "ID (alphanumeric)",
        ...{ class: "prop-input" },
    });
    (__VLS_ctx.newDef.id);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "Name",
        ...{ class: "prop-input" },
    });
    (__VLS_ctx.newDef.name);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "Icon",
        ...{ class: "prop-input" },
        ...{ style: {} },
    });
    (__VLS_ctx.newDef.icon);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        placeholder: "Category",
        ...{ class: "prop-input" },
    });
    (__VLS_ctx.newDef.category);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.addCustomDef) },
        ...{ class: "css-add-btn" },
    });
}
/** @type {__VLS_StyleScopedClasses['mobile-notice']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-left']} */ ;
/** @type {__VLS_StyleScopedClasses['palette-header']} */ ;
/** @type {__VLS_StyleScopedClasses['palette-title']} */ ;
/** @type {__VLS_StyleScopedClasses['palette-manage-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-view']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-title']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-node']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-selected']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-drop-target']} */ ;
/** @type {__VLS_StyleScopedClasses['layer-z']} */ ;
/** @type {__VLS_StyleScopedClasses['layer-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['layer-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['layer-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['layer-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['layer-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['layer-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-child']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-selected']} */ ;
/** @type {__VLS_StyleScopedClasses['tree-root-drop']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-center']} */ ;
/** @type {__VLS_StyleScopedClasses['scenario-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['scenario-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['scenario-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['scenario-del']} */ ;
/** @type {__VLS_StyleScopedClasses['scenario-add']} */ ;
/** @type {__VLS_StyleScopedClasses['scenario-input']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-title']} */ ;
/** @type {__VLS_StyleScopedClasses['toolbar-select']} */ ;
/** @type {__VLS_StyleScopedClasses['save-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['changed']} */ ;
/** @type {__VLS_StyleScopedClasses['styled-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['styled-btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['styled-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['styled-btn--ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['align-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['align-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['align-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['align-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['align-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['align-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['styled-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['styled-btn--ghost']} */ ;
/** @type {__VLS_StyleScopedClasses['zoom-info']} */ ;
/** @type {__VLS_StyleScopedClasses['zoom-slider']} */ ;
/** @type {__VLS_StyleScopedClasses['canvas-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['editor-statusbar']} */ ;
/** @type {__VLS_StyleScopedClasses['save-toast']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-overlay']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-box']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-header']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-close']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-body']} */ ;
/** @type {__VLS_StyleScopedClasses['custom-def-row']} */ ;
/** @type {__VLS_StyleScopedClasses['css-remove']} */ ;
/** @type {__VLS_StyleScopedClasses['custom-def-form']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-input']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-input']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-input']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-input']} */ ;
/** @type {__VLS_StyleScopedClasses['css-add-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ComponentPalette: ComponentPalette,
            MockupCanvas: MockupCanvas,
            PropertyPanel: PropertyPanel,
            getComponentDef: getComponentDef,
            slug: slug,
            components: components,
            selectedId: selectedId,
            selectedIds: selectedIds,
            onSelect: onSelect,
            pageTitle: pageTitle,
            pageDescription: pageDescription,
            viewport: viewport,
            saving: saving,
            hasChanges: hasChanges,
            zoom: zoom,
            showGrid: showGrid,
            onWheel: onWheel,
            saveToast: saveToast,
            scenarios: scenarios,
            activeScenarioId: activeScenarioId,
            selectScenario: selectScenario,
            deleteScenario: deleteScenario,
            showScenarioInput: showScenarioInput,
            newScenarioName: newScenarioName,
            addScenario: addScenario,
            showCompModal: showCompModal,
            customDefs: customDefs,
            newDef: newDef,
            fetchCustomDefs: fetchCustomDefs,
            addCustomDef: addCustomDef,
            deleteCustomDef: deleteCustomDef,
            treeDragOver: treeDragOver,
            onTreeDragStart: onTreeDragStart,
            onTreeDragOver: onTreeDragOver,
            onTreeDrop: onTreeDrop,
            onTreeDropToRoot: onTreeDropToRoot,
            bringToFront: bringToFront,
            sendToBack: sendToBack,
            bringForward: bringForward,
            sendBackward: sendBackward,
            alignSelected: alignSelected,
            selectedComponent: selectedComponent,
            onAddComponent: onAddComponent,
            onDrop: onDrop,
            onDelete: onDelete,
            onReorder: onReorder,
            onUpdateProp: onUpdateProp,
            onUpdateSpec: onUpdateSpec,
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
