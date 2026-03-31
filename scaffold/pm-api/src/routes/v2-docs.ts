import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'

const app = new Hono<AppEnv>()

// GET / - document list
app.get('/', async (c) => {
  const { rows } = await queryOrThrow('SELECT id, title, SUBSTR(content, 1, 100) as summary, created_by, updated_at FROM docs ORDER BY title')
  return c.json({ docs: rows })
})

// GET /:id - document detail (includes version for optimistic locking)
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const { rows } = await queryOrThrow('SELECT * FROM docs WHERE id = ?', [id])
  if (!rows.length) return c.json({ error: 'Document not found' }, 404)
  return c.json({ doc: rows[0] })
})

// PUT /:id - create/update document with optimistic locking
// Body: { title, content, version? }
// - New doc (INSERT): version is ignored; server sets version = 1
// - Existing doc (UPDATE): must supply version matching current row
//   → 409 Conflict if version mismatch (someone else saved in between)
app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ title: string; content: string; version?: number }>()
  const createdBy = c.get('userName') || 'unknown'

  // Check if doc already exists
  const { rows } = await queryOrThrow('SELECT version FROM docs WHERE id = ?', [id])

  if (rows.length === 0) {
    // New document — INSERT with version = 1
    await executeOrThrow(
      `INSERT INTO docs (id, title, content, created_by, version) VALUES (?, ?, ?, ?, 1)`,
      [id, body.title, body.content, createdBy],
    )
    return c.json({ ok: true, version: 1 })
  }

  // Existing document — optimistic locking
  const currentVersion = (rows[0] as { version: number }).version ?? 1
  const clientVersion = body.version

  if (clientVersion === undefined || clientVersion === null) {
    // Legacy client without version support — allow save but warn
    // (graceful degradation: skips conflict check)
    await executeOrThrow(
      `UPDATE docs SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = ?`,
      [body.title, body.content, id],
    )
    return c.json({ ok: true, version: currentVersion + 1 })
  }

  // Versioned save: only update if version matches
  const result = await executeOrThrow(
    `UPDATE docs SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP, version = version + 1
     WHERE id = ? AND version = ?`,
    [body.title, body.content, id, clientVersion],
  )

  if (result.rowsAffected === 0) {
    return c.json(
      { error: 'Conflict: document was modified by someone else. Please refresh and try again.', code: 'VERSION_CONFLICT' },
      409,
    )
  }

  return c.json({ ok: true, version: currentVersion + 1 })
})

export default app
