import { query, execute } from '../db/adapter.js'
import { text, err, today, resolveSprint, notify, checkRateLimit, emitAgentEvent, validateAssignee, resolveMemberId, type ToolResult } from './utils.js'

export async function toolGetRetroSession(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const sprint = await resolveSprint(args.sprint as string | undefined)
  if (!sprint) return err('Please specify a sprint.')

  const sessionResult = await query<{ id: number; sprint: string; title: string; phase: string; created_at: string }>(
    'SELECT * FROM retro_sessions WHERE sprint = ? LIMIT 1', [sprint],
  )
  if (sessionResult.error) return err(sessionResult.error)
  if (sessionResult.rows.length === 0) return text(`${sprint.toUpperCase()} retro session not found.`)

  const session = sessionResult.rows[0]
  const [itemsResult, actionsResult] = await Promise.all([
    query<{ id: number; category: string; content: string; author: string; vote_count: number; has_voted: number }>(
      `SELECT i.*, COUNT(v.item_id) as vote_count,
       CASE WHEN SUM(CASE WHEN v.voter = ? THEN 1 ELSE 0 END) > 0 THEN 1 ELSE 0 END as has_voted
       FROM retro_items i LEFT JOIN retro_votes v ON v.item_id = i.id
       WHERE i.session_id = ? GROUP BY i.id ORDER BY vote_count DESC`,
      [user, session.id],
    ),
    query<{ id: number; content: string; assignee: string | null; status: string }>(
      'SELECT * FROM retro_actions WHERE session_id = ? ORDER BY created_at ASC',
      [session.id],
    ),
  ])

  const catIcon: Record<string, string> = { keep: '💚', problem: '🔴', try: '💡' }
  const lines = [
    `🔄 Retrospective: ${session.title} (${sprint.toUpperCase()})`,
    `Phase: ${session.phase} | Created: ${session.created_at}`,
    '─────────────',
  ]

  if (!itemsResult.error && itemsResult.rows.length > 0) {
    for (const cat of ['keep', 'problem', 'try']) {
      const items = itemsResult.rows.filter(i => i.category === cat)
      if (items.length > 0) {
        lines.push(`\n${catIcon[cat] ?? '●'} ${cat.toUpperCase()} (${items.length} items)`)
        for (const i of items) {
          const voted = i.has_voted ? '★' : '☆'
          lines.push(`  ${voted} [R${i.id}] ${i.content} (${i.author}, ${i.vote_count} votes)`)
        }
      }
    }
  } else {
    lines.push('\nNo items found.')
  }

  if (!actionsResult.error && actionsResult.rows.length > 0) {
    const si: Record<string, string> = { todo: '⬜', 'in-progress': '🔵', done: '✅' }
    lines.push('\n📌 Action Items:')
    for (const a of actionsResult.rows) {
      lines.push(`  ${si[a.status] ?? '⬜'} [A${a.id}] ${a.content} (${a.assignee ?? 'Unassigned'})`)
    }
  }

  return text(lines.join('\n'))
}

export async function toolAddRetroItem(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const sessionId = args.session_id as number
  const category = args.category as string
  const content = args.content as string

  const result = await execute(
    'INSERT INTO retro_items (session_id, category, content, author) VALUES (?, ?, ?, ?)',
    [sessionId, category, content, user],
  )
  if (result.error) return err(result.error)
  return text(`✅ Retro item added (${category}): ${content}`)
}

export async function toolVoteRetroItem(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const itemId = args.item_id as number

  // Check if already voted
  const existing = await query<{ item_id: number }>(
    'SELECT item_id FROM retro_votes WHERE item_id = ? AND voter = ?', [itemId, user],
  )
  if (existing.rows.length > 0) {
    await execute('DELETE FROM retro_votes WHERE item_id = ? AND voter = ?', [itemId, user])
    return text(`✅ Vote removed: item #${itemId}`)
  } else {
    await execute('INSERT OR IGNORE INTO retro_votes (item_id, voter) VALUES (?, ?)', [itemId, user])
    return text(`✅ Voted: item #${itemId}`)
  }
}

