import { Hono } from 'hono'
import { buildUpdateQuery } from '../utils/db.js'
import type { AppEnv } from '../types.js'
import { query, execute } from '../db/adapter.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'

const app = new Hono<AppEnv>()

import { validateAssignee } from '../utils/assignee.js'

// Auto-sync task SP sum to story SP
async function syncStorySP(storyId: number) {
  const { rows } = await queryOrThrow<{ total: number | null }>(
    'SELECT SUM(story_points) as total FROM pm_tasks WHERE story_id = ?',
    [storyId],
  )
  if (rows.length > 0) {
    const total = rows[0].total ?? 0
    await execute('UPDATE pm_stories SET story_points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [total, storyId])
  }
}

// GET /epics
app.get('/epics', async (c) => {
  const { rows } = await queryOrThrow('SELECT * FROM pm_epics ORDER BY title')
  return c.json({ epics: rows })
})

// GET /data
app.get('/data', async (c) => {
  const sprint = c.req.query('sprint')

  if (sprint) {
    // sprint=backlog -> stories where sprint IS NULL
    const storiesResult = sprint === 'backlog'
      ? await query("SELECT * FROM pm_stories WHERE sprint IS NULL AND status NOT IN ('done', 'cancelled')")
      : await query('SELECT * FROM pm_stories WHERE sprint = ?', [sprint])
    if (storiesResult.error) return c.json({ error: storiesResult.error }, 500)

    if (storiesResult.rows.length === 0) {
      return c.json({ stories: [], tasks: [] })
    }

    const storyIds = (storiesResult.rows as Array<{ id: number }>).map(s => s.id)
    const placeholders = storyIds.map(() => '?').join(', ')
    const tasksResult = await query(
      `SELECT * FROM pm_tasks WHERE story_id IN (${placeholders})`,
      storyIds,
    )
    if (tasksResult.error) return c.json({ error: tasksResult.error }, 500)
    return c.json({ stories: storiesResult.rows, tasks: tasksResult.rows })
  }

  const [storiesResult, tasksResult] = await Promise.all([
    query('SELECT * FROM pm_stories'),
    query('SELECT * FROM pm_tasks'),
  ])
  if (storiesResult.error) return c.json({ error: storiesResult.error }, 500)
  if (tasksResult.error) return c.json({ error: tasksResult.error }, 500)
  return c.json({ stories: storiesResult.rows, tasks: tasksResult.rows })
})

// POST /epics
app.post('/epics', async (c) => {
  const body = await c.req.json<{
    title: string; description?: string; status?: string; owner?: string
    sortOrder?: number; originSprint?: string
  }>()
  const { rowsAffected } = await executeOrThrow(
    'INSERT INTO pm_epics (title, description, status, owner, sort_order, origin_sprint) VALUES (?, ?, ?, ?, ?, ?)',
    [
      body.title, body.description ?? null, body.status ?? 'active', body.owner ?? null,
      body.sortOrder ?? 0, body.originSprint ?? null,
    ],
  )
  return c.json({ ok: true }, 201)
})

// PATCH /epics/:id
app.patch('/epics/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<Record<string, unknown>>()

  const fieldMap: Record<string, string> = {
    title: 'title', description: 'description', status: 'status', owner: 'owner',
    sortOrder: 'sort_order', originSprint: 'origin_sprint', category: 'category', badge: 'badge',
  }
  const sets: string[] = []
  const args: (string | number | null)[] = []

  for (const [key, col] of Object.entries(fieldMap)) {
    if (body[key] !== undefined) {
      sets.push(`${col} = ?`)
      args.push(body[key] as string | number | null)
    }
  }
  if (sets.length === 0) return c.json({ ok: true })

  sets.push('updated_at = CURRENT_TIMESTAMP')
  args.push(id)
  const { rowsAffected } = await executeOrThrow(`UPDATE pm_epics SET ${sets.join(', ')} WHERE id = ?`, args)
  return c.json({ ok: true })
})

// DELETE /epics/:id
app.delete('/epics/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const r1 = await execute('UPDATE pm_stories SET epic_id = NULL WHERE epic_id = ?', [id])
  if (r1.error) return c.json({ error: r1.error }, 500)
  const r2 = await execute('DELETE FROM pm_epics WHERE id = ?', [id])
  if (r2.error) return c.json({ error: r2.error }, 500)
  return c.json({ ok: true })
})

