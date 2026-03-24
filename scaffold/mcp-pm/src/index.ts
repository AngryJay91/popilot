// Unified MCP PM Server
// Combines project management tools + notification tools into a single MCP server.
// All operations go through the PM API via HTTP (no direct DB access).

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { apiGet, apiPost, apiPatch, apiPut } from './api-client.js'

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

// ── Tool 18: resolve_memo ──

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

// ── Start ──

async function main() {
  await fetchActiveSprint()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch(console.error)
