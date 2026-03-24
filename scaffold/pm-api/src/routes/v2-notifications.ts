import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'

const app = new Hono<AppEnv>()

// GET /
app.get('/', async (c) => {
  const user = c.req.query('user')
  if (!user) return c.json({ error: 'user query param required' }, 400)
  const { rows } = await queryOrThrow(
    'SELECT * FROM notifications WHERE user_name = ? ORDER BY created_at DESC LIMIT 50',
    [user],
  )
  return c.json({ notifications: rows })
})

// GET /unread-count
app.get('/unread-count', async (c) => {
  const user = c.req.query('user')
  if (!user) return c.json({ error: 'user query param required' }, 400)
  const { rows } = await queryOrThrow<{ count: number }>(
    'SELECT COUNT(*) as count FROM notifications WHERE user_name = ? AND is_read = 0',
    [user],
  )
  return c.json({ count: rows[0]?.count ?? 0 })
})

// PATCH /:id/read
app.patch('/:id/read', async (c) => {
  const id = Number(c.req.param('id'))
  await executeOrThrow('UPDATE notifications SET is_read = 1 WHERE id = ?', [id])
  return c.json({ ok: true })
})

// POST /mark-all-read
app.post('/mark-all-read', async (c) => {
  const body = await c.req.json<{ user: string }>()
  await executeOrThrow(
    'UPDATE notifications SET is_read = 1 WHERE user_name = ? AND is_read = 0',
    [body.user],
  )
  return c.json({ ok: true })
})

// POST /
app.post('/', async (c) => {
  const body = await c.req.json<{
    userName: string; type: string; title: string; body?: string
    sourceType: string; sourceId: string; pageId: string; actor: string
  }>()
  await executeOrThrow(
    'INSERT INTO notifications (user_name, type, title, body, source_type, source_id, page_id, actor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [body.userName, body.type, body.title, body.body ?? null, body.sourceType, body.sourceId, body.pageId, body.actor],
  )
  return c.json({ ok: true })
})

// DELETE /by-source
app.delete('/by-source', async (c) => {
  const sourceType = c.req.query('sourceType')
  const sourceId = c.req.query('sourceId')
  if (!sourceType || !sourceId) return c.json({ error: 'sourceType and sourceId query params required' }, 400)
  await executeOrThrow(
    'DELETE FROM notifications WHERE source_type = ? AND source_id = ?',
    [sourceType, sourceId],
  )
  return c.json({ ok: true })
})

// GET /active-users
app.get('/active-users', async (c) => {
  const { rows } = await queryOrThrow<{ user_name: string }>(
    'SELECT user_name FROM auth_tokens WHERE is_active = 1',
  )
  return c.json({ users: rows.map(r => r.user_name) })
})

export default app