// POST /stories
app.post('/stories', async (c) => {
  const body = await c.req.json<{
    epicId?: number; sprint?: string | null; title: string; description?: string
    acceptanceCriteria?: string; assignee?: string; status?: string
    priority?: string; area?: string; storyPoints?: number; sortOrder?: number
  }>()

  const assigneeErr = await validateAssignee(body.assignee)
  if (assigneeErr) return c.json({ error: assigneeErr }, 400)

  const epicUid = body.epicId ? `pm:${body.epicId}` : `pm:0`

  const { rowsAffected } = await executeOrThrow(
    `INSERT INTO pm_stories (epic_id, epic_uid, sprint, title, description, acceptance_criteria, assignee, status, priority, area, story_points, sort_order, start_date, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      body.epicId ?? null, epicUid, body.sprint ?? null, body.title,
      body.description ?? null, body.acceptanceCriteria ?? null,
      body.assignee ?? null, body.status ?? 'todo',
      body.priority ?? null, body.area ?? null,
      body.storyPoints ?? null, body.sortOrder ?? 0,
      (body as any).startDate ?? null, (body as any).dueDate ?? null,
    ],
  )
  return c.json({ ok: true }, 201)
})

// PATCH /stories/:id
app.patch('/stories/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<Record<string, unknown>>()

  if (body.assignee !== undefined) {
    const assigneeErr = await validateAssignee(body.assignee as string | null)
    if (assigneeErr) return c.json({ error: assigneeErr }, 400)
  }

  const fieldMap: Record<string, string> = {
    epicId: 'epic_id', sprint: 'sprint', title: 'title',
    description: 'description', acceptanceCriteria: 'acceptance_criteria',
    assignee: 'assignee', status: 'status', priority: 'priority',
    area: 'area', storyPoints: 'story_points', figmaUrl: 'figma_url', sortOrder: 'sort_order',
    startDate: 'start_date', dueDate: 'due_date',
  }
  const sets: string[] = []
  const args: (string | number | null)[] = []

  for (const [key, col] of Object.entries(fieldMap)) {
    if (body[key] !== undefined) {
      sets.push(`${col} = ?`)
      args.push(body[key] as string | number | null)
    }
  }
  if (sets.length === 0) return c.json({ ok: true })

  sets.push('updated_at = CURRENT_TIMESTAMP')
  args.push(id)
  const { rowsAffected } = await executeOrThrow(`UPDATE pm_stories SET ${sets.join(', ')} WHERE id = ?`, args)

  // Activity log
  if (body.status !== undefined) {
    const { logActivity } = await import('../utils/activity.js')
    const userName = c.get('userName') || 'unknown'
    await logActivity(userName, 'story_status_change', 'story', id, body.title as string || `SID:${id}`, { status: body.status })
  }

  return c.json({ ok: true })
})

// DELETE /stories/:id
app.delete('/stories/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const r1 = await execute('DELETE FROM pm_tasks WHERE story_id = ?', [id])
  if (r1.error) return c.json({ error: r1.error }, 500)
  const r2 = await execute('DELETE FROM pm_stories WHERE id = ?', [id])
  if (r2.error) return c.json({ error: r2.error }, 500)
  return c.json({ ok: true })
})

// POST /tasks
app.post('/tasks', async (c) => {
  const body = await c.req.json<{
    storyId: number; title: string; assignee?: string
    description?: string; sortOrder?: number; storyPoints?: number
  }>()
  const assigneeErr = await validateAssignee(body.assignee)
  if (assigneeErr) return c.json({ error: assigneeErr }, 400)
  const { rowsAffected } = await executeOrThrow(
    'INSERT INTO pm_tasks (story_id, title, assignee, description, sort_order, story_points, start_date, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [body.storyId, body.title, body.assignee ?? null, body.description ?? null, body.sortOrder ?? 0, body.storyPoints ?? null, (body as any).startDate ?? null, (body as any).dueDate ?? null],
  )

  // Auto-sync story SP
  if (body.storyPoints != null) {
    await syncStorySP(body.storyId)
  }

  return c.json({ ok: true }, 201)
})

// PATCH /tasks/:id
app.patch('/tasks/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<Record<string, unknown>>()

  if (body.assignee !== undefined) {
    const assigneeErr = await validateAssignee(body.assignee as string | null)
    if (assigneeErr) return c.json({ error: assigneeErr }, 400)
  }

  const fieldMap: Record<string, string> = {
    title: 'title', assignee: 'assignee', status: 'status', description: 'description',
    storyPoints: 'story_points', startDate: 'start_date', dueDate: 'due_date',
  }
  const sets: string[] = []
  const args: (string | number | null)[] = []

  for (const [key, col] of Object.entries(fieldMap)) {
    if (body[key] !== undefined) {
      sets.push(`${col} = ?`)
      args.push(body[key] as string | number | null)
    }
  }
  if (sets.length === 0) return c.json({ ok: true })

  sets.push('updated_at = CURRENT_TIMESTAMP')
  args.push(id)
  const { rowsAffected } = await executeOrThrow(`UPDATE pm_tasks SET ${sets.join(', ')} WHERE id = ?`, args)

  // Auto-sync story SP on SP change
  if (body.storyPoints !== undefined) {
    const storyResult = await query<{ story_id: number }>('SELECT story_id FROM pm_tasks WHERE id = ?', [id])
    if (!storyResult.error && storyResult.rows.length > 0) {
      await syncStorySP(storyResult.rows[0].story_id)
    }
  }

  return c.json({ ok: true })
})

// DELETE /tasks/:id
app.delete('/tasks/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const { rowsAffected } = await executeOrThrow('DELETE FROM pm_tasks WHERE id = ?', [id])
  return c.json({ ok: true })
})

// ── PR <-> Story link ──

type PrEntry = { prNumber: number; prUrl: string; prTitle: string; status: string }

async function linkPrToStory(
  storyId: number,
  pr: { prNumber: number; prUrl: string; prTitle: string; status?: string },
): Promise<{ ok: boolean; error?: string; relatedPrs: PrEntry[] }> {
  const existing = await query('SELECT related_prs FROM pm_stories WHERE id = ?', [storyId])
  if (!existing.rows?.length) return { ok: false, error: 'Story not found', relatedPrs: [] }

  const current: PrEntry[] = JSON.parse((existing.rows[0] as any).related_prs || '[]')
  const entry: PrEntry = { prNumber: pr.prNumber, prUrl: pr.prUrl, prTitle: pr.prTitle, status: pr.status || 'open' }
  const idx = current.findIndex(p => p.prNumber === pr.prNumber)
  if (idx >= 0) current[idx] = entry
  else current.push(entry)

  await execute('UPDATE pm_stories SET related_prs = ? WHERE id = ?', [JSON.stringify(current), storyId])

  if (pr.status === 'merged') {
    const storyResult = await query('SELECT status FROM pm_stories WHERE id = ?', [storyId])
    const storyStatus = (storyResult.rows?.[0] as any)?.status
    if (storyStatus === 'review') {
      await execute("UPDATE pm_stories SET status = 'qa' WHERE id = ?", [storyId])
    }
    await execute(
      "UPDATE memos_v2 SET status = 'resolved', resolved_by = 'system', resolved_at = CURRENT_TIMESTAMP WHERE status = 'open' AND content LIKE ?",
      [`%SID:${storyId}%`],
    )
  }

  // Activity log
  if (pr.status === 'merged') {
    const { logActivity } = await import('../utils/activity.js')
    await logActivity('system', 'pr_merged', 'story', storyId, pr.prTitle)
  }

  return { ok: true, relatedPrs: current }
}

// POST /stories/:id/link-pr
app.post('/stories/:id/link-pr', async (c) => {
  const storyId = Number(c.req.param('id'))
  const body = await c.req.json<{ prNumber: number; prUrl: string; prTitle: string; status?: string }>()
  const result = await linkPrToStory(storyId, body)
  if (!result.ok) return c.json({ error: result.error }, 404)
  return c.json({ ok: true, relatedPrs: result.relatedPrs })
})

// GET /stories/:id/prs
app.get('/stories/:id/prs', async (c) => {
  const storyId = Number(c.req.param('id'))
  const existing = await query('SELECT related_prs FROM pm_stories WHERE id = ?', [storyId])
  if (!existing.rows?.length) return c.json({ error: 'Story not found' }, 404)
  return c.json({ prs: JSON.parse((existing.rows[0] as any).related_prs || '[]') })
})

// POST /link-pr-by-title — auto-parse SID:xxx from PR title
app.post('/link-pr-by-title', async (c) => {
  const body = await c.req.json<{ prNumber: number; prUrl: string; prTitle: string; status?: string }>()
  const match = body.prTitle.match(/SID[:\s]*(\d+)/i)
  if (!match) return c.json({ ok: false, message: 'No SID pattern found' })
  const storyId = Number(match[1])
  const result = await linkPrToStory(storyId, body)
  if (!result.ok) return c.json({ ok: false, message: result.error })
  return c.json({ ok: true, storyId, relatedPrs: result.relatedPrs })
})

// ── Story Comments ──

// GET /stories/:id/comments
app.get('/stories/:id/comments', async (c) => {
  const storyId = Number(c.req.param('id'))
  const { rows } = await queryOrThrow(
    'SELECT * FROM story_comments WHERE story_id = ? ORDER BY created_at ASC',
    [storyId],
  )
  return c.json({ comments: rows })
})

// POST /stories/:id/comments
app.post('/stories/:id/comments', async (c) => {
  const storyId = Number(c.req.param('id'))
  const body = await c.req.json<{ content: string }>()
  const createdBy = c.get('userName') || 'unknown'

  await executeOrThrow(
    'INSERT INTO story_comments (story_id, content, created_by) VALUES (?, ?, ?)',
    [storyId, body.content, createdBy],
  )

  // @mention webhook
  const { rows: members } = await queryOrThrow<{ display_name: string }>(
    "SELECT display_name FROM members WHERE is_active = 1",
  )
  const { notifyByName } = await import('../utils/agent-notify.js')
  for (const m of members) {
    if (body.content.includes(`@${m.display_name}`) && m.display_name !== createdBy) {
      const preview = body.content.length > 50 ? body.content.slice(0, 50) + '...' : body.content
      await notifyByName(m.display_name, `Comment: ${createdBy}`, `SID:${storyId} comment\n${preview}`)
    }
  }

  return c.json({ ok: true }, 201)
})

// DELETE /stories/:id/comments/:commentId
app.delete('/stories/:id/comments/:commentId', async (c) => {
  const commentId = Number(c.req.param('commentId'))
  const userName = c.get('userName')
  await executeOrThrow(
    'DELETE FROM story_comments WHERE id = ? AND created_by = ?',
    [commentId, userName],
  )
  return c.json({ ok: true })
})

export default app
