// Unified MCP PM Server
// Combines project management tools + notification tools into a single MCP server.
// All operations go through the PM API via HTTP (no direct DB access).

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from './api-client.js'

let activeSprint = ''
const PM_API_URL = process.env.PM_API_URL ?? ''

async function fetchActiveSprint(): Promise<void> {
  try {
    const resp = await fetch(`${PM_API_URL}/api/sprint/active`, { signal: AbortSignal.timeout(5000) })
    const data = await resp.json() as { sprint?: string }
    if (data.sprint) activeSprint = data.sprint
  } catch { /* will fail gracefully on tool calls */ }
}

const server = new McpServer({
  name: 'mcp-pm',
  version: '2.0.0',
})

// ── Helpers ──

function text(t: string) {
  return { content: [{ type: 'text' as const, text: t }] }
}

function err(msg: string) {
  return text(`Error: ${msg}`)
}

function resolveSprint(arg?: string): string | null {
  return arg || activeSprint || null
}

function progressBar(done: number, total: number, width = 10): string {
  if (total === 0) return '\u2591'.repeat(width)
  const filled = Math.round((done / total) * width)
  return '\u2588'.repeat(filled) + '\u2591'.repeat(width - filled)
}

// ── Types (API responses) ──

interface DashboardData {
  user: string
  sprint: string
  tasks: Record<string, number>
  unread_memos: number
  has_standup: boolean
}

interface TaskRow {
  task_id: number; task_title: string; task_status: string
  story_id: number; story_title: string
  epic_id: number | null; epic_title: string | null
}

interface TaskDetail {
  task: {
    id: number; story_id: number; title: string; assignee: string | null
    status: string; description: string | null; sort_order: number
    created_at: string; updated_at: string
  }
  story: {
    id: number; title: string; description: string | null
    acceptance_criteria: string | null; assignee: string | null
    status: string; sprint: string
  } | null
  siblings: Array<{ id: number; title: string; status: string; assignee: string | null }>
}

interface StandupData {
  user: string; sprint: string; date: string
  entry: {
    id: number; done_text: string | null; plan_text: string | null
    plan_story_ids: string | null; blockers: string | null
    created_at: string; updated_at: string
  } | null
  stories: Array<{ id: number; title: string }>
}

interface MemoRow {
  id: number; from_user: string; to_user: string; content: string
  story_id: number | null; is_read: number; reply: string | null
  replied_by: string | null; replied_at: string | null; created_at: string
}

interface SprintData {
  sprint: string
  epics: Array<{ epic_title: string; total: number; done: number }>
  assignees: Array<{ assignee: string; total: number; done: number; in_progress: number; todo: number }>
  blockers: Array<{ user_name: string; blockers: string; entry_date: string }>
}

interface NotificationRow {
  id: number; type: string; title: string; body: string | null
  source_type: string; source_id: string; page_id: string
  actor: string; is_read: number; created_at: string
}

interface MemoV2Row {
  id: number; page_id: string; content: string; memo_type: string
  created_by: string; assigned_to: string | null; created_at: string
}

// ══════════════════════════════════════════════════
// PM TOOLS
// ══════════════════════════════════════════════════

// ── Tool 1: my_dashboard ──

server.tool(
  'my_dashboard',
  'My dashboard — task status, unread memos, today\'s standup status',
  {},
  async () => {
    const sprint = resolveSprint()
    if (!sprint) return err('No active sprint found. Set PM_SPRINT env var.')

    const { data, error } = await apiGet<DashboardData>('/api/dashboard', { sprint })
    if (error || !data) return err(error ?? 'Unknown error')

    const s = data.tasks
    const lines = [
      `Dashboard for ${data.user} (${sprint.toUpperCase()})`,
      '─────────────',
      `Tasks: todo ${s.todo ?? 0} | in-progress ${s['in-progress'] ?? 0} | done ${s.done ?? 0}`,
      `Unread memos: ${data.unread_memos}`,
      `Today's standup: ${data.has_standup ? 'Submitted' : 'Not submitted'}`,
    ]

    return text(lines.join('\n'))
  },
)

// ── Tool 2: list_my_tasks ──

server.tool(
  'list_my_tasks',
  'My task list (Epic > Story > Task tree)',
  {
    status: z.enum(['todo', 'in-progress', 'done']).optional().describe('Filter by status'),
    sprint: z.string().optional().describe('Sprint ID (default: active sprint)'),
  },
  async ({ status, sprint: sprintArg }) => {
    const sprint = resolveSprint(sprintArg)
    if (!sprint) return err('Please specify a sprint.')

    const params: Record<string, string> = { sprint }
    if (status) params.status = status

    const { data, error } = await apiGet<{ user: string; sprint: string; tasks: TaskRow[] }>('/api/tasks', params)
    if (error || !data) return err(error ?? 'Unknown error')
    if (data.tasks.length === 0) return text(`No tasks found for ${data.user}.`)

    const statusIcon: Record<string, string> = { todo: '[ ]', 'in-progress': '[~]', done: '[x]' }

    const tree = new Map<string, Map<string, Array<{ id: number; title: string; status: string }>>>()
    for (const r of data.tasks) {
      const epicKey = r.epic_title ?? '(No epic)'
      if (!tree.has(epicKey)) tree.set(epicKey, new Map())
      const epicMap = tree.get(epicKey)!
      const storyKey = `[S${r.story_id}] ${r.story_title}`
      if (!epicMap.has(storyKey)) epicMap.set(storyKey, [])
      epicMap.get(storyKey)!.push({ id: r.task_id, title: r.task_title, status: r.task_status })
    }

    const lines: string[] = [`Tasks for ${data.user} (${sprint.toUpperCase()})`, '─────────────']
    for (const [epicTitle, stories] of tree) {
      lines.push(`\n# ${epicTitle}`)
      for (const [storyTitle, tasks] of stories) {
        lines.push(`  ${storyTitle}`)
        for (const t of tasks) {
          lines.push(`    ${statusIcon[t.status] ?? '[ ]'} [T${t.id}] ${t.title}`)
        }
      }
    }

    return text(lines.join('\n'))
  },
)

// ── Tool 3: get_task ──

server.tool(
  'get_task',
  'Task detail + parent story context + sibling tasks',
  {
    task_id: z.number().describe('Task ID'),
  },
  async ({ task_id }) => {
    const { data, error } = await apiGet<TaskDetail>(`/api/tasks/${task_id}`)
    if (error || !data) return err(error ?? 'Unknown error')

    const t = data.task
    const s = data.story
    const statusIcon: Record<string, string> = { todo: '[ ]', 'in-progress': '[~]', done: '[x]' }

    const lines = [
      `Task #${t.id}: ${t.title}`,
      '─────────────',
      `Status: ${statusIcon[t.status] ?? '[ ]'} ${t.status}`,
      `Assignee: ${t.assignee ?? 'Unassigned'}`,
      t.description ? `Description: ${t.description}` : '',
      `Created: ${t.created_at} | Updated: ${t.updated_at}`,
    ].filter(Boolean)

    if (s) {
      lines.push(
        '',
        `Parent Story [S${s.id}]: ${s.title}`,
        `  Sprint: ${s.sprint} | Status: ${s.status} | Assignee: ${s.assignee ?? 'Unassigned'}`,
      )
      if (s.description) lines.push(`  Description: ${s.description}`)
      if (s.acceptance_criteria) lines.push(`  AC: ${s.acceptance_criteria}`)
    }

    if (data.siblings.length > 0) {
      lines.push('', 'Sibling Tasks:')
      for (const sb of data.siblings) {
        const marker = sb.id === task_id ? ' <-- current' : ''
        lines.push(`  ${statusIcon[sb.status] ?? '[ ]'} [T${sb.id}] ${sb.title} (${sb.assignee ?? 'Unassigned'})${marker}`)
      }
    }

    return text(lines.join('\n'))
  },
)

