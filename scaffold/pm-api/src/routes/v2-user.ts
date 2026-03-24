import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { query, execute } from '../db/adapter.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'

const app = new Hono<AppEnv>()

// GET /members — members table based (no duplicates)
app.get('/members', async (c) => {
  const { rows } = await queryOrThrow(
    'SELECT display_name FROM members WHERE is_active = 1 ORDER BY display_name',
  )
  return c.json({ members: rows.map((r: Record<string, unknown>) => String(r.display_name)) })
})

// POST /activity
app.post('/activity', async (c) => {
  const body = await c.req.json<{ userName: string }>()
  const { rowsAffected } = await executeOrThrow(
    `INSERT INTO user_activity (user_name, last_seen_at) VALUES (?, CURRENT_TIMESTAMP)
     ON CONFLICT (user_name) DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP`,
    [body.userName],
  )
  return c.json({ ok: true })
})

// POST /memo-seen
app.post('/memo-seen', async (c) => {
  const body = await c.req.json<{ userName: string }>()
  const { rowsAffected } = await executeOrThrow(
    `INSERT INTO user_activity (user_name, last_memo_seen) VALUES (?, CURRENT_TIMESTAMP)
     ON CONFLICT (user_name) DO UPDATE SET last_memo_seen = CURRENT_TIMESTAMP`,
    [body.userName],
  )
  return c.json({ ok: true })
})

export default app
