import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { query, execute } from '../db/adapter.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'

const app = new Hono<AppEnv>()

// GET /session
app.get('/session', async (c) => {
  const sprint = c.req.query('sprint')
  if (!sprint) return c.json({ error: 'sprint query param required' }, 400)

  const { rows } = await queryOrThrow(
    'SELECT * FROM retro_sessions WHERE sprint = ? LIMIT 1',
    [sprint],
  )
  return c.json({ session: rows[0] ?? null })
})

// POST /session
app.post('/session', async (c) => {
  const body = await c.req.json<{ sprint: string; title: string }>()
  const insertResult = await executeOrThrow(
    'INSERT INTO retro_sessions (sprint, title) VALUES (?, ?)',
    [body.sprint, body.title],
  )

  const { rows } = await queryOrThrow(
    'SELECT * FROM retro_sessions WHERE sprint = ? LIMIT 1',
    [body.sprint],
  )
  return c.json({ session: rows[0] ?? null })
})

// PATCH /session/:id/phase
app.patch('/session/:id/phase', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<{ phase: string }>()
  const { rowsAffected } = await executeOrThrow(
    'UPDATE retro_sessions SET phase = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [body.phase, id],
  )
  return c.json({ ok: true })
})

// GET /items
app.get('/items', async (c) => {
  const sessionId = c.req.query('sessionId')
  const user = c.req.query('user')
  if (!sessionId) return c.json({ error: 'sessionId query param required' }, 400)

  const { rows } = await queryOrThrow(
    `SELECT i.*, COUNT(v.item_id) as vote_count,
       CASE WHEN SUM(CASE WHEN v.voter = ? THEN 1 ELSE 0 END) > 0 THEN 1 ELSE 0 END as has_voted
     FROM retro_items i
     LEFT JOIN retro_votes v ON v.item_id = i.id
     WHERE i.session_id = ?
     GROUP BY i.id`,
    [user ?? '', Number(sessionId)],
  )
  const mapped = rows.map((r: Record<string, unknown>) => ({
    ...r,
    voteCount: Number(r.vote_count ?? 0),
    hasVoted: Number(r.has_voted ?? 0),
  }))
  return c.json({ items: mapped })
})

// POST /items
app.post('/items', async (c) => {
  const body = await c.req.json<{
    sessionId: number; category: string; content: string; author: string
  }>()
  const { rowsAffected } = await executeOrThrow(
    'INSERT INTO retro_items (session_id, category, content, author) VALUES (?, ?, ?, ?)',
    [body.sessionId, body.category, body.content, body.author],
  )
  return c.json({ ok: true })
})

// DELETE /items/:id
app.delete('/items/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const r1 = await executeOrThrow('DELETE FROM retro_votes WHERE item_id = ?', [id])
  const r2 = await executeOrThrow('DELETE FROM retro_items WHERE id = ?', [id])
  return c.json({ ok: true })
})

// POST /items/:id/vote
app.post('/items/:id/vote', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<{ voter: string; hasVoted: boolean }>()

  if (body.hasVoted) {
    const { rowsAffected } = await executeOrThrow(
      'DELETE FROM retro_votes WHERE item_id = ? AND voter = ?',
      [id, body.voter],
    )
  } else {
    const { rowsAffected } = await executeOrThrow(
      'INSERT OR IGNORE INTO retro_votes (item_id, voter) VALUES (?, ?)',
      [id, body.voter],
    )
  }
  return c.json({ ok: true })
})

// GET /actions
app.get('/actions', async (c) => {
  const sessionId = c.req.query('sessionId')
  if (!sessionId) return c.json({ error: 'sessionId query param required' }, 400)

  const { rows } = await queryOrThrow(
    'SELECT * FROM retro_actions WHERE session_id = ? ORDER BY created_at ASC',
    [Number(sessionId)],
  )
  return c.json({ actions: rows })
})

// POST /actions
app.post('/actions', async (c) => {
  const body = await c.req.json<{
    sessionId: number; content: string; assignee?: string
  }>()
  const { rowsAffected } = await executeOrThrow(
    'INSERT INTO retro_actions (session_id, content, assignee) VALUES (?, ?, ?)',
    [body.sessionId, body.content, body.assignee ?? null],
  )
  return c.json({ ok: true })
})

// PATCH /actions/:id/status
app.patch('/actions/:id/status', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<{ status: string }>()
  const { rowsAffected } = await executeOrThrow(
    'UPDATE retro_actions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [body.status, id],
  )
  return c.json({ ok: true })
})

// DELETE /session/:id — cascade delete
app.delete('/session/:id', async (c) => {
  const id = Number(c.req.param('id'))

  // Delete votes via subquery
  const r1 = await executeOrThrow(
    'DELETE FROM retro_votes WHERE item_id IN (SELECT id FROM retro_items WHERE session_id = ?)',
    [id],
  )

  const r2 = await executeOrThrow('DELETE FROM retro_actions WHERE session_id = ?', [id])

  const r3 = await executeOrThrow('DELETE FROM retro_items WHERE session_id = ?', [id])

  const r4 = await executeOrThrow('DELETE FROM retro_sessions WHERE id = ?', [id])

  return c.json({ ok: true })
})

// POST /:sprint/complete — retro complete + action items -> backlog stories
app.post('/:sprint/complete', async (c) => {
  const sprintId = c.req.param('sprint')

  // 1. Check retro session
  const { rows } = await queryOrThrow(
    'SELECT id, phase FROM retro_sessions WHERE sprint = ? LIMIT 1',
    [sprintId],
  )
  if (!rows.length) return c.json({ error: 'Retro session not found' }, 404)
  const sessionId = (rows[0] as { id: number }).id

  // 2. Get action items
  const { rows: actionRows } = await queryOrThrow<{ id: number; content: string; assignee: string | null; status: string }>(
    'SELECT id, content, assignee, status FROM retro_actions WHERE session_id = ?',
    [sessionId],
  )

  // 3. Incomplete actions -> backlog stories
  const { actionToStory, getPendingActions } = await import('../utils/retro-link.js')
  const pending = getPendingActions(actionRows)
  const created: Array<{ actionId: number; title: string }> = []

  for (const action of pending) {
    const story = actionToStory(action, sprintId)
    const r = await executeOrThrow(
      'INSERT INTO pm_stories (title, description, assignee, status, sprint, priority) VALUES (?, ?, ?, ?, ?, ?)',
      [story.title, story.description, story.assignee, 'backlog', null, 'medium'],
    )
     created.push({ actionId: action.id, title: story.title })
  }

  // 4. Set retro phase -> done
  await executeOrThrow(
    "UPDATE retro_sessions SET phase = 'done', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [sessionId],
  )

  return c.json({
    ok: true,
    sprintId,
    actionsProcessed: pending.length,
    storiesCreated: created,
  })
})

// GET /:sprint/actions — retro action items by sprint
app.get('/:sprint/actions', async (c) => {
  const sprint = c.req.param('sprint')
  const { rows: sessions } = await queryOrThrow('SELECT id FROM retro_sessions WHERE sprint = ? LIMIT 1', [sprint])
  if (!sessions.length) return c.json({ actions: [] })
  const sessionId = (sessions[0] as any).id
  const { rows } = await queryOrThrow(
    'SELECT * FROM retro_actions WHERE session_id = ? ORDER BY created_at ASC',
    [sessionId],
  )
  return c.json({ actions: rows })
})

export default app