// ── Tool 4: update_task_status ──

server.tool(
  'update_task_status',
  'Update task status',
  {
    task_id: z.number().describe('Task ID'),
    status: z.enum(['todo', 'in-progress', 'done']).describe('New status'),
  },
  async ({ task_id, status }) => {
    const { error } = await apiPatch(`/api/tasks/${task_id}/status`, { status })
    if (error) return err(error)
    return text(`Task #${task_id} updated to ${status}`)
  },
)

// ── Tool 5: add_task ──

server.tool(
  'add_task',
  'Add a new task to a story',
  {
    story_id: z.number().describe('Story ID'),
    title: z.string().describe('Task title'),
    assignee: z.string().optional().describe('Assignee (default: token user)'),
    description: z.string().optional().describe('Task description'),
  },
  async ({ story_id, title, assignee, description }) => {
    const { data, error } = await apiPost<{ ok: boolean; story_id: number; title: string }>('/api/tasks', {
      story_id, title, assignee, description,
    })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Task added to story #${story_id}: ${title}`)
  },
)

// ── Tool 6: list_my_stories ──

server.tool(
  'list_my_stories',
  'My story list — find story IDs to reference in standups',
  {
    sprint: z.string().optional().describe('Sprint ID (default: active sprint)'),
  },
  async ({ sprint: sprintArg }) => {
    const sprint = resolveSprint(sprintArg)
    if (!sprint) return err('Please specify a sprint.')

    const { data, error } = await apiGet<{
      user: string; sprint: string
      stories: Array<{ id: number; title: string; status: string; epic_title: string | null }>
    }>('/api/stories', { sprint })
    if (error || !data) return err(error ?? 'Unknown error')
    if (data.stories.length === 0) return text(`No stories found for ${data.user}.`)

    const statusIcon: Record<string, string> = { todo: '[ ]', 'in-progress': '[~]', done: '[x]' }

    const lines = [`Stories for ${data.user} (${sprint.toUpperCase()})`, '─────────────']
    let lastEpic = ''
    for (const s of data.stories) {
      const epic = s.epic_title ?? '(No epic)'
      if (epic !== lastEpic) {
        lines.push(`\n# ${epic}`)
        lastEpic = epic
      }
      lines.push(`  ${statusIcon[s.status] ?? '[ ]'} [S${s.id}] ${s.title}`)
    }
    lines.push('', 'Tip: Pass story IDs as an array to save_standup\'s plan_story_ids parameter.')

    return text(lines.join('\n'))
  },
)

// ── Tool 7: get_standup ──

server.tool(
  'get_standup',
  'View standup entry',
  {
    date: z.string().optional().describe('Date (YYYY-MM-DD, default: today)'),
    sprint: z.string().optional().describe('Sprint ID (default: active sprint)'),
  },
  async ({ date, sprint: sprintArg }) => {
    const sprint = resolveSprint(sprintArg)
    if (!sprint) return err('Please specify a sprint.')

    const params: Record<string, string> = { sprint }
    if (date) params.date = date

    const { data, error } = await apiGet<StandupData>('/api/standup', params)
    if (error || !data) return err(error ?? 'Unknown error')
    if (!data.entry) return text(`No standup entry for ${data.date}.`)

    const e = data.entry
    const lines = [
      `Standup for ${data.user} (${data.date})`,
      '─────────────',
      `Done: ${e.done_text ?? '(none)'}`,
      `Plan: ${e.plan_text ?? '(none)'}`,
    ]
    if (data.stories.length > 0) {
      const storyLines = data.stories.map(s => `  - [S${s.id}] ${s.title}`).join('\n')
      lines.push(`Planned stories:\n${storyLines}`)
    }
    if (e.blockers) lines.push(`Blockers: ${e.blockers}`)

    return text(lines.join('\n'))
  },
)

// ── Tool 8: save_standup ──

server.tool(
  'save_standup',
  'Save standup entry (upsert)',
  {
    done_text: z.string().optional().describe('Work completed'),
    plan_text: z.string().optional().describe('Today\'s plan'),
    plan_story_ids: z.array(z.number()).optional().describe('Planned story IDs array'),
    blockers: z.string().optional().describe('Blockers'),
    date: z.string().optional().describe('Date (YYYY-MM-DD, default: today)'),
    sprint: z.string().optional().describe('Sprint ID (default: active sprint)'),
  },
  async ({ done_text, plan_text, plan_story_ids, blockers, date, sprint: sprintArg }) => {
    const sprint = resolveSprint(sprintArg)
    if (!sprint) return err('Please specify a sprint.')

    const { data, error } = await apiPut<{ ok: boolean; date: string }>('/api/standup', {
      sprint, done_text, plan_text, plan_story_ids, blockers, date,
    })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Standup saved for ${data.date}`)
  },
)

// ── Tool 9: send_memo ──

server.tool(
  'send_memo',
  'Send a memo to a team member',
  {
    to_user: z.string().describe('Recipient name'),
    content: z.string().describe('Memo content'),
    story_id: z.number().optional().describe('Related story ID'),
    sprint: z.string().optional().describe('Sprint ID (default: active sprint)'),
  },
  async ({ to_user, content, story_id, sprint: sprintArg }) => {
    const sprint = resolveSprint(sprintArg)
    if (!sprint) return err('Please specify a sprint.')

    const { data, error } = await apiPost<{ ok: boolean; from_user: string; to_user: string }>('/api/memos', {
      to_user, content, story_id, sprint,
    })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Memo sent: ${data.from_user} -> ${data.to_user}`)
  },
)

// ── Tool 10: list_my_memos ──

server.tool(
  'list_my_memos',
  'List memos sent to me',
  {
    unread_only: z.boolean().optional().describe('Unread only (default: false)'),
    sprint: z.string().optional().describe('Sprint ID (default: active sprint)'),
  },
  async ({ unread_only, sprint: sprintArg }) => {
    const sprint = resolveSprint(sprintArg)
    if (!sprint) return err('Please specify a sprint.')

    const params: Record<string, string> = { sprint }
    if (unread_only) params.unread_only = 'true'

    const { data, error } = await apiGet<{ user: string; sprint: string; memos: MemoRow[] }>('/api/memos', params)
    if (error || !data) return err(error ?? 'Unknown error')
    if (data.memos.length === 0) return text('No memos found.')

    const lines = [`Memos for ${data.user} (${sprint.toUpperCase()})`, '─────────────']
    for (const m of data.memos) {
      const readIcon = m.is_read ? '(read)' : '(new)'
      const storyTag = m.story_id ? ` [S${m.story_id}]` : ''
      const preview = m.content.length > 60 ? m.content.slice(0, 60) + '...' : m.content
      lines.push(`${readIcon} [M${m.id}] ${m.from_user}${storyTag}: ${preview}`)
      if (m.reply) {
        const replyPreview = m.reply.length > 50 ? m.reply.slice(0, 50) + '...' : m.reply
        lines.push(`  -> ${m.replied_by}: ${replyPreview}`)
      }
    }

    return text(lines.join('\n'))
  },
)

