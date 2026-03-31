import { computed, ref } from 'vue';
import { getComponentDef } from './componentCatalog';
const props = defineProps();
const emit = defineEmits();
const CSS_WHITELIST = [
    'backgroundColor', 'color', 'fontSize', 'fontWeight',
    'borderRadius', 'border', 'borderColor',
    'padding', 'margin', 'gap', 'opacity', 'boxShadow',
    'width', 'height', 'minWidth', 'minHeight', 'maxWidth',
    'textAlign', 'display', 'flexDirection', 'justifyContent', 'alignItems', 'overflow',
];
const LAYOUT_CSS = ['display', 'flexDirection', 'justifyContent', 'alignItems', 'gap', 'overflow'];
const TEXT_CSS = ['textAlign', 'fontSize', 'fontWeight', 'color'];
function getRelevantCss() {
    const type = props.selected?.componentType || '';
    const def = getComponentDef(type);
    if (def?.allowChildren)
        return CSS_WHITELIST; // Container: all properties
    if (['button', 'text', 'page-title', 'label'].includes(type))
        return [...TEXT_CSS, 'backgroundColor', 'borderRadius', 'border', 'borderColor', 'padding', 'margin', 'opacity', 'boxShadow', 'width', 'height', 'minWidth', 'minHeight', 'maxWidth'];
    return CSS_WHITELIST.filter(k => !LAYOUT_CSS.includes(k)); // Default: exclude layout
}
// Show only currently active CSS properties
const activeCssProps = computed(() => {
    const css = props.selected?.props.css || {};
    return Object.keys(css).filter(k => CSS_WHITELIST.includes(k));
});
const availableCssProps = computed(() => {
    const active = new Set(activeCssProps.value);
    return getRelevantCss().filter(k => !active.has(k));
});
const addCssPropKey = ref('');
function addCssProp() {
    if (!addCssPropKey.value)
        return;
    setCssProp(addCssPropKey.value, '');
    addCssPropKey.value = '';
}
function removeCssProp(key) {
    const css = { ...(props.selected?.props.css || {}) };
    delete css[key];
    emit('update-prop', 'css', css);
}
function getCssProp(key) {
    const css = props.selected?.props.css || {};
    return css[key] || '';
}
function setCssProp(key, value) {
    const css = { ...(props.selected?.props.css || {}), [key]: value };
    if (value === undefined)
        delete css[key];
    emit('update-prop', 'css', css);
}
function updateMenuItem(idx, field, value) {
    const items = [...(props.selected?.props.menuItems || [])];
    items[idx] = { ...items[idx], [field]: value };
    emit('update-prop', 'menuItems', items);
}
function removeMenuItem(idx) {
    const items = [...(props.selected?.props.menuItems || [])];
    items.splice(idx, 1);
    emit('update-prop', 'menuItems', items);
}
function addMenuItem() {
    const items = [...(props.selected?.props.menuItems || []), { text: '', icon: '📄', link: '' }];
    emit('update-prop', 'menuItems', items);
}
const compDef = computed(() => props.selected ? getComponentDef(props.selected.componentType) : null);
const SYSTEM_KEYS = ['css', 'menuItems', 'x', 'y', 'w', 'h', 'locked', 'specDescription', 'zIndex', 'onClick'];
const editableProps = computed(() => {
    if (!props.selected)
        return [];
    const p = props.selected.props;
    return Object.entries(p).filter(([key]) => !SYSTEM_KEYS.includes(key)).map(([key, val]) => ({
        key,
        value: val,
        type: typeof val === 'boolean' ? 'boolean'
            : typeof val === 'number' ? 'number'
                : Array.isArray(val) ? 'array'
                    : key.includes('color') ? 'color'
                        : key.includes('variant') || key.includes('type') || key.includes('level') ? 'select'
                            : 'text',
    }));
});
function getSelectOptions(key) {
    if (key === 'variant')
        return ['primary', 'secondary', 'danger', 'ghost'];
    if (key === 'type')
        return ['info', 'warning', 'error', 'success'];
    if (key === 'level')
        return ['h1', 'h2', 'h3'];
    if (key === 'direction')
        return ['column', 'row'];
    if (key === 'position')
        return ['left', 'right'];
    if (key === 'size')
        return ['sm', 'md', 'lg'];
    return [];
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "prop-panel" },
});
if (__VLS_ctx.selected) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title" },
    });
    (__VLS_ctx.compDef?.icon);
    (__VLS_ctx.compDef?.name);
    for (const [p] of __VLS_getVForSourceType((__VLS_ctx.editableProps))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (p.key),
            ...{ class: "prop-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "prop-label" },
        });
        (p.key);
        if (p.type === 'text') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onInput: (...[$event]) => {
                        if (!(__VLS_ctx.selected))
                            return;
                        if (!(p.type === 'text'))
                            return;
                        __VLS_ctx.emit('update-prop', p.key, $event.target.value);
                    } },
                ...{ class: "prop-input" },
                value: (p.value),
            });
        }
        else if (p.type === 'number') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onInput: (...[$event]) => {
                        if (!(__VLS_ctx.selected))
                            return;
                        if (!!(p.type === 'text'))
                            return;
                        if (!(p.type === 'number'))
                            return;
                        __VLS_ctx.emit('update-prop', p.key, Number($event.target.value));
                    } },
                ...{ class: "prop-input" },
                type: "number",
                value: (p.value),
            });
        }
        else if (p.type === 'color') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onInput: (...[$event]) => {
                        if (!(__VLS_ctx.selected))
                            return;
                        if (!!(p.type === 'text'))
                            return;
                        if (!!(p.type === 'number'))
                            return;
                        if (!(p.type === 'color'))
                            return;
                        __VLS_ctx.emit('update-prop', p.key, $event.target.value);
                    } },
                ...{ class: "prop-color" },
                type: "color",
                value: (p.value),
            });
        }
        else if (p.type === 'boolean') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "prop-toggle" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onChange: (...[$event]) => {
                        if (!(__VLS_ctx.selected))
                            return;
                        if (!!(p.type === 'text'))
                            return;
                        if (!!(p.type === 'number'))
                            return;
                        if (!!(p.type === 'color'))
                            return;
                        if (!(p.type === 'boolean'))
                            return;
                        __VLS_ctx.emit('update-prop', p.key, $event.target.checked);
                    } },
                type: "checkbox",
                checked: p.value,
            });
        }
        else if (p.type === 'select') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
                ...{ onChange: (...[$event]) => {
                        if (!(__VLS_ctx.selected))
                            return;
                        if (!!(p.type === 'text'))
                            return;
                        if (!!(p.type === 'number'))
                            return;
                        if (!!(p.type === 'color'))
                            return;
                        if (!!(p.type === 'boolean'))
                            return;
                        if (!(p.type === 'select'))
                            return;
                        __VLS_ctx.emit('update-prop', p.key, $event.target.value);
                    } },
                ...{ class: "prop-input" },
                value: (p.value),
            });
            for (const [opt] of __VLS_getVForSourceType((__VLS_ctx.getSelectOptions(p.key)))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
                    key: (opt),
                    value: (opt),
                });
                (opt);
            }
        }
        else if (p.key === 'menuItems' && Array.isArray(p.value)) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "menu-editor" },
            });
            for (const [item, idx] of __VLS_getVForSourceType(p.value)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: (idx),
                    ...{ class: "menu-item-row" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    ...{ onInput: (...[$event]) => {
                            if (!(__VLS_ctx.selected))
                                return;
                            if (!!(p.type === 'text'))
                                return;
                            if (!!(p.type === 'number'))
                                return;
                            if (!!(p.type === 'color'))
                                return;
                            if (!!(p.type === 'boolean'))
                                return;
                            if (!!(p.type === 'select'))
                                return;
                            if (!(p.key === 'menuItems' && Array.isArray(p.value)))
                                return;
                            __VLS_ctx.updateMenuItem(idx, 'icon', $event.target.value);
                        } },
                    ...{ class: "prop-input menu-input" },
                    value: (item.icon),
                    ...{ style: {} },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    ...{ onInput: (...[$event]) => {
                            if (!(__VLS_ctx.selected))
                                return;
                            if (!!(p.type === 'text'))
                                return;
                            if (!!(p.type === 'number'))
                                return;
                            if (!!(p.type === 'color'))
                                return;
                            if (!!(p.type === 'boolean'))
                                return;
                            if (!!(p.type === 'select'))
                                return;
                            if (!(p.key === 'menuItems' && Array.isArray(p.value)))
                                return;
                            __VLS_ctx.updateMenuItem(idx, 'text', $event.target.value);
                        } },
                    ...{ class: "prop-input menu-input" },
                    value: (item.text),
                    placeholder: "Name",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    ...{ onInput: (...[$event]) => {
                            if (!(__VLS_ctx.selected))
                                return;
                            if (!!(p.type === 'text'))
                                return;
                            if (!!(p.type === 'number'))
                                return;
                            if (!!(p.type === 'color'))
                                return;
                            if (!!(p.type === 'boolean'))
                                return;
                            if (!!(p.type === 'select'))
                                return;
                            if (!(p.key === 'menuItems' && Array.isArray(p.value)))
                                return;
                            __VLS_ctx.updateMenuItem(idx, 'link', $event.target.value);
                        } },
                    ...{ class: "prop-input menu-input" },
                    value: (item.link),
                    placeholder: "Link",
                    ...{ style: {} },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.selected))
                                return;
                            if (!!(p.type === 'text'))
                                return;
                            if (!!(p.type === 'number'))
                                return;
                            if (!!(p.type === 'color'))
                                return;
                            if (!!(p.type === 'boolean'))
                                return;
                            if (!!(p.type === 'select'))
                                return;
                            if (!(p.key === 'menuItems' && Array.isArray(p.value)))
                                return;
                            __VLS_ctx.removeMenuItem(idx);
                        } },
                    ...{ class: "css-remove" },
                });
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.addMenuItem) },
                ...{ class: "css-add-btn" },
                ...{ style: {} },
            });
        }
        else if (p.type === 'array') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "prop-muted" },
            });
            (p.value.join(', '));
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-subtitle" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
        ...{ onInput: (...[$event]) => {
                if (!(__VLS_ctx.selected))
                    return;
                __VLS_ctx.emit('update-spec', $event.target.value);
            } },
        ...{ class: "spec-textarea" },
        value: (__VLS_ctx.selected.props.specDescription || ''),
        placeholder: "Role/function of this component...",
        rows: "4",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-subtitle" },
    });
    for (const [cssProp] of __VLS_getVForSourceType((__VLS_ctx.activeCssProps))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (cssProp),
            ...{ class: "prop-row css-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "prop-label" },
        });
        (cssProp);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "css-input-wrap" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onInput: (...[$event]) => {
                    if (!(__VLS_ctx.selected))
                        return;
                    __VLS_ctx.setCssProp(cssProp, $event.target.value);
                } },
            ...{ class: "prop-input css-val" },
            value: (__VLS_ctx.getCssProp(cssProp)),
            type: (cssProp.includes('color') || cssProp.includes('Color') ? 'color' : 'text'),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.selected))
                        return;
                    __VLS_ctx.removeCssProp(cssProp);
                } },
            ...{ class: "css-remove" },
            title: "Remove",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "css-add-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.addCssPropKey),
        ...{ class: "prop-input css-select" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "",
    });
    for (const [k] of __VLS_getVForSourceType((__VLS_ctx.availableCssProps))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
            key: (k),
            value: (k),
        });
        (k);
    }
    if (__VLS_ctx.addCssPropKey) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.addCssProp) },
            ...{ class: "css-add-btn" },
        });
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-section" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "prop-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "prop-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onInput: (...[$event]) => {
                if (!!(__VLS_ctx.selected))
                    return;
                __VLS_ctx.emit('update-page-title', $event.target.value);
            } },
        ...{ class: "prop-input" },
        value: (__VLS_ctx.pageTitle),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "prop-row" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "prop-label" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea)({
        ...{ onInput: (...[$event]) => {
                if (!!(__VLS_ctx.selected))
                    return;
                __VLS_ctx.emit('update-page-desc', $event.target.value);
            } },
        ...{ class: "spec-textarea" },
        value: (__VLS_ctx.pageDescription),
        rows: "4",
        placeholder: "Overall page description...",
    });
}
/** @type {__VLS_StyleScopedClasses['prop-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-section']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-row']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-label']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-input']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-input']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-color']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-input']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-editor']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-item-row']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-input']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-input']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-input']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-input']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-input']} */ ;
/** @type {__VLS_StyleScopedClasses['menu-input']} */ ;
/** @type {__VLS_StyleScopedClasses['css-remove']} */ ;
/** @type {__VLS_StyleScopedClasses['css-add-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-section']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-textarea']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-section']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-row']} */ ;
/** @type {__VLS_StyleScopedClasses['css-row']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-label']} */ ;
/** @type {__VLS_StyleScopedClasses['css-input-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-input']} */ ;
/** @type {__VLS_StyleScopedClasses['css-val']} */ ;
/** @type {__VLS_StyleScopedClasses['css-remove']} */ ;
/** @type {__VLS_StyleScopedClasses['css-add-row']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-input']} */ ;
/** @type {__VLS_StyleScopedClasses['css-select']} */ ;
/** @type {__VLS_StyleScopedClasses['css-add-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-section']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-title']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-row']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-label']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-input']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-row']} */ ;
/** @type {__VLS_StyleScopedClasses['prop-label']} */ ;
/** @type {__VLS_StyleScopedClasses['spec-textarea']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            emit: emit,
            activeCssProps: activeCssProps,
            availableCssProps: availableCssProps,
            addCssPropKey: addCssPropKey,
            addCssProp: addCssProp,
            removeCssProp: removeCssProp,
            getCssProp: getCssProp,
            setCssProp: setCssProp,
            updateMenuItem: updateMenuItem,
            removeMenuItem: removeMenuItem,
            addMenuItem: addMenuItem,
            compDef: compDef,
            editableProps: editableProps,
            getSelectOptions: getSelectOptions,
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
