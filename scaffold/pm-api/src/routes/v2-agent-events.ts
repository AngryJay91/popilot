import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { query, execute } from '../db/adapter.js'

const app = new Hono<AppEnv>()

// POST / — emit event
app.post('/', async (c) => {
  const user = c.get('userName')
  const body = await c.req.json<{
    event_type: string
    target_agent: string
    target_user: string
    payload: string
    ttl_hours?: number
    source_agent?: string
  }>()

  const HOOK_ONLY_TYPES = ['memo_assigned', 'memo_replied', 'memo_resolved']
  if (HOOK_ONLY_TYPES.includes(body.event_type)) {
    return c.json({ error: 'Memo-related events are emitted automatically. Cannot emit directly.' }, 400)
  }

  try { JSON.parse(body.payload) } catch {
    return c.json({ error: 'Payload is not valid JSON.' }, 400)
  }

  const ttlHours = body.ttl_hours ?? 24
  const sourceAgent = body.source_agent ?? user
  const expiresAt = new Date(Date.now() + ttlHours * 3600_000).toISOString()

  await execute(
    `INSERT INTO agent_events (event_type, source_agent, target_agent, target_user, payload, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [body.event_type, sourceAgent, body.target_agent, body.target_user, body.payload, expiresAt],
  )

  const idResult = await query<{ id: number }>('SELECT last_insert_rowid() as id')
  const newId = idResult.rows[0]?.id ?? 0

  return c.json({ ok: true, id: newId, ttl_hours: ttlHours })
})

// GET / — poll events
app.get('/', async (c) => {
  const user = c.get('userName')
  const eventType = c.req.query('event_type')
  const limit = Number(c.req.query('limit') || '20')

  let sql = `SELECT id, event_type, source_agent, target_agent, payload, status, created_at
             FROM agent_events
             WHERE target_user = ? AND status = 'pending'
               AND (expires_at IS NULL OR expires_at > datetime('now'))`
  const sqlArgs: (string | number)[] = [user]

  if (eventType) {
    sql += ' AND event_type = ?'
    sqlArgs.push(eventType)
  }

  sql += ' ORDER BY created_at DESC LIMIT ?'
  sqlArgs.push(limit)

  const result = await query<{
    id: number; event_type: string; source_agent: string; target_agent: string
    payload: string; status: string; created_at: string
  }>(sql, sqlArgs)

  return c.json({ events: result.rows })
})

// PATCH /:id/ack — acknowledge event
app.patch('/:id/ack', async (c) => {
  const user = c.get('userName')
  const eventId = Number(c.req.param('id'))

  const result = await execute(
    `UPDATE agent_events SET status = 'acked', acked_at = datetime('now')
     WHERE id = ? AND status IN ('pending', 'delivered') AND target_user = ?`,
    [eventId, user],
  )

  if (result.rowsAffected === 0) {
    return c.json({ error: `Event #${eventId} not found or already acknowledged.` }, 404)
  }

  return c.json({ ok: true, event_id: eventId })
})

export default app
