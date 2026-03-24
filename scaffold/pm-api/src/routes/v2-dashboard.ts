import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { query, execute } from '../db/adapter.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'

const app = new Hono<AppEnv>()

// GET /unread-memos — unread memos (assigned to me, unanswered)
// ?review_required=1 to filter approval-pending only
app.get('/unread-memos', async (c) => {
  const user = c.get('userName')
  const reviewFilter = c.req.query('review_required')
  const memoTypeFilter = c.req.query('memo_type')

  let sql = `SELECT m.id, m.content, m.memo_type, m.created_by, m.created_at, m.review_required, m.page_id, m.title, m.supersedes_id,
            (SELECT COUNT(*) FROM memo_replies r WHERE r.memo_id = m.id) as reply_count
     FROM memos_v2 m
     WHERE m.assigned_to LIKE '%' || ? || '%'
       AND m.status = 'open'
       AND (SELECT COUNT(*) FROM memo_replies r WHERE r.memo_id = m.id) = 0`

  const args: (string | number)[] = [user]

  if (reviewFilter === '1') {
    sql += ` AND m.review_required = 1`
  }
  if (memoTypeFilter) {
    sql += ` AND m.memo_type = ?`
    args.push(memoTypeFilter)
  }

  sql += ` ORDER BY m.review_required DESC, m.created_at DESC LIMIT 20`

  const { rows } = await queryOrThrow(sql, args)
  return c.json({ unreadMemos: rows })
})

// GET /sprint-progress — sprint progress (?user= personal filter)
app.get('/sprint-progress', async (c) => {
  const sprint = c.req.query('sprint')
  const userFilter = c.req.query('user')
  if (!sprint) return c.json({ error: 'sprint required' }, 400)

  let sql = `SELECT status, COUNT(*) as cnt FROM pm_stories WHERE sprint = ?`
  const args: (string)[] = [sprint]

  if (userFilter) {
    sql += ` AND assignee LIKE '%' || ? || '%'`
    args.push(userFilter)
  }

  sql += ` GROUP BY status`

  const { rows } = await queryOrThrow(sql, args)

  const statusMap: Record<string, number> = {}
  let total = 0
  for (const row of rows as any[]) {
    statusMap[row.status] = row.cnt
    total += row.cnt
  }
  const done = statusMap['done'] || 0

  return c.json({
    sprint,
    total,
    done,
    progressPercent: total > 0 ? Math.round(done / total * 100) : 0,
    byStatus: statusMap,
  })
})

// GET /standup-status — today's standup submission status
app.get('/standup-status', async (c) => {
  const sprint = c.req.query('sprint')
  const date = c.req.query('date')
  if (!sprint || !date) return c.json({ error: 'sprint and date required' }, 400)

  const { rows } = await queryOrThrow(
    `SELECT user_name, done_text, plan_text FROM pm_standup_entries WHERE sprint = ? AND entry_date = ?`,
    [sprint, date],
  )

  const written = (rows as any[]).map(r => r.user_name)
  return c.json({ date, written, count: written.length })
})

// GET /my-requests — requests I created
app.get('/my-requests', async (c) => {
  const user = c.get('userName')
  const { rows } = await queryOrThrow(
    `SELECT id, title, content, memo_type, assigned_to, status, created_at, supersedes_id
     FROM memos_v2
     WHERE created_by = ? AND memo_type IN ('decision', 'feature_request', 'policy_request')
     ORDER BY created_at DESC LIMIT 20`,
    [user],
  )
  return c.json({ myRequests: rows })
})

// GET /active-decisions — active decisions
app.get('/active-decisions', async (c) => {
  const { rows } = await queryOrThrow(
    `SELECT id, title, content, created_by, assigned_to, created_at, supersedes_id
     FROM memos_v2
     WHERE memo_type = 'decision' AND status = 'open'
     ORDER BY created_at DESC LIMIT 20`,
  )
  return c.json({ decisions: rows })
})

// GET /supersede-chain/:id — trace supersede chain
app.get('/supersede-chain/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const chain: any[] = []
  let currentId: number | null = id

  for (let i = 0; i < 10 && currentId; i++) {
    const chainResult: { rows: Record<string, unknown>[] } = await queryOrThrow(
      'SELECT id, title, content, memo_type, status, created_by, created_at, supersedes_id FROM memos_v2 WHERE id = ?',
      [currentId],
    )
    if (chainResult.rows.length === 0) break
    chain.push(chainResult.rows[0])
    currentId = (chainResult.rows[0] as any).supersedes_id
  }

  return c.json({ chain: chain.reverse() })
})

// GET /nudge-log — recent Nudge history
app.get('/nudge-log', async (c) => {
  const limit = parseInt(c.req.query('limit') ?? '20')
  const nudgeRows = await query(
    `SELECT id, rule_id, title, body, created_at FROM nudge_log ORDER BY created_at DESC LIMIT ?`,
    [limit],
  )
  return c.json({ nudges: (nudgeRows as { rows?: unknown[] }).rows ?? [] })
})

// DELETE /nudge-log/:id — delete Nudge log (admin only)
app.delete('/nudge-log/:id', async (c) => {
  const userName = c.get('userName')
  const { isAdmin } = await import('../utils/admin.js')
  if (!await isAdmin(userName)) return c.json({ error: 'Admin privileges required' }, 403)
  const id = Number(c.req.param('id'))
  const { rowsAffected } = await executeOrThrow('DELETE FROM nudge_log WHERE id = ?', [id])
  return c.json({ ok: true })
})

// GET /my-summary — personal dashboard summary
app.get('/my-summary', async (c) => {
  const user = c.req.query('user')
  if (!user) return c.json({ error: 'user query param required' }, 400)

  const [storiesRes, reviewsRes, mentionsRes, memosRes] = await Promise.all([
    queryOrThrow(
      "SELECT id, title, story_points, sprint, status, start_date FROM pm_stories WHERE assignee LIKE ? AND status = 'in-progress'",
      [`%${user}%`],
    ),
    queryOrThrow(
      "SELECT id, title, story_points, status, assignee FROM pm_stories WHERE status IN ('review', 'qa')",
    ),
    queryOrThrow<{ count: number }>(
      "SELECT COUNT(*) as count FROM notifications WHERE user_name = ? AND is_read = 0 AND type = 'mention'",
      [user],
    ),
    queryOrThrow<{ count: number }>(
      "SELECT COUNT(*) as count FROM memos_v2 WHERE assigned_to LIKE ? AND status = 'open'",
      [`%${user}%`],
    ),
  ])

  // days_in_progress calculation
  const now = new Date()
  const myStories = storiesRes.rows.map((s: any) => ({
    ...s,
    daysInProgress: s.start_date ? Math.floor((now.getTime() - new Date(s.start_date + 'Z').getTime()) / 86400000) : null,
  }))

  return c.json({
    myStories,
    myReviews: reviewsRes.rows,
    unreadMentions: (mentionsRes.rows[0] as any)?.count ?? 0,
    unansweredMemos: (memosRes.rows[0] as any)?.count ?? 0,
  })
})

export default app
