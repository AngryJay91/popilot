import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { query, execute } from '../db/adapter.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'

const app = new Hono<AppEnv>()

// GET /:sprint/:epicId
// Supports both legacy string keys (E-01) and numeric pm_epics.id (18)
app.get('/:sprint/:epicId', async (c) => {
  const sprint = c.req.param('sprint')
  const epicId = c.req.param('epicId')

  // 1. Try exact match first (works for both "E-01" and numeric "18")
  const { rows } = await queryOrThrow<{ content: string }>(
    'SELECT content FROM policy_documents WHERE sprint = ? AND epic_id = ?',
    [sprint, epicId],
  )
  if (rows.length > 0) return c.json({ content: rows[0].content })

  // 2. If epicId is numeric, resolve legacy E-XX key via story title pattern
  if (/^\d+$/.test(epicId)) {
    const storyResult = await query<{ title: string }>(
      `SELECT title FROM pm_stories WHERE epic_id = ? AND sprint = ? LIMIT 1`,
      [Number(epicId), sprint],
    )
    if (!storyResult.error && storyResult.rows.length > 0) {
      const match = storyResult.rows[0].title.match(/^\[(E-\d+)/)
      if (match) {
        const legacyId = match[1]
        const fallback = await query<{ content: string }>(
          'SELECT content FROM policy_documents WHERE sprint = ? AND epic_id = ?',
          [sprint, legacyId],
        )
        if (!fallback.error && fallback.rows.length > 0) {
          return c.json({ content: fallback.rows[0].content })
        }
      }
    }
  }

  return c.json({ error: 'Not found' }, 404)
})

// PUT /:sprint/:epicId — upsert policy document
app.put('/:sprint/:epicId', async (c) => {
  const sprint = c.req.param('sprint')
  const epicId = c.req.param('epicId')
  const body = await c.req.json<{ content: string }>().catch(() => ({} as { content: string }))
  if (!body.content) return c.json({ error: 'Missing content' }, 400)
  const { rowsAffected } = await executeOrThrow(
    'INSERT OR REPLACE INTO policy_documents (sprint, epic_id, content, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
    [sprint, epicId, body.content],
  )
  return c.json({ ok: true })
})

export default app
