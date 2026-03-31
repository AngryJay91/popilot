import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { query, execute } from '../db/adapter.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'

const app = new Hono<AppEnv>()

// GET / — load all sprints + epics (pm_epics = SSOT)
app.get('/', async (c) => {
  const [sprints, epics] = await Promise.all([
    query('SELECT id, COALESCE(label, title) AS label, theme, status, active, start_date, end_date, velocity, team_size, sort_order, created_at, updated_at FROM nav_sprints ORDER BY sort_order'),
    query('SELECT * FROM pm_epics ORDER BY sort_order, id'),
  ])
  if (sprints.error) return c.json({ error: sprints.error }, 500)
  if (epics.error) return c.json({ error: epics.error }, 500)
  return c.json({ sprints: sprints.rows, epics: epics.rows })
})

// POST /sprints
app.post('/sprints', async (c) => {
  const body = await c.req.json<{
    id: string; label: string; theme: string
    startDate?: string; endDate?: string; sortOrder: number
    status?: string
  }>()
  const status = body.status ?? 'planning'
  const { rowsAffected } = await executeOrThrow(
    'INSERT INTO nav_sprints (id, label, theme, start_date, end_date, sort_order, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [body.id, body.label, body.theme, body.startDate ?? null, body.endDate ?? null, body.sortOrder, status],
  )
  return c.json({ ok: true })
})

// GET /sprints/velocity — velocity based on past sprint results
app.get('/sprints/velocity', async (c) => {
  const { rows } = await queryOrThrow(
    `SELECT s.sprint,
            SUM(CASE WHEN s.status = 'done' THEN COALESCE(s.story_points, 0) ELSE 0 END) as done_sp,
            SUM(COALESCE(s.story_points, 0)) as total_sp,
            COUNT(*) as story_count
     FROM pm_stories s
     JOIN nav_sprints ns ON s.sprint = ns.id
     WHERE ns.status = 'closed' AND s.sprint IS NOT NULL
     GROUP BY s.sprint
     ORDER BY ns.sort_order`,
  )

  const sprints = (rows as Array<{ sprint: string; done_sp: number; total_sp: number; story_count: number }>)
  const doneSPs = sprints.map(s => s.done_sp)
  const avgVelocity = doneSPs.length ? Math.round(doneSPs.reduce((a, b) => a + b, 0) / doneSPs.length) : 0
  const lastThree = doneSPs.slice(-3)
  const recentAvg = lastThree.length ? Math.round(lastThree.reduce((a, b) => a + b, 0) / lastThree.length) : 0

  return c.json({
    sprints,
    avgVelocity,
    recentAvgVelocity: recentAvg,
    sprintCount: sprints.length,
  })
})

// GET /sprints/timeline — full sprint timeline
app.get('/sprints/timeline', async (c) => {
  const sprints = await query(
    'SELECT id, COALESCE(label, title) AS label, theme, status, start_date, end_date, velocity, team_size FROM nav_sprints ORDER BY sort_order',
  )
  if (sprints.error) return c.json({ error: sprints.error }, 500)

  const timeline = []
  for (const s of sprints.rows as Array<Record<string, unknown>>) {
    const stories = await query(
      `SELECT status, story_points FROM pm_stories WHERE sprint = ?`,
      [s.id as string],
    )
    const storyRows = (stories.rows ?? []) as Array<{ status: string; story_points: number | null }>
    const total = storyRows.length
    const done = storyRows.filter(r => r.status === 'done').length
    const totalSP = storyRows.reduce((sum, r) => sum + (r.story_points ?? 0), 0)
    const doneSP = storyRows.filter(r => r.status === 'done').reduce((sum, r) => sum + (r.story_points ?? 0), 0)

    timeline.push({
      id: s.id,
      label: s.label,
      theme: s.theme,
      status: s.status,
      startDate: s.start_date,
      endDate: s.end_date,
      velocity: s.velocity,
      teamSize: s.team_size,
      storyCount: total,
      doneCount: done,
      totalSP,
      doneSP,
      completionRate: totalSP > 0 ? Math.round((doneSP / totalSP) * 100) : 0,
    })
  }

  return c.json({ timeline })
})

// GET /sprints/:id
app.get('/sprints/:id', async (c) => {
  const id = c.req.param('id')
  const result = await query<Record<string, unknown>>(
    'SELECT id, COALESCE(label, title) AS label, theme, status, active, start_date, end_date, velocity, team_size, sort_order, created_at, updated_at FROM nav_sprints WHERE id = ?',
    [id],
  )
  if (!result.rows.length) return c.json({ error: 'Not found' }, 404)
  return c.json(result.rows[0])
})

// PATCH /sprints/:id
app.patch('/sprints/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{
    label?: string; theme?: string; startDate?: string; endDate?: string; status?: string
  }>()
  const sets: string[] = []
  const args: (string | number | null)[] = []

  if (body.label !== undefined) {
    sets.push('label = ?'); args.push(body.label)
    sets.push('title = ?'); args.push(body.label) // 레거시 컬럼 동기화
  }
  if (body.theme !== undefined) { sets.push('theme = ?'); args.push(body.theme) }
  if (body.startDate !== undefined) { sets.push('start_date = ?'); args.push(body.startDate) }
  if (body.endDate !== undefined) { sets.push('end_date = ?'); args.push(body.endDate) }
  if (body.status !== undefined) { sets.push('status = ?'); args.push(body.status) }

  if (sets.length === 0) return c.json({ ok: true })

  sets.push('updated_at = CURRENT_TIMESTAMP')
  args.push(id)
  const { rowsAffected } = await executeOrThrow(`UPDATE nav_sprints SET ${sets.join(', ')} WHERE id = ?`, args)
  return c.json({ ok: true })
})

