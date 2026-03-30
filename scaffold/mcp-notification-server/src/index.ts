import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { query, execute } from './turso-client.js'

const server = new McpServer({
  name: 'spec-notifications',
  version: '1.0.0',
})

// Tool 1: Check unread notifications
server.tool(
  'check_notifications',
  'Check unread notifications for a user (max 20)',
  { user_name: z.string().describe('User name to check notifications for') },
  async ({ user_name }) => {
    const result = await query<{
      id: number; type: string; title: string; body: string | null
      source_type: string; source_id: number; page_id: string
      actor: string; is_read: number; created_at: string
    }>(
      `SELECT id, type, title, body, source_type, source_id, page_id, actor, is_read, created_at
       FROM notifications
       WHERE user_name = ? AND is_read = 0
       ORDER BY created_at DESC
       LIMIT 20`,
      [user_name],
    )

    if (result.error) {
      return { content: [{ type: 'text' as const, text: `Error: ${result.error}` }] }
    }

    if (result.rows.length === 0) {
      return { content: [{ type: 'text' as const, text: `No unread notifications for ${user_name}.` }] }
    }

    const lines = result.rows.map((n, i) => {
      const icon = n.type === 'memo_assigned' ? '📩' : n.type === 'reply_received' ? '💬' : '📢'
      return `${i + 1}. ${icon} [ID:${n.id}] ${n.title}\n   ${n.body ?? ''}\n   Page: ${n.page_id} | ${n.created_at}`
    })

    return {
      content: [{
        type: 'text' as const,
        text: `Unread notifications for ${user_name} (${result.rows.length}):\n\n${lines.join('\n\n')}`,
      }],
    }
  },
)

// Tool 2: Mark notification as read
server.tool(
  'mark_notification_read',
  'Mark a notification as read by ID',
  { notification_id: z.number().describe('Notification ID to mark as read') },
  async ({ notification_id }) => {
    const result = await execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [notification_id],
    )

    if (result.error) {
      return { content: [{ type: 'text' as const, text: `Error: ${result.error}` }] }
    }

    return {
      content: [{
        type: 'text' as const,
        text: result.rowsAffected > 0
          ? `Notification #${notification_id} marked as read.`
          : `Notification #${notification_id} not found.`,
      }],
    }
  },
)

// Tool 3: Check open memos assigned to user
server.tool(
  'check_open_memos',
  'Check all open memos assigned to a user',
  { user_name: z.string().describe('User name to check memos for') },
  async ({ user_name }) => {
    const result = await query<{
      id: number; page_id: string; content: string; memo_type: string
      created_by: string; assigned_to: string | null; created_at: string
    }>(
      `SELECT id, page_id, content, memo_type, created_by, assigned_to, created_at
       FROM memos_v2
       WHERE assigned_to = ? AND status = 'open'
       ORDER BY created_at DESC`,
      [user_name],
    )

    if (result.error) {
      return { content: [{ type: 'text' as const, text: `Error: ${result.error}` }] }
    }

    if (result.rows.length === 0) {
      return { content: [{ type: 'text' as const, text: `No open memos assigned to ${user_name}.` }] }
    }

    const typeIcons: Record<string, string> = {
      memo: '📝', decision: '⚡', request: '📋', backlog: '💡',
    }

    const lines = result.rows.map((m, i) => {
      const icon = typeIcons[m.memo_type] ?? '📝'
      const preview = m.content.length > 80 ? m.content.slice(0, 80) + '…' : m.content
      return `${i + 1}. ${icon} [ID:${m.id}] ${m.created_by} → ${m.assigned_to}\n   ${preview}\n   Page: ${m.page_id} | ${m.created_at}`
    })

    return {
      content: [{
        type: 'text' as const,
        text: `Open memos for ${user_name} (${result.rows.length}):\n\n${lines.join('\n\n')}`,
      }],
    }
  },
)