// ── Tool 11: read_memo ──

server.tool(
  'read_memo',
  'Read memo detail and mark as read',
  {
    memo_id: z.number().describe('Memo ID'),
  },
  async ({ memo_id }) => {
    const { data, error } = await apiPatch<{ memo: MemoRow }>(`/api/memos/${memo_id}/read`, {})
    if (error || !data) return err(error ?? 'Unknown error')

    const m = data.memo
    const lines = [
      `Memo #${m.id}`,
      '─────────────',
      `From: ${m.from_user} -> ${m.to_user}`,
      m.story_id ? `Story: [S${m.story_id}]` : '',
      `Date: ${m.created_at}`,
      '',
      m.content,
    ].filter(Boolean)

    if (m.reply) {
      lines.push('', `Reply (${m.replied_by}, ${m.replied_at}):`, m.reply)
    }

    return text(lines.join('\n'))
  },
)

// ── Tool 12: reply_memo ──

server.tool(
  'reply_memo',
  'Reply to a memo',
  {
    memo_id: z.number().describe('Memo ID'),
    content: z.string().describe('Reply content'),
  },
  async ({ memo_id, content }) => {
    const { error } = await apiPost(`/api/memos/${memo_id}/reply`, { content })
    if (error) return err(error)
    return text(`Reply sent to memo #${memo_id}`)
  },
)

// ── Tool 13: sprint_summary ──

server.tool(
  'sprint_summary',
  'Sprint overview — progress by epic, workload by assignee, blockers',
  {
    sprint: z.string().optional().describe('Sprint ID (default: active sprint)'),
  },
  async ({ sprint: sprintArg }) => {
    const sprint = resolveSprint(sprintArg)
    if (!sprint) return err('Please specify a sprint.')

    const { data, error } = await apiGet<SprintData>('/api/sprint/summary', { sprint })
    if (error || !data) return err(error ?? 'Unknown error')

    const lines = [`Sprint Summary: ${sprint.toUpperCase()}`, '─────────────']

    for (const e of data.epics) {
      const pct = e.total > 0 ? Math.round((e.done / e.total) * 100) : 0
      lines.push(`# ${e.epic_title}: ${progressBar(e.done, e.total)} ${e.done}/${e.total} (${pct}%)`)
    }

    if (data.assignees.length > 0) {
      lines.push('')
      for (const a of data.assignees) {
        lines.push(`${a.assignee}: ${a.total} tasks (done ${a.done}, in-progress ${a.in_progress}, todo ${a.todo})`)
      }
    }

    if (data.blockers.length > 0) {
      lines.push('', `Blockers: ${data.blockers.length}`)
      for (const b of data.blockers) {
        lines.push(`  - [${b.entry_date}] ${b.user_name}: ${b.blockers}`)
      }
    } else {
      lines.push('', 'Blockers: 0')
    }

    return text(lines.join('\n'))
  },
)

// ══════════════════════════════════════════════════
// NOTIFICATION TOOLS
// ══════════════════════════════════════════════════

// ── Tool 14: check_notifications ──

server.tool(
  'check_notifications',
  'Check unread notifications for a user (max 20)',
  {
    user_name: z.string().describe('User name to check'),
  },
  async ({ user_name }) => {
    const { data, error } = await apiGet<{ notifications: NotificationRow[] }>(
      '/api/notifications', { user_name, unread_only: 'true', limit: '20' },
    )
    if (error || !data) return err(error ?? 'Unknown error')

    if (data.notifications.length === 0) {
      return text(`No unread notifications for ${user_name}.`)
    }

    const lines = data.notifications.map((n, i) => {
      const icon = n.type === 'memo_assigned' ? '[memo]'
        : n.type === 'reply_received' ? '[reply]'
        : '[notice]'
      return `${i + 1}. ${icon} [ID:${n.id}] ${n.title}\n   ${n.body ?? ''}\n   Page: ${n.page_id} | ${n.created_at}`
    })

    return text(`Unread notifications for ${user_name} (${data.notifications.length}):\n\n${lines.join('\n\n')}`)
  },
)

// ── Tool 15: mark_notification_read ──

server.tool(
  'mark_notification_read',
  'Mark a notification as read',
  {
    notification_id: z.number().describe('Notification ID to mark as read'),
  },
  async ({ notification_id }) => {
    const { data, error } = await apiPatch<{ ok: boolean; rows_affected: number }>(
      `/api/notifications/${notification_id}/read`, {},
    )
    if (error || !data) return err(error ?? 'Unknown error')

    return text(
      data.rows_affected > 0
        ? `Notification #${notification_id} marked as read.`
        : `Notification #${notification_id} not found.`,
    )
  },
)

// ── Tool 16: check_open_memos ──

server.tool(
  'check_open_memos',
  'Check all open memos assigned to a user',
  {
    user_name: z.string().describe('User name to check'),
  },
  async ({ user_name }) => {
    const { data, error } = await apiGet<{ memos: MemoV2Row[] }>(
      '/api/memos/v2', { assigned_to: user_name, status: 'open' },
    )
    if (error || !data) return err(error ?? 'Unknown error')

    if (data.memos.length === 0) {
      return text(`No open memos assigned to ${user_name}.`)
    }

    const typeIcons: Record<string, string> = {
      memo: '[memo]', decision: '[decision]', request: '[request]', backlog: '[idea]',
    }

    const lines = data.memos.map((m, i) => {
      const icon = typeIcons[m.memo_type] ?? '[memo]'
      const preview = m.content.length > 80 ? m.content.slice(0, 80) + '...' : m.content
      return `${i + 1}. ${icon} [ID:${m.id}] ${m.created_by} -> ${m.assigned_to}\n   ${preview}\n   Page: ${m.page_id} | ${m.created_at}`
    })

    return text(`Open memos for ${user_name} (${data.memos.length}):\n\n${lines.join('\n\n')}`)
  },
)

// ── Tool 17: create_notification ──

server.tool(
  'create_notification',
  'Create a notification for a user (triggered by memo events like replies, resolve, reopen)',
  {
    user_name: z.string().describe('Notification recipient'),
    type: z.enum(['memo_assigned', 'memo_mention_all', 'reply_received', 'memo_resolved', 'memo_reopened'])
      .describe('Notification type'),
    title: z.string().describe('Notification title'),
    body: z.string().optional().describe('Notification body preview (under 60 chars)'),
    source_id: z.number().describe('Related memo ID'),
    page_id: z.string().describe('Page ID where the memo belongs (e.g., home, diagnosis)'),
    actor: z.string().describe('Name of the user who performed the action'),
  },
  async ({ user_name, type, title, body, source_id, page_id, actor }) => {
    const { data, error } = await apiPost<{ ok: boolean }>('/api/notifications', {
      user_name, type, title, body, source_type: 'memo', source_id, page_id, actor,
    })
    if (error || !data) return err(error ?? 'Unknown error')

    return text(`Notification created: [${type}] "${title}" -> ${user_name}`)
  },
)

// ── Tool 18: emit_event ──

