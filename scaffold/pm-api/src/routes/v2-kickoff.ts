import { Hono } from 'hono'
import type { AppEnv } from '../types.js'
import { query, execute } from '../db/adapter.js'
import { queryOrThrow, executeOrThrow } from '../utils/db.js'

const app = new Hono<AppEnv>()

/** Count working days (excluding Sat/Sun) */
function countWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  let count = 0
  const d = new Date(start)
  while (d <= end) {
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

// POST /create — create sprint (planning state)
app.post('/create', async (c) => {
  const body = await c.req.json<{
    id: string; label: string; theme?: string
    startDate: string; endDate: string
  }>()
  if (!body.id || !body.startDate || !body.endDate) {
    return c.json({ error: 'id, startDate, endDate required' }, 400)
  }
  const { rowsAffected } = await executeOrThrow(
    `INSERT INTO nav_sprints (id, title, label, theme, start_date, end_date, status, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, 'planning', 0)`,
    [body.id, body.label || body.id.toUpperCase(), body.label || body.id.toUpperCase(), body.theme ?? null, body.startDate, body.endDate],
  )

  const totalWorkingDays = countWorkingDays(body.startDate, body.endDate)
  return c.json({ ok: true, sprintId: body.id, totalWorkingDays })
})

// POST /:id/checkin — team member check-in
app.post('/:id/checkin', async (c) => {
  const sprintId = c.req.param('id')
  const body = await c.req.json<{ memberIds: number[] }>()
  if (!body.memberIds?.length) return c.json({ error: 'memberIds required' }, 400)

  // Get sprint dates
  const sprint = await query<{ start_date: string; end_date: string; status: string }>(
    'SELECT start_date, end_date, status FROM nav_sprints WHERE id = ?', [sprintId],
  )
  if (!sprint.rows.length) return c.json({ error: 'Sprint not found' }, 404)
  if (sprint.rows[0].status !== 'planning') {
    return c.json({ error: 'Check-in only available in planning state' }, 400)
  }

  const totalDays = countWorkingDays(sprint.rows[0].start_date, sprint.rows[0].end_date)

  // Reset existing check-ins + register new
  await execute('DELETE FROM sprint_members WHERE sprint_id = ?', [sprintId])

  for (const memberId of body.memberIds) {
    // Get absence count for this member
    const absences = await query<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM member_absences WHERE sprint_id = ? AND member_id = ?',
      [sprintId, memberId],
    )
    const absenceCount = absences.rows[0]?.cnt ?? 0
    const workingDays = Math.max(0, totalDays - absenceCount)

    await execute(
      'INSERT OR REPLACE INTO sprint_members (sprint_id, member_id, working_days) VALUES (?, ?, ?)',
      [sprintId, memberId, workingDays],
    )
  }

  // Team total working days = velocity
  const teamResult = await query<{ total: number }>(
    'SELECT SUM(working_days) as total FROM sprint_members WHERE sprint_id = ?', [sprintId],
  )
  const velocity = teamResult.rows[0]?.total ?? 0
  await execute(
    'UPDATE nav_sprints SET velocity = ?, team_size = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [velocity, body.memberIds.length, sprintId],
  )

  return c.json({ ok: true, velocity, teamSize: body.memberIds.length, totalWorkingDays: totalDays })
})

// POST /:id/absence — register absence
app.post('/:id/absence', async (c) => {
  const sprintId = c.req.param('id')
  const body = await c.req.json<{
    memberId: number; dates: string[]; reason?: string
  }>()
  if (!body.memberId || !body.dates?.length) return c.json({ error: 'memberId, dates required' }, 400)

  for (const date of body.dates) {
    await execute(
      'INSERT OR IGNORE INTO member_absences (sprint_id, member_id, absence_date, reason) VALUES (?, ?, ?, ?)',
      [sprintId, body.memberId, date, body.reason ?? null],
    )
  }

  // Recalculate working_days
  const sprint = await query<{ start_date: string; end_date: string }>(
    'SELECT start_date, end_date FROM nav_sprints WHERE id = ?', [sprintId],
  )
  if (sprint.rows.length) {
    const totalDays = countWorkingDays(sprint.rows[0].start_date, sprint.rows[0].end_date)
    const absences = await query<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM member_absences WHERE sprint_id = ? AND member_id = ?',
      [sprintId, body.memberId],
    )
    const workingDays = Math.max(0, totalDays - (absences.rows[0]?.cnt ?? 0))
    await execute(
      'UPDATE sprint_members SET working_days = ? WHERE sprint_id = ? AND member_id = ?',
      [workingDays, sprintId, body.memberId],
    )

    // Recalculate velocity
    const teamResult = await query<{ total: number }>(
      'SELECT SUM(working_days) as total FROM sprint_members WHERE sprint_id = ?', [sprintId],
    )
    await execute('UPDATE nav_sprints SET velocity = ? WHERE id = ?', [teamResult.rows[0]?.total ?? 0, sprintId])
  }

  return c.json({ ok: true })
})

// DELETE /:id/absence — delete absence
app.delete('/:id/absence', async (c) => {
  const sprintId = c.req.param('id')
  const body = await c.req.json<{ memberId: number; date: string }>()
  await execute(
    'DELETE FROM member_absences WHERE sprint_id = ? AND member_id = ? AND absence_date = ?',
    [sprintId, body.memberId, body.date],
  )
  return c.json({ ok: true })
})

