import { query } from '../db/adapter.js'

export async function isAdmin(userName: string): Promise<boolean> {
  const result = await query<{ role: string }>(
    "SELECT role FROM members WHERE display_name = ? AND is_active = 1",
    [userName],
  )
  return result.rows[0]?.role === 'admin'
}
