import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { query } from '../db/adapter.js'

const app = new Hono<AppEnv>()

// POST /api/auth/verify — public (no auth middleware)
app.post('/verify', async (c) => {
  const body = await c.req.json<{ token?: string }>().catch(() => ({} as { token?: string }))
  const token = body.token
  if (!token) {
    return c.json({ error: 'Missing token' }, 400)
  }

  const result = await query<{ user_name: string }>(
    `SELECT user_name FROM auth_tokens
     WHERE token = ? AND is_active = 1
     AND (expires_at IS NULL OR expires_at > datetime('now'))`,
    [token],
  )

  if (result.error) {
    return c.json({ error: 'Verification failed' }, 500)
  }
  if (result.rows.length === 0) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  return c.json({ userName: result.rows[0].user_name })
})

export default app
