/**
 * Proactive Nudge — Cron-triggered check & webhook notification module
 */

// ── Types ──
interface NudgeRule {
  id: string
  label: string
  check: (env: Env) => Promise<NudgeMessage[]>
}

interface NudgeMessage {
  ruleId: string
  title: string
  body: string
  mentions?: string[] // user names
}

interface Env {
  DB_URL: string
  DB_AUTH_TOKEN: string
  NUDGE_WEBHOOK_URL?: string
}

// ── DB helper (standalone fetch for cron context) ──
async function query(env: Env, sql: string, args: unknown[] = []): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${env.DB_URL}/v2/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.DB_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        { type: 'execute', stmt: { sql, args: args.map(a => ({ type: typeof a === 'number' ? 'integer' : 'text', value: String(a) })) } },
        { type: 'close' },
      ],
    }),
  })
  const data = (await res.json()) as { results?: Array<{ response?: { result?: { cols?: Array<{ name: string }>; rows?: unknown[][] } } }> }
  const result = data.results?.[0]?.response?.result
  if (!result?.cols || !result?.rows) return []
  return result.rows.map((row: unknown[]) => {
    const obj: Record<string, unknown> = {}
    result.cols!.forEach((col: { name: string }, i: number) => {
      obj[col.name] = (row[i] as { value?: unknown })?.value ?? row[i]
    })
    return obj
  })
}

// ── Rules ──

// Rule 1: review_required memo unanswered for 24h
const reviewOverdue: NudgeRule = {
  id: 'review_overdue',
  label: 'Review request unanswered for 24h',
  check: async (env) => {
    const rows = await query(env,
      `SELECT id, title, content, assigned_to, created_by, created_at
       FROM memos_v2
       WHERE review_required = 1
         AND status = 'open'
         AND created_at <= datetime('now', '-24 hours')
       LIMIT 10`)
    return rows.map(r => ({
      ruleId: 'review_overdue',
      title: `Pending review: ${r.title || (r.content as string).slice(0, 30)}`,
      body: `${r.created_by} → ${r.assigned_to} | waiting since ${r.created_at}`,
      mentions: r.assigned_to ? [r.assigned_to as string] : [],
    }))
  },
}

// Rule 2: Sprint deadline within 3 days, less than 50% complete
const sprintDeadline: NudgeRule = {
  id: 'sprint_deadline',
  label: 'Sprint deadline approaching',
  check: async (env) => {
    // Check active sprint
    const sprints = await query(env,
      `SELECT id, end_date FROM nav_sprints WHERE active = 1 LIMIT 1`)
    if (!sprints.length) return []
    const sprint = sprints[0]
    const endDate = new Date(sprint.end_date as string)
    const now = new Date()
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft > 3) return []

    // Check progress
    const stories = await query(env,
      `SELECT status FROM pm_stories WHERE sprint = ? AND status != 'cancelled'`,
      [sprint.id as string])
    if (!stories.length) return []
    const done = stories.filter(s => s.status === 'done').length
    const total = stories.length
    const pct = Math.round((done / total) * 100)
    if (pct >= 50) return [] // 50%+ is OK

    return [{
      ruleId: 'sprint_deadline',
      title: `${sprint.id} due in ${daysLeft} days — progress ${pct}%`,
      body: `${done}/${total} stories completed. Due: ${sprint.end_date}`,
    }]
  },
}

// Rule 3: Standup not submitted today
const standupMissing: NudgeRule = {
  id: 'standup_missing',
  label: 'Standup not submitted',
  check: async (env) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Active sprint
    const sprints = await query(env,
      `SELECT id FROM nav_sprints WHERE active = 1 LIMIT 1`)
    if (!sprints.length) return []

    // Who submitted today
    const written = await query(env,
      `SELECT DISTINCT user_name FROM pm_standup_entries WHERE entry_date = ?`, [today])
    const writtenSet = new Set(written.map(w => w.user_name as string))

    // All team members
    const members = await query(env,
      `SELECT DISTINCT user_name FROM auth_tokens WHERE is_active = 1`)
    const missing = members
      .map(m => m.user_name as string)
      .filter(name => !writtenSet.has(name))

    if (!missing.length) return []

    // Only trigger in afternoon (give people time to write)
    const hour = now.getUTCHours()
    if (hour < 8) return [] // Before 08:00 UTC

    return [{
      ruleId: 'standup_missing',
      title: `Standup not submitted: ${missing.length} members`,
      body: `Missing: ${missing.join(', ')}`,
      mentions: missing,
    }]
  },
}

