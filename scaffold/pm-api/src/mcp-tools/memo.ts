import { query, execute } from '../db/adapter.js'
import { text, err, today, resolveSprint, notify, checkRateLimit, emitAgentEvent, validateAssignee, resolveMemberId, type ToolResult } from './utils.js'

export async function toolSendMemo(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const toUserRaw = args.to_user as string
  const recipients = toUserRaw.split(',').map(s => s.trim()).filter(Boolean)
  const assignedTo = recipients.join(',')
  const content = args.content as string
  const pageId = (args.page_id as string) || 'home'
  const memoType = (args.memo_type as string) || 'memo'
  const preview = content.length > 50 ? content.slice(0, 50) + '…' : content

  // Parse [D-XX] tags → related_decisions
  const decisionMatches = content.match(/\[D-\d+\]/g)
  const relatedDecisions = decisionMatches ? JSON.stringify([...new Set(decisionMatches.map(m => m.slice(1, -1)))]) : null
  const reviewRequired = (args.review_required as boolean) ? 1 : 0
  const title = (args.title as string) ?? null
  const supersedesId = (args.supersedes_id as number) ?? null

  // Decision type requires title
  if (memoType === 'decision' && !title) {
    return err('Decision type memos require a title.')
  }

  // Supersede: update previous memo status
  if (supersedesId) {
    await execute('UPDATE memos_v2 SET status = ? WHERE id = ?', ['superseded', supersedesId])
  }

  // Resolve member IDs
  const createdById = await resolveMemberId(user)
  const assignedToId = recipients.length === 1 ? await resolveMemberId(recipients[0]) : null

  const result = await execute(
    'INSERT INTO memos_v2 (page_id, content, memo_type, created_by, created_by_id, assigned_to, assigned_to_id, related_decisions, review_required, title, supersedes_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [pageId, content, memoType, user, createdById, assignedTo, assignedToId, relatedDecisions, reviewRequired, title, supersedesId],
  )
  if (result.error) return err(result.error)

  const idResult = await query<{ id: number }>('SELECT last_insert_rowid() as id')
  const memoId = idResult.rows[0]?.id ?? 0

  // Notify each recipient
  for (const r of recipients) {
    await notify(r, 'memo_received', `New memo: ${user}`, preview, 'memo', memoId, pageId, user)
  }

  // Auto-emit agent events
  for (const r of recipients) {
    await emitAgentEvent('memo_assigned', user, r, r, {
      memo_id: memoId, from: user, preview, page_id: pageId,
    })
  }

  // Agent webhook notification
  const { notifyByName } = await import('../utils/agent-notify.js')
  for (const r of recipients) {
    await notifyByName(r, `📋 New memo: ${user}`, `${preview}\n\nMemo #${memoId} | ${memoType}`)
  }

  return text(`✅ Memo sent: ${user} → ${assignedTo}`)
}

export async function toolListMemos(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  let sql = "SELECT * FROM memos_v2 WHERE (assigned_to = ? OR assigned_to LIKE ? OR assigned_to LIKE ? OR assigned_to LIKE ?)"
  const sqlArgs: (string | number)[] = [user, `${user},%`, `%,${user},%`, `%,${user}`]
  if (args.unread_only) { sql += " AND status = 'open'" }
  sql += ' ORDER BY created_at DESC LIMIT 20'

  const result = await query<{ id: number; page_id: string; content: string; memo_type: string; status: string; created_by: string; assigned_to: string | null; created_at: string }>(sql, sqlArgs)
  if (result.error) return err(result.error)
  if (result.rows.length === 0) return text('📩 No memos found.')

  const lines = [`📩 ${user}'s Memos`, '─────────────']
  for (const m of result.rows) {
    const icon = m.status === 'open' ? '📩' : m.status === 'resolved' ? '✅' : '📖'
    const preview = m.content.length > 60 ? m.content.slice(0, 60) + '…' : m.content
    lines.push(`${icon} [M${m.id}] ${m.created_by} (${m.page_id}): ${preview}`)
  }
  return text(lines.join('\n'))
}

