import { query, execute } from '../db/adapter.js'

export type ToolResult = { content: Array<{ type: string; text: string }>; isError?: boolean }

export function today(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function text(t: string): ToolResult {
  return { content: [{ type: 'text', text: t }] }
}

export function err(msg: string): ToolResult {
  return text(`Error: ${msg}`)
}

export async function getActiveSprint(): Promise<string | null> {
  const result = await query<{ id: string }>('SELECT id FROM nav_sprints WHERE active = 1 LIMIT 1')
  return result.rows?.[0]?.id ?? null
}

export async function resolveSprint(arg?: string): Promise<string | null> {
  return arg || await getActiveSprint()
}

export async function notify(
  userName: string, type: string, title: string, body: string,
  sourceType: string, sourceId: string | number, pageId: string, actor: string,
): Promise<void> {
  if (userName === actor) return
  await execute(
    'INSERT INTO notifications (user_name, type, title, body, source_type, source_id, page_id, actor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [userName, type, title, body, sourceType, String(sourceId), pageId, actor],
  )
}

export { validateAssignee, resolveMemberId } from '../utils/assignee.js'

const RATE_LIMIT = 30
const emitRateMap = new Map<string, number[]>()

export function checkRateLimit(user: string): boolean {
  const now = Date.now()
  const window = 60_000
  if (emitRateMap.size > 100) {
    for (const [k, v] of emitRateMap) {
      const filtered = v.filter(t => now - t < window)
      if (filtered.length === 0) emitRateMap.delete(k)
      else emitRateMap.set(k, filtered)
    }
  }
  const timestamps = (emitRateMap.get(user) ?? []).filter(t => now - t < window)
  if (timestamps.length >= RATE_LIMIT) return false
  timestamps.push(now)
  emitRateMap.set(user, timestamps)
  return true
}

export async function emitAgentEvent(
  eventType: string, sourceAgent: string, targetAgent: string,
  targetUser: string, payload: Record<string, unknown>,
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + 24 * 3600_000).toISOString()
    await execute(
      `INSERT INTO agent_events (event_type, source_agent, target_agent, target_user, payload, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [eventType, sourceAgent, targetAgent, targetUser, JSON.stringify(payload), expiresAt],
    )
  } catch {
    // fire-and-forget
  }
}

export function progressBar(done: number, total: number, width = 10): string {
  if (total === 0) return '░'.repeat(width)
  const filled = Math.round((done / total) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}
