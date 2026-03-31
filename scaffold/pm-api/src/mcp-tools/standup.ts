import { query, execute } from '../db/adapter.js'
import { text, err, today, resolveSprint, notify, checkRateLimit, emitAgentEvent, validateAssignee, resolveMemberId, type ToolResult } from './utils.js'

export async function toolGetStandup(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const sprint = await resolveSprint(args.sprint as string | undefined)
  if (!sprint) return err('Please specify a sprint.')
  const d = (args.date as string) || today()

  const result = await query<{ id: number; done_text: string | null; plan_text: string | null; plan_story_ids: string | null; blockers: string | null; created_at: string; updated_at: string }>('SELECT * FROM pm_standup_entries WHERE sprint = ? AND user_name = ? AND entry_date = ?', [sprint, user, d])
  if (result.error) return err(result.error)
  if (result.rows.length === 0) return text(`📝 No standup found for ${d}.`)

  const e = result.rows[0]
  const storyIds: number[] = e.plan_story_ids ? JSON.parse(e.plan_story_ids) : []
  let storyTitles = ''
  if (storyIds.length > 0) {
    const ph = storyIds.map(() => '?').join(',')
    const sr = await query<{ id: number; title: string }>(`SELECT id, title FROM pm_stories WHERE id IN (${ph})`, storyIds)
    if (!sr.error) storyTitles = sr.rows.map(s => `  - [S${s.id}] ${s.title}`).join('\n')
  }

  const lines = [`📝 ${user}'s Standup (${d})`, '─────────────', `✅ Done: ${e.done_text ?? '(none)'}`, `📌 Plan: ${e.plan_text ?? '(none)'}`]
  if (storyTitles) lines.push(`📖 Planned Stories:\n${storyTitles}`)
  if (e.blockers) lines.push(`🚧 Blockers: ${e.blockers}`)
  return text(lines.join('\n'))
}

export async function toolSaveStandup(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const sprint = await resolveSprint(args.sprint as string | undefined)
  if (!sprint) return err('Please specify a sprint.')
  const d = (args.date as string) || today()
  const storyIdsJson = (args.plan_story_ids as number[] | undefined)?.length ? JSON.stringify(args.plan_story_ids) : null

  const result = await execute(
    `INSERT INTO pm_standup_entries (sprint, user_name, entry_date, done_text, plan_text, plan_story_ids, blockers, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(sprint, user_name, entry_date) DO UPDATE SET done_text = excluded.done_text, plan_text = excluded.plan_text, plan_story_ids = excluded.plan_story_ids, blockers = excluded.blockers, updated_at = CURRENT_TIMESTAMP`,
    [sprint, user, d, (args.done_text as string) ?? null, (args.plan_text as string) ?? null, storyIdsJson, (args.blockers as string) ?? null],
  )
  if (result.error) return err(result.error)
  return text(`✅ ${d} standup saved`)
}

export async function toolListStandupEntries(args: Record<string, unknown>): Promise<ToolResult> {
  const sprint = await resolveSprint(args.sprint as string | undefined)
  const date = args.date as string | undefined
  const withFeedback = args.with_feedback === true || args.with_feedback === 'true'

  let sql: string
  const sqlArgs: (string | number)[] = []

  if (sprint && date) {
    sql = 'SELECT * FROM pm_standup_entries WHERE sprint = ? AND entry_date = ? ORDER BY user_name'
    sqlArgs.push(sprint, date)
  } else if (date) {
    sql = 'SELECT * FROM pm_standup_entries WHERE entry_date = ? ORDER BY user_name'
    sqlArgs.push(date)
  } else if (sprint) {
    sql = 'SELECT * FROM pm_standup_entries WHERE sprint = ? ORDER BY entry_date DESC, user_name LIMIT 50'
    sqlArgs.push(sprint)
  } else {
    return err('Please specify a sprint or date.')
  }

  const result = await query<{ id: number; user_name: string; entry_date: string; done_text: string | null; plan_text: string | null; blockers: string | null }>(sql, sqlArgs)
  if (result.error) return err(result.error)
  if (result.rows.length === 0) return text('No standup records found.')

  const lines = ['📝 Standup Records', '─────────────']

  // Batch-fetch feedback in a single IN query when requested — eliminates N+1
  type FeedbackRow = { standup_entry_id: number; feedback_by: string; feedback_text: string; review_type: string; created_at: string }
  const feedbackMap: Record<number, FeedbackRow[]> = {}
  if (withFeedback && result.rows.length > 0) {
    const ids = result.rows.map(e => e.id)
    const ph = ids.map(() => '?').join(',')
    const fbResult = await query<FeedbackRow>(
      `SELECT standup_entry_id, feedback_by, feedback_text, review_type, created_at FROM pm_standup_feedback WHERE standup_entry_id IN (${ph}) ORDER BY created_at ASC`,
      ids,
    )
    if (!fbResult.error) {
      for (const f of fbResult.rows) {
        if (!feedbackMap[f.standup_entry_id]) feedbackMap[f.standup_entry_id] = []
        feedbackMap[f.standup_entry_id].push(f)
      }
    } else {
      lines.push('⚠️ Warning: could not load feedback data.')
    }
  }
  for (const e of result.rows) {
    lines.push(`\n👤 ${e.user_name} (${e.entry_date})`)
    if (e.done_text) lines.push(`  ✅ ${e.done_text}`)
    if (e.plan_text) lines.push(`  📌 ${e.plan_text}`)
    if (e.blockers) lines.push(`  🚧 ${e.blockers}`)
    if (withFeedback) {
      const fb = feedbackMap[e.id] ?? []
      if (fb.length > 0) {
        lines.push(`  💬 Feedback (${fb.length}):`)
        for (const f of fb) {
          const icon = f.review_type === 'approve' ? '✅' : f.review_type === 'request_changes' ? '🔄' : '💬'
          lines.push(`    ${icon} ${f.feedback_by}: ${f.feedback_text}`)
        }
      }
    }
  }
  return text(lines.join('\n'))
}