server.tool(
  'emit_event',
  'Emit agent event — push notification to target agent/user',
  {
    event_type: z.enum([
      'memo_assigned', 'memo_replied', 'memo_resolved',
      'review_requested', 'task_status_changed', 'decision_needed', 'sprint_alert',
    ]).describe('Event type'),
    target_agent: z.string().describe('Target agent (e.g. Oscar, Penny)'),
    target_user: z.string().describe('Target user name'),
    payload: z.string().describe('Event payload (JSON string)'),
    ttl_hours: z.number().optional().describe('TTL hours (default: 24)'),
    source_agent: z.string().optional().describe('Source agent name (default: calling user)'),
  },
  async ({ event_type, target_agent, target_user, payload, ttl_hours, source_agent }) => {
    const { data, error } = await apiPost<{ ok: boolean; id: number; ttl_hours: number }>(
      '/api/v2/agent-events',
      { event_type, target_agent, target_user, payload, ttl_hours, source_agent },
    )
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`✅ Event emitted: [${event_type}] → ${target_user} (ID: ${data.id}, TTL: ${data.ttl_hours}h)`)
  },
)

// ── Tool 19: poll_events ──

server.tool(
  'poll_events',
  'Poll pending events (SSE fallback for unsupported clients)',
  {
    event_type: z.string().optional().describe('Event type filter'),
    limit: z.number().optional().describe('Max results (default: 20)'),
  },
  async ({ event_type, limit }) => {
    const params: Record<string, string> = {}
    if (event_type) params.event_type = event_type
    if (limit !== undefined) params.limit = String(limit)

    const { data, error } = await apiGet<{
      events: Array<{
        id: number; event_type: string; source_agent: string; target_agent: string
        payload: string; status: string; created_at: string
      }>
    }>('/api/v2/agent-events', params)
    if (error || !data) return err(error ?? 'Unknown error')

    if (data.events.length === 0) return text('📭 No pending events.')

    const lines = [`📬 Pending events (${data.events.length})`, '─────────────']
    for (const e of data.events) {
      const payloadPreview = e.payload.length > 60 ? e.payload.slice(0, 60) + '...' : e.payload
      lines.push(`[E${e.id}] ${e.event_type} from ${e.source_agent} (${e.created_at.slice(5, 16)})`)
      lines.push(`  payload: ${payloadPreview}`)
    }
    return text(lines.join('\n'))
  },
)

// ── Tool 20: ack_event ──

server.tool(
  'ack_event',
  'Acknowledge event',
  {
    event_id: z.number().describe('Event ID'),
  },
  async ({ event_id }) => {
    const { data, error } = await apiPatch<{ ok: boolean; event_id: number }>(
      `/api/v2/agent-events/${event_id}/ack`, {},
    )
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`✅ Event #${event_id} acknowledged`)
  },
)

// ── Tool 21: resolve_memo ──

server.tool(
  'resolve_memo',
  'Resolve a memo (mark as resolved) and notify the author',
  {
    memo_id: z.number().describe('Memo ID to resolve'),
    resolved_by: z.string().describe('Name of the user resolving the memo'),
  },
  async ({ memo_id, resolved_by }) => {
    const { data, error } = await apiPatch<{ ok: boolean; already_resolved?: boolean }>(
      `/api/memos/v2/${memo_id}/resolve`, { resolved_by },
    )
    if (error || !data) return err(error ?? 'Unknown error')

    if (data.already_resolved) {
      return text(`Memo #${memo_id} is already resolved.`)
    }

    return text(`Memo #${memo_id} resolved by ${resolved_by}.`)
  },
)

// ══════════════════════════════════════════════════
// SPRINT TOOLS
// ══════════════════════════════════════════════════

// ── Tool: get_sprint ──

server.tool(
  'get_sprint',
  'Get sprint by ID',
  {
    sprint_id: z.string().describe('Sprint ID (e.g. s55)'),
  },
  async ({ sprint_id }) => {
    const { data, error } = await apiGet<Record<string, unknown>>(`/api/v2/nav/sprints/${sprint_id}`)
    if (error || !data) return err(error ?? 'Unknown error')
    return text(JSON.stringify(data, null, 2))
  },
)

// ── Tool 19: list_sprints ──

server.tool(
  'list_sprints',
  'List all sprints with status and dates',
  {
    status: z.enum(['planning', 'active', 'closed']).optional().describe('Filter by status'),
  },
  async ({ status }) => {
    const params: Record<string, string> = {}
    if (status) params.status = status
    const { data, error } = await apiGet<{
      sprints: Array<{ id: string; title?: string; label?: string; status: string; start_date: string | null; end_date: string | null; active: number }>
    }>('/api/v2/nav', params)
    if (error || !data) return err(error ?? 'Unknown error')
    const sprints = data.sprints
    if (!sprints || sprints.length === 0) return text('No sprints found.')

    const lines = ['Sprints', '─────────────']
    for (const s of sprints) {
      const marker = s.active ? ' ← active' : ''
      const icon = s.active ? '[A]' : `[${s.status.toUpperCase().charAt(0)}]`
      const label = s.title ?? s.label ?? s.id
      const dates = s.start_date ? `${s.start_date} ~ ${s.end_date ?? '?'}` : 'dates not set'
      lines.push(`${icon} ${s.id}: ${label} (${dates})${marker}`)
    }
    return text(lines.join('\n'))
  },
)

// ── Tool 20: activate_sprint ──

