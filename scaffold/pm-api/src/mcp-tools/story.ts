import { query, execute } from '../db/adapter.js'
import { text, err, today, resolveSprint, notify, checkRateLimit, emitAgentEvent, validateAssignee, resolveMemberId, type ToolResult } from './utils.js'

export async function toolListStories(args: Record<string, unknown>): Promise<ToolResult> {
  const isBacklog = (args.sprint as string)?.toLowerCase() === 'backlog'
  const sprint = isBacklog ? null : await resolveSprint(args.sprint as string | undefined)
  if (!isBacklog && !sprint) return err('Please specify a sprint.')

  let sql = `SELECT s.id, s.title, s.status, s.priority, s.assignee, s.area, s.story_points,
             e.id as epic_id, e.title as epic_title
             FROM pm_stories s LEFT JOIN pm_epics e ON s.epic_id = e.id`
  const sqlArgs: (string | number)[] = []

  if (isBacklog) {
    sql += ' WHERE s.sprint IS NULL'
  } else {
    sql += ' WHERE s.sprint = ?'
    sqlArgs.push(sprint!)
  }

  if (args.epic_id !== undefined) { sql += ' AND s.epic_id = ?'; sqlArgs.push(args.epic_id as number) }
  if (args.status) { sql += ' AND s.status = ?'; sqlArgs.push(args.status as string) }
  if (args.assignee) { sql += ' AND s.assignee LIKE ?'; sqlArgs.push(`%${args.assignee as string}%`) }
  sql += ' ORDER BY e.title, s.sort_order'

  const result = await query<{
    id: number; title: string; status: string; priority: string; assignee: string | null
    area: string; story_points: number | null; epic_id: number | null; epic_title: string | null
  }>(sql, sqlArgs)
  if (result.error) return err(result.error)
  const label = isBacklog ? 'Backlog' : sprint!.toUpperCase()
  if (result.rows.length === 0) return text(`No stories in ${label}.`)

  const statusIcon: Record<string, string> = { draft: '📝', backlog: '📋', ready: '🟡', 'in-progress': '🔵', review: '🟣', done: '✅' }
  const priorityIcon: Record<string, string> = { low: '⬇️', medium: '➡️', high: '⬆️', critical: '🔴' }

  const lines = [`📖 ${label} Stories (${result.rows.length})`, '─────────────']
  let lastEpic: string | null = null
  for (const s of result.rows) {
    const epic = s.epic_title ?? '(No epic)'
    if (epic !== lastEpic) { lines.push(`\n🏷 ${epic}`); lastEpic = epic }
    const pts = s.story_points ? ` ${s.story_points}pt` : ''
    lines.push(`  ${statusIcon[s.status] ?? '⬜'} [S${s.id}] ${s.title} ${priorityIcon[s.priority] ?? ''}${pts} (${s.assignee ?? 'Unassigned'})`)
  }
  return text(lines.join('\n'))
}

export async function toolListBacklog(args: Record<string, unknown>): Promise<ToolResult> {
  let sql = `SELECT s.id, s.title, s.status, s.priority, s.assignee, s.area, s.story_points,
             e.id as epic_id, e.title as epic_title
             FROM pm_stories s LEFT JOIN pm_epics e ON s.epic_id = e.id WHERE s.sprint IS NULL`
  const sqlArgs: (string | number)[] = []

  if (args.epic_id !== undefined) { sql += ' AND s.epic_id = ?'; sqlArgs.push(args.epic_id as number) }
  if (args.status) { sql += ' AND s.status = ?'; sqlArgs.push(args.status as string) }
  if (args.assignee) { sql += ' AND s.assignee LIKE ?'; sqlArgs.push(`%${args.assignee as string}%`) }
  sql += ' ORDER BY e.title, s.sort_order'

  const result = await query<{
    id: number; title: string; status: string; priority: string; assignee: string | null
    area: string; story_points: number | null; epic_id: number | null; epic_title: string | null
  }>(sql, sqlArgs)
  if (result.error) return err(result.error)
  if (result.rows.length === 0) return text('No stories in backlog.')

  const statusIcon: Record<string, string> = { draft: '📝', backlog: '📋', ready: '🟡', 'in-progress': '🔵', review: '🟣', done: '✅' }
  const priorityIcon: Record<string, string> = { low: '⬇️', medium: '➡️', high: '⬆️', critical: '🔴' }

  const lines = [`📦 Backlog Stories (${result.rows.length})`, '─────────────']
  let lastEpic: string | null = null
  for (const s of result.rows) {
    const epic = s.epic_title ?? '(No epic)'
    if (epic !== lastEpic) { lines.push(`\n🏷 ${epic}`); lastEpic = epic }
    const pts = s.story_points ? ` ${s.story_points}pt` : ''
    lines.push(`  ${statusIcon[s.status] ?? '⬜'} [S${s.id}] ${s.title} ${priorityIcon[s.priority] ?? ''}${pts} (${s.assignee ?? 'Unassigned'})`)
  }
  return text(lines.join('\n'))
}

