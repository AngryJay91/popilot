/**
 * Turso HTTP API v2 (/v2/pipeline) direct call
 * Uses raw fetch + /v2/pipeline for browser CORS compatibility
 */

const url = import.meta.env.VITE_TURSO_URL as string
const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN as string

let _reachable: boolean | null = null
let _lastFailureAt = 0
const RETRY_COOLDOWN_MS = 15_000

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[]
  error?: string
}

type ArgValue = string | number | null

interface HranaValue {
  type: 'text' | 'integer' | 'float' | 'null'
  value?: string
}

function toHranaArg(v: ArgValue): HranaValue {
  if (v === null) return { type: 'null' }
  if (typeof v === 'number') {
    return Number.isInteger(v)
      ? { type: 'integer', value: String(v) }
      : { type: 'float', value: String(v) }
  }
  return { type: 'text', value: String(v) }
}

interface PipelineResult {
  results: Array<{
    type: 'ok' | 'error'
    response?: {
      type: string
      result?: {
        cols: Array<{ name: string }>
        rows: Array<Array<HranaValue>>
        affected_row_count: number
        last_insert_rowid: string | null
      }
    }
    error?: { message: string }
  }>
}

async function pipeline(
  sql: string,
  args: ArgValue[],
): Promise<{
  cols: string[]
  rows: Array<Record<string, unknown>>
  affectedRowCount: number
  lastInsertRowid: number | null
  error?: string
}> {
  if (!url || !authToken) {
    return { cols: [], rows: [], affectedRowCount: 0, lastInsertRowid: null, error: 'Missing credentials' }
  }

  if (_reachable === false) {
    if (Date.now() - _lastFailureAt >= RETRY_COOLDOWN_MS) {
      _reachable = null
    } else {
      return { cols: [], rows: [], affectedRowCount: 0, lastInsertRowid: null, error: 'Turso unreachable' }
    }
  }

  try {
    const resp = await fetch(url + '/v2/pipeline', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + authToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql, args: args.map(toHranaArg) } },
          { type: 'close' },
        ],
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      _reachable = false
      _lastFailureAt = Date.now()
      return { cols: [], rows: [], affectedRowCount: 0, lastInsertRowid: null, error: `HTTP ${resp.status}: ${text}` }
    }

    _reachable = true
    const data: PipelineResult = await resp.json()
    const first = data.results[0]

    if (first.type === 'error') {
      return { cols: [], rows: [], affectedRowCount: 0, lastInsertRowid: null, error: first.error?.message ?? 'Unknown error' }
    }

    const result = first.response?.result
    if (!result) {
      return { cols: [], rows: [], affectedRowCount: 0, lastInsertRowid: null }
    }

    const colNames = result.cols.map((c) => c.name)
    const rows = result.rows.map((row) => {
      const obj: Record<string, unknown> = {}
      colNames.forEach((col, i) => {
        const cell = row[i]
        if (cell.type === 'null') obj[col] = null
        else if (cell.type === 'integer') obj[col] = Number(cell.value)
        else if (cell.type === 'float') obj[col] = Number(cell.value)
        else obj[col] = cell.value
      })
      return obj
    })

    return {
      cols: colNames,
      rows,
      affectedRowCount: result.affected_row_count,
      lastInsertRowid: result.last_insert_rowid ? Number(result.last_insert_rowid) : null,
    }
  } catch (err: unknown) {
    if (_reachable !== false) {
      console.warn('[useTurso] Turso unreachable, using offline mode')
    }
    _reachable = false
    _lastFailureAt = Date.now()
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { cols: [], rows: [], affectedRowCount: 0, lastInsertRowid: null, error: message }
  }
}

// -- Public API --

export async function query<T = Record<string, unknown>>(
  sql: string,
  args: ArgValue[] = [],
): Promise<QueryResult<T>> {
  const result = await pipeline(sql, args)
  if (result.error) return { rows: [], error: result.error }
  return { rows: result.rows as T[] }
}

export async function execute(
  sql: string,
  args: ArgValue[] = [],
): Promise<{ lastInsertRowid?: number | bigint; rowsAffected: number; error?: string }> {
  const result = await pipeline(sql, args)
  if (result.error) return { rowsAffected: 0, error: result.error }
  return {
    lastInsertRowid: result.lastInsertRowid ?? undefined,
    rowsAffected: result.affectedRowCount,
  }
}
