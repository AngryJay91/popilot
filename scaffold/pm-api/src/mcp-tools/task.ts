import { query, execute } from '../db/adapter.js'
import { text, err, today, resolveSprint, notify, checkRateLimit, emitAgentEvent, validateAssignee, resolveMemberId, type ToolResult } from './utils.js'

export async function toolListTasks(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const sprint = await resolveSprint(args.sprint as string | undefined)
  if (!sprint) return err('Please specify a sprint.')
  const status = args.status as string | undefined

  let sql = `SELECT t.id as task_id, t.title as task_title, t.status as task_status, s.id as story_id, s.title as story_title, e.id as epic_id, e.title as epic_title FROM pm_tasks t JOIN pm_stories s ON t.story_id = s.id LEFT JOIN pm_epics e ON s.epic_id = e.id WHERE t.assignee = ? AND s.sprint = ?`
  const sqlArgs: (string | number)[] = [user, sprint]
  if (status) { sql += ' AND t.status = ?'; sqlArgs.push(status) }
  sql += ' ORDER BY e.title, s.sort_order, t.sort_order'

  const result = await query<{ task_id: number; task_title: string; task_status: string; story_id: number; story_title: string; epic_id: number | null; epic_title: string | null }>(sql, sqlArgs)
  if (result.error) return err(result.error)
  if (result.rows.length === 0) return text(`No tasks found for ${user}.`)

  const statusIcon: Record<string, string> = { todo: '⬜', 'in-progress': '🔵', done: '✅' }
  const tree = new Map<string, Map<string, Array<{ id: number; title: string; status: string }>>>()
  for (const r of result.rows) {
    const ek = r.epic_title ?? '(No epic)'
    if (!tree.has(ek)) tree.set(ek, new Map())
    const em = tree.get(ek)!
    const sk = `[S${r.story_id}] ${r.story_title}`
    if (!em.has(sk)) em.set(sk, [])
    em.get(sk)!.push({ id: r.task_id, title: r.task_title, status: r.task_status })
  }

  const lines: string[] = [`📋 ${user}'s Tasks (${sprint.toUpperCase()})`, '─────────────']
  for (const [epicTitle, stories] of tree) {
    lines.push(`\n🏷 ${epicTitle}`)
    for (const [storyTitle, tasks] of stories) {
      lines.push(`  📖 ${storyTitle}`)
      for (const t of tasks) lines.push(`    ${statusIcon[t.status] ?? '⬜'} [T${t.id}] ${t.title}`)
    }
  }
  return text(lines.join('\n'))
}

export async function toolGetTask(args: Record<string, unknown>): Promise<ToolResult> {
  const taskId = args.task_id as number
  const taskResult = await query<{ id: number; story_id: number; title: string; assignee: string | null; status: string; description: string | null; sort_order: number; created_at: string; updated_at: string }>('SELECT * FROM pm_tasks WHERE id = ?', [taskId])
  if (taskResult.error) return err(taskResult.error)
  if (taskResult.rows.length === 0) return err(`Task #${taskId} not found.`)

  const t = taskResult.rows[0]
  const [storyResult, siblingsResult] = await Promise.all([
    query<{ id: number; title: string; description: string | null; acceptance_criteria: string | null; assignee: string | null; status: string; sprint: string }>('SELECT id, title, description, acceptance_criteria, assignee, status, sprint FROM pm_stories WHERE id = ?', [t.story_id]),
    query<{ id: number; title: string; status: string; assignee: string | null }>('SELECT id, title, status, assignee FROM pm_tasks WHERE story_id = ? ORDER BY sort_order', [t.story_id]),
  ])

  const si: Record<string, string> = { todo: '⬜', 'in-progress': '🔵', done: '✅' }
  const s = storyResult.rows[0]
  const lines = [`📋 Task #${t.id}: ${t.title}`, '─────────────', `Status: ${si[t.status] ?? '⬜'} ${t.status}`, `Assignee: ${t.assignee ?? 'Unassigned'}`, t.description ? `Description: ${t.description}` : '', `Created: ${t.created_at} | Modified: ${t.updated_at}`].filter(Boolean)
  if (s) {
    lines.push('', `📖 Parent Story [S${s.id}]: ${s.title}`, `  Sprint: ${s.sprint} | Status: ${s.status} | Assignee: ${s.assignee ?? 'Unassigned'}`)
    if (s.description) lines.push(`  Description: ${s.description}`)
    if (s.acceptance_criteria) lines.push(`  AC: ${s.acceptance_criteria}`)
  }
  if (siblingsResult.rows.length > 0) {
    lines.push('', '👥 Sibling Tasks:')
    for (const sb of siblingsResult.rows) {
      const marker = sb.id === taskId ? ' ← current' : ''
      lines.push(`  ${si[sb.status] ?? '⬜'} [T${sb.id}] ${sb.title} (${sb.assignee ?? 'Unassigned'})${marker}`)
    }
  }
  return text(lines.join('\n'))
}

