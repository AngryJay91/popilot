// PM API HTTP client
// All MCP tools use this client to communicate with the PM API server.
// Required env vars: PM_API_URL, PM_TOKEN

const PM_API_URL = process.env.PM_API_URL ?? ''
const PM_TOKEN = process.env.PM_TOKEN ?? ''

interface ApiResult<T> {
  data: T | null
  error?: string
}

async function request<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
  if (!PM_API_URL || !PM_TOKEN) {
    return { data: null, error: 'Missing PM_API_URL or PM_TOKEN' }
  }

  try {
    const resp = await fetch(`${PM_API_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${PM_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    })

    const data = await resp.json()

    if (!resp.ok) {
      return { data: null, error: data.error ?? `HTTP ${resp.status}` }
    }

    return { data: data as T }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { data: null, error: message }
  }
}

export function apiGet<T>(path: string, params?: Record<string, string>): Promise<ApiResult<T>> {
  let url = path
  if (params) {
    const search = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v) search.set(k, v)
    }
    const qs = search.toString()
    if (qs) url += '?' + qs
  }
  return request<T>('GET', url)
}

export function apiPost<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  return request<T>('POST', path, body)
}

export function apiPatch<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  return request<T>('PATCH', path, body)
}

export function apiPut<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  return request<T>('PUT', path, body)
}

export function apiDelete<T>(path: string): Promise<ApiResult<T>> {
  return request<T>('DELETE', path)
}