server.tool(
  'activate_sprint',
  'Activate a sprint (deactivates others)',
  {
    sprint_id: z.string().describe('Sprint ID (e.g. s55)'),
  },
  async ({ sprint_id }) => {
    const { data, error } = await apiPost<{ ok: boolean }>(`/api/v2/nav/sprints/${sprint_id}/activate`, {})
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Sprint ${sprint_id} activated.`)
  },
)

// ── Tool 21: kickoff_sprint ──

server.tool(
  'kickoff_sprint',
  'Sprint kickoff — select stories from backlog + team + velocity check. Only available in planning state.',
  {
    sprint_id: z.string().describe('Sprint ID'),
    story_ids: z.array(z.number()).describe('Story IDs selected from backlog'),
    team_members: z.array(z.string()).optional().describe('Participating team member names'),
    velocity: z.number().optional().describe('Target velocity (SP)'),
  },
  async ({ sprint_id, story_ids, team_members, velocity }) => {
    const { data, error } = await apiPost<{ ok: boolean; storiesAssigned: number; totalSP: number; velocityWarning?: string | null }>(`/api/v2/nav/sprints/${sprint_id}/kickoff`, {
      storyIds: story_ids,
      teamMembers: team_members,
      velocity,
    })
    if (error || !data) return err(error ?? 'Unknown error')

    const lines = [
      `Sprint ${sprint_id} kickoff complete!`,
      `Stories assigned: ${data.storiesAssigned}`,
      `Total SP: ${data.totalSP}`,
    ]
    if (data.velocityWarning) lines.push(`Warning: ${data.velocityWarning}`)
    return text(lines.join('\n'))
  },
)

// ── Tool 22: close_sprint ──

server.tool(
  'close_sprint',
  'Close sprint — active→closed. Incomplete stories return to backlog + velocity saved + retro session created.',
  {
    sprint_id: z.string().describe('Sprint ID (e.g. s55)'),
  },
  async ({ sprint_id }) => {
    const { data, error } = await apiPost<{
      ok: boolean
      summary: { completedCount: number; incompleteCount: number; doneSP: number; completionRate: number }
    }>(`/api/v2/kickoff/${sprint_id}/close`, {})
    if (error || !data) return err(error ?? 'Unknown error')

    const s = data.summary
    const lines = [
      `Sprint ${sprint_id} closed!`,
      '─────────────',
      `Completed: ${s.completedCount} (${s.doneSP} SP)`,
      `Incomplete: ${s.incompleteCount} → Returned to backlog`,
      `Completion rate: ${s.completionRate}%`,
    ]
    return text(lines.join('\n'))
  },
)

// ── Tool 23: get_velocity ──

server.tool(
  'get_velocity',
  'Velocity report — overall average + recent 3 sprint average',
  {},
  async () => {
    const { data, error } = await apiGet<{
      sprints: Array<{ sprint: string; done_sp: number; total_sp: number; story_count: number }>
      avgVelocity: number
      recentAvgVelocity: number
      sprintCount: number
    }>('/api/v2/nav/sprints/velocity')
    if (error || !data) return err(error ?? 'Unknown error')

    const lines = [
      'Velocity Report',
      '─────────────',
      `Overall average: ${data.avgVelocity} SP (${data.sprintCount} sprints)`,
      `Recent 3 average: ${data.recentAvgVelocity} SP`,
      '',
      'Sprint results:',
    ]
    for (const s of data.sprints) {
      lines.push(`  ${s.sprint}: ${s.done_sp}/${s.total_sp} SP (${s.story_count} stories)`)
    }
    if (!data.sprints.length) lines.push('  (No completed sprints)')
    return text(lines.join('\n'))
  },
)

// ══════════════════════════════════════════════════
// STANDUP TOOLS (extended)
// ══════════════════════════════════════════════════

// ── Tool 24: list_standup_entries ──

server.tool(
  'list_standup_entries',
  'List standup entries (filter by sprint/date)',
  {
    sprint: z.string().optional().describe('Sprint (default: active sprint)'),
    date: z.string().optional().describe('Date (YYYY-MM-DD)'),
  },
  async ({ sprint, date }) => {
    const params: Record<string, string> = {}
    if (sprint) params.sprint = sprint
    if (date) params.date = date

    const { data, error } = await apiGet<{
      entries: Array<{ id: number; user_name: string; sprint: string; entry_date: string; done_text: string | null; plan_text: string | null; blockers: string | null }>
    }>('/api/v2/standup/entries', params)
    if (error || !data) return err(error ?? 'Unknown error')
    if (!data.entries || data.entries.length === 0) return text('No standup entries found.')

    const lines = ['Standup Entries', '─────────────']
    for (const e of data.entries) {
      lines.push(`[${e.entry_date}] ${e.user_name}`)
      if (e.done_text) lines.push(`  Done: ${e.done_text.slice(0, 80)}`)
      if (e.plan_text) lines.push(`  Plan: ${e.plan_text.slice(0, 80)}`)
      if (e.blockers) lines.push(`  Blockers: ${e.blockers}`)
    }
    return text(lines.join('\n'))
  },
)

// ── Tool 25: review_standup ──

server.tool(
  'review_standup',
  'Write standup feedback (comment/approve/request_changes)',
  {
    standup_entry_id: z.number().describe('Target standup entry ID'),
    sprint: z.string().describe('Sprint ID'),
    target_user: z.string().describe('Standup author name'),
    feedback_text: z.string().describe('Feedback content'),
    review_type: z.enum(['comment', 'approve', 'request_changes']).optional().describe('Review type (default: comment)'),
  },
  async ({ standup_entry_id, sprint, target_user, feedback_text, review_type }) => {
    const { data, error } = await apiPost<{ ok: boolean }>('/api/v2/standup/feedback', {
      standup_entry_id,
      sprint,
      target_user,
      feedback_text,
      review_type: review_type ?? 'comment',
    })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Standup feedback submitted for ${target_user}`)
  },
)

// ── Tool 26: get_standup_feedback ──

server.tool(
  'get_standup_feedback',
  'Get standup feedback',
  {
    standup_entry_id: z.number().optional().describe('Standup entry ID'),
    sprint: z.string().optional().describe('Sprint (used with user)'),
    user: z.string().optional().describe('Target user (used with sprint)'),
  },
  async ({ standup_entry_id, sprint, user }) => {
    const params: Record<string, string> = {}
    if (standup_entry_id) params.standup_entry_id = String(standup_entry_id)
    if (sprint) params.sprint = sprint
    if (user) params.user = user

    const { data, error } = await apiGet<{
      feedback: Array<{ id: number; reviewer: string; review_type: string; feedback_text: string; created_at: string }>
    }>('/api/v2/standup/feedback', params)
    if (error || !data) return err(error ?? 'Unknown error')
    if (!data.feedback || data.feedback.length === 0) return text('No feedback found.')

    const lines = ['Standup Feedback', '─────────────']
    for (const f of data.feedback) {
      lines.push(`[${f.review_type.toUpperCase()}] ${f.reviewer} (${f.created_at})`)
      lines.push(`  ${f.feedback_text}`)
    }
    return text(lines.join('\n'))
  },
)

// ══════════════════════════════════════════════════
// EPIC TOOLS
// ══════════════════════════════════════════════════

// ── Tool: get_epic ──

server.tool(
  'get_epic',
  'Get epic by ID',
  {
    epic_id: z.number().describe('Epic ID'),
  },
  async ({ epic_id }) => {
    const { data, error } = await apiGet<Record<string, unknown>>(`/api/v2/pm/epics/${epic_id}`)
    if (error || !data) return err(error ?? 'Unknown error')
    return text(JSON.stringify(data, null, 2))
  },
)

// ── Tool 27: list_epics ──

server.tool(
  'list_epics',
  'List epics with story counts',
  {},
  async () => {
    const { data, error } = await apiGet<{
      epics: Array<{ id: number; title: string; status: string; owner: string | null; story_count?: number }>
    }>('/api/v2/pm/epics')
    if (error || !data) return err(error ?? 'Unknown error')
    if (!data.epics || data.epics.length === 0) return text('No epics found.')

    const statusIcon: Record<string, string> = { active: '[A]', planned: '[P]', completed: '[C]', archived: '[X]' }
    const lines = ['Epic List', '─────────────']
    for (const e of data.epics) {
      const icon = statusIcon[e.status] ?? '[?]'
      const storyCount = e.story_count !== undefined ? ` (${e.story_count} stories)` : ''
      lines.push(`${icon} [E${e.id}] ${e.title}${e.owner ? ` | owner: ${e.owner}` : ''}${storyCount}`)
    }
    return text(lines.join('\n'))
  },
)

// ── Tool 28: add_epic ──

server.tool(
  'add_epic',
  'Create new epic',
  {
    title: z.string().describe('Epic title'),
    description: z.string().optional().describe('Epic description'),
    owner: z.string().optional().describe('Epic owner (default: token user)'),
    status: z.enum(['active', 'planned', 'completed', 'archived']).optional().describe('Status'),
  },
  async ({ title, description, owner, status }) => {
    const { data, error } = await apiPost<{ ok: boolean; epic?: { id: number } }>('/api/v2/pm/epics', {
      title, description, owner, status,
    })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Epic created: ${title}`)
  },
)

// ── Tool 29: update_epic ──

server.tool(
  'update_epic',
  'Update epic',
  {
    epic_id: z.number().describe('Epic ID'),
    title: z.string().optional().describe('Title'),
    description: z.string().optional().describe('Description'),
    status: z.enum(['active', 'planned', 'completed', 'archived']).optional().describe('Status'),
    owner: z.string().optional().describe('Owner'),
  },
  async ({ epic_id, title, description, status, owner }) => {
    const { data, error } = await apiPatch<{ ok: boolean }>(`/api/v2/pm/epics/${epic_id}`, {
      title, description, status, owner,
    })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Epic #${epic_id} updated`)
  },
)

