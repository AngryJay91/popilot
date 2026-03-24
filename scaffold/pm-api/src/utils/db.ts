import { query, execute, type ArgValue } from '../db/adapter.js'

export class DbError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DbError'
  }
}

export async function queryOrThrow<T = Record<string, unknown>>(
  sql: string,
  args: ArgValue[] = [],
): Promise<{ rows: T[] }> {
  const result = await query<T>(sql, args)
  if (result.error) throw new DbError(result.error)
  return { rows: result.rows ?? [] }
}

export async function executeOrThrow(
  sql: string,
  args: ArgValue[] = [],
): Promise<{ rowsAffected: number }> {
  const result = await execute(sql, args)
  if (result.error) throw new DbError(result.error)
  return { rowsAffected: result.rowsAffected }
}

export function buildUpdateQuery(
  fieldMap: Record<string, string>,
  body: Record<string, unknown>,
): { sets: string[]; args: (string | number | null)[] } | null {
  const sets: string[] = []
  const args: (string | number | null)[] = []

  for (const [key, col] of Object.entries(fieldMap)) {
    if (body[key] !== undefined) {
      sets.push(`${col} = ?`)
      args.push(body[key] as string | number | null)
    }
  }

  if (sets.length === 0) return null
  sets.push('updated_at = CURRENT_TIMESTAMP')
  return { sets, args }
}