export async function toolAddStory(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const title = args.title as string
  const sprintArg = args.sprint as string | undefined
  const isBacklog = !sprintArg || sprintArg.toLowerCase() === 'backlog'
  const sprint = isBacklog ? null : await resolveSprint(sprintArg)

  const epicId = (args.epic_id as number) ?? null
  const description = (args.description as string) ?? null
  const acceptanceCriteria = (args.acceptance_criteria as string) ?? null
  const assignee = (args.assignee as string) ?? null
  const assigneeErr = await validateAssignee(assignee)
  if (assigneeErr) return err(assigneeErr)
  const assigneeId = assignee ? await resolveMemberId(assignee) : null
  const priority = (args.priority as string) || 'medium'
  const area = (args.area as string) || 'FE'
  const storyPoints = (args.story_points as number) ?? null

  const maxResult = sprint
    ? await query<{ max_order: number | null }>('SELECT MAX(sort_order) as max_order FROM pm_stories WHERE sprint = ?', [sprint])
    : await query<{ max_order: number | null }>('SELECT MAX(sort_order) as max_order FROM pm_stories WHERE sprint IS NULL')
  const sortOrder = (maxResult.rows[0]?.max_order ?? -1) + 1

  const epicUid = epicId ? `pm:${epicId}` : 'pm:0'

  const result = await execute(
    'INSERT INTO pm_stories (epic_id, epic_uid, sprint, title, description, acceptance_criteria, assignee, assignee_id, status, priority, area, story_points, sort_order, start_date, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [epicId, epicUid, sprint, title, description, acceptanceCriteria, assignee, assigneeId, 'backlog', priority, area, storyPoints, sortOrder, (args.start_date as string) ?? null, (args.due_date as string) ?? null],
  )
  if (result.error) return err(result.error)
  const idResult = await query<{ id: number }>('SELECT last_insert_rowid() as id')
  const newId = idResult.rows[0]?.id ?? '?'

  // Notify assignee(s)
  if (assignee) {
    for (const a of assignee.split(',').map(s => s.trim()).filter(Boolean)) {
      await notify(a, 'story_assigned', `Story assigned: ${title}`, `${user} assigned story [S${newId}].`, 'story', String(newId), 'board', user)
    }
  }

  const epicLabel = epicId ? ` (Epic #${epicId})` : ''
  const sprintLabel = sprint ? sprint.toUpperCase() : 'Backlog'
  return text(`✅ Story created${epicLabel}: ${title} (ID: ${newId}, ${sprintLabel})`)
}