// ── Tool 30: delete_epic ──

server.tool(
  'delete_epic',
  "Delete epic (stories' epic_id set to null)",
  {
    epic_id: z.number().describe('Epic ID'),
  },
  async ({ epic_id }) => {
    const { data, error } = await apiDelete<{ ok: boolean }>(`/api/v2/pm/epics/${epic_id}`)
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Epic #${epic_id} deleted`)
  },
)

// ══════════════════════════════════════════════════
// STORY TOOLS
// ══════════════════════════════════════════════════

// ── Tool: get_story ──

server.tool(
  'get_story',
  'Get story by ID',
  {
    story_id: z.number().describe('Story ID'),
  },
  async ({ story_id }) => {
    const { data, error } = await apiGet<Record<string, unknown>>(`/api/v2/pm/stories/${story_id}`)
    if (error || !data) return err(error ?? 'Unknown error')
    return text(JSON.stringify(data, null, 2))
  },
)

// ── Tool 31: list_stories ──

server.tool(
  'list_stories',
  "List stories (filter by sprint/epic). sprint='backlog' shows unassigned stories",
  {
    sprint: z.string().optional().describe('Sprint (default: active sprint)'),
    epic_id: z.number().optional().describe('Epic ID filter'),
    status: z.enum(['draft', 'backlog', 'ready', 'in-progress', 'review', 'done']).optional().describe('Status'),
    assignee: z.string().optional().describe('Assignee filter'),
  },
  async ({ sprint, epic_id, status, assignee }) => {
    const params: Record<string, string> = {}
    if (sprint) params.sprint = sprint
    if (epic_id) params.epic_id = String(epic_id)
    if (status) params.status = status
    if (assignee) params.assignee = assignee

    const { data, error } = await apiGet<{
      stories: Array<{ id: number; title: string; status: string; assignee: string | null; sprint: string | null; epic_id: number | null; story_points: number | null }>
    }>('/api/v2/pm/stories', params)
    if (error || !data) return err(error ?? 'Unknown error')
    if (!data.stories || data.stories.length === 0) return text('No stories found.')

    const statusIcon: Record<string, string> = { todo: '[ ]', 'in-progress': '[~]', done: '[x]', draft: '[d]', backlog: '[b]', ready: '[r]', review: '[v]' }
    const lines = ['Story List', '─────────────']
    for (const s of data.stories) {
      const icon = statusIcon[s.status] ?? '[ ]'
      const pts = s.story_points ? ` (${s.story_points}SP)` : ''
      const assigneeStr = s.assignee ? ` → ${s.assignee}` : ''
      lines.push(`${icon} [S${s.id}] ${s.title}${pts}${assigneeStr}`)
    }
    return text(lines.join('\n'))
  },
)

// ── Tool 32: list_backlog ──

server.tool(
  'list_backlog',
  'List backlog stories — unassigned (sprint IS NULL) stories only',
  {
    epic_id: z.number().optional().describe('Epic ID filter'),
    status: z.enum(['draft', 'backlog', 'ready', 'in-progress', 'review', 'done']).optional().describe('Status'),
    assignee: z.string().optional().describe('Assignee filter'),
  },
  async ({ epic_id, status, assignee }) => {
    const params: Record<string, string> = { sprint: 'backlog' }
    if (epic_id) params.epic_id = String(epic_id)
    if (status) params.status = status
    if (assignee) params.assignee = assignee

    const { data, error } = await apiGet<{
      stories: Array<{ id: number; title: string; status: string; assignee: string | null; story_points: number | null; epic_id: number | null }>
    }>('/api/v2/pm/stories', params)
    if (error || !data) return err(error ?? 'Unknown error')
    if (!data.stories || data.stories.length === 0) return text('No backlog stories found.')

    const lines = ['Backlog Stories', '─────────────']
    for (const s of data.stories) {
      const pts = s.story_points ? ` (${s.story_points}SP)` : ''
      const assigneeStr = s.assignee ? ` → ${s.assignee}` : ''
      lines.push(`[S${s.id}] ${s.title}${pts}${assigneeStr}`)
    }
    return text(lines.join('\n'))
  },
)

// ── Tool 33: add_story ──

server.tool(
  'add_story',
  'Create new story (under epic). If sprint not specified, creates as backlog',
  {
    title: z.string().describe('Story title'),
    epic_id: z.number().optional().describe('Epic ID (optional)'),
    sprint: z.string().optional().describe('Sprint. Enter "backlog" to move to backlog (sprint=NULL)'),
    description: z.string().optional().describe('Story description'),
    acceptance_criteria: z.string().optional().describe('Acceptance criteria'),
    assignee: z.string().optional().describe('Assignee (comma-separated for multiple)'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Priority (default: medium)'),
    area: z.enum(['FE', 'BE', 'Design', 'Data', 'Infra', 'PO']).optional().describe('Area (default: FE)'),
    story_points: z.number().optional().describe('Story points'),
    start_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
    due_date: z.string().optional().describe('Due date (YYYY-MM-DD)'),
  },
  async ({ title, epic_id, sprint, description, acceptance_criteria, assignee, priority, area, story_points, start_date, due_date }) => {
    const { data, error } = await apiPost<{ ok: boolean; id?: number }>('/api/v2/pm/stories', {
      title, epic_id, sprint, description, acceptance_criteria, assignee, priority, area,
      story_points, start_date, due_date,
    })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Story created: ${title}`)
  },
)

// ── Tool 34: update_story ──

server.tool(
  'update_story',
  'Update story',
  {
    story_id: z.number().describe('Story ID'),
    title: z.string().optional().describe('Title'),
    description: z.string().optional().describe('Description'),
    acceptance_criteria: z.string().optional().describe('Acceptance criteria'),
    assignee: z.string().optional().describe('Assignee (comma-separated for multiple)'),
    status: z.enum(['draft', 'backlog', 'ready', 'in-progress', 'review', 'done']).optional().describe('Status'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Priority'),
    area: z.enum(['FE', 'BE', 'Design', 'Data', 'Infra', 'PO']).optional().describe('Area'),
    story_points: z.number().optional().describe('Story points'),
    figma_url: z.string().optional().describe('Figma URL'),
    epic_id: z.number().optional().describe('Epic ID'),
    sprint: z.string().optional().describe('Sprint. Enter "backlog" to move to backlog (sprint=NULL)'),
  },
  async ({ story_id, title, description, acceptance_criteria, assignee, status, priority, area, story_points, figma_url, epic_id, sprint }) => {
    const { data, error } = await apiPatch<{ ok: boolean }>(`/api/v2/pm/stories/${story_id}`, {
      title, description, acceptance_criteria, assignee, status, priority, area,
      story_points, figma_url, epic_id, sprint,
    })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Story #${story_id} updated`)
  },
)

// ── Tool 35: delete_story ──

server.tool(
  'delete_story',
  'Delete story (tasks also deleted)',
  {
    story_id: z.number().describe('Story ID'),
  },
  async ({ story_id }) => {
    const { data, error } = await apiDelete<{ ok: boolean }>(`/api/v2/pm/stories/${story_id}`)
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Story #${story_id} deleted`)
  },
)

