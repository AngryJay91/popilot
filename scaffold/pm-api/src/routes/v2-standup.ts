import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { query, execute } from '../db/adapter.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'

const app = new Hono<AppEnv>()

// GET /entries — sprint optional, date-based primary view
app.get('/entries', async (c) => {
  const sprint = c.req.query('sprint')
  const date = c.req.query('date')

  if (date && sprint) {
    const { rows } = await queryOrThrow(
      'SELECT * FROM pm_standup_entries WHERE sprint = ? AND entry_date = ? ORDER BY user_name',
      [sprint, date],
    )
    return c.json({ entries: rows })
  }

  if (date) {
    const { rows } = await queryOrThrow(
      'SELECT * FROM pm_standup_entries WHERE entry_date = ? ORDER BY user_name',
      [date],
    )
    return c.json({ entries: rows })
  }

  if (sprint) {
    const { rows } = await queryOrThrow(
      'SELECT * FROM pm_standup_entries WHERE sprint = ? ORDER BY entry_date DESC, user_name LIMIT 50',
      [sprint],
    )
    return c.json({ entries: rows })
  }

  return c.json({ error: 'sprint or date query param required' }, 400)
})

// PUT /entries — UPSERT
app.put('/entries', async (c) => {
  const body = await c.req.json<{
    sprint: string; userName: string; date: string
    doneText?: string; planText?: string; planStoryIds?: number[] | string | null; blockers?: string
  }>()

  // planStoryIds: number[] -> JSON string for storage
  const storyIdsJson = Array.isArray(body.planStoryIds) && body.planStoryIds.length
    ? JSON.stringify(body.planStoryIds)
    : (typeof body.planStoryIds === 'string' ? body.planStoryIds : null)

  const { rowsAffected } = await executeOrThrow(
    `INSERT INTO pm_standup_entries (sprint, user_name, entry_date, done_text, plan_text, plan_story_ids, blockers)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (sprint, user_name, entry_date)
     DO UPDATE SET done_text = excluded.done_text, plan_text = excluded.plan_text,
       plan_story_ids = excluded.plan_story_ids, blockers = excluded.blockers,
       updated_at = CURRENT_TIMESTAMP`,
    [body.sprint, body.userName, body.date, body.doneText ?? null, body.planText ?? null, storyIdsJson, body.blockers ?? null],
  )
  return c.json({ ok: true })
})

// ── Standup Feedback (1:N) ──

// GET /feedback?standup_entry_id= or ?sprint=&user=
app.get('/feedback', async (c) => {
  const entryId = c.req.query('standup_entry_id')
  const sprint = c.req.query('sprint')
  const user = c.req.query('user')

  if (entryId) {
    const { rows } = await queryOrThrow(
      'SELECT * FROM pm_standup_feedback WHERE standup_entry_id = ? ORDER BY created_at ASC',
      [Number(entryId)],
    )
    return c.json({ feedback: rows })
  }

  if (sprint && user) {
    const { rows } = await queryOrThrow(
      'SELECT f.* FROM pm_standup_feedback f WHERE f.sprint = ? AND f.target_user = ? ORDER BY f.created_at DESC LIMIT 50',
      [sprint, user],
    )
    return c.json({ feedback: rows })
  }

  return c.json({ error: 'standup_entry_id or (sprint + user) query params required' }, 400)
})

// POST /feedback — add feedback to a standup entry
app.post('/feedback', async (c) => {
  const body = await c.req.json<{
    standupEntryId: number
    sprint: string
    targetUser: string
    feedbackBy: string
    feedbackText: string
    reviewType?: string
  }>()

  if (!body.standupEntryId || !body.sprint || !body.targetUser || !body.feedbackBy || !body.feedbackText) {
    return c.json({ error: 'standupEntryId, sprint, targetUser, feedbackBy, feedbackText required' }, 400)
  }

  const reviewType = body.reviewType ?? 'comment'
  if (!['comment', 'approve', 'request_changes'].includes(reviewType)) {
    return c.json({ error: 'reviewType must be comment, approve, or request_changes' }, 400)
  }

  // Verify the standup entry exists
  const entryCheck = await query(
    'SELECT id FROM pm_standup_entries WHERE id = ?',
    [body.standupEntryId],
  )
  if (entryCheck.error) return c.json({ error: entryCheck.error }, 500)
  if (entryCheck.rows.length === 0) return c.json({ error: 'Standup entry not found' }, 404)

  const { rowsAffected } = await executeOrThrow(
    `INSERT INTO pm_standup_feedback (standup_entry_id, sprint, target_user, feedback_by, feedback_text, review_type)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [body.standupEntryId, body.sprint, body.targetUser, body.feedbackBy, body.feedbackText, reviewType],
  )
  return c.json({ ok: true })
})

export default app
