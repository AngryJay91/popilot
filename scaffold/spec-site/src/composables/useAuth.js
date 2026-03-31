/**
 * Auth composable — Token-based authentication for spec-site.
 *
 * Supports:
 * - URL token parameter (?token=...) with auto-cleanup
 * - localStorage persistence
 * - API verification with offline fallback
 *
 * In static mode, auth is disabled (always authenticated).
 */
import { ref, readonly } from 'vue';
import { isStaticMode } from '@/api/client';
import { useUser } from './useUser';
const AUTH_STORAGE_KEY = 'spec-auth-token';
const AUTH_USER_KEY = 'spec-auth-user';
const isAuthenticated = ref(false);
const authUser = ref(null);
const authLoading = ref(false);
const _token = ref(null);
// Static mode: always authenticated
if (isStaticMode()) {
    isAuthenticated.value = true;
    authUser.value = 'local';
}
else {
    // Restore from localStorage
    const savedToken = localStorage.getItem(AUTH_STORAGE_KEY);
    const savedUser = localStorage.getItem(AUTH_USER_KEY);
    if (savedToken && savedUser) {
        _token.value = savedToken;
        authUser.value = savedUser;
        isAuthenticated.value = true;
        const { setUser } = useUser();
        setUser(savedUser);
    }
}
async function verifyToken(token) {
    if (isStaticMode())
        return 'local';
    const apiUrl = import.meta.env.VITE_API_URL;
    const savedToken = localStorage.getItem(AUTH_STORAGE_KEY);
    const savedUser = localStorage.getItem(AUTH_USER_KEY);
    try {
        const resp = await fetch(`${apiUrl}/api/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            signal: AbortSignal.timeout(5000),
        });
        if (resp.ok) {
            const data = await resp.json();
            if (data.userName)
                return String(data.userName);
        }
    }
    catch {
        // API unreachable — use cached auth
        if (savedToken === token && savedUser) {
            return savedUser;
        }
    }
    return null;
}
async function login(token) {
    authLoading.value = true;
    try {
        const userName = await verifyToken(token);
        if (!userName)
            return false;
        _token.value = token;
        authUser.value = userName;
        isAuthenticated.value = true;
        localStorage.setItem(AUTH_STORAGE_KEY, token);
        localStorage.setItem(AUTH_USER_KEY, userName);
        const { setUser } = useUser();
        setUser(userName);
        // Log activity (non-critical)
        try {
            const { apiPost } = await import('@/api/client');
            await apiPost('/api/v2/user/activity', { userName });
        }
        catch { /* non-critical */ }
        return true;
    }
    finally {
        authLoading.value = false;
    }
}
function logout() {
    _token.value = null;
    authUser.value = null;
    isAuthenticated.value = false;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    const { clearUser } = useUser();
    clearUser();
}
async function tryAutoLogin() {
    if (isStaticMode())
        return true;
    // 1) URL token parameter
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
        // Remove token from URL (security: prevent referrer/history exposure)
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('token');
        window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
        return await login(urlToken);
    }
    // 2) localStorage token
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
        return await login(stored);
    }
    return false;
}
export function useAuth() {
    return {
        isAuthenticated: readonly(isAuthenticated),
        authUser: readonly(authUser),
        authLoading: readonly(authLoading),
        login,
        logout,
        tryAutoLogin,
    };
}
