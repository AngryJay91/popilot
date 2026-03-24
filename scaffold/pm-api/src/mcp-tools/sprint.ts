import { query, execute } from '../db/adapter.js'
import { text, err, today, resolveSprint, notify, checkRateLimit, emitAgentEvent, validateAssignee, resolveMemberId, progressBar, type ToolResult } from './utils.js'

export async function toolListSprints(): Promise<ToolResult> {
  const result = await query<{ id: string; title: string; active: number; start_date: string | null; end_date: string | null }>(
    'SELECT id, title, active, start_date, end_date FROM nav_sprints ORDER BY id DESC',
  )
  if (result.error) return err(result.error)
  if (result.rows.length === 0) return text('No sprints found.')

  const lines = ['📅 Sprint List', '─────────────']
  for (const s of result.rows) {
    const marker = s.active ? ' ← active' : ''
    const icon = s.active ? '🟢' : '⚪'
    const dates = s.start_date && s.end_date ? ` (${s.start_date} ~ ${s.end_date})` : ''
    lines.push(`${icon} ${s.id}: ${s.title}${dates}${marker}`)
  }
  return text(lines.join('\n'))
}

export async function toolActivateSprint(args: Record<string, unknown>): Promise<ToolResult> {
  const sprintId = args.sprint_id as string
  const r1 = await execute('UPDATE nav_sprints SET active = 0 WHERE active = 1', [])
  if (r1.error) return err(r1.error)
  const r2 = await execute('UPDATE nav_sprints SET active = 1 WHERE id = ?', [sprintId])
  if (r2.error) return err(r2.error)
  if (r2.rowsAffected === 0) return err(`Sprint '${sprintId}' not found.`)
  return text(`✅ Sprint ${sprintId} activated.`)
}