// Tool 4: Create notification
server.tool(
  'create_notification',
  'Create a notification for a user (memo events: assignment, reply, resolve, reopen)',
  {
    user_name: z.string().describe('Notification recipient'),
    type: z.enum(['memo_assigned', 'memo_mention_all', 'reply_received', 'memo_resolved', 'memo_reopened'])
      .describe('Notification type'),
    title: z.string().describe('Notification title'),
    body: z.string().optional().describe('Preview body (60 chars max)'),
    source_id: z.number().describe('Related memo ID'),
    page_id: z.string().describe('Page ID the memo belongs to'),
    actor: z.string().describe('Name of the person who performed the action'),
  },
  async ({ user_name, type, title, body, source_id, page_id, actor }) => {
    const result = await execute(
      `INSERT INTO notifications (user_name, type, title, body, source_type, source_id, page_id, actor)
       VALUES (?, ?, ?, ?, 'memo', ?, ?, ?)`,
      [user_name, type, title, body ?? null, source_id, page_id, actor],
    )

    if (result.error) {
      return { content: [{ type: 'text' as const, text: `Error: ${result.error}` }] }
    }

    return {
      content: [{
        type: 'text' as const,
        text: `Notification created: [${type}] "${title}" for ${user_name}`,
      }],
    }
  },
)

// Tool 5: Reply to memo
server.tool(
  'reply_memo',
  'Reply to a memo and notify the memo author',
  {
    memo_id: z.number().describe('Memo ID to reply to'),
    content: z.string().describe('Reply content'),
    created_by: z.string().describe('Reply author name'),
  },
  async ({ memo_id, content, created_by }) => {
    const memo = await query<{
      id: number; page_id: string; created_by: string; assigned_to: string | null; status: string
    }>(
      'SELECT id, page_id, created_by, assigned_to, status FROM memos_v2 WHERE id = ?',
      [memo_id],
    )

    if (memo.error) {
      return { content: [{ type: 'text' as const, text: `Error: ${memo.error}` }] }
    }
    if (memo.rows.length === 0) {
      return { content: [{ type: 'text' as const, text: `Memo #${memo_id} not found.` }] }
    }

    const m = memo.rows[0]

    const insertResult = await execute(
      'INSERT INTO memo_replies (memo_id, content, created_by) VALUES (?, ?, ?)',
      [memo_id, content, created_by],
    )

    if (insertResult.error) {
      return { content: [{ type: 'text' as const, text: `Error: ${insertResult.error}` }] }
    }

    // Notify memo author (skip self-notification)
    if (m.created_by !== created_by) {
      await execute(
        `INSERT INTO notifications (user_name, type, title, body, source_type, source_id, page_id, actor)
         VALUES (?, 'reply_received', ?, ?, 'memo', ?, ?, ?)`,
        [
          m.created_by,
          `${created_by} replied to your memo`,
          content.length > 60 ? content.slice(0, 57) + '…' : content,
          memo_id,
          m.page_id,
          created_by,
        ],
      )
    }

    return {
      content: [{
        type: 'text' as const,
        text: `Reply posted on memo #${memo_id} by ${created_by}.\nContent: ${content}`,
      }],
    }
  },
)

// Tool 6: Resolve memo
server.tool(
  'resolve_memo',
  'Mark a memo as resolved and notify related users',
  {
    memo_id: z.number().describe('Memo ID to resolve'),
    resolved_by: z.string().describe('Name of resolver'),
  },
  async ({ memo_id, resolved_by }) => {
    const memo = await query<{
      id: number; page_id: string; created_by: string; assigned_to: string | null; status: string
    }>(
      'SELECT id, page_id, created_by, assigned_to, status FROM memos_v2 WHERE id = ?',
      [memo_id],
    )

    if (memo.error) {
      return { content: [{ type: 'text' as const, text: `Error: ${memo.error}` }] }
    }
    if (memo.rows.length === 0) {
      return { content: [{ type: 'text' as const, text: `Memo #${memo_id} not found.` }] }
    }

    const m = memo.rows[0]
    if (m.status === 'resolved') {
      return { content: [{ type: 'text' as const, text: `Memo #${memo_id} is already resolved.` }] }
    }

    const updateResult = await execute(
      "UPDATE memos_v2 SET status = 'resolved' WHERE id = ?",
      [memo_id],
    )

    if (updateResult.error) {
      return { content: [{ type: 'text' as const, text: `Error: ${updateResult.error}` }] }
    }

    if (m.created_by !== resolved_by) {
      await execute(
        `INSERT INTO notifications (user_name, type, title, body, source_type, source_id, page_id, actor)
         VALUES (?, 'memo_resolved', ?, NULL, 'memo', ?, ?, ?)`,
        [m.created_by, `${resolved_by} resolved the memo`, memo_id, m.page_id, resolved_by],
      )
    }

    return {
      content: [{
        type: 'text' as const,
        text: `Memo #${memo_id} resolved by ${resolved_by}.`,
      }],
    }
  },
)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(console.error)
