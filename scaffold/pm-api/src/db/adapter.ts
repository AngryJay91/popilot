/**
 * Database adapter interface — provider-agnostic query layer.
 * Implementations: TursoAdapter, (future: SupabaseAdapter, SqliteAdapter)
 */

export type ArgValue = string | number | null

export interface DbAdapter {
  query<T = Record<string, unknown>>(sql: string, args?: ArgValue[]): Promise<{ rows: T[]; error?: string }>
  execute(sql: string, args?: ArgValue[]): Promise<{ rowsAffected: number; error?: string }>
}

let _adapter: DbAdapter | null = null

export function setAdapter(adapter: DbAdapter) {
  _adapter = adapter
}

export function getAdapter(): DbAdapter {
  if (!_adapter) throw new Error('DB adapter not initialized. Call setAdapter() first.')
  return _adapter
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  args: ArgValue[] = [],
): Promise<{ rows: T[]; error?: string }> {
  return getAdapter().query<T>(sql, args)
}

export async function execute(
  sql: string,
  args: ArgValue[] = [],
): Promise<{ rowsAffected: number; error?: string }> {
  return getAdapter().execute(sql, args)
}