// ═══════════════════════════════════════════
// Standup Feedback
// ═══════════════════════════════════════════

export async function toolReviewStandup(user: string, args: Record<string, unknown>): Promise<ToolResult> {
  const entryId = args.standup_entry_id as number
  const sprint = args.sprint as string
  const targetUser = args.target_user as string
  const feedbackText = args.feedback_text as string
  const reviewType = (args.review_type as string) || 'comment'

  if (!['comment', 'approve', 'request_changes'].includes(reviewType)) {
    return text('❌ review_type must be one of: comment, approve, request_changes.')
  }

  // Verify the standup entry exists and validate consistency
  const entryCheck = await query<{ id: number; user_name: string; sprint: string }>(
    'SELECT id, user_name, sprint FROM pm_standup_entries WHERE id = ?', [entryId],
  )
  if (entryCheck.rows.length === 0) return text('❌ Standup entry not found.')
  const entry = entryCheck.rows[0]
  if (entry.sprint !== sprint) return text(`❌ Sprint mismatch: entry belongs to ${entry.sprint} but ${sprint} was requested.`)
  if (entry.user_name !== targetUser) return text(`❌ Target user mismatch: entry author is ${entry.user_name} but ${targetUser} was requested.`)

  const result = await execute(
    'INSERT INTO pm_standup_feedback (standup_entry_id, sprint, target_user, feedback_by, feedback_text, review_type) VALUES (?, ?, ?, ?, ?, ?)',
    [entryId, sprint, targetUser, user, feedbackText, reviewType],
  )
  if (result.error) return text(`❌ ${result.error}`)

  const icon = reviewType === 'approve' ? '✅' : reviewType === 'request_changes' ? '🔄' : '💬'
  return text(`${icon} Feedback registered for ${targetUser}'s standup (${reviewType})`)
}

export async function toolGetStandupFeedback(args: Record<string, unknown>): Promise<ToolResult> {
  const entryId = args.standup_entry_id as number | undefined
  const sprint = args.sprint as string | undefined
  const user = args.user as string | undefined

  let result
  if (entryId) {
    result = await query('SELECT * FROM pm_standup_feedback WHERE standup_entry_id = ? ORDER BY created_at ASC', [entryId])
  } else if (sprint && user) {
    result = await query('SELECT * FROM pm_standup_feedback WHERE sprint = ? AND target_user = ? ORDER BY created_at DESC LIMIT 50', [sprint, user])
  } else {
    return text('❌ standup_entry_id or (sprint + user) parameters required.')
  }

  if (result.error) return text(`❌ ${result.error}`)
  if (result.rows.length === 0) return text('📝 No feedback found.')

  const lines = ['📝 Standup Feedback', '─────────────']
  for (const f of result.rows as Array<Record<string, unknown>>) {
    const icon = f.review_type === 'approve' ? '✅' : f.review_type === 'request_changes' ? '🔄' : '💬'
    lines.push(`${icon} [${f.review_type}] ${f.feedback_by} → ${f.target_user}`)
    lines.push(`   ${f.feedback_text}`)
    lines.push(`   ${f.created_at}`)
    lines.push('')
  }
  return text(lines.join('\n'))
}