// POST /sprints/:id/status — transition sprint status (planning → active → closed)
app.post('/sprints/:id/status', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ status: string }>()
  const validStatuses = ['planning', 'active', 'closed']
  if (!validStatuses.includes(body.status)) {
    return c.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, 400)
  }

  // If activating, also set active=1 and deactivate others
  if (body.status === 'active') {
    const r1 = await execute('UPDATE nav_sprints SET active = 0, updated_at = CURRENT_TIMESTAMP', [])
    if (r1.error) return c.json({ error: r1.error }, 500)
    const r2 = await execute(
      'UPDATE nav_sprints SET status = ?, active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [body.status, id],
    )
    if (r2.error) return c.json({ error: r2.error }, 500)
    if (r2.rowsAffected === 0) return c.json({ error: `Sprint '${id}' not found` }, 404)
    return c.json({ ok: true })
  }

  // If closing, also set active=0
  const active = body.status === 'planning' ? null : 0
  const sets = ['status = ?', 'updated_at = CURRENT_TIMESTAMP']
  const args: (string | number | null)[] = [body.status]
  if (active !== null) { sets.push('active = ?'); args.push(active) }
  args.push(id)

  const { rowsAffected } = await executeOrThrow(`UPDATE nav_sprints SET ${sets.join(', ')} WHERE id = ?`, args)
  if (rowsAffected === 0) return c.json({ error: `Sprint '${id}' not found` }, 404)
  return c.json({ ok: true })
})

// DELETE /sprints/:id
app.delete('/sprints/:id', async (c) => {
  const id = c.req.param('id')
  const r = await execute('DELETE FROM nav_sprints WHERE id = ?', [id])
  if (r.error) return c.json({ error: r.error }, 500)
  return c.json({ ok: true })
})

// POST /sprints/:id/kickoff — sprint kickoff
app.post('/sprints/:id/kickoff', async (c) => {
  const sprintId = c.req.param('id')
  const body = await c.req.json<{
    storyIds: number[]
    teamMembers?: string[]
    velocity?: number
  }>()

  if (!body.storyIds?.length) {
    return c.json({ error: 'storyIds required (stories selected from backlog)' }, 400)
  }

  // 1. Check sprint status — only planning can kickoff
  const sprint = await query('SELECT id, status FROM nav_sprints WHERE id = ?', [sprintId])
  if (sprint.error || !sprint.rows.length) return c.json({ error: 'Sprint not found' }, 404)
  const currentStatus = (sprint.rows[0] as { status: string }).status
  if (currentStatus !== 'planning') {
    return c.json({ error: `Kickoff only available in planning state (current: ${currentStatus})` }, 400)
  }

  // 2. SP total vs velocity check (warning only, does not block)
  const storyPlaceholders = body.storyIds.map(() => '?').join(', ')
  const stories = await query(
    `SELECT id, title, story_points FROM pm_stories WHERE id IN (${storyPlaceholders})`,
    body.storyIds,
  )
  if (stories.error) return c.json({ error: stories.error }, 500)
  const totalSP = (stories.rows as Array<{ story_points: number | null }>)
    .reduce((sum, s) => sum + (s.story_points ?? 0), 0)
  const velocityWarning = body.velocity && totalSP > body.velocity
    ? `Warning: SP total (${totalSP}) exceeds velocity (${body.velocity})` : null

  // 3. Assign selected stories to this sprint
  const assignResult = await execute(
    `UPDATE pm_stories SET sprint = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${storyPlaceholders})`,
    [sprintId, ...body.storyIds],
  )
  if (assignResult.error) return c.json({ error: assignResult.error }, 500)

  // 4. Deactivate existing active sprint + activate this one
  await execute('UPDATE nav_sprints SET active = 0, status = \'closed\', updated_at = CURRENT_TIMESTAMP WHERE active = 1 AND id != ?', [sprintId])
  await execute(
    'UPDATE nav_sprints SET status = \'active\', active = 1, velocity = ?, team_size = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [body.velocity ?? null, body.teamMembers?.length ?? null, sprintId],
  )

  return c.json({
    ok: true,
    sprint: sprintId,
    storiesAssigned: body.storyIds.length,
    totalSP,
    velocity: body.velocity ?? null,
    velocityWarning,
    teamMembers: body.teamMembers ?? [],
  })
})

// POST /sprints/:id/activate
app.post('/sprints/:id/activate', async (c) => {
  const id = c.req.param('id')
  const r1 = await execute('UPDATE nav_sprints SET active = 0, updated_at = CURRENT_TIMESTAMP', [])
  if (r1.error) return c.json({ error: r1.error }, 500)
  const r2 = await execute('UPDATE nav_sprints SET active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id])
  if (r2.error) return c.json({ error: r2.error }, 500)
  return c.json({ ok: true })
})

// ── Story-level carry-over (epics are global, stories move between sprints) ──

// POST /stories/carry-over
app.post('/stories/carry-over', async (c) => {
  const body = await c.req.json<{
    storyIds: number[]
    targetSprint: string
  }>()

  if (!body.storyIds?.length || !body.targetSprint) {
    return c.json({ error: 'storyIds and targetSprint required' }, 400)
  }

  const placeholders = body.storyIds.map(() => '?').join(', ')
  const { rowsAffected } = await executeOrThrow(
    `UPDATE pm_stories SET sprint = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
    [body.targetSprint, ...body.storyIds],
  )
  return c.json({ ok: true, moved: body.storyIds.length })
})

// ── Legacy carry-over (deprecated, backward compat) ──
app.post('/epics/carry-over', async (c) => {
  return c.json({ error: 'Deprecated. Use POST /stories/carry-over instead.' }, 410)
})

export default app
