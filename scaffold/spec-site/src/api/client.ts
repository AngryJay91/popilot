/**
 * Generic REST API client for spec-site.
 *
 * Provider-agnostic: works with any backend that implements the spec-site
 * API contract (Turso+CF Workers, Supabase, Lambda+RDS, etc.).
 *
 * In static mode (VITE_SPEC_MODE=static), API calls gracefully degrade
 * and composables fall back to local data sources.
 */

const apiUrl = import.meta.env.VITE_API_URL as string | undefined
const specMode = (import.meta.env.VITE_SPEC_MODE as string) || 'static'

let _reachable: boolean | null = null

export function isApiMode(): boolean {
  return specMode === 'api' && !!apiUrl
}

export function isStaticMode(): boolean {
  return !isApiMode()
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('spec-auth-token')
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export async function apiGet<T = Record<string, unknown>>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<{ data?: T; error?: string }> {
  if (!apiUrl) return { error: 'Missing API URL' }
  if (_reachable === false) return { error: 'API unreachable' }

  try {
    let url = `${apiUrl}${endpoint}`
    if (params) {
      const qs = new URLSearchParams(params).toString()
      if (qs) url += `?${qs}`
    }
    const resp = await fetch(url, {
      headers: { ...getAuthHeader() },
      signal: AbortSignal.timeout(5000),
    })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      if (resp.status !== 401 && resp.status !== 403 && _reachable === null) _reachable = false
      return { error: `HTTP ${resp.status}: ${text}` }
    }
    _reachable = true
    const data = await resp.json()
    if (data.error) return { error: data.error }
    return { data }
  } catch (err: unknown) {
    if (_reachable === null) {
      _reachable = false
      console.warn('[api] API unreachable, using offline mode')
    }
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export function resetReachable() {
  _reachable = null
}

export async function apiPost<T = Record<string, unknown>>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<{ data?: T; error?: string }> {
  return apiMutate<T>('POST', endpoint, body)
}

export async function apiPatch<T = Record<string, unknown>>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<{ data?: T; error?: string }> {
  return apiMutate<T>('PATCH', endpoint, body)
}

export async function apiPut<T = Record<string, unknown>>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<{ data?: T; error?: string }> {
  return apiMutate<T>('PUT', endpoint, body)
}

export async function apiDelete<T = Record<string, unknown>>(
  endpoint: string,
  body?: Record<string, unknown>,
): Promise<{ data?: T; error?: string }> {
  return apiMutate<T>('DELETE', endpoint, body)
}

async function apiMutate<T>(
  method: string,
  endpoint: string,
  body?: Record<string, unknown>,
): Promise<{ data?: T; error?: string }> {
  if (!apiUrl) return { error: 'Missing API URL' }
  if (_reachable === false) return { error: 'API unreachable' }

  try {
    const resp = await fetch(`${apiUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(5000),
    })
    if (!resp.ok) {
      if (resp.status !== 401 && resp.status !== 403 && _reachable === null) _reachable = false
      // Try to parse structured error body (e.g. 409 conflict payloads)
      const errorData = await resp.json().catch(() => null)
      return { error: `HTTP ${resp.status}`, data: errorData ?? undefined }
    }
    _reachable = true
    const data = await resp.json()
    if (data.error) return { error: data.error }
    return { data }
  } catch (err: unknown) {
    if (_reachable === null) {
      _reachable = false
      console.warn('[api] API unreachable, using offline mode')
    }
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
