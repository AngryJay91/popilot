/**
 * Generic REST API client for spec-site.
 *
 * Provider-agnostic: works with any backend that implements the spec-site
 * API contract (Turso+CF Workers, Supabase, Lambda+RDS, etc.).
 *
 * In static mode (VITE_SPEC_MODE=static), API calls gracefully degrade
 * and composables fall back to local data sources.
 */
const apiUrl = import.meta.env.VITE_API_URL;
const specMode = import.meta.env.VITE_SPEC_MODE || 'static';
let _reachable = null;
export function isApiMode() {
    return specMode === 'api' && !!apiUrl;
}
export function isStaticMode() {
    return !isApiMode();
}
function getAuthHeader() {
    const token = localStorage.getItem('spec-auth-token');
    if (!token)
        return {};
    return { Authorization: `Bearer ${token}` };
}
export async function apiGet(endpoint, params) {
    if (!apiUrl)
        return { error: 'Missing API URL' };
    if (_reachable === false)
        return { error: 'API unreachable' };
    try {
        let url = `${apiUrl}${endpoint}`;
        if (params) {
            const qs = new URLSearchParams(params).toString();
            if (qs)
                url += `?${qs}`;
        }
        const resp = await fetch(url, {
            headers: { ...getAuthHeader() },
            signal: AbortSignal.timeout(5000),
        });
        if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            if (resp.status !== 401 && resp.status !== 403 && _reachable === null)
                _reachable = false;
            return { error: `HTTP ${resp.status}: ${text}` };
        }
        _reachable = true;
        const data = await resp.json();
        if (data.error)
            return { error: data.error };
        return { data };
    }
    catch (err) {
        if (_reachable === null) {
            _reachable = false;
            console.warn('[api] API unreachable, using offline mode');
        }
        return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
}
export function resetReachable() {
    _reachable = null;
}
export async function apiPost(endpoint, body) {
    return apiMutate('POST', endpoint, body);
}
export async function apiPatch(endpoint, body) {
    return apiMutate('PATCH', endpoint, body);
}
export async function apiPut(endpoint, body) {
    return apiMutate('PUT', endpoint, body);
}
export async function apiDelete(endpoint, body) {
    return apiMutate('DELETE', endpoint, body);
}
async function apiMutate(method, endpoint, body) {
    if (!apiUrl)
        return { error: 'Missing API URL' };
    if (_reachable === false)
        return { error: 'API unreachable' };
    try {
        const resp = await fetch(`${apiUrl}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(5000),
        });
        if (!resp.ok) {
            const text = await resp.text().catch(() => '');
            if (resp.status !== 401 && resp.status !== 403 && _reachable === null)
                _reachable = false;
            return { error: `HTTP ${resp.status}: ${text}` };
        }
        _reachable = true;
        const data = await resp.json();
        if (data.error)
            return { error: data.error };
        return { data };
    }
    catch (err) {
        if (_reachable === null) {
            _reachable = false;
            console.warn('[api] API unreachable, using offline mode');
        }
        return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
}
