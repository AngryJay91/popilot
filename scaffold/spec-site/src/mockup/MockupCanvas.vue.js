import { ref, computed } from 'vue';
import { getComponentDef } from './componentCatalog';
const props = defineProps();
const emit = defineEmits();
// Auto-expand canvas based on component positions
const canvasMinWidth = computed(() => {
    let maxX = 0;
    for (const c of props.components) {
        const x = c.props.x || 0;
        const w = c.props.w || 200;
        maxX = Math.max(maxX, x + w + 40);
    }
    return maxX > 0 ? `${maxX}px` : 'auto';
});
const canvasMinHeight = computed(() => {
    let maxY = 0;
    for (const c of props.components) {
        const y = c.props.y || 0;
        const h = c.props.h || 40;
        maxY = Math.max(maxY, y + h + 40);
    }
    return maxY > 400 ? `${maxY}px` : '400px';
});
const canvasWidth = computed(() => props.viewport === 'mobile' ? '375px' : '100%');
function onDragOver(e) {
    e.preventDefault();
    if (e.dataTransfer)
        e.dataTransfer.dropEffect = 'copy';
}
function onDrop(e, parentId) {
    e.preventDefault();
    e.stopPropagation();
    const compId = e.dataTransfer?.getData('component-id');
    if (compId) {
        // Drop position X/Y
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.round(e.clientX - rect.left);
        const y = Math.round(e.clientY - rect.top);
        emit('drop', compId, parentId, x, y);
    }
}
// Internal drag (reorder)
const dragInsert = ref('');
let internalDragId = '';
function onInternalDragStart(e, id) {
    internalDragId = id;
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('internal-comp-id', id);
    }
}
function onInternalDragOver(e, targetId) {
    e.preventDefault();
    if (!internalDragId || internalDragId === targetId)
        return;
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    dragInsert.value = e.clientY < midY ? targetId + '-top' : targetId + '-bottom';
}
function onInternalDrop(e, targetId) {
    e.preventDefault();
    const sourceId = e.dataTransfer?.getData('internal-comp-id') || internalDragId;
    if (!sourceId || sourceId === targetId) {
        dragInsert.value = '';
        return;
    }
    // Drop from palette
    const paletteCompId = e.dataTransfer?.getData('component-id');
    if (paletteCompId) {
        emit('drop', paletteCompId, getComponentDef(targetId)?.allowChildren ? targetId : undefined);
        dragInsert.value = '';
        return;
    }
    // Internal reorder
    const isTop = dragInsert.value.endsWith('-top');
    emit('reorder', sourceId, isTop ? 'up' : 'down');
    dragInsert.value = '';
    internalDragId = '';
}
// Snap guidelines
const snapLines = ref([]);
const SNAP_THRESHOLD = 5;
function getSnapTargets(excludeId) {
    return props.components
        .filter(c => c.id !== excludeId && typeof c.props.x === 'number')
        .map(c => {
        const x = c.props.x;
        const y = c.props.y;
        const w = c.props.w || 200;
        const h = c.props.h || 40;
        return { x, y, cx: x + w / 2, cy: y + h / 2, r: x + w, b: y + h };
    });
}
function snapPosition(x, y, w, h, excludeId) {
    const targets = getSnapTargets(excludeId);
    const lines = [];
    let sx = x, sy = y;
    const cx = x + w / 2, r = x + w;
    const cy = y + h / 2, b = y + h;
    for (const t of targets) {
        // Vertical snap (X axis)
        if (Math.abs(x - t.x) < SNAP_THRESHOLD) {
            sx = t.x;
            lines.push({ type: 'v', pos: t.x });
        }
        else if (Math.abs(r - t.r) < SNAP_THRESHOLD) {
            sx = t.r - w;
            lines.push({ type: 'v', pos: t.r });
        }
        else if (Math.abs(cx - t.cx) < SNAP_THRESHOLD) {
            sx = t.cx - w / 2;
            lines.push({ type: 'v', pos: t.cx });
        }
        else if (Math.abs(x - t.r) < SNAP_THRESHOLD) {
            sx = t.r;
            lines.push({ type: 'v', pos: t.r });
        }
        else if (Math.abs(r - t.x) < SNAP_THRESHOLD) {
            sx = t.x - w;
            lines.push({ type: 'v', pos: t.x });
        }
        // Horizontal snap (Y axis)
        if (Math.abs(y - t.y) < SNAP_THRESHOLD) {
            sy = t.y;
            lines.push({ type: 'h', pos: t.y });
        }
        else if (Math.abs(b - t.b) < SNAP_THRESHOLD) {
            sy = t.b - h;
            lines.push({ type: 'h', pos: t.b });
        }
        else if (Math.abs(cy - t.cy) < SNAP_THRESHOLD) {
            sy = t.cy - h / 2;
            lines.push({ type: 'h', pos: t.cy });
        }
        else if (Math.abs(y - t.b) < SNAP_THRESHOLD) {
            sy = t.b;
            lines.push({ type: 'h', pos: t.b });
        }
        else if (Math.abs(b - t.y) < SNAP_THRESHOLD) {
            sy = t.y - h;
            lines.push({ type: 'h', pos: t.y });
        }
    }
    snapLines.value = lines;
    return { x: sx, y: sy };
}
// Mouse drag movement
let dragMoveComp = null;
let dragStartX = 0;
let dragStartY = 0;
let origX = 0;
let origY = 0;
function startDragMove(e, comp) {
    if (props.viewMode)
        return;
    // Initialize default values if x/y/w/h are missing
    if (typeof comp.props.x !== 'number')
        comp.props.x = 0;
    if (typeof comp.props.y !== 'number')
        comp.props.y = 0;
    if (typeof comp.props.w !== 'number')
        comp.props.w = 200;
    if (typeof comp.props.h !== 'number')
        comp.props.h = 40;
    dragMoveComp = comp;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    origX = comp.props.x;
    origY = comp.props.y;
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragMoveEnd);
}
function onDragMove(e) {
    if (!dragMoveComp)
        return;
    const rawX = origX + (e.clientX - dragStartX);
    const rawY = origY + (e.clientY - dragStartY);
    const w = dragMoveComp.props.w || 200;
    const h = dragMoveComp.props.h || 40;
    const snapped = snapPosition(rawX, rawY, w, h, dragMoveComp.id);
    dragMoveComp.props.x = snapped.x;
    dragMoveComp.props.y = snapped.y;
}
function onDragMoveEnd() {
    dragMoveComp = null;
    snapLines.value = [];
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragMoveEnd);
}
// Resize
let resizeComp = null;
let resizeDir = '';
let resizeStartX = 0;
let resizeStartY = 0;
let resizeOrigW = 0;
let resizeOrigH = 0;
let resizeOrigX = 0;
let resizeOrigY = 0;
function startResize(e, comp, dir) {
    resizeComp = comp;
    resizeDir = dir;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeOrigW = comp.props.w || 200;
    resizeOrigH = comp.props.h || 40;
    resizeOrigX = comp.props.x || 0;
    resizeOrigY = comp.props.y || 0;
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', onResizeEnd);
}
function onResize(e) {
    if (!resizeComp)
        return;
    const dx = e.clientX - resizeStartX;
    const dy = e.clientY - resizeStartY;
    if (resizeDir.includes('e'))
        resizeComp.props.w = Math.max(20, resizeOrigW + dx);
    if (resizeDir.includes('w')) {
        resizeComp.props.w = Math.max(20, resizeOrigW - dx);
        resizeComp.props.x = resizeOrigX + dx;
    }
    if (resizeDir.includes('s'))
        resizeComp.props.h = Math.max(20, resizeOrigH + dy);
    if (resizeDir.includes('n')) {
        resizeComp.props.h = Math.max(20, resizeOrigH - dy);
        resizeComp.props.y = resizeOrigY + dy;
    }
}
function onResizeEnd() {
    resizeComp = null;
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', onResizeEnd);
}
function onInlineEdit(comp, key, e) {
    const text = e.target.textContent || '';
    if (comp.props[key] !== text)
        comp.props[key] = text;
}
function onKeydown(e) {
    if (e.key === 'Delete' && props.selectedId) {
        emit('delete', props.selectedId);
    }
}
function renderStyle(comp) {
    const p = comp.props;
    const style = {};
    // Absolute positioning (when x/y are set)
    if (typeof p.x === 'number' && typeof p.y === 'number') {
        style.position = 'absolute';
        style.left = `${p.x}px`;
        style.top = `${p.y}px`;
    }
    if (typeof p.w === 'number' && p.w > 0)
        style.width = `${p.w}px`;
    if (typeof p.h === 'number' && p.h > 0)
        style.height = `${p.h}px`;
    if (p.padding)
        style.padding = `${p.padding}px`;
    if (p.gap)
        style.gap = `${p.gap}px`;
    if (p.direction === 'row')
        style.flexDirection = 'row';
    if (p.direction === 'column')
        style.flexDirection = 'column';
    if (p.height && typeof p.x !== 'number')
        style.height = `${p.height}px`;
    if (p.width && typeof p.width === 'number' && typeof p.x !== 'number')
        style.width = `${p.width}px`;
    if (p.maxWidth)
        style.maxWidth = `${p.maxWidth}px`;
    if (p.borderRadius)
        style.borderRadius = `${p.borderRadius}px`;
    if (p.margin)
        style.margin = `${p.margin}px 0`;
    if (typeof p.zIndex === 'number')
        style.zIndex = String(p.zIndex);
    // CSS whitelist application
    if (p.css && typeof p.css === 'object') {
        const css = p.css;
        for (const [k, v] of Object.entries(css)) {
            if (v)
                style[k] = v;
        }
    }
    return style;
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['canvas-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['canvas-comp']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
/** @type {__VLS_StyleScopedClasses['canvas-comp']} */ ;
/** @type {__VLS_StyleScopedClasses['canvas-comp']} */ ;
/** @type {__VLS_StyleScopedClasses['canvas-comp']} */ ;
/** @type {__VLS_StyleScopedClasses['view-mode']} */ ;
/** @type {__VLS_StyleScopedClasses['canvas-comp']} */ ;
/** @type {__VLS_StyleScopedClasses['view-mode']} */ ;
/** @type {__VLS_StyleScopedClasses['canvas-comp']} */ ;
/** @type {__VLS_StyleScopedClasses['view-mode']} */ ;
/** @type {__VLS_StyleScopedClasses['canvas-comp']} */ ;
/** @type {__VLS_StyleScopedClasses['selected']} */ ;
/** @type {__VLS_StyleScopedClasses['canvas-comp']} */ ;
/** @type {__VLS_StyleScopedClasses['canvas-comp']} */ ;
/** @type {__VLS_StyleScopedClasses['canvas-comp']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-header']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-row']} */ ;
/** @type {__VLS_StyleScopedClasses['switch-on']} */ ;
/** @type {__VLS_StyleScopedClasses['switch-thumb']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onKeydown: (__VLS_ctx.onKeydown) },
    ...{ class: "canvas-wrap" },
    tabindex: "0",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "canvas-scroll-wrapper" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onDragover: (__VLS_ctx.onDragOver) },
    ...{ onDrop: (...[$event]) => {
            __VLS_ctx.onDrop($event);
        } },
    ...{ class: "canvas" },
    ...{ style: ({ maxWidth: __VLS_ctx.canvasWidth, minWidth: __VLS_ctx.canvasMinWidth, minHeight: __VLS_ctx.canvasMinHeight }) },
});
if (!__VLS_ctx.components.length && !__VLS_ctx.viewMode) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "canvas-empty" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.br)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
}
if (!__VLS_ctx.components.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onDragover: (__VLS_ctx.onDragOver) },
        ...{ onDrop: (...[$event]) => {
                if (!(!__VLS_ctx.components.length))
                    return;
                __VLS_ctx.onDrop($event);
            } },
        ...{ class: "canvas-empty" },
    });
}
for (const [comp] of __VLS_getVForSourceType((__VLS_ctx.components))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.emit('select', comp.id, $event);
            } },
        ...{ onMousedown: (...[$event]) => {
                !comp.props.locked && !$event.shiftKey && !$event.metaKey && !$event.ctrlKey && __VLS_ctx.startDragMove($event, comp);
            } },
        ...{ onDragstart: (...[$event]) => {
                __VLS_ctx.onInternalDragStart($event, comp.id);
            } },
        ...{ onDragover: (...[$event]) => {
                __VLS_ctx.onInternalDragOver($event, comp.id);
            } },
        ...{ onDragleave: (...[$event]) => {
                __VLS_ctx.dragInsert = '';
            } },
        ...{ onDrop: (...[$event]) => {
                __VLS_ctx.onInternalDrop($event, comp.id);
            } },
        ...{ class: "canvas-comp" },
        ...{ class: ({ selected: __VLS_ctx.selectedId === comp.id && !__VLS_ctx.viewMode, 'has-children': __VLS_ctx.getComponentDef(comp.componentType)?.allowChildren, 'view-mode': __VLS_ctx.viewMode, 'drag-over-top': __VLS_ctx.dragInsert === comp.id + '-top', 'drag-over-bottom': __VLS_ctx.dragInsert === comp.id + '-bottom' }) },
        ...{ style: (__VLS_ctx.renderStyle(comp)) },
        draggable: (!__VLS_ctx.viewMode),
    });
    if (!__VLS_ctx.viewMode) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "comp-label" },
        });
        (__VLS_ctx.getComponentDef(comp.componentType)?.icon);
        (__VLS_ctx.getComponentDef(comp.componentType)?.name);
    }
    if (comp.componentType === 'page-title') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onBlur: (...[$event]) => {
                    if (!(comp.componentType === 'page-title'))
                        return;
                    __VLS_ctx.onInlineEdit(comp, 'text', $event);
                } },
            ...{ class: "render-title" },
            contenteditable: (!__VLS_ctx.viewMode && __VLS_ctx.selectedId === comp.id),
        });
        (comp.props.text);
    }
    else if (comp.componentType === 'text') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onBlur: (...[$event]) => {
                    if (!!(comp.componentType === 'page-title'))
                        return;
                    if (!(comp.componentType === 'text'))
                        return;
                    __VLS_ctx.onInlineEdit(comp, 'text', $event);
                } },
            ...{ class: "render-text" },
            ...{ style: ({ fontSize: comp.props.size + 'px', color: comp.props.color }) },
            contenteditable: (!__VLS_ctx.viewMode && __VLS_ctx.selectedId === comp.id),
        });
        (comp.props.text);
    }
    else if (comp.componentType === 'button') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!!(comp.componentType === 'page-title'))
                        return;
                    if (!!(comp.componentType === 'text'))
                        return;
                    if (!(comp.componentType === 'button'))
                        return;
                    comp.props.onClick && __VLS_ctx.viewMode && __VLS_ctx.$router?.push(comp.props.onClick);
                } },
            ...{ class: "render-button" },
            ...{ class: ('btn--' + comp.props.variant) },
            ...{ style: ({ cursor: comp.props.onClick ? 'pointer' : 'default' }) },
        });
        (comp.props.text);
    }
    else if (comp.componentType === 'text-field') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ class: "render-input" },
            placeholder: comp.props.placeholder,
            disabled: true,
        });
    }
    else if (comp.componentType === 'data-grid') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "render-grid" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "grid-header" },
        });
        for (const [col] of __VLS_getVForSourceType(comp.props.columns)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                key: (col),
            });
            (col);
        }
        for (const [i] of __VLS_getVForSourceType(comp.props.rows)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (i),
                ...{ class: "grid-row" },
            });
            for (const [col] of __VLS_getVForSourceType(comp.props.columns)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    key: (col),
                });
            }
        }
    }
    else if (comp.componentType === 'chart') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "render-chart" },
        });
        (comp.props.title);
    }
    else if (comp.componentType === 'alert') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "render-alert" },
            ...{ class: ('alert--' + comp.props.type) },
        });
        (comp.props.message);
    }
    else if (comp.componentType === 'divider') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "render-divider" },
        });
    }
    else if (comp.componentType === 'spacer') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ style: ({ height: comp.props.height + 'px' }) },
        });
    }
    else if (comp.componentType === 'label') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "render-label" },
        });
        (comp.props.text);
    }
    else if (comp.componentType === 'checkbox') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "render-check" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "checkbox",
            checked: comp.props.checked,
            disabled: true,
        });
        (comp.props.label);
    }
    else if (comp.componentType === 'date-picker') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "render-datepicker" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "dp-label" },
        });
        (comp.props.label);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "date",
            ...{ class: "dp-input" },
            disabled: true,
        });
    }
    else if (comp.componentType === 'pagination') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "render-pagination" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ class: "pg-btn" },
            disabled: true,
        });
        for (const [p] of __VLS_getVForSourceType((Math.min(comp.props.totalPages || 5, 7)))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                key: (p),
                ...{ class: "pg-btn" },
                ...{ class: ({ 'pg-active': p === (comp.props.current || 1) }) },
                disabled: true,
            });
            (p);
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ class: "pg-btn" },
            disabled: true,
        });
    }
    else if (comp.componentType === 'switch') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "render-switch" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (comp.props.label);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "switch-track" },
            ...{ class: ({ 'switch-on': comp.props.checked }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
            ...{ class: "switch-thumb" },
        });
    }
    else if (comp.componentType === 'card') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "render-card" },
        });
        if (comp.props.imageUrl) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                src: comp.props.imageUrl,
                ...{ class: "card-image" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-title" },
        });
        (comp.props.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "card-content" },
        });
        (comp.props.content);
    }
    else if (comp.componentType === 'sidebar') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "render-sidebar" },
        });
        for (const [item, idx] of __VLS_getVForSourceType(((comp.props.menuItems || [])))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!!(comp.componentType === 'page-title'))
                            return;
                        if (!!(comp.componentType === 'text'))
                            return;
                        if (!!(comp.componentType === 'button'))
                            return;
                        if (!!(comp.componentType === 'text-field'))
                            return;
                        if (!!(comp.componentType === 'data-grid'))
                            return;
                        if (!!(comp.componentType === 'chart'))
                            return;
                        if (!!(comp.componentType === 'alert'))
                            return;
                        if (!!(comp.componentType === 'divider'))
                            return;
                        if (!!(comp.componentType === 'spacer'))
                            return;
                        if (!!(comp.componentType === 'label'))
                            return;
                        if (!!(comp.componentType === 'checkbox'))
                            return;
                        if (!!(comp.componentType === 'date-picker'))
                            return;
                        if (!!(comp.componentType === 'pagination'))
                            return;
                        if (!!(comp.componentType === 'switch'))
                            return;
                        if (!!(comp.componentType === 'card'))
                            return;
                        if (!(comp.componentType === 'sidebar'))
                            return;
                        item.link && __VLS_ctx.$router?.push(item.link);
                    } },
                key: (idx),
                ...{ class: "sidebar-item" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "sidebar-icon" },
            });
            (item.icon);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "sidebar-text" },
            });
            (item.text);
        }
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "render-placeholder" },
        });
        (comp.props.text || comp.props.title || comp.componentType);
    }
    if (comp.children?.length) {
        const __VLS_0 = {}.MockupCanvas;
        /** @type {[typeof __VLS_components.MockupCanvas, ]} */ ;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
            ...{ 'onSelect': {} },
            ...{ 'onDrop': {} },
            ...{ 'onDelete': {} },
            components: (comp.children),
            selectedId: (__VLS_ctx.selectedId),
            viewport: (__VLS_ctx.viewport),
            viewMode: (__VLS_ctx.viewMode),
        }));
        const __VLS_2 = __VLS_1({
            ...{ 'onSelect': {} },
            ...{ 'onDrop': {} },
            ...{ 'onDelete': {} },
            components: (comp.children),
            selectedId: (__VLS_ctx.selectedId),
            viewport: (__VLS_ctx.viewport),
            viewMode: (__VLS_ctx.viewMode),
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        let __VLS_4;
        let __VLS_5;
        let __VLS_6;
        const __VLS_7 = {
            onSelect: ((id, ev) => __VLS_ctx.emit('select', id, ev))
        };
        const __VLS_8 = {
            onDrop: (...[$event]) => {
                if (!(comp.children?.length))
                    return;
                __VLS_ctx.emit('drop', $event, comp.id);
            }
        };
        const __VLS_9 = {
            onDelete: (...[$event]) => {
                if (!(comp.children?.length))
                    return;
                __VLS_ctx.emit('delete', $event);
            }
        };
        var __VLS_3;
    }
    if (comp.props.locked && !__VLS_ctx.viewMode) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "lock-indicator" },
        });
    }
    if (__VLS_ctx.selectedId === comp.id && !__VLS_ctx.viewMode && !comp.props.locked) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ onMousedown: (...[$event]) => {
                    if (!(__VLS_ctx.selectedId === comp.id && !__VLS_ctx.viewMode && !comp.props.locked))
                        return;
                    __VLS_ctx.startResize($event, comp, 'n');
                } },
            ...{ class: "resize-handle rh-n" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ onMousedown: (...[$event]) => {
                    if (!(__VLS_ctx.selectedId === comp.id && !__VLS_ctx.viewMode && !comp.props.locked))
                        return;
                    __VLS_ctx.startResize($event, comp, 's');
                } },
            ...{ class: "resize-handle rh-s" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ onMousedown: (...[$event]) => {
                    if (!(__VLS_ctx.selectedId === comp.id && !__VLS_ctx.viewMode && !comp.props.locked))
                        return;
                    __VLS_ctx.startResize($event, comp, 'e');
                } },
            ...{ class: "resize-handle rh-e" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ onMousedown: (...[$event]) => {
                    if (!(__VLS_ctx.selectedId === comp.id && !__VLS_ctx.viewMode && !comp.props.locked))
                        return;
                    __VLS_ctx.startResize($event, comp, 'w');
                } },
            ...{ class: "resize-handle rh-w" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ onMousedown: (...[$event]) => {
                    if (!(__VLS_ctx.selectedId === comp.id && !__VLS_ctx.viewMode && !comp.props.locked))
                        return;
                    __VLS_ctx.startResize($event, comp, 'ne');
                } },
            ...{ class: "resize-handle rh-ne" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ onMousedown: (...[$event]) => {
                    if (!(__VLS_ctx.selectedId === comp.id && !__VLS_ctx.viewMode && !comp.props.locked))
                        return;
                    __VLS_ctx.startResize($event, comp, 'nw');
                } },
            ...{ class: "resize-handle rh-nw" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ onMousedown: (...[$event]) => {
                    if (!(__VLS_ctx.selectedId === comp.id && !__VLS_ctx.viewMode && !comp.props.locked))
                        return;
                    __VLS_ctx.startResize($event, comp, 'se');
                } },
            ...{ class: "resize-handle rh-se" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ onMousedown: (...[$event]) => {
                    if (!(__VLS_ctx.selectedId === comp.id && !__VLS_ctx.viewMode && !comp.props.locked))
                        return;
                    __VLS_ctx.startResize($event, comp, 'sw');
                } },
            ...{ class: "resize-handle rh-sw" },
        });
    }
    if (__VLS_ctx.selectedId === comp.id && !__VLS_ctx.viewMode) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "comp-controls" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.selectedId === comp.id && !__VLS_ctx.viewMode))
                        return;
                    __VLS_ctx.emit('delete', comp.id);
                } },
            ...{ class: "comp-delete" },
        });
    }
}
for (const [line, idx] of __VLS_getVForSourceType((__VLS_ctx.snapLines))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        key: (idx),
        ...{ class: "snap-line" },
        ...{ class: (line.type === 'h' ? 'snap-h' : 'snap-v') },
        ...{ style: (line.type === 'h' ? { top: line.pos + 'px' } : { left: line.pos + 'px' }) },
    });
}
/** @type {__VLS_StyleScopedClasses['canvas-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['canvas-scroll-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['canvas']} */ ;
/** @type {__VLS_StyleScopedClasses['canvas-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['canvas-empty']} */ ;
/** @type {__VLS_StyleScopedClasses['canvas-comp']} */ ;
/** @type {__VLS_StyleScopedClasses['selected']} */ ;
/** @type {__VLS_StyleScopedClasses['has-children']} */ ;
/** @type {__VLS_StyleScopedClasses['view-mode']} */ ;
/** @type {__VLS_StyleScopedClasses['drag-over-top']} */ ;
/** @type {__VLS_StyleScopedClasses['drag-over-bottom']} */ ;
/** @type {__VLS_StyleScopedClasses['comp-label']} */ ;
/** @type {__VLS_StyleScopedClasses['render-title']} */ ;
/** @type {__VLS_StyleScopedClasses['render-text']} */ ;
/** @type {__VLS_StyleScopedClasses['render-button']} */ ;
/** @type {__VLS_StyleScopedClasses['render-input']} */ ;
/** @type {__VLS_StyleScopedClasses['render-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-header']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-row']} */ ;
/** @type {__VLS_StyleScopedClasses['render-chart']} */ ;
/** @type {__VLS_StyleScopedClasses['render-alert']} */ ;
/** @type {__VLS_StyleScopedClasses['render-divider']} */ ;
/** @type {__VLS_StyleScopedClasses['render-label']} */ ;
/** @type {__VLS_StyleScopedClasses['render-check']} */ ;
/** @type {__VLS_StyleScopedClasses['render-datepicker']} */ ;
/** @type {__VLS_StyleScopedClasses['dp-label']} */ ;
/** @type {__VLS_StyleScopedClasses['dp-input']} */ ;
/** @type {__VLS_StyleScopedClasses['render-pagination']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-active']} */ ;
/** @type {__VLS_StyleScopedClasses['pg-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['render-switch']} */ ;
/** @type {__VLS_StyleScopedClasses['switch-track']} */ ;
/** @type {__VLS_StyleScopedClasses['switch-on']} */ ;
/** @type {__VLS_StyleScopedClasses['switch-thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['render-card']} */ ;
/** @type {__VLS_StyleScopedClasses['card-image']} */ ;
/** @type {__VLS_StyleScopedClasses['card-title']} */ ;
/** @type {__VLS_StyleScopedClasses['card-content']} */ ;
/** @type {__VLS_StyleScopedClasses['render-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-item']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-text']} */ ;
/** @type {__VLS_StyleScopedClasses['render-placeholder']} */ ;
/** @type {__VLS_StyleScopedClasses['lock-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['resize-handle']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-n']} */ ;
/** @type {__VLS_StyleScopedClasses['resize-handle']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-s']} */ ;
/** @type {__VLS_StyleScopedClasses['resize-handle']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-e']} */ ;
/** @type {__VLS_StyleScopedClasses['resize-handle']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-w']} */ ;
/** @type {__VLS_StyleScopedClasses['resize-handle']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-ne']} */ ;
/** @type {__VLS_StyleScopedClasses['resize-handle']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-nw']} */ ;
/** @type {__VLS_StyleScopedClasses['resize-handle']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-se']} */ ;
/** @type {__VLS_StyleScopedClasses['resize-handle']} */ ;
/** @type {__VLS_StyleScopedClasses['rh-sw']} */ ;
/** @type {__VLS_StyleScopedClasses['comp-controls']} */ ;
/** @type {__VLS_StyleScopedClasses['comp-delete']} */ ;
/** @type {__VLS_StyleScopedClasses['snap-line']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            getComponentDef: getComponentDef,
            emit: emit,
            canvasMinWidth: canvasMinWidth,
            canvasMinHeight: canvasMinHeight,
            canvasWidth: canvasWidth,
            onDragOver: onDragOver,
            onDrop: onDrop,
            dragInsert: dragInsert,
            onInternalDragStart: onInternalDragStart,
            onInternalDragOver: onInternalDragOver,
            onInternalDrop: onInternalDrop,
            snapLines: snapLines,
            startDragMove: startDragMove,
            startResize: startResize,
            onInlineEdit: onInlineEdit,
            onKeydown: onKeydown,
            renderStyle: renderStyle,
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