// ══════════════════════════════════════════════════
// TASK TOOLS (extended)
// ══════════════════════════════════════════════════

// ── Tool: get_task_raw ──

server.tool(
  'get_task_raw',
  'Get task by ID (raw DB row)',
  {
    task_id: z.number().describe('Task ID'),
  },
  async ({ task_id }) => {
    const { data, error } = await apiGet<Record<string, unknown>>(`/api/v2/pm/tasks/${task_id}`)
    if (error || !data) return err(error ?? 'Unknown error')
    return text(JSON.stringify(data, null, 2))
  },
)

// ── Tool 36: update_task ──

server.tool(
  'update_task',
  'Update task (title, assignee, status, description)',
  {
    task_id: z.number().describe('Task ID'),
    title: z.string().optional().describe('Title'),
    assignee: z.string().optional().describe('Assignee'),
    status: z.enum(['todo', 'in-progress', 'done']).optional().describe('Status'),
    description: z.string().optional().describe('Description'),
  },
  async ({ task_id, title, assignee, status, description }) => {
    const { data, error } = await apiPatch<{ ok: boolean }>(`/api/v2/pm/tasks/${task_id}`, {
      title, assignee, status, description,
    })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Task #${task_id} updated`)
  },
)

// ── Tool 37: delete_task ──

server.tool(
  'delete_task',
  'Delete task',
  {
    task_id: z.number().describe('Task ID'),
  },
  async ({ task_id }) => {
    const { data, error } = await apiDelete<{ ok: boolean }>(`/api/v2/pm/tasks/${task_id}`)
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Task #${task_id} deleted`)
  },
)

// ══════════════════════════════════════════════════
// TEAM / MEMBER TOOLS
// ══════════════════════════════════════════════════

// ── Tool 38: list_team_members ──

server.tool(
  'list_team_members',
  'List team members (active users)',
  {},
  async () => {
    const { data, error } = await apiGet<{
      members: Array<{ id: number; display_name: string; role: string; is_active: number; email?: string | null }>
    }>('/api/v2/admin/members')
    if (error || !data) return err(error ?? 'Unknown error')
    if (!data.members || data.members.length === 0) return text('No team members found.')

    const lines = ['Team Members', '─────────────']
    for (const m of data.members) {
      const active = m.is_active ? '[active]' : '[inactive]'
      const email = m.email ? ` <${m.email}>` : ''
      lines.push(`${active} ${m.display_name} (${m.role})${email}`)
    }
    return text(lines.join('\n'))
  },
)

// ══════════════════════════════════════════════════
// INITIATIVE TOOLS
// ══════════════════════════════════════════════════

// ── Tool 39: create_initiative ──

server.tool(
  'create_initiative',
  'Create initiative — register proposals discovered in conversations',
  {
    title: z.string().describe('One-line summary (required)'),
    content: z.string().describe('Details (what, why)'),
    decider: z.string().optional().describe('Decider name (nullable)'),
    source_context: z.string().optional().describe('Source context'),
  },
  async ({ title, content, decider, source_context }) => {
    const { data, error } = await apiPost<{ ok: boolean; id?: number }>('/api/v2/initiatives', {
      title, content, decider, source_context,
    })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Initiative created: ${title}`)
  },
)

// ── Tool 40: list_initiatives ──

server.tool(
  'list_initiatives',
  'List initiatives',
  {
    status: z.enum(['pending', 'approved', 'rejected', 'deferred']).optional().describe('Status filter'),
  },
  async ({ status }) => {
    const params: Record<string, string> = {}
    if (status) params.status = status

    const { data, error } = await apiGet<{
      initiatives: Array<{ id: number; title: string; status: string; content: string; decider: string | null; created_at: string }>
    }>('/api/v2/initiatives', params)
    if (error || !data) return err(error ?? 'Unknown error')
    if (!data.initiatives || data.initiatives.length === 0) return text('No initiatives found.')

    const statusIcon: Record<string, string> = { pending: '[?]', approved: '[✓]', rejected: '[✗]', deferred: '[~]' }
    const lines = ['Initiatives', '─────────────']
    for (const i of data.initiatives) {
      const icon = statusIcon[i.status] ?? '[?]'
      const preview = i.content.length > 60 ? i.content.slice(0, 60) + '...' : i.content
      lines.push(`${icon} [I${i.id}] ${i.title}`)
      lines.push(`       ${preview}`)
    }
    return text(lines.join('\n'))
  },
)

// ── Tool 41: update_initiative_status ──

server.tool(
  'update_initiative_status',
  'Update initiative status (pending→approved/rejected/deferred)',
  {
    initiative_id: z.number().describe('Initiative ID'),
    status: z.enum(['pending', 'approved', 'rejected', 'deferred']).describe('New status'),
    decision_note: z.string().optional().describe('Decision comment'),
  },
  async ({ initiative_id, status, decision_note }) => {
    const { data, error } = await apiPatch<{ ok: boolean }>(`/api/v2/initiatives/${initiative_id}/status`, {
      status, decision_note,
    })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Initiative #${initiative_id} status updated to ${status}`)
  },
)

// ══════════════════════════════════════════════════
// RETRO TOOLS
// ══════════════════════════════════════════════════

// ── Tool 42: get_retro_session ──

server.tool(
  'get_retro_session',
  'Get retro session (items + actions)',
  {
    sprint: z.string().optional().describe('Sprint (default: active sprint)'),
  },
  async ({ sprint: sprintArg }) => {
    const sprint = resolveSprint(sprintArg)
    const params: Record<string, string> = {}
    if (sprint) params.sprint = sprint

    const { data, error } = await apiGet<{
      session: { id: number; sprint: string; phase: string; created_at: string } | null
      items: Array<{ id: number; category: string; content: string; votes: number; created_by: string }>
      actions: Array<{ id: number; content: string; assignee: string | null; status: string }>
    }>('/api/v2/retro/session', params)
    if (error || !data) return err(error ?? 'Unknown error')
    if (!data.session) return text(`No retro session found${sprint ? ` for ${sprint}` : ''}.`)

    const s = data.session
    const lines = [`Retro Session: ${s.sprint.toUpperCase()} (${s.phase})`, '─────────────']

    if (data.items && data.items.length > 0) {
      const keep = data.items.filter(i => i.category === 'keep')
      const problem = data.items.filter(i => i.category === 'problem')
      const tryItems = data.items.filter(i => i.category === 'try')

      if (keep.length) { lines.push('Keep:'); keep.forEach(i => lines.push(`  [${i.votes}v] ${i.content}`)) }
      if (problem.length) { lines.push('Problem:'); problem.forEach(i => lines.push(`  [${i.votes}v] ${i.content}`)) }
      if (tryItems.length) { lines.push('Try:'); tryItems.forEach(i => lines.push(`  [${i.votes}v] ${i.content}`)) }
    }

    if (data.actions && data.actions.length > 0) {
      lines.push('', 'Actions:')
      for (const a of data.actions) {
        lines.push(`  [${a.status}] ${a.content}${a.assignee ? ` → ${a.assignee}` : ''}`)
      }
    }

    return text(lines.join('\n'))
  },
)

// ── Tool 43: add_retro_item ──

server.tool(
  'add_retro_item',
  'Add retro item (keep/problem/try)',
  {
    session_id: z.number().describe('Session ID'),
    category: z.enum(['keep', 'problem', 'try']).describe('Category'),
    content: z.string().describe('Content'),
  },
  async ({ session_id, category, content }) => {
    const { data, error } = await apiPost<{ ok: boolean }>('/api/v2/retro/items', {
      session_id, category, content,
    })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Retro item added to session #${session_id}: [${category}] ${content}`)
  },
)

