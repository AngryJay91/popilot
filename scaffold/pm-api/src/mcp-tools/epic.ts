import { query, execute } from '../db/adapter.js'
import { text, err, today, resolveSprint, notify, checkRateLimit, emitAgentEvent, validateAssignee, resolveMemberId, type ToolResult } from './utils.js'

export async function toolListEpics(): Promise<ToolResult> {
  const result = await query<{ id: number; title: string; status: string; owner: string | null; story_count: number }>(
    `SELECT e.id, e.title, e.status, e.owner, COUNT(s.id) as story_count
     FROM pm_epics e LEFT JOIN pm_stories s ON s.epic_id = e.id
     GROUP BY e.id ORDER BY e.title`,
  )
  if (result.error) return err(result.error)
  if (result.rows.length === 0) return text('No epics found.')

  const lines = ['🏷 Epic List', '─────────────']
  for (const e of result.rows) {
    const statusIcon: Record<string, string> = { active: '🟢', planned: '📋', completed: '✅', archived: '📦' }
    lines.push(`${statusIcon[e.status] ?? '⚪'} [E${e.id}] ${e.title} (${e.status}, ${e.story_count} stories${e.owner ? `, owner: ${e.owner}` : ''})`)
  }
  return text(lines.join('\n'))
}

export async function toolAddEpic(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const title = args.title as string
  const description = (args.description as string) ?? null
  const owner = (args.owner as string) || user
  const status = (args.status as string) || 'active'

  const result = await execute(
    'INSERT INTO pm_epics (title, description, owner, status) VALUES (?, ?, ?, ?)',
    [title, description, owner, status],
  )
  if (result.error) return err(result.error)
  const idResult = await query<{ id: number }>('SELECT last_insert_rowid() as id')
  const newId = idResult.rows[0]?.id ?? '?'
  return text(`✅ Epic created: ${title} (ID: ${newId})`)
}

export async function toolUpdateEpic(args: Record<string, unknown>): Promise<ToolResult> {
  const epicId = args.epic_id as number
  const fieldMap: Record<string, string> = { title: 'title', description: 'description', status: 'status', owner: 'owner' }
  const sets: string[] = []
  const sqlArgs: (string | number | null)[] = []

  for (const [key, col] of Object.entries(fieldMap)) {
    if (args[key] !== undefined) {
      sets.push(`${col} = ?`)
      sqlArgs.push(args[key] as string | number | null)
    }
  }
  if (sets.length === 0) return text('No fields to update.')

  sets.push('updated_at = CURRENT_TIMESTAMP')
  sqlArgs.push(epicId)
  const result = await execute(`UPDATE pm_epics SET ${sets.join(', ')} WHERE id = ?`, sqlArgs)
  if (result.error) return err(result.error)
  if (result.rowsAffected === 0) return err(`Epic #${epicId} not found.`)
  return text(`✅ Epic #${epicId} updated`)
}

export async function toolDeleteEpic(args: Record<string, unknown>): Promise<ToolResult> {
  const epicId = args.epic_id as number
  const r1 = await execute('UPDATE pm_stories SET epic_id = NULL WHERE epic_id = ?', [epicId])
  if (r1.error) return err(r1.error)
  const r2 = await execute('DELETE FROM pm_epics WHERE id = ?', [epicId])
  if (r2.error) return err(r2.error)
  if (r2.rowsAffected === 0) return err(`Epic #${epicId} not found.`)
  return text(`✅ Epic #${epicId} deleted`)
}