export async function toolCloseSprint(args: Record<string, unknown>): Promise<ToolResult> {
  const sprintId = args.sprint_id as string

  // Check status
  const sprint = await query<{ id: string; status: string }>('SELECT id, status FROM nav_sprints WHERE id = ?', [sprintId])
  if (sprint.error) return err(sprint.error)
  if (!sprint.rows.length) return err(`Sprint '${sprintId}' not found`)
  if (sprint.rows[0].status !== 'active') return err(`Can only close sprints in active state (current: ${sprint.rows[0].status})`)

  // Fetch stories
  const stories = await query<{ id: number; title: string; sprint: string | null; status: string; story_points: number | null; assignee: string | null }>(
    'SELECT id, title, sprint, status, story_points, assignee FROM pm_stories WHERE sprint = ?', [sprintId])
  if (stories.error) return err(stories.error)

  const { getIncompleteStories, getCompletedStories, generateCloseSummary } = await import('../utils/sprint-lifecycle.js')
  const completed = getCompletedStories(stories.rows)
  const incomplete = getIncompleteStories(stories.rows)
  const summary = generateCloseSummary(sprintId, stories.rows)

  // Incomplete → backlog
  if (incomplete.length > 0) {
    const ids = incomplete.map((s: { id: number }) => s.id)
    const ph = ids.map(() => '?').join(', ')
    await execute(`UPDATE pm_stories SET sprint = NULL, updated_at = CURRENT_TIMESTAMP WHERE id IN (${ph})`, ids)
  }

  // Close
  await execute(`UPDATE nav_sprints SET status = 'closed', active = 0, velocity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [summary.doneSP, sprintId])

  // Create retro session
  try { await execute(`INSERT OR IGNORE INTO retro_sessions (sprint, phase) VALUES (?, 'collect')`, [sprintId]) } catch (_) {}

  const lines = [
    `🏁 ${sprintId} Sprint closed!`,
    '─────────────',
    `Completed: ${completed.length} (${summary.doneSP} SP)`,
    `Incomplete: ${incomplete.length} → Returned to backlog`,
    `Completion rate: ${summary.completionRate}%`,
  ]
  if (incomplete.length > 0) {
    lines.push('', 'Stories returned to backlog:')
    for (const s of incomplete) lines.push(`  • S${s.id}: ${s.title}`)
  }
  return text(lines.join('\n'))
}

export async function toolCheckinSprint(args: Record<string, unknown>): Promise<ToolResult> {
  const sprintId = args.sprint_id as string
  const memberIds = args.member_ids as number[]
  if (!sprintId || !memberIds?.length) return err('sprint_id, member_ids required')
  await execute('DELETE FROM sprint_members WHERE sprint_id = ?', [sprintId])
  for (const mid of memberIds) {
    await execute('INSERT OR REPLACE INTO sprint_members (sprint_id, member_id, working_days) VALUES (?, ?, 0)', [sprintId, mid])
  }
  await execute('UPDATE nav_sprints SET team_size = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [memberIds.length, sprintId])
  return text(`✅ ${sprintId} check-in: ${memberIds.length} members registered`)
}

export async function toolAddAbsence(args: Record<string, unknown>): Promise<ToolResult> {
  const sprintId = args.sprint_id as string
  const memberId = args.member_id as number
  const dates = args.dates as string[]
  const reason = (args.reason as string) ?? null
  if (!sprintId || !memberId || !dates?.length) return err('sprint_id, member_id, dates required')
  for (const d of dates) {
    await execute('INSERT OR IGNORE INTO member_absences (sprint_id, member_id, absence_date, reason) VALUES (?, ?, ?, ?)', [sprintId, memberId, d, reason])
  }
  return text(`✅ ${sprintId} absence registered: ${dates.length} day(s)`)
}

export async function toolGetVelocity(): Promise<ToolResult> {
  const result = await query<{ sprint: string; done_sp: number; total_sp: number; story_count: number }>(
    `SELECT s.sprint,
            SUM(CASE WHEN s.status = 'done' THEN COALESCE(s.story_points, 0) ELSE 0 END) as done_sp,
            SUM(COALESCE(s.story_points, 0)) as total_sp,
            COUNT(*) as story_count
     FROM pm_stories s
     JOIN nav_sprints ns ON s.sprint = ns.id
     WHERE ns.status = 'closed' AND s.sprint IS NOT NULL
     GROUP BY s.sprint
     ORDER BY ns.sort_order`)
  if (result.error) return err(result.error)

  const sprints = result.rows
  const doneSPs = sprints.map(s => s.done_sp)
  const avgVelocity = doneSPs.length ? Math.round(doneSPs.reduce((a, b) => a + b, 0) / doneSPs.length) : 0
  const lastThree = doneSPs.slice(-3)
  const recentAvg = lastThree.length ? Math.round(lastThree.reduce((a, b) => a + b, 0) / lastThree.length) : 0

  const lines = [
    '📊 Velocity Report',
    '─────────────',
    `Overall average: ${avgVelocity} SP (${sprints.length} sprints)`,
    `Recent 3 average: ${recentAvg} SP`,
    '',
    'Sprint results:',
  ]
  for (const s of sprints) {
    lines.push(`  ${s.sprint}: ${s.done_sp}/${s.total_sp} SP (${s.story_count} stories)`)
  }
  if (!sprints.length) lines.push('  (No completed sprints)')
  return text(lines.join('\n'))
}

export async function toolKickoffSprint(args: Record<string, unknown>): Promise<ToolResult> {
  const sprintId = args.sprint_id as string
  const storyIds = args.story_ids as number[]
  const teamMembers = (args.team_members as string[]) ?? []
  const velocity = (args.velocity as number) ?? null

  if (!storyIds?.length) return err('story_ids required')

  // Check sprint status
  const sprint = await query<{ id: string; status: string }>('SELECT id, status FROM nav_sprints WHERE id = ?', [sprintId])
  if (sprint.error) return err(sprint.error)
  if (!sprint.rows.length) return err(`Sprint '${sprintId}' not found`)
  if (sprint.rows[0].status !== 'planning') return err(`Kickoff is only available in planning state (current: ${sprint.rows[0].status})`)

  // Total SP
  const placeholders = storyIds.map(() => '?').join(', ')
  const stories = await query<{ id: number; title: string; story_points: number | null }>(
    `SELECT id, title, story_points FROM pm_stories WHERE id IN (${placeholders})`, storyIds)
  if (stories.error) return err(stories.error)
  const totalSP = stories.rows.reduce((sum, s) => sum + (s.story_points ?? 0), 0)

  // Assign stories
  const assignResult = await execute(
    `UPDATE pm_stories SET sprint = ?, updated_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`,
    [sprintId, ...storyIds])
  if (assignResult.error) return err(assignResult.error)

  // Activate sprint
  await execute('UPDATE nav_sprints SET active = 0, status = \'closed\', updated_at = CURRENT_TIMESTAMP WHERE active = 1 AND id != ?', [sprintId])
  await execute('UPDATE nav_sprints SET status = \'active\', active = 1, velocity = ?, team_size = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [velocity, teamMembers.length || null, sprintId])

  const lines = [
    `🚀 ${sprintId} Kickoff complete!`,
    `─────────────`,
    `Stories: ${storyIds.length} assigned`,
    `SP total: ${totalSP}${velocity ? ` / velocity: ${velocity}` : ''}`,
  ]
  if (velocity && totalSP > velocity) lines.push(`⚠️ SP exceeds velocity target!`)
  if (teamMembers.length) lines.push(`Members: ${teamMembers.join(', ')}`)
  return text(lines.join('\n'))
}

export async function toolSprintSummary(args: Record<string, unknown>): Promise<ToolResult> {
  const sprint = await resolveSprint(args.sprint as string | undefined)
  if (!sprint) return err('Please specify a sprint.')

  const [epicResult, assigneeResult, blockerResult] = await Promise.all([
    query<{ epic_title: string; total: number; done: number }>(`SELECT COALESCE(e.title, '(No epic)') as epic_title, COUNT(t.id) as total, SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done FROM pm_tasks t JOIN pm_stories s ON t.story_id = s.id LEFT JOIN pm_epics e ON s.epic_id = e.id WHERE s.sprint = ? GROUP BY e.title ORDER BY e.title`, [sprint]),
    query<{ assignee: string; total: number; done: number; in_progress: number; todo: number }>(`SELECT COALESCE(t.assignee, 'Unassigned') as assignee, COUNT(t.id) as total, SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done, SUM(CASE WHEN t.status = 'in-progress' THEN 1 ELSE 0 END) as in_progress, SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo FROM pm_tasks t JOIN pm_stories s ON t.story_id = s.id WHERE s.sprint = ? GROUP BY t.assignee ORDER BY total DESC`, [sprint]),
    query<{ user_name: string; blockers: string; entry_date: string }>(`SELECT user_name, blockers, entry_date FROM pm_standup_entries WHERE sprint = ? AND blockers IS NOT NULL AND blockers != '' ORDER BY entry_date DESC LIMIT 10`, [sprint]),
  ])

  const lines = [`📊 ${sprint.toUpperCase()} Sprint Summary`, '─────────────']
  if (!epicResult.error) for (const e of epicResult.rows) {
    const pct = e.total > 0 ? Math.round((e.done / e.total) * 100) : 0
    lines.push(`🏷 ${e.epic_title}: ${progressBar(e.done, e.total)} ${e.done}/${e.total} (${pct}%)`)
  }
  if (!assigneeResult.error && assigneeResult.rows.length > 0) {
    lines.push('')
    for (const a of assigneeResult.rows) lines.push(`👤 ${a.assignee}: ${a.total} tasks (done ${a.done}, in-progress ${a.in_progress}, todo ${a.todo})`)
  }
  if (!blockerResult.error && blockerResult.rows.length > 0) {
    lines.push('', `🚧 Blockers: ${blockerResult.rows.length}`)
    for (const b of blockerResult.rows) lines.push(`  - [${b.entry_date}] ${b.user_name}: ${b.blockers}`)
  } else {
    lines.push('', '🚧 Blockers: 0')
  }
  return text(lines.join('\n'))
}
