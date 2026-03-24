import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { query, execute } from '../db/adapter.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'

const app = new Hono<AppEnv>()

// GET /:pageId/:sprint
app.get('/:pageId/:sprint', async (c) => {
  const pageId = c.req.param('pageId')
  const sprint = c.req.param('sprint')
  const { rows } = await queryOrThrow(
    'SELECT * FROM scenario_data WHERE page_id = ? AND sprint = ?',
    [pageId, sprint],
  )
  return c.json({ rows: rows })
})

// PUT /:pageId/:sprint/:scenarioId — UPSERT
app.put('/:pageId/:sprint/:scenarioId', async (c) => {
  const pageId = c.req.param('pageId')
  const sprint = c.req.param('sprint')
  const scenarioId = c.req.param('scenarioId')
  const body = await c.req.json<{ label: string; dataJson: string; author: string }>()

  const { rowsAffected } = await executeOrThrow(
    `INSERT INTO scenario_data (page_id, sprint, scenario_id, label, data_json, author)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (page_id, sprint, scenario_id)
     DO UPDATE SET label = excluded.label, data_json = excluded.data_json, author = excluded.author, updated_at = CURRENT_TIMESTAMP`,
    [pageId, sprint, scenarioId, body.label, body.dataJson, body.author],
  )
  return c.json({ ok: true })
})

// DELETE /:pageId/:sprint/:scenarioId
app.delete('/:pageId/:sprint/:scenarioId', async (c) => {
  const pageId = c.req.param('pageId')
  const sprint = c.req.param('sprint')
  const scenarioId = c.req.param('scenarioId')
  const { rowsAffected } = await executeOrThrow(
    'DELETE FROM scenario_data WHERE page_id = ? AND sprint = ? AND scenario_id = ?',
    [pageId, sprint, scenarioId],
  )
  return c.json({ ok: true })
})

export default app
