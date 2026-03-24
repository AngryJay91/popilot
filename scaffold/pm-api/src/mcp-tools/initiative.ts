import { query, execute } from '../db/adapter.js'
import { text, err, today, resolveSprint, notify, checkRateLimit, emitAgentEvent, validateAssignee, resolveMemberId, type ToolResult } from './utils.js'

export async function toolCreateInitiative(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const title = args.title as string
  const content = args.content as string
  if (!title?.trim() || !content?.trim()) return err('title, content required')
  const decider = (args.decider as string) ?? null
  const sourceContext = (args.source_context as string) ?? null
  const r = await execute(
    'INSERT INTO initiatives (title, content, author, decider, source_context) VALUES (?, ?, ?, ?, ?)',
    [title, content, user, decider, sourceContext],
  )
  if (r.error) return err(r.error)
  return text(`✅ Initiative created: "${title}"`)
}

export async function toolListInitiatives(args: Record<string, unknown>): Promise<ToolResult> {
  const status = args.status as string | undefined
  let sql = 'SELECT id, title, author, decider, status, created_at FROM initiatives'
  const sqlArgs: string[] = []
  if (status) { sql += ' WHERE status = ?'; sqlArgs.push(status) }
  sql += ' ORDER BY created_at DESC LIMIT 20'
  const r = await query<{ id: number; title: string; author: string; decider: string | null; status: string; created_at: string }>(sql, sqlArgs)
  if (r.error) return err(r.error)
  if (!r.rows.length) return text('No initiatives found.')
  const lines = ['📋 Initiative List', '─────────────']
  for (const i of r.rows) {
    const dec = i.decider ? ` → ${i.decider}` : ''
    lines.push(`  [${i.status}] #${i.id}: ${i.title} (${i.author}${dec})`)
  }
  return text(lines.join('\n'))
}

export async function toolUpdateInitiativeStatus(args: Record<string, unknown>): Promise<ToolResult> {
  const id = args.initiative_id as number
  const newStatus = args.status as string
  const note = (args.decision_note as string) ?? null
  if (!id || !newStatus) return err('initiative_id, status required')
  const { canTransition } = await import('../utils/initiative.js')
  const current = await query<{ status: string }>('SELECT status FROM initiatives WHERE id = ?', [id])
  if (!current.rows.length) return err('Initiative not found.')
  if (!canTransition(current.rows[0].status as 'pending' | 'approved' | 'rejected' | 'deferred', newStatus as 'pending' | 'approved' | 'rejected' | 'deferred')) {
    return err(`${current.rows[0].status} → ${newStatus} transition not allowed`)
  }
  await execute(
    `UPDATE initiatives SET status = ?, decision_note = ?, decided_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [newStatus, note, id],
  )
  return text(`✅ Initiative #${id}: ${current.rows[0].status} → ${newStatus}`)
}