export async function toolUpdateTaskStatus(args: Record<string, unknown>): Promise<ToolResult> {
  const taskId = args.task_id as number
  const status = args.status as string
  const result = await execute('UPDATE pm_tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, taskId])
  if (result.error) return err(result.error)
  if (result.rowsAffected === 0) return err(`Task #${taskId} not found.`)
  return text(`✅ Task #${taskId} → ${status}`)
}

export async function toolUpdateTask(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const taskId = args.task_id as number

  // Get current for notification
  const current = await query<{ assignee: string | null; title: string }>(
    'SELECT assignee, title FROM pm_tasks WHERE id = ?', [taskId],
  )
  if (current.error) return err(current.error)
  if (current.rows.length === 0) return err(`Task #${taskId} not found.`)
  const oldAssignee = current.rows[0].assignee
  const taskTitle = current.rows[0].title

  if (args.assignee !== undefined) {
    const assigneeErr = await validateAssignee(args.assignee as string | null)
    if (assigneeErr) return err(assigneeErr)
  }

  const fieldMap: Record<string, string> = { title: 'title', assignee: 'assignee', status: 'status', description: 'description', story_points: 'story_points' }
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
  sqlArgs.push(taskId)
  const result = await execute(`UPDATE pm_tasks SET ${sets.join(', ')} WHERE id = ?`, sqlArgs)
  if (result.error) return err(result.error)

  // Auto-sum story SP when task SP changes
  if (args.story_points !== undefined) {
    const storyResult = await query<{ story_id: number }>('SELECT story_id FROM pm_tasks WHERE id = ?', [taskId])
    if (!storyResult.error && storyResult.rows.length > 0) {
      const sid = storyResult.rows[0].story_id
      const spResult = await query<{ total: number | null }>('SELECT SUM(story_points) as total FROM pm_tasks WHERE story_id = ?', [sid])
      if (!spResult.error && spResult.rows.length > 0) {
        await execute('UPDATE pm_stories SET story_points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [spResult.rows[0].total ?? 0, sid])
      }
    }
  }

  // Notify on assignee change
  if (args.assignee !== undefined) {
    const newAssignee = args.assignee as string | null
    if (newAssignee && newAssignee !== oldAssignee) {
      await notify(newAssignee, 'task_assigned', `Task assigned: ${taskTitle}`, `${user} assigned task [T${taskId}].`, 'task', String(taskId), 'board', user)
    }
  }

  return text(`✅ Task #${taskId} updated`)
}

export async function toolAddTask(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const storyId = args.story_id as number
  const title = args.title as string
  const assignee = (args.assignee as string) || user
  const assigneeErr = await validateAssignee(assignee)
  if (assigneeErr) return err(assigneeErr)
  const assigneeId = await resolveMemberId(assignee)
  const description = args.description as string | undefined

  const storyPoints = (args.story_points as number) ?? null

  const maxResult = await query<{ max_order: number | null }>('SELECT MAX(sort_order) as max_order FROM pm_tasks WHERE story_id = ?', [storyId])
  const sortOrder = (maxResult.rows[0]?.max_order ?? -1) + 1
  const result = await execute('INSERT INTO pm_tasks (story_id, title, assignee, assignee_id, description, sort_order, story_points) VALUES (?, ?, ?, ?, ?, ?, ?)', [storyId, title, assignee, assigneeId, description ?? null, sortOrder, storyPoints])
  if (result.error) return err(result.error)

  const idResult = await query<{ id: number }>('SELECT last_insert_rowid() as id')
  const newId = idResult.rows[0]?.id ?? '?'

  // Auto-sum story SP
  if (storyPoints != null) {
    const spResult = await query<{ total: number | null }>('SELECT SUM(story_points) as total FROM pm_tasks WHERE story_id = ?', [storyId])
    if (!spResult.error && spResult.rows.length > 0) {
      await execute('UPDATE pm_stories SET story_points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [spResult.rows[0].total ?? 0, storyId])
    }
  }

  // Notify assignee
  if (assignee !== user) {
    await notify(assignee, 'task_assigned', `Task assigned: ${title}`, `${user} assigned task [T${newId}].`, 'task', String(newId), 'board', user)
  }

  const spLabel = storyPoints != null ? ` ${storyPoints}SP` : ''
  return text(`✅ Task added (Story #${storyId}): ${title}${spLabel} (ID: ${newId})`)
}

export async function toolDeleteTask(args: Record<string, unknown>): Promise<ToolResult> {
  const taskId = args.task_id as number
  const result = await execute('DELETE FROM pm_tasks WHERE id = ?', [taskId])
  if (result.error) return err(result.error)
  if (result.rowsAffected === 0) return err(`Task #${taskId} not found.`)
  return text(`✅ Task #${taskId} deleted`)
}
