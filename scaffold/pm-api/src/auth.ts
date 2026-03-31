import type { Context, Next } from 'hono'
import type { AppEnv } from './types.js'
import { query } from './db/adapter.js'
import { hashToken } from './utils/hash.js'

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401)
  }

  const rawToken = header.slice(7)
  const hashedToken = await hashToken(rawToken)

  // Support both hashed (new) and plaintext (legacy) tokens during migration period.
  // First try token_hash match, then fall back to plaintext token match.
  const result = await query<{ user_name: string }>(
    `SELECT user_name FROM auth_tokens
     WHERE (token_hash = ? OR token = ?) AND is_active = 1
     AND (expires_at IS NULL OR expires_at > datetime('now'))`,
    [hashedToken, rawToken],
  )

  if (result.error) {
    return c.json({ error: 'Auth verification failed' }, 500)
  }
  if (result.rows.length === 0) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  c.set('userName', result.rows[0].user_name)
  await next()
}
