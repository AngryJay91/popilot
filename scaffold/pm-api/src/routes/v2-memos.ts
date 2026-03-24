import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { query, execute } from '../db/adapter.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'

const app = new Hono<AppEnv>()

// GET /all — global memo inbox
app.get('/all', async (c) => {
  const user = c.req.query('user')
  const status = c.req.query('status')
  const keyword = c.req.query('keyword')
  const author = c.req.query('author')
  const dateFrom = c.req.query('dateFrom')
  const dateTo = c.req.query('dateTo')
  const limit = Number(c.req.query('limit') ?? '50')

  const conditions: string[] = []
  const params: (string | number)[] = []

  if (user) {
    conditions.push('assigned_to = ?')
    params.push(user)
  }
  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }
  if (keyword) {
    conditions.push('(content LIKE ? OR title LIKE ? OR created_by LIKE ?)')
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
  }
  if (author) {
    conditions.push('created_by = ?')
    params.push(author)
  }
  if (dateFrom) {
    conditions.push('created_at >= ?')
    params.push(dateFrom)
  }
  if (dateTo) {
    conditions.push('created_at <= ?')
    params.push(dateTo + 'T23:59:59')
  }
  const memoType = c.req.query('memo_type')
  if (memoType) {
    conditions.push('memo_type = ?')
    params.push(memoType)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = Number(c.req.query('offset') ?? '0')

  // total count
  const countParams = [...params]
  const countResult = await query(
    `SELECT COUNT(*) as total FROM memos_v2 ${where}`,
    countParams,
  )
  const total = (countResult.rows?.[0] as { total: number })?.total || 0

  params.push(limit, offset)
  const { rows } = await queryOrThrow(
    `SELECT * FROM memos_v2 ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    params,
  )
  return c.json({ memos: rows, total, limit, offset })
})

// GET /unread-count
app.get('/unread-count', async (c) => {
  const user = c.req.query('user')
  if (!user) return c.json({ error: 'user query param required' }, 400)

  const { rows } = await queryOrThrow<{ count: number }>(
    `SELECT COUNT(*) as count FROM memos_v2
     WHERE assigned_to = ? AND status = 'open'
       AND created_at > COALESCE(
         (SELECT last_memo_seen FROM user_activity WHERE user_name = ?),
         '2000-01-01'
       )`,
    [user, user],
  )
  return c.json({ count: rows[0]?.count ?? 0 })
})

// ── Replies (static routes BEFORE dynamic /:pageId) ──

// GET /replies
app.get('/replies', async (c) => {
  const memoIds = c.req.query('memoIds')
  if (!memoIds) return c.json({ error: 'memoIds query param required' }, 400)

  const ids = memoIds.split(',').map(Number)
  const placeholders = ids.map(() => '?').join(', ')
  const { rows } = await queryOrThrow(
    `SELECT * FROM memo_replies WHERE memo_id IN (${placeholders}) ORDER BY created_at ASC`,
    ids,
  )
  return c.json({ replies: rows })
})

// POST /replies
app.post('/replies', async (c) => {
  const body = await c.req.json<{
    memoId: number; content: string; createdBy?: string; reviewType?: string
  }>()
  const createdBy = c.get('userName') || body.createdBy || 'unknown'
  const reviewType = body.reviewType || 'comment'
  const { rowsAffected } = await executeOrThrow(
    'INSERT INTO memo_replies (memo_id, content, created_by, review_type) VALUES (?, ?, ?, ?)',
    [body.memoId, body.content, createdBy, reviewType],
  )

  // Activity log
  const { logActivity } = await import('../utils/activity.js')
  await logActivity(createdBy, 'memo_reply', 'memo', body.memoId, body.content?.slice(0, 50) || '')

  // Notify all conversation participants (excluding self)
  const [memoResult, repliesResult] = await Promise.all([
    query('SELECT created_by, assigned_to FROM memos_v2 WHERE id = ?', [body.memoId]),
    query('SELECT DISTINCT created_by FROM memo_replies WHERE memo_id = ?', [body.memoId]),
  ])

  const participants = new Set<string>()
  if (memoResult.rows?.length) {
    const memo = memoResult.rows[0] as { created_by: string; assigned_to: string | null }
    participants.add(memo.created_by)
    if (memo.assigned_to) {
      for (const a of memo.assigned_to.split(',').map(s => s.trim()).filter(Boolean)) {
        participants.add(a)
      }
    }
  }
  if (repliesResult.rows?.length) {
    for (const r of repliesResult.rows as Array<{ created_by: string }>) {
      participants.add(r.created_by)
    }
  }
  // @mention parsing
  const membersResult = await query<{ display_name: string }>('SELECT display_name FROM members WHERE is_active = 1')
  const memberNames = (membersResult.rows ?? []).map(r => r.display_name)
  for (const name of memberNames) {
    if (body.content.includes(`@${name}`)) {
      participants.add(name)
    }
  }

  participants.delete(createdBy) // Exclude self

  if (participants.size > 0) {
    const { notifyByName } = await import('../utils/agent-notify.js')
    const preview = body.content.length > 50 ? body.content.slice(0, 50) + '...' : body.content
    for (const p of participants) {
      await notifyByName(p, `Reply: ${createdBy}`, `Memo #${body.memoId} reply\n${preview}`)
    }
  }

  return c.json({ ok: true }, 201)
})

