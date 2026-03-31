import Icon from '@/components/Icon.vue';
import { ref, onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { loadNavData } from '@/composables/useNavStore';
const { isAuthenticated, authLoading, login, tryAutoLogin } = useAuth();
const tokenInput = ref('');
const loginError = ref(false);
const initializing = ref(true);
onMounted(async () => {
    const ok = await tryAutoLogin();
    if (ok)
        loadNavData();
    initializing.value = false;
});
async function handleLogin() {
    loginError.value = false;
    const ok = await login(tokenInput.value.trim());
    if (!ok) {
        loginError.value = true;
    }
    else {
        tokenInput.value = '';
        loadNavData();
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['auth-input']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-input']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
// CSS variable injection 
// CSS variable injection end 
if (__VLS_ctx.initializing) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "auth-init" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "auth-spinner" },
    });
}
else if (__VLS_ctx.isAuthenticated) {
    var __VLS_0 = {};
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "auth-page" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "auth-card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "auth-logo" },
    });
    /** @type {[typeof Icon, ]} */ ;
    // @ts-ignore
    const __VLS_2 = __VLS_asFunctionalComponent(Icon, new Icon({
        name: "sprint",
        size: (14),
    }));
    const __VLS_3 = __VLS_2({
        name: "sprint",
        size: (14),
    }, ...__VLS_functionalComponentArgsRest(__VLS_2));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
        ...{ class: "auth-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "auth-desc" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.br, __VLS_intrinsicElements.br)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "auth-form" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onKeydown: (__VLS_ctx.handleLogin) },
        value: (__VLS_ctx.tokenInput),
        type: "text",
        ...{ class: "auth-input" },
        placeholder: "Auth token",
        autocomplete: "off",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.handleLogin) },
        ...{ class: "auth-btn" },
        disabled: (__VLS_ctx.authLoading || !__VLS_ctx.tokenInput.trim()),
    });
    (__VLS_ctx.authLoading ? 'Verifying...' : 'Enter');
    if (__VLS_ctx.loginError) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "auth-error" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "auth-hint" },
    });
}
/** @type {__VLS_StyleScopedClasses['auth-init']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-spinner']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-page']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-card']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-logo']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-title']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-form']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-input']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-error']} */ ;
/** @type {__VLS_StyleScopedClasses['auth-hint']} */ ;
// @ts-ignore
var __VLS_1 = __VLS_0;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            Icon: Icon,
            isAuthenticated: isAuthenticated,
            authLoading: authLoading,
            tokenInput: tokenInput,
            loginError: loginError,
            initializing: initializing,
            handleLogin: handleLogin,
        };
    },
});
const __VLS_component = (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
export default {};
; /* PartiallyEnd: #4569/main.vue */