export async function toolChangeRetroPhase(args: Record<string, unknown>): Promise<ToolResult> {
  const sessionId = args.session_id as number
  const phase = args.phase as string
  const result = await execute(
    'UPDATE retro_sessions SET phase = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [phase, sessionId],
  )
  if (result.error) return err(result.error)
  if (result.rowsAffected === 0) return err(`Session #${sessionId} not found.`)
  return text(`✅ Retro session #${sessionId} → ${phase} phase`)
}

export async function toolAddRetroAction(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const sessionId = args.session_id as number
  const content = args.content as string
  const assignee = (args.assignee as string) ?? null

  const result = await execute(
    'INSERT INTO retro_actions (session_id, content, assignee) VALUES (?, ?, ?)',
    [sessionId, content, assignee],
  )
  if (result.error) return err(result.error)

  // Notify assignee
  if (assignee) {
    const idResult = await query<{ id: number }>('SELECT last_insert_rowid() as id')
    const actionId = idResult.rows[0]?.id ?? 0
    await notify(assignee, 'retro_action', `Retro action assigned: ${content.slice(0, 30)}`, `${user} assigned retro action: ${content}`, 'retro_action', actionId, 'retro', user)
  }

  return text(`✅ Action added: ${content}${assignee ? ` (assignee: ${assignee})` : ''}`)
}

export async function toolUpdateRetroActionStatus(args: Record<string, unknown>): Promise<ToolResult> {
  const actionId = args.action_id as number
  const status = args.status as string
  const result = await execute(
    'UPDATE retro_actions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, actionId],
  )
  if (result.error) return err(result.error)
  if (result.rowsAffected === 0) return err(`Action #${actionId} not found.`)
  return text(`✅ Action #${actionId} → ${status}`)
}

export async function toolExportRetro(args: Record<string, unknown>): Promise<ToolResult> {
  const sprint = await resolveSprint(args.sprint as string | undefined)
  if (!sprint) return err('Please specify a sprint.')

  const sessionResult = await query<{ id: number; title: string; phase: string }>(
    'SELECT id, title, phase FROM retro_sessions WHERE sprint = ? LIMIT 1', [sprint],
  )
  if (sessionResult.error) return err(sessionResult.error)
  if (sessionResult.rows.length === 0) return err(`${sprint.toUpperCase()} retro session not found.`)

  const session = sessionResult.rows[0]
  const [itemsResult, actionsResult] = await Promise.all([
    query<{ category: string; content: string; author: string; vote_count: number }>(
      `SELECT i.category, i.content, i.author, COUNT(v.item_id) as vote_count
       FROM retro_items i LEFT JOIN retro_votes v ON v.item_id = i.id
       WHERE i.session_id = ? GROUP BY i.id ORDER BY i.category, vote_count DESC`,
      [session.id],
    ),
    query<{ content: string; assignee: string | null; status: string }>(
      'SELECT content, assignee, status FROM retro_actions WHERE session_id = ? ORDER BY created_at',
      [session.id],
    ),
  ])

  const lines = [
    `# ${session.title} (${sprint.toUpperCase()})`,
    '',
  ]

  if (!itemsResult.error) {
    for (const cat of ['keep', 'problem', 'try']) {
      const items = itemsResult.rows.filter(i => i.category === cat)
      lines.push(`## ${cat.toUpperCase()} (${items.length} items)`)
      for (const i of items) lines.push(`- ${i.content} — ${i.author} (${i.vote_count} votes)`)
      lines.push('')
    }
  }

  if (!actionsResult.error && actionsResult.rows.length > 0) {
    lines.push('## Action Items')
    for (const a of actionsResult.rows) {
      const check = a.status === 'done' ? '[x]' : '[ ]'
      lines.push(`- ${check} ${a.content}${a.assignee ? ` @${a.assignee}` : ''}`)
    }
  }

  return text(lines.join('\n'))
}