// ── Tool 44: vote_retro_item ──

server.tool(
  'vote_retro_item',
  'Vote/unvote retro item',
  {
    item_id: z.number().describe('Item ID'),
  },
  async ({ item_id }) => {
    const { data, error } = await apiPost<{ ok: boolean; votes?: number }>(`/api/v2/retro/items/${item_id}/vote`, {})
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Voted on retro item #${item_id}${data.votes !== undefined ? ` (${data.votes} votes total)` : ''}`)
  },
)

// ── Tool 45: change_retro_phase ──

server.tool(
  'change_retro_phase',
  'Change retro session phase',
  {
    session_id: z.number().describe('Session ID'),
    phase: z.enum(['collect', 'vote', 'discuss', 'action', 'done']).describe('Phase'),
  },
  async ({ session_id, phase }) => {
    const { data, error } = await apiPatch<{ ok: boolean }>(`/api/v2/retro/session/${session_id}/phase`, { phase })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Retro session #${session_id} phase changed to ${phase}`)
  },
)

// ── Tool 46: add_retro_action ──

server.tool(
  'add_retro_action',
  'Add retro action item',
  {
    session_id: z.number().describe('Session ID'),
    content: z.string().describe('Action content'),
    assignee: z.string().optional().describe('Assignee'),
  },
  async ({ session_id, content, assignee }) => {
    const { data, error } = await apiPost<{ ok: boolean }>('/api/v2/retro/actions', {
      session_id, content, assignee,
    })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Retro action added: ${content}`)
  },
)

// ── Tool 47: update_retro_action_status ──

server.tool(
  'update_retro_action_status',
  'Update retro action status',
  {
    action_id: z.number().describe('Action ID'),
    status: z.enum(['todo', 'in-progress', 'done']).describe('Status'),
  },
  async ({ action_id, status }) => {
    const { data, error } = await apiPatch<{ ok: boolean }>(`/api/v2/retro/actions/${action_id}/status`, { status })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Retro action #${action_id} status updated to ${status}`)
  },
)

// ── Tool 48: export_retro ──

server.tool(
  'export_retro',
  'Export full retro summary (keep/problem/try + actions + votes)',
  {
    sprint: z.string().optional().describe('Sprint (default: active sprint)'),
  },
  async ({ sprint: sprintArg }) => {
    const sprint = resolveSprint(sprintArg)
    const params: Record<string, string> = {}
    if (sprint) params.sprint = sprint

    const { data, error } = await apiGet<{
      session: { sprint: string; phase: string }
      items: Array<{ category: string; content: string; votes: number }>
      actions: Array<{ content: string; assignee: string | null; status: string }>
    }>('/api/v2/retro/session', params)
    if (error || !data) return err(error ?? 'Unknown error')
    if (!data.session) return text(`No retro session found${sprint ? ` for ${sprint}` : ''}.`)

    const lines = [
      `Retro Export: ${data.session.sprint.toUpperCase()}`,
      '═══════════════════════════',
      '',
    ]

    const categories = ['keep', 'problem', 'try']
    const labels: Record<string, string> = { keep: '✅ Keep', problem: '🔴 Problem', try: '💡 Try' }
    for (const cat of categories) {
      const items = data.items.filter(i => i.category === cat)
      if (items.length) {
        lines.push(labels[cat] + ':')
        items.sort((a, b) => b.votes - a.votes).forEach(i => lines.push(`  - ${i.content} [${i.votes}v]`))
        lines.push('')
      }
    }

    if (data.actions && data.actions.length > 0) {
      lines.push('📋 Action Items:')
      data.actions.forEach(a => lines.push(`  - [${a.status}] ${a.content}${a.assignee ? ` (${a.assignee})` : ''}`))
    }

    return text(lines.join('\n'))
  },
)

// ── Tool 49: mark_all_notifications_read ──

server.tool(
  'mark_all_notifications_read',
  'Mark all notifications as read',
  {},
  async () => {
    const { data, error } = await apiPost<{ ok: boolean; rows_affected?: number }>('/api/v2/notifications/mark-all-read', {})
    if (error || !data) return err(error ?? 'Unknown error')
    return text('All notifications marked as read.')
  },
)

// ══════════════════════════════════════════════════
// SPRINT / STORY ASSIGNMENT TOOLS
// ══════════════════════════════════════════════════

// ── Tool: assign_story_to_sprint ──

server.tool(
  'assign_story_to_sprint',
  'Assign a story to a sprint',
  {
    story_id: z.number().describe('Story ID'),
    sprint_id: z.string().describe('Sprint ID'),
  },
  async ({ story_id, sprint_id }) => {
    const { data, error } = await apiPatch<{ ok: boolean }>(`/api/v2/pm/stories/${story_id}`, { sprint: sprint_id })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Story #${story_id} assigned to sprint ${sprint_id}`)
  },
)

// ── Tool: unassign_story_from_sprint ──

server.tool(
  'unassign_story_from_sprint',
  'Remove a story from its sprint (move to backlog)',
  {
    story_id: z.number().describe('Story ID'),
  },
  async ({ story_id }) => {
    const { data, error } = await apiPatch<{ ok: boolean }>(`/api/v2/pm/stories/${story_id}`, { sprint: 'backlog' })
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Story #${story_id} moved to backlog`)
  },
)

// ── Tool: checkin_sprint ──

server.tool(
  'checkin_sprint',
  'Register team members for a sprint',
  {
    sprint_id: z.string().describe('Sprint ID'),
    member_ids: z.array(z.number()).describe('Member IDs to register'),
  },
  async ({ sprint_id, member_ids }) => {
    const { data, error } = await apiPost<{ ok: boolean; velocity?: number; teamSize?: number }>(
      `/api/v2/kickoff/${sprint_id}/checkin`,
      { memberIds: member_ids },
    )
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Sprint ${sprint_id} check-in complete: ${member_ids.length} members registered`)
  },
)

// ── Tool: add_absence ──

server.tool(
  'add_absence',
  'Register absence dates for a sprint member',
  {
    sprint_id: z.string().describe('Sprint ID'),
    member_id: z.number().describe('Member ID'),
    dates: z.array(z.string()).describe('Absence dates (YYYY-MM-DD)'),
    reason: z.string().optional().describe('Absence reason'),
  },
  async ({ sprint_id, member_id, dates, reason }) => {
    const { data, error } = await apiPost<{ ok: boolean }>(
      `/api/v2/kickoff/${sprint_id}/absence`,
      { memberId: member_id, dates, reason },
    )
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Absence registered for member #${member_id} in sprint ${sprint_id}: ${dates.length} day(s)`)
  },
)

// ── Tool: reject_memo ──

server.tool(
  'reject_memo',
  'Reject/reopen a resolved memo',
  {
    memo_id: z.number().describe('Memo ID to reject'),
  },
  async ({ memo_id }) => {
    const { data, error } = await apiPatch<{ ok: boolean }>(`/api/v2/memos/${memo_id}/reopen`, {})
    if (error || !data) return err(error ?? 'Unknown error')
    return text(`Memo #${memo_id} rejected (reopened)`)
  },
)

// ── Start ──

async function main() {
  await fetchActiveSprint()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(console.error)
