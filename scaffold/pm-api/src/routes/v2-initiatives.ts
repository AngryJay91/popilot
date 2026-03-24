import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { query, execute } from '../db/adapter.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'
import { canTransition, validateCreate, type InitiativeStatus } from '../utils/initiative.js'

const app = new Hono<AppEnv>()

// GET / — initiative list
app.get('/', async (c) => {
  const status = c.req.query('status')
  const limit = Number(c.req.query('limit') ?? '50')

  let sql = 'SELECT * FROM initiatives'
  const args: (string | number)[] = []
  if (status) {
    sql += ' WHERE status = ?'
    args.push(status)
  }
  sql += ' ORDER BY created_at DESC LIMIT ?'
  args.push(limit)

  const { rows } = await queryOrThrow(sql, args)
  return c.json({ initiatives: rows })
})

// GET /:id — detail
app.get('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const { rows } = await queryOrThrow('SELECT * FROM initiatives WHERE id = ?', [id])
  if (!rows.length) return c.json({ error: 'Initiative not found' }, 404)
  return c.json({ initiative: rows[0] })
})

// POST / — create
app.post('/', async (c) => {
  const body = await c.req.json<{
    title: string; content: string; decider?: string
    source_context?: string; sourceContext?: string
  }>()
  const author = c.get('userName')
  const err = validateCreate(body.title, body.content, author)
  if (err) return c.json({ error: err }, 400)
  const sourceContext = body.source_context ?? body.sourceContext ?? null

  const { rowsAffected } = await executeOrThrow(
    `INSERT INTO initiatives (title, content, author, decider, source_context) VALUES (?, ?, ?, ?, ?)`,
    [body.title, body.content, author, body.decider ?? null, sourceContext],
  )
  const { logActivity } = await import('../utils/activity.js')
  await logActivity(c.get('userName') || 'unknown', 'initiative_created', 'initiative', 'new', body.title || '')

  return c.json({ ok: true }, 201)
})

// PATCH /:id/status — status transition
app.patch('/:id/status', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<{ status: InitiativeStatus; decision_note?: string; decisionNote?: string }>()

  const current = await query<{ status: string }>('SELECT status FROM initiatives WHERE id = ?', [id])
  if (!current.rows.length) return c.json({ error: 'Initiative not found' }, 404)

  const from = current.rows[0].status as InitiativeStatus
  if (!canTransition(from, body.status)) {
    return c.json({ error: `Cannot transition ${from} → ${body.status}` }, 400)
  }

  const decidedAt = ['approved', 'rejected'].includes(body.status) ? 'CURRENT_TIMESTAMP' : 'NULL'
  await execute(
    `UPDATE initiatives SET status = ?, decision_note = ?, decided_at = ${decidedAt}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [body.status, body.decision_note ?? body.decisionNote ?? null, id],
  )
  return c.json({ ok: true })
})

// DELETE /:id
app.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const { rowsAffected } = await executeOrThrow('DELETE FROM initiatives WHERE id = ?', [id])
  return c.json({ ok: true })
})

// POST /:id/convert-to-epic — initiative -> epic conversion
app.post('/:id/convert-to-epic', async (c) => {
  const id = Number(c.req.param('id'))
  const initiative = await query<{ id: number; title: string; content: string; status: string }>(
    'SELECT id, title, content, status FROM initiatives WHERE id = ?', [id],
  )
  if (!initiative.rows.length) return c.json({ error: 'Initiative not found' }, 404)
  if (initiative.rows[0].status !== 'approved') return c.json({ error: 'Only approved initiatives can be converted' }, 400)

  const ini = initiative.rows[0]
  const { rowsAffected } = await executeOrThrow(
    'INSERT INTO pm_epics (title, description, status, owner) VALUES (?, ?, ?, ?)',
    [ini.title, `Created from initiative #${ini.id}.\n\n${ini.content}`, 'active', c.get('userName')],
  )
  return c.json({ ok: true, epicTitle: ini.title })
})

// POST /:id/convert-to-story — initiative -> story conversion
app.post('/:id/convert-to-story', async (c) => {
  const id = Number(c.req.param('id'))
  const initiative = await query<{ id: number; title: string; content: string; status: string }>(
    'SELECT id, title, content, status FROM initiatives WHERE id = ?', [id],
  )
  if (!initiative.rows.length) return c.json({ error: 'Initiative not found' }, 404)
  if (initiative.rows[0].status !== 'approved') return c.json({ error: 'Only approved initiatives can be converted' }, 400)

  const ini = initiative.rows[0]
  const { rowsAffected } = await executeOrThrow(
    'INSERT INTO pm_stories (title, description, status, priority) VALUES (?, ?, ?, ?)',
    [`[Initiative] ${ini.title}`, `Created from initiative #${ini.id}.\n\n${ini.content}`, 'backlog', 'medium'],
  )
  return c.json({ ok: true, storyTitle: `[Initiative] ${ini.title}` })
})

export default app
