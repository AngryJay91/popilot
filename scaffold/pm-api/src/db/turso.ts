/**
 * Turso HTTP API v2 (/v2/pipeline) adapter
 * Workers environment: setTursoEnv() injects bindings per request
 */

import type { DbAdapter, ArgValue } from './adapter.js'

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

export class TursoAdapter implements DbAdapter {
  private url: string
  private token: string

  constructor(url: string, token: string) {
    this.url = url
    this.token = token
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    args: ArgValue[] = [],
  ): Promise<{ rows: T[]; error?: string }> {
    if (!this.url || !this.token) {
      return { rows: [], error: 'Missing TURSO_URL or TURSO_AUTH_TOKEN' }
    }

    try {
      const resp = await fetch(this.url + '/v2/pipeline', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + this.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            { type: 'execute', stmt: { sql, args: args.map(toHranaArg) } },
            { type: 'close' },
          ],
        }),
      })

      if (!resp.ok) {
        const text = await resp.text().catch(() => '')
        return { rows: [], error: `HTTP ${resp.status}: ${text}` }
      }

      const data: PipelineResult = await resp.json()
      const first = data.results[0]

      if (first.type === 'error') {
        return { rows: [], error: first.error?.message ?? 'Unknown error' }
      }

      const result = first.response?.result
      if (!result) return { rows: [] }

      const colNames = result.cols.map(c => c.name)
      const rows = result.rows.map(row => {
        const obj: Record<string, unknown> = {}
        colNames.forEach((col, i) => {
          const cell = row[i]
          if (cell.type === 'null') obj[col] = null
          else if (cell.type === 'integer') obj[col] = Number(cell.value)
          else if (cell.type === 'float') obj[col] = Number(cell.value)
          else obj[col] = cell.value
        })
        return obj as T
      })

      return { rows }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { rows: [], error: message }
    }
  }

  async execute(
    sql: string,
    args: ArgValue[] = [],
  ): Promise<{ rowsAffected: number; error?: string }> {
    if (!this.url || !this.token) {
      return { rowsAffected: 0, error: 'Missing TURSO_URL or TURSO_AUTH_TOKEN' }
    }

    try {
      const resp = await fetch(this.url + '/v2/pipeline', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + this.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            { type: 'execute', stmt: { sql, args: args.map(toHranaArg) } },
            { type: 'close' },
          ],
        }),
      })

      if (!resp.ok) {
        const text = await resp.text().catch(() => '')
        return { rowsAffected: 0, error: `HTTP ${resp.status}: ${text}` }
      }

      const data: PipelineResult = await resp.json()
      const first = data.results[0]

      if (first.type === 'error') {
        return { rowsAffected: 0, error: first.error?.message ?? 'Unknown error' }
      }

      return { rowsAffected: first.response?.result?.affected_row_count ?? 0 }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { rowsAffected: 0, error: message }
    }
  }
}
