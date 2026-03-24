import { query, execute } from '../db/adapter.js'
import { text, err, today, resolveSprint, notify, checkRateLimit, emitAgentEvent, validateAssignee, resolveMemberId, type ToolResult } from './utils.js'

export async function toolCheckNotifications(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const unreadOnly = args.unread_only as boolean | undefined
  let sql = 'SELECT * FROM notifications WHERE user_name = ?'
  const sqlArgs: (string | number)[] = [user]
  if (unreadOnly) { sql += ' AND is_read = 0' }
  sql += ' ORDER BY created_at DESC LIMIT 30'

  const result = await query<{ id: number; type: string; title: string; body: string | null; source_type: string; source_id: string; actor: string; is_read: number; created_at: string }>(sql, sqlArgs)
  if (result.error) return err(result.error)
  if (result.rows.length === 0) return text(unreadOnly ? '🔔 No unread notifications.' : '🔔 No notifications.')

  const unread = result.rows.filter(n => !n.is_read).length
  const lines = [`🔔 Notifications (${unread} unread)`, '─────────────']
  for (const n of result.rows) {
    const icon = n.is_read ? '  ' : '🔴'
    const body = n.body ? ` — ${n.body.length > 40 ? n.body.slice(0, 40) + '…' : n.body}` : ''
    lines.push(`${icon} [N${n.id}] ${n.title}${body} (${n.actor}, ${n.created_at.slice(5, 16)})`)
  }
  return text(lines.join('\n'))
}

export async function toolMarkNotificationRead(args: Record<string, unknown>): Promise<ToolResult> {
  const notifId = args.notification_id as number
  const result = await execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [notifId])
  if (result.error) return err(result.error)
  if (result.rowsAffected === 0) return err(`Notification #${notifId} not found.`)
  return text(`✅ Notification #${notifId} marked as read`)
}

export async function toolMarkAllNotificationsRead(user: string): Promise<ToolResult> {
  const result = await execute('UPDATE notifications SET is_read = 1 WHERE user_name = ? AND is_read = 0', [user])
  if (result.error) return err(result.error)
  return text(`✅ ${result.rowsAffected} notifications marked as read.`)
}