export async function toolUpdateStory(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const storyId = args.story_id as number

  // Get current story for notification comparison
  const current = await query<{ assignee: string | null; title: string }>(
    'SELECT assignee, title FROM pm_stories WHERE id = ?', [storyId],
  )
  if (current.error) return err(current.error)
  if (current.rows.length === 0) return err(`Story #${storyId} not found.`)
  const oldAssignee = current.rows[0].assignee
  const storyTitle = current.rows[0].title

  if (args.assignee !== undefined) {
    const assigneeErr = await validateAssignee(args.assignee as string | null)
    if (assigneeErr) return err(assigneeErr)
  }

  // Normalize sprint='backlog' to NULL
  if (args.sprint !== undefined) {
    const sv = args.sprint as string | null
    if (sv === null || (typeof sv === 'string' && sv.toLowerCase() === 'backlog')) {
      args.sprint = null
    }
  }

  const fieldMap: Record<string, string> = {
    title: 'title', description: 'description', acceptance_criteria: 'acceptance_criteria',
    assignee: 'assignee', status: 'status', priority: 'priority', area: 'area',
    story_points: 'story_points', figma_url: 'figma_url', epic_id: 'epic_id', sprint: 'sprint',
  }
  const sets: string[] = []
  const sqlArgs: (string | number | null)[] = []

  for (const [key, col] of Object.entries(fieldMap)) {
    if (args[key] !== undefined) {
      sets.push(`${col} = ?`)
      sqlArgs.push(args[key] as string | number | null)
    }
  }

  // Also update assignee_id when assignee changes
  if (args.assignee !== undefined) {
    const newAssignee = args.assignee as string | null
    const newAssigneeId = newAssignee ? await resolveMemberId(newAssignee) : null
    sets.push('assignee_id = ?')
    sqlArgs.push(newAssigneeId)
  }

  if (sets.length === 0) return text('No fields to update.')

  sets.push('updated_at = CURRENT_TIMESTAMP')
  sqlArgs.push(storyId)
  const result = await execute(`UPDATE pm_stories SET ${sets.join(', ')} WHERE id = ?`, sqlArgs)
  if (result.error) return err(result.error)
  if (result.rowsAffected === 0) return err(`Story #${storyId} not found.`)

  // Notify new assignee(s) on assignment change
  if (args.assignee !== undefined) {
    const newAssignee = args.assignee as string | null
    if (newAssignee) {
      const oldSet = new Set((oldAssignee ?? '').split(',').map(s => s.trim()).filter(Boolean))
      for (const a of newAssignee.split(',').map(s => s.trim()).filter(Boolean)) {
        if (!oldSet.has(a)) {
          await notify(a, 'story_assigned', `Story assigned: ${storyTitle}`, `${user} assigned story [S${storyId}].`, 'story', String(storyId), 'board', user)
        }
      }
    }
  }

  // Agent webhook notification (on status change)
  if (args.status !== undefined) {
    const assignee = (args.assignee as string) ?? oldAssignee
    if (assignee) {
      const { notifyByName } = await import('../utils/agent-notify.js')
      await notifyByName(assignee, `📌 Status changed`, `S${storyId}: ${storyTitle}\nStatus: ${args.status}`)
    }
  }

  return text(`✅ Story #${storyId} updated`)
}

export async function toolDeleteStory(args: Record<string, unknown>): Promise<ToolResult> {
  const storyId = args.story_id as number
  const r1 = await execute('DELETE FROM pm_tasks WHERE story_id = ?', [storyId])
  if (r1.error) return err(r1.error)
  const r2 = await execute('DELETE FROM pm_stories WHERE id = ?', [storyId])
  if (r2.error) return err(r2.error)
  if (r2.rowsAffected === 0) return err(`Story #${storyId} not found.`)
  return text(`✅ Story #${storyId} deleted (${r1.rowsAffected} tasks also deleted)`)
}

export async function toolAssignStory(args: Record<string, unknown>): Promise<ToolResult> {
  const storyId = args.story_id as number
  const sprintId = args.sprint_id as string
  if (!storyId || !sprintId) return err('story_id, sprint_id required')
  const r = await execute('UPDATE pm_stories SET sprint = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [sprintId, storyId])
  if (r.error) return err(r.error)
  return text(`✅ S${storyId} → ${sprintId} assigned`)
}

export async function toolUnassignStory(args: Record<string, unknown>): Promise<ToolResult> {
  const storyId = args.story_id as number
  if (!storyId) return err('story_id required')
  const r = await execute('UPDATE pm_stories SET sprint = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [storyId])
  if (r.error) return err(r.error)
  return text(`✅ S${storyId} → backlog unassigned`)
}
