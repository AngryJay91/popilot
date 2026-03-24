import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'

const app = new Hono<AppEnv>()

// GET / - document list
app.get('/', async (c) => {
  const { rows } = await queryOrThrow('SELECT id, title, SUBSTR(content, 1, 100) as summary, created_by, updated_at FROM docs ORDER BY title')
  return c.json({ docs: rows })
})

// GET /:id - document detail
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const { rows } = await queryOrThrow('SELECT * FROM docs WHERE id = ?', [id])
  if (!rows.length) return c.json({ error: 'Document not found' }, 404)
  return c.json({ doc: rows[0] })
})

// PUT /:id - create/update document
app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ title: string; content: string }>()
  const createdBy = c.get('userName') || 'unknown'
  await executeOrThrow(
    `INSERT INTO docs (id, title, content, created_by) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, content = excluded.content, updated_at = CURRENT_TIMESTAMP`,
    [id, body.title, body.content, createdBy],
  )
  return c.json({ ok: true })
})

export default app