// DELETE /replies/:id
app.delete('/replies/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const userName = c.get('userName')
  const { rowsAffected } = await executeOrThrow(
    'DELETE FROM memo_replies WHERE id = ? AND created_by = ?',
    [id, userName],
  )
  return c.json({ ok: true })
})

// ── Memos (dynamic /:pageId must come after static routes) ──

// GET /by-id/:id — single memo lookup (for deep links)
app.get('/by-id/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const { rows } = await queryOrThrow('SELECT * FROM memos_v2 WHERE id = ?', [id])
  return c.json({ memos: rows })
})

app.get('/:pageId', async (c) => {
  const pageId = c.req.param('pageId')
  const { rows } = await queryOrThrow(
    'SELECT * FROM memos_v2 WHERE page_id = ? ORDER BY created_at DESC',
    [pageId],
  )
  return c.json({ memos: rows })
})

// POST /
app.post('/', async (c) => {
  const body = await c.req.json<{
    pageId: string; content: string; memoType: string
    createdBy?: string; assignedTo?: string
  }>()
  const createdBy = c.get('userName') || body.createdBy || 'unknown'
  // [D-XX] tag parsing -> related_decisions
  const decisionMatches = body.content.match(/\[D-\d+\]/g)
  const relatedDecisions = decisionMatches ? JSON.stringify([...new Set(decisionMatches.map((m: string) => m.slice(1, -1)))]) : null
  const title = (body as any).title ?? null
  const supersedesId = (body as any).supersedesId ?? null
  const reviewRequired = (body as any).reviewRequired ? 1 : 0

  const { rowsAffected } = await executeOrThrow(
    'INSERT INTO memos_v2 (page_id, content, memo_type, created_by, assigned_to, related_decisions, title, supersedes_id, review_required) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [body.pageId, body.content, body.memoType, createdBy, body.assignedTo ?? null, relatedDecisions, title, supersedesId, reviewRequired],
  )

  // Notify recipients via webhook
  if (body.assignedTo) {
    const { notifyRecipients } = await import('../utils/agent-notify.js')
    const recipients = body.assignedTo.split(',').map((s: string) => s.trim()).filter(Boolean)
    const preview = body.content.length > 50 ? body.content.slice(0, 50) + '...' : body.content
    await notifyRecipients(recipients, `New memo: ${createdBy}`, `${preview}\n\n${body.memoType}`)
  }

  // Activity log
  const { logActivity } = await import('../utils/activity.js')
  await logActivity(createdBy, 'memo_created', 'memo', 'new', body.content?.slice(0, 50) || '')

  return c.json({ ok: true }, 201)
})

// PATCH /:id/resolve
app.patch('/:id/resolve', async (c) => {
  const id = Number(c.req.param('id'))
  const userName = c.get('userName')
  const { rowsAffected } = await executeOrThrow(
    `UPDATE memos_v2 SET status = 'resolved', resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [userName, id],
  )
  return c.json({ ok: true })
})

// PATCH /:id/reopen
app.patch('/:id/reopen', async (c) => {
  const id = Number(c.req.param('id'))
  const { rowsAffected } = await executeOrThrow(
    `UPDATE memos_v2 SET status = 'open', resolved_by = NULL, resolved_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [id],
  )
  return c.json({ ok: true })
})

// DELETE /:id
app.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const userName = c.get('userName')
  const { rowsAffected } = await executeOrThrow(
    'DELETE FROM memos_v2 WHERE id = ? AND created_by = ?',
    [id, userName],
  )
  return c.json({ ok: true })
})

export default app
