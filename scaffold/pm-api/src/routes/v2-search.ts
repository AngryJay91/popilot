import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { query } from '../db/adapter.js'

const app = new Hono<AppEnv>()

// GET / — unified search
app.get('/', async (c) => {
  const q = c.req.query('q')
  if (!q || q.length < 2) return c.json({ results: [] })

  const keyword = `%${q}%`
  const perType = 5

  const [stories, memos, docs, meetings] = await Promise.all([
    query('SELECT id, title, SUBSTR(description, 1, 50) as preview, created_at FROM pm_stories WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC LIMIT ?', [keyword, keyword, perType]),
    query('SELECT id, title, SUBSTR(content, 1, 50) as preview, created_at FROM memos_v2 WHERE content LIKE ? OR title LIKE ? ORDER BY created_at DESC LIMIT ?', [keyword, keyword, perType]),
    query('SELECT id, title, SUBSTR(content, 1, 50) as preview, updated_at as created_at FROM docs WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC LIMIT ?', [keyword, keyword, perType]),
    query('SELECT id, title, SUBSTR(summary, 1, 50) as preview, date as created_at FROM meetings WHERE title LIKE ? OR summary LIKE ? ORDER BY date DESC LIMIT ?', [keyword, keyword, perType]),
  ])

  const results = [
    ...(stories.rows ?? []).map((r: any) => ({ type: 'story', ...r, url: `/board?story=${r.id}` })),
    ...(memos.rows ?? []).map((r: any) => ({ type: 'memo', ...r, url: `/memos/${r.id}` })),
    ...(docs.rows ?? []).map((r: any) => ({ type: 'doc', ...r, url: `/docs/${r.id}` })),
    ...(meetings.rows ?? []).map((r: any) => ({ type: 'meeting', ...r, url: `/meetings` })),
  ]

  return c.json({ results })
})

export default app
