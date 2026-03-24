import { query, execute } from '../db/adapter.js'
import { text, err, today, resolveSprint, notify, checkRateLimit, emitAgentEvent, validateAssignee, resolveMemberId, type ToolResult } from './utils.js'

export async function toolEmitEvent(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  if (!checkRateLimit(user)) {
    return err('Rate limit exceeded: Maximum 10 events per minute.')
  }

  const eventType = args.event_type as string

  const HOOK_ONLY_TYPES = ['memo_assigned', 'memo_replied', 'memo_resolved']
  if (HOOK_ONLY_TYPES.includes(eventType)) {
    return err('Memo-related events are emitted automatically. Cannot emit directly.')
  }
  const targetAgent = args.target_agent as string
  const targetUser = args.target_user as string
  const payload = args.payload as string
  const ttlHours = (args.ttl_hours as number) ?? 24
  const sourceAgent = (args.source_agent as string) ?? user

  // Validate payload is valid JSON
  try {
    JSON.parse(payload)
  } catch {
    return err('Payload is not valid JSON.')
  }

  const expiresAt = new Date(Date.now() + ttlHours * 3600_000).toISOString()

  const result = await execute(
    `INSERT INTO agent_events (event_type, source_agent, target_agent, target_user, payload, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [eventType, sourceAgent, targetAgent, targetUser, payload, expiresAt],
  )
  if (result.error) return err(result.error)

  const idResult = await query<{ id: number }>('SELECT last_insert_rowid() as id')
  const newId = idResult.rows[0]?.id ?? '?'

  return text(`✅ Event emitted: [${eventType}] → ${targetUser} (ID: ${newId}, TTL: ${ttlHours}h)`)
}

export async function toolPollEvents(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const eventType = args.event_type as string | undefined
  const limit = (args.limit as number) ?? 20

  let sql = `SELECT id, event_type, source_agent, target_agent, payload, status, created_at
             FROM agent_events
             WHERE target_user = ? AND status = 'pending'
               AND (expires_at IS NULL OR expires_at > datetime('now'))`
  const sqlArgs: (string | number)[] = [user]

  if (eventType) {
    sql += ' AND event_type = ?'
    sqlArgs.push(eventType)
  }

  sql += ' ORDER BY created_at DESC LIMIT ?'
  sqlArgs.push(limit)

  const result = await query<{
    id: number; event_type: string; source_agent: string; target_agent: string
    payload: string; status: string; created_at: string
  }>(sql, sqlArgs)

  if (result.error) return err(result.error)
  if (result.rows.length === 0) return text('📭 No pending events.')

  const lines = [`📬 Pending events (${result.rows.length})`, '─────────────']
  for (const e of result.rows) {
    const payloadPreview = e.payload.length > 60 ? e.payload.slice(0, 60) + '...' : e.payload
    lines.push(`[E${e.id}] ${e.event_type} from ${e.source_agent} (${e.created_at.slice(5, 16)})`)
    lines.push(`  payload: ${payloadPreview}`)
  }
  return text(lines.join('\n'))
}

export async function toolAckEvent(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const eventId = args.event_id as number

  const result = await execute(
    `UPDATE agent_events SET status = 'acked', acked_at = datetime('now')
     WHERE id = ? AND status IN ('pending', 'delivered') AND target_user = ?`,
    [eventId, user],
  )
  if (result.error) return err(result.error)
  if (result.rowsAffected === 0) return err(`Event #${eventId} not found or already acknowledged.`)
  return text(`✅ Event #${eventId} acknowledged`)
}