// Rule 4: Task stagnant 3+ days in-progress
const taskStagnant: NudgeRule = {
  id: 'task_stagnant',
  label: 'Task stagnant 3+ days',
  check: async (env) => {
    const rows = await query(env,
      `SELECT t.id, t.title, t.assignee, t.updated_at, s.title as story_title
       FROM pm_tasks t
       JOIN pm_stories s ON t.story_id = s.id
       JOIN nav_sprints sp ON s.sprint = sp.id AND sp.active = 1
       WHERE t.status = 'in-progress'
         AND t.updated_at <= datetime('now', '-3 days')
       LIMIT 10`)
    return rows.map(r => ({
      ruleId: 'task_stagnant',
      title: `Task stagnant 3+ days: ${(r.title as string).slice(0, 40)}`,
      body: `Assignee: ${r.assignee || 'Unassigned'} | Story: ${r.story_title} | Last update: ${r.updated_at}`,
      mentions: r.assignee ? [r.assignee as string] : [],
    }))
  },
}

// Rule 5: Unresolved blocker
const blockerOpen: NudgeRule = {
  id: 'blocker_open',
  label: 'Unresolved blocker',
  check: async (env) => {
    const rows = await query(env,
      `SELECT id, title, content, created_by, assigned_to, created_at
       FROM memos_v2
       WHERE memo_type = 'blocker'
         AND status = 'open'
       LIMIT 10`)
    return rows.map(r => ({
      ruleId: 'blocker_open',
      title: `Unresolved blocker: ${r.title || (r.content as string).slice(0, 30)}`,
      body: `Author: ${r.created_by} | Assignee: ${r.assigned_to || 'Unassigned'} | open since ${r.created_at}`,
      mentions: r.assigned_to ? [r.assigned_to as string] : [],
    }))
  },
}

// Rule 6: Sprint daily progress report
const sprintDailyReport: NudgeRule = {
  id: 'sprint_daily_report',
  label: 'Sprint daily progress',
  check: async (env) => {
    const sprints = await query(env,
      `SELECT id, end_date, theme FROM nav_sprints WHERE active = 1 LIMIT 1`)
    if (!sprints.length) return []
    const sprint = sprints[0]
    const endDate = new Date(sprint.end_date as string)
    const now = new Date()
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const stories = await query(env,
      `SELECT status FROM pm_stories WHERE sprint = ? AND status != 'cancelled'`,
      [sprint.id as string])
    if (!stories.length) return []

    const done = stories.filter(s => s.status === 'done').length
    const inProgress = stories.filter(s => s.status === 'in-progress').length
    const total = stories.length
    const pct = Math.round((done / total) * 100)

    // Only trigger in afternoon
    const hour = now.getUTCHours()
    if (hour < 8) return [] // Before 08:00 UTC

    return [{
      ruleId: 'sprint_daily_report',
      title: `${sprint.id} Daily Report — ${pct}% completed`,
      body: `completed ${done} / in-progress ${inProgress} / total ${total} | D-${daysLeft} (Due: ${sprint.end_date})`,
    }]
  },
}

const RULES: NudgeRule[] = [reviewOverdue, sprintDeadline, standupMissing, taskStagnant, blockerOpen, sprintDailyReport]

// ── Webhook sender ──
async function sendWebhook(env: Env, messages: NudgeMessage[]): Promise<void> {
  const url = env.NUDGE_WEBHOOK_URL
  if (!url || !messages.length) return

  // Discord/Slack compatible embed format
  const embeds = messages.map(m => ({
    title: m.title,
    description: m.body,
    color: m.ruleId === 'review_overdue' ? 0xf59e0b
         : m.ruleId === 'sprint_deadline' ? 0xef4444
         : m.ruleId === 'task_stagnant' ? 0xf97316
         : m.ruleId === 'blocker_open' ? 0xdc2626
         : m.ruleId === 'sprint_daily_report' ? 0x8b5cf6
         : 0x3b82f6,
    footer: { text: `nudge:${m.ruleId}` },
  }))

  // Discord webhook
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds }),
  })
}

// ── Nudge log ──
async function logNudges(env: Env, messages: NudgeMessage[]): Promise<void> {
  for (const m of messages) {
    await query(env,
      `INSERT INTO nudge_log (rule_id, title, body, created_at) VALUES (?, ?, ?, datetime('now'))`,
      [m.ruleId, m.title, m.body])
  }
}

// ── Main entry ──
export async function handleScheduled(env: Env): Promise<void> {
  const allMessages: NudgeMessage[] = []

  for (const rule of RULES) {
    try {
      const msgs = await rule.check(env)
      allMessages.push(...msgs)
    } catch (e) {
      console.error(`Nudge rule ${rule.id} failed:`, e)
    }
  }

  if (allMessages.length > 0) {
    await sendWebhook(env, allMessages)
    await logNudges(env, allMessages)
  }

  if (allMessages.length > 0) {
    console.log(`Nudge: ${allMessages.length} messages sent (${allMessages.map(m => m.ruleId).join(', ')})`)
  }
}
