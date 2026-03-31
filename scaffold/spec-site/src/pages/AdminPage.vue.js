import { ref, onMounted, computed } from 'vue';
import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from '@/api/client';
const members = ref([]);
const loading = ref(true);
const error = ref('');
// New member form
const newName = ref('');
const newEmail = ref('');
const newTtlDays = ref(null);
// Status message
const statusMsg = ref('');
// LLM settings
const llmApiKey = ref('');
const llmProvider = ref('openai');
const llmModel = ref('');
const settingsSaved = ref(false);
async function loadSettings() {
    const { data } = await apiGet('/api/v2/admin/settings');
    if (data?.settings) {
        llmApiKey.value = data.settings.llm_api_key ?? '';
        llmProvider.value = data.settings.llm_provider ?? 'openai';
        llmModel.value = data.settings.llm_model ?? '';
    }
}
async function saveSettings() {
    settingsSaved.value = false;
    await apiPut('/api/v2/admin/settings/llm_api_key', { value: llmApiKey.value || null });
    await apiPut('/api/v2/admin/settings/llm_provider', { value: llmProvider.value || null });
    await apiPut('/api/v2/admin/settings/llm_model', { value: llmModel.value || null });
    settingsSaved.value = true;
    setTimeout(() => { settingsSaved.value = false; }, 3000);
}
async function clearApiKey() {
    await apiPut('/api/v2/admin/settings/llm_api_key', { value: null });
    llmApiKey.value = '';
    settingsSaved.value = true;
    setTimeout(() => { settingsSaved.value = false; }, 3000);
}
loadSettings();
async function loadMembers() {
    loading.value = true;
    const { data, error: apiError } = await apiGet('/api/v2/admin/members');
    if (apiError) {
        error.value = apiError;
    }
    else if (data) {
        members.value = data.members;
    }
    loading.value = false;
}
function generateToken() {
    return crypto.randomUUID();
}
async function addMember() {
    const name = newName.value.trim();
    if (!name)
        return;
    const token = generateToken();
    const email = newEmail.value.trim() || null;
    const ttl = newTtlDays.value;
    const body = { token, userName: name, userEmail: email };
    if (ttl && Number.isInteger(ttl) && ttl > 0 && ttl <= 3650)
        body.ttlDays = ttl;
    const { error: apiError } = await apiPost('/api/v2/admin/members', body);
    if (apiError) {
        statusMsg.value = `Error: ${apiError}`;
    }
    else {
        statusMsg.value = `${name} added`;
        newName.value = '';
        newEmail.value = '';
        newTtlDays.value = null;
        await loadMembers();
    }
    clearStatus();
}
async function revokeToken(id, name) {
    if (!confirm(`Revoke token for ${name}?`))
        return;
    const { error: apiError } = await apiPatch(`/api/v2/admin/members/${id}/revoke`, {});
    if (!apiError) {
        statusMsg.value = `${name} token revoked`;
        await loadMembers();
    }
    clearStatus();
}
async function reactivateToken(id, name) {
    const { error: apiError } = await apiPatch(`/api/v2/admin/members/${id}/activate`, {});
    if (!apiError) {
        statusMsg.value = `${name} token reactivated`;
        await loadMembers();
    }
    clearStatus();
}
async function regenerateToken(oldToken, name) {
    if (!confirm(`Regenerate token for ${name}? The old token will be invalidated.`))
        return;
    const newToken = generateToken();
    const { error: apiError } = await apiPost(`/api/v2/admin/members/${oldToken}/regenerate`, { newToken });
    if (!apiError) {
        statusMsg.value = `${name} token regenerated`;
        await loadMembers();
    }
    clearStatus();
}
async function deleteMember(id, name) {
    if (!confirm(`Permanently delete ${name}? This cannot be undone.`))
        return;
    const { error: apiError } = await apiDelete(`/api/v2/admin/members/${id}`);
    if (!apiError) {
        statusMsg.value = `${name} deleted`;
        await loadMembers();
    }
    clearStatus();
}
function clearStatus() {
    setTimeout(() => { statusMsg.value = ''; }, 3000);
}
function formatDate(d) {
    if (!d)
        return '-';
    return d.replace('T', ' ').substring(0, 16);
}
const activeCount = computed(() => members.value.filter(m => m.is_active).length);
const totalCount = computed(() => members.value.length);
onMounted(loadMembers);
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['admin-header']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-error']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-section']} */ ;
/** @type {__VLS_StyleScopedClasses['setting-row']} */ ;
/** @type {__VLS_StyleScopedClasses['admin']} */ ;
/** @type {__VLS_StyleScopedClasses['add-form']} */ ;
/** @type {__VLS_StyleScopedClasses['td-actions']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-header-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "admin-subtitle" },
});
const __VLS_0 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    name: "fade",
}));
const __VLS_2 = __VLS_1({
    name: "fade",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
if (__VLS_ctx.statusMsg) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-status" },
    });
    (__VLS_ctx.statusMsg);
}
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-stats" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "stat-num" },
});
(__VLS_ctx.activeCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "stat-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stat" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "stat-num" },
});
(__VLS_ctx.totalCount);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "stat-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "add-form" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ class: "input" },
    placeholder: "Name",
});
(__VLS_ctx.newName);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ class: "input" },
    placeholder: "Email (optional)",
});
(__VLS_ctx.newEmail);
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ class: "input input--sm" },
    type: "number",
    placeholder: "TTL (days)",
    min: "1",
});
(__VLS_ctx.newTtlDays);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.addMember) },
    ...{ class: "btn btn--primary" },
    disabled: (!__VLS_ctx.newName.trim()),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "add-hint" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-loading" },
    });
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "admin-error" },
    });
    (__VLS_ctx.error);
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "table-wrap" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
    for (const [m] of __VLS_getVForSourceType((__VLS_ctx.members))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
            key: (String(m.id)),
            ...{ class: ({ inactive: !m.is_active }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "badge" },
            ...{ class: (m.is_active ? 'badge--active' : 'badge--revoked') },
        });
        (m.is_active ? 'active' : 'revoked');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "td-name" },
        });
        (m.display_name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "td-email" },
        });
        (m.email || '-');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
        (m.role);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "td-date" },
        });
        (__VLS_ctx.formatDate(m.created_at));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
            ...{ class: "td-actions" },
        });
        if (m.is_active) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(m.is_active))
                            return;
                        __VLS_ctx.revokeToken(String(m.id), m.display_name);
                    } },
                ...{ class: "btn btn--sm btn--warn" },
            });
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!!(m.is_active))
                            return;
                        __VLS_ctx.reactivateToken(String(m.id), m.display_name);
                    } },
                ...{ class: "btn btn--sm btn--ok" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    __VLS_ctx.regenerateToken(String(m.id), m.display_name);
                } },
            ...{ class: "btn btn--sm" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    __VLS_ctx.deleteMember(String(m.id), m.display_name);
                } },
            ...{ class: "btn btn--sm btn--danger" },
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "admin-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "setting-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "password",
    ...{ class: "setting-input" },
    placeholder: "sk-...",
});
(__VLS_ctx.llmApiKey);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "setting-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.llmProvider),
    ...{ class: "setting-input" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "openai",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "anthropic",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
    value: "gemini",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "setting-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ class: "setting-input" },
    placeholder: "gpt-4o-mini",
});
(__VLS_ctx.llmModel);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "setting-actions" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.saveSettings) },
    ...{ class: "btn btn--primary" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.clearApiKey) },
    ...{ class: "btn btn--danger" },
});
if (__VLS_ctx.settingsSaved) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "save-ok" },
    });
}
/** @type {__VLS_StyleScopedClasses['admin']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-header']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-header-row']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-subtitle']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-status']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-stats']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-num']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['stat']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-num']} */ ;
/** @type {__VLS_StyleScopedClasses['stat-label']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
/** @type {__VLS_StyleScopedClasses['add-form']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input']} */ ;
/** @type {__VLS_StyleScopedClasses['input--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['add-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-card']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-loading']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-error']} */ ;
/** @type {__VLS_StyleScopedClasses['table-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['inactive']} */ ;
/** @type {__VLS_StyleScopedClasses['badge']} */ ;
/** @type {__VLS_StyleScopedClasses['td-name']} */ ;
/** @type {__VLS_StyleScopedClasses['td-email']} */ ;
/** @type {__VLS_StyleScopedClasses['td-date']} */ ;
/** @type {__VLS_StyleScopedClasses['td-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--warn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--ok']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--sm']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--danger']} */ ;
/** @type {__VLS_StyleScopedClasses['admin-section']} */ ;
/** @type {__VLS_StyleScopedClasses['setting-row']} */ ;
/** @type {__VLS_StyleScopedClasses['setting-input']} */ ;
/** @type {__VLS_StyleScopedClasses['setting-row']} */ ;
/** @type {__VLS_StyleScopedClasses['setting-input']} */ ;
/** @type {__VLS_StyleScopedClasses['setting-row']} */ ;
/** @type {__VLS_StyleScopedClasses['setting-input']} */ ;
/** @type {__VLS_StyleScopedClasses['setting-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--primary']} */ ;
/** @type {__VLS_StyleScopedClasses['btn']} */ ;
/** @type {__VLS_StyleScopedClasses['btn--danger']} */ ;
/** @type {__VLS_StyleScopedClasses['save-ok']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            members: members,
            loading: loading,
            error: error,
            newName: newName,
            newEmail: newEmail,
            newTtlDays: newTtlDays,
            statusMsg: statusMsg,
            llmApiKey: llmApiKey,
            llmProvider: llmProvider,
            llmModel: llmModel,
            settingsSaved: settingsSaved,
            saveSettings: saveSettings,
            clearApiKey: clearApiKey,
            addMember: addMember,
            revokeToken: revokeToken,
            reactivateToken: reactivateToken,
            regenerateToken: regenerateToken,
            deleteMember: deleteMember,
            formatDate: formatDate,
            activeCount: activeCount,
            totalCount: totalCount,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