export async function toolReadMemo(args: Record<string, unknown>): Promise<ToolResult> {
  const memoId = args.memo_id as number
  const result = await query<{ id: number; page_id: string; content: string; memo_type: string; status: string; created_by: string; assigned_to: string | null; resolved_by: string | null; resolved_at: string | null; created_at: string }>('SELECT * FROM memos_v2 WHERE id = ?', [memoId])
  if (result.error) return err(result.error)
  if (result.rows.length === 0) return err(`Memo #${memoId} not found.`)

  const m = result.rows[0]

  const repliesResult = await query<{ id: number; content: string; created_by: string; created_at: string }>('SELECT * FROM memo_replies WHERE memo_id = ? ORDER BY created_at ASC', [memoId])

  const lines = [`📩 Memo #${m.id}`, '─────────────', `From: ${m.created_by} → ${m.assigned_to ?? 'all'}`, `Page: ${m.page_id}`, `Status: ${m.status}`, `Date: ${m.created_at}`, '', m.content]
  if (m.resolved_by) lines.push('', `✅ Resolved: ${m.resolved_by} (${m.resolved_at})`)
  if (!repliesResult.error && repliesResult.rows.length > 0) {
    lines.push('', '💬 Replies:')
    for (const r of repliesResult.rows) lines.push(`  ${r.created_by} (${r.created_at}): ${r.content}`)
  }
  return text(lines.join('\n'))
}

export async function toolReplyMemo(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const memoId = args.memo_id as number
  const content = args.content as string
  const reviewType = (args.review_type as string) || 'comment'
  const result = await execute(
    'INSERT INTO memo_replies (memo_id, content, created_by, review_type) VALUES (?, ?, ?, ?)',
    [memoId, content, user, reviewType],
  )
  if (result.error) return err(result.error)

  // Notify memo author
  const memoResult = await query<{ created_by: string; assigned_to: string | null }>(
    'SELECT created_by, assigned_to FROM memos_v2 WHERE id = ?', [memoId],
  )
  if (!memoResult.error && memoResult.rows.length > 0) {
    const memo = memoResult.rows[0]
    const preview = content.length > 50 ? content.slice(0, 50) + '…' : content
    // Notify author
    await notify(memo.created_by, 'memo_reply', `Memo reply: ${user}`, preview, 'memo', memoId, 'home', user)
    // If assigned_to is different from author and from replier, notify them too
    if (memo.assigned_to && memo.assigned_to !== memo.created_by && memo.assigned_to !== user) {
      await notify(memo.assigned_to, 'memo_reply', `Memo reply: ${user}`, preview, 'memo', memoId, 'home', user)
    }
    // Auto-emit agent event
    await emitAgentEvent('memo_replied', user, memo.created_by, memo.created_by, {
      memo_id: memoId, reply_by: user, preview,
    })
  }

  return text(`✅ Reply sent to Memo #${memoId}`)
}

export async function toolResolveMemo(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const memoId = args.memo_id as number
  const result = await execute(
    `UPDATE memos_v2 SET status = 'resolved', resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [user, memoId],
  )
  if (result.error) return err(result.error)
  if (result.rowsAffected === 0) return err(`Memo #${memoId} not found.`)

  // Notify memo author
  const memoResult = await query<{ created_by: string }>(
    'SELECT created_by FROM memos_v2 WHERE id = ?', [memoId],
  )
  if (!memoResult.error && memoResult.rows.length > 0) {
    await notify(memoResult.rows[0].created_by, 'memo_resolved', `Memo resolved: ${user}`, `${user} resolved Memo #${memoId}.`, 'memo', memoId, 'home', user)
    // Auto-emit agent event
    await emitAgentEvent('memo_resolved', user, memoResult.rows[0].created_by, memoResult.rows[0].created_by, {
      memo_id: memoId, resolved_by: user,
    })
  }

  return text(`✅ Memo #${memoId} resolved`)
}

export async function toolRejectMemo(args: Record<string, unknown>): Promise<ToolResult> {
  const memoId = args.memo_id as number
  if (!memoId) return err('memo_id required')
  const r = await execute("UPDATE memos_v2 SET status = 'open', resolved_by = NULL, resolved_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [memoId])
  if (r.error) return err(r.error)
  return text(`✅ Memo #${memoId} rejected (reopened)`)
}