// GET /:id/plan — kickoff plan status (checked-in members + absences + velocity)
app.get('/:id/plan', async (c) => {
  const sprintId = c.req.param('id')

  const [sprint, members, absences, stories] = await Promise.all([
    query<{ id: string; label: string; status: string; start_date: string; end_date: string; velocity: number | null; team_size: number | null }>(
      'SELECT id, COALESCE(label, title) AS label, theme, status, start_date, end_date, velocity, team_size, sort_order, updated_at FROM nav_sprints WHERE id = ?', [sprintId]),
    query<{ member_id: number; working_days: number; display_name: string }>(
      `SELECT sm.member_id, sm.working_days, m.display_name
       FROM sprint_members sm JOIN members m ON sm.member_id = m.id
       WHERE sm.sprint_id = ?`, [sprintId]),
    query<{ member_id: number; absence_date: string; reason: string | null }>(
      'SELECT member_id, absence_date, reason FROM member_absences WHERE sprint_id = ?', [sprintId]),
    query<{ id: number; title: string; story_points: number | null; assignee: string | null }>(
      'SELECT id, title, story_points, assignee FROM pm_stories WHERE sprint = ?', [sprintId]),
  ])

  if (!sprint.rows.length) return c.json({ error: 'Sprint not found' }, 404)
  const s = sprint.rows[0]
  const totalWorkingDays = countWorkingDays(s.start_date, s.end_date)
  const totalSP = (stories.rows as Array<{ story_points: number | null }>).reduce((sum, st) => sum + (st.story_points ?? 0), 0)

  return c.json({
    sprint: s,
    totalWorkingDays,
    members: members.rows,
    absences: absences.rows,
    stories: stories.rows,
    totalSP,
    velocity: s.velocity ?? 0,
  })
})

// GET /:id/close-preview — close preview
app.get('/:id/close-preview', async (c) => {
  const sprintId = c.req.param('id')

  const sprint = await query<{ id: string; status: string; start_date: string; end_date: string; velocity: number | null }>(
    'SELECT id, status, start_date, end_date, velocity FROM nav_sprints WHERE id = ?', [sprintId],
  )
  if (!sprint.rows.length) return c.json({ error: 'Sprint not found' }, 404)

  const stories = await query<{ id: number; title: string; sprint: string | null; status: string; story_points: number | null; assignee: string | null }>(
    'SELECT id, title, sprint, status, story_points, assignee FROM pm_stories WHERE sprint = ?', [sprintId],
  )

  const { generateCloseSummary, aggregateVelocity, getIncompleteStories } = await import('../utils/sprint-lifecycle.js')
  const summary = generateCloseSummary(sprintId, stories.rows)
  const velocity = aggregateVelocity(sprintId, stories.rows)
  const incomplete = getIncompleteStories(stories.rows)

  return c.json({
    sprint: sprint.rows[0],
    summary,
    velocity,
    incompleteStories: incomplete.map(s => ({ id: s.id, title: s.title, status: s.status, story_points: s.story_points, assignee: s.assignee })),
  })
})

// POST /:id/close — close sprint
app.post('/:id/close', async (c) => {
  const sprintId = c.req.param('id')

  // 1. Check sprint status
  const sprint = await query<{ id: string; status: string }>(
    'SELECT id, status FROM nav_sprints WHERE id = ?', [sprintId],
  )
  if (!sprint.rows.length) return c.json({ error: 'Sprint not found' }, 404)
  if (sprint.rows[0].status !== 'active') {
    return c.json({ error: `Close only available in active state (current: ${sprint.rows[0].status})` }, 400)
  }

  // 2. Get all sprint stories
  const stories = await query<{
    id: number; title: string; status: string; story_points: number | null; assignee: string | null
  }>('SELECT id, title, status, story_points, assignee FROM pm_stories WHERE sprint = ?', [sprintId])
  if (stories.error) return c.json({ error: stories.error }, 500)

  const allStories = stories.rows
  const completed = allStories.filter(s => s.status === 'done')
  const incomplete = allStories.filter(s => s.status !== 'done')

  // 3. Move incomplete stories to backlog
  if (incomplete.length > 0) {
    const ids = incomplete.map(s => s.id)
    const placeholders = ids.map(() => '?').join(', ')
    await execute(
      `UPDATE pm_stories SET sprint = NULL, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
      ids,
    )
  }

  // 4. Save velocity history
  const totalDoneSP = completed.reduce((sum, s) => sum + (s.story_points ?? 0), 0)
  const totalSP = allStories.reduce((sum, s) => sum + (s.story_points ?? 0), 0)
  await execute(
    `UPDATE nav_sprints SET status = 'closed', active = 0, velocity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [totalDoneSP, sprintId],
  )

  // 5. Auto-create retro session
  try {
    await execute(
      `INSERT OR IGNORE INTO retro_sessions (sprint, phase) VALUES (?, 'collect')`,
      [sprintId],
    )
  } catch (_) { /* Ignore if retro table doesn't exist */ }

  return c.json({
    ok: true,
    summary: {
      sprintId,
      completedCount: completed.length,
      incompleteCount: incomplete.length,
      totalStories: allStories.length,
      doneSP: totalDoneSP,
      totalSP,
      completionRate: totalSP > 0 ? Math.round((totalDoneSP / totalSP) * 100) : 0,
      movedToBacklog: incomplete.map(s => ({ id: s.id, title: s.title })),
    },
  })
})

export { countWorkingDays }
export default app
