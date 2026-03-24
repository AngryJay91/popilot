import { query, execute } from '../db/adapter.js'
import { text, err, today, resolveSprint, notify, checkRateLimit, emitAgentEvent, validateAssignee, resolveMemberId, type ToolResult } from './utils.js'

export async function toolDashboard(user: string): Promise<ToolResult> {
  const sprint = await resolveSprint()
  if (!sprint) return err('No active sprint found.')

  const [taskResult, memoResult, standupResult, notifResult] = await Promise.all([
    query<{ status: string; cnt: number }>(
      `SELECT t.status, COUNT(*) as cnt FROM pm_tasks t JOIN pm_stories s ON t.story_id = s.id WHERE t.assignee = ? AND s.sprint = ? GROUP BY t.status`,
      [user, sprint],
    ),
    query<{ cnt: number }>("SELECT COUNT(*) as cnt FROM memos_v2 WHERE (assigned_to = ? OR assigned_to LIKE ? OR assigned_to LIKE ? OR assigned_to LIKE ?) AND status = 'open'", [user, `${user},%`, `%,${user},%`, `%,${user}`]),
    query<{ id: number }>('SELECT id FROM pm_standup_entries WHERE user_name = ? AND sprint = ? AND entry_date = ? LIMIT 1', [user, sprint, today()]),
    query<{ cnt: number }>("SELECT COUNT(*) as cnt FROM notifications WHERE user_name = ? AND is_read = 0", [user]),
  ])

  const s: Record<string, number> = { todo: 0, 'in-progress': 0, done: 0 }
  if (!taskResult.error) for (const r of taskResult.rows) s[r.status] = r.cnt

  return text([
    `📊 ${user}'s Dashboard (${sprint.toUpperCase()})`,
    '─────────────',
    `📋 Tasks: todo ${s.todo} | in-progress ${s['in-progress']} | done ${s.done}`,
    `📩 Unread memos: ${memoResult.rows[0]?.cnt ?? 0}`,
    `🔔 Unread notifications: ${notifResult.rows[0]?.cnt ?? 0}`,
    `📝 Today's standup: ${standupResult.rows.length > 0 ? 'submitted' : 'not submitted'}`,
  ].join('\n'))
}

export async function toolListTeamMembers(): Promise<ToolResult> {
  const result = await query<{ id: number; display_name: string; role: string }>('SELECT id, display_name, role FROM members WHERE is_active = 1 ORDER BY display_name')
  if (result.error) return err(result.error)
  const lines = ['👥 Team Members', '─────────────']
  for (const r of result.rows) {
    const badge = r.role === 'admin' ? ' 👑' : ''
    lines.push(`  • [M${r.id}] ${r.display_name}${badge}`)
  }
  return text(lines.join('\n'))
}
