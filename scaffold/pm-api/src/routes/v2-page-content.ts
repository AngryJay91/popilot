import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { query } from '../db/adapter.js'

const app = new Hono<AppEnv>()

// GET /:pageId/:sprint
app.get('/:pageId/:sprint', async (c) => {
  const pageId = c.req.param('pageId')
  const sprint = c.req.param('sprint')

  const [rules, scenarios, areas, versions, meta] = await Promise.all([
    query('SELECT * FROM spec_rules WHERE page_id = ? ORDER BY rule_group, sort_order', [pageId]),
    query('SELECT scenario_id, label, data_json, is_default, sort_order FROM spec_scenarios WHERE page_id = ? ORDER BY sort_order', [pageId]),
    query('SELECT area_id, label, short_label, rule_count, sort_order FROM spec_areas WHERE page_id = ? ORDER BY sort_order', [pageId]),
    query('SELECT * FROM spec_versions WHERE page_id = ?', [pageId]),
    query('SELECT default_scenario_id, spec_title, route_title FROM spec_wireframe_meta WHERE page_id = ? AND sprint = ?', [pageId, sprint]),
  ])

  if (rules.error) return c.json({ error: rules.error }, 500)
  if (scenarios.error) return c.json({ error: scenarios.error }, 500)
  if (areas.error) return c.json({ error: areas.error }, 500)
  if (versions.error) return c.json({ error: versions.error }, 500)
  if (meta.error) return c.json({ error: meta.error }, 500)

  return c.json({
    rules: rules.rows,
    scenarios: scenarios.rows,
    areas: areas.rows,
    versions: versions.rows,
    meta: meta.rows[0] ?? null,
  })
})

export default app
