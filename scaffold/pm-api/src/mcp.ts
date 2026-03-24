import { Hono } from 'hono'
import type { AppEnv } from './types.js'
import { query, execute } from './db/adapter.js'

const mcp = new Hono<AppEnv>()

// ── Helpers ──


// Domain tool function imports
import {
  toolDashboard, toolListTeamMembers,
  toolListSprints, toolActivateSprint, toolCloseSprint, toolCheckinSprint,
  toolAddAbsence, toolGetVelocity, toolKickoffSprint, toolSprintSummary,
  toolListEpics, toolAddEpic, toolUpdateEpic, toolDeleteEpic,
  toolListStories, toolListBacklog, toolAddStory, toolUpdateStory,
  toolDeleteStory, toolAssignStory, toolUnassignStory,
  toolListTasks, toolGetTask, toolUpdateTaskStatus, toolUpdateTask,
  toolAddTask, toolDeleteTask,
  toolSendMemo, toolListMemos, toolReadMemo, toolReplyMemo,
  toolResolveMemo, toolRejectMemo,
  toolCreateInitiative, toolListInitiatives, toolUpdateInitiativeStatus,
  toolCheckNotifications, toolMarkNotificationRead, toolMarkAllNotificationsRead,
  toolGetStandup, toolSaveStandup, toolListStandupEntries,
  toolReviewStandup, toolGetStandupFeedback,
  toolGetRetroSession, toolAddRetroItem, toolVoteRetroItem,
  toolChangeRetroPhase, toolAddRetroAction, toolUpdateRetroActionStatus, toolExportRetro,
  toolEmitEvent, toolPollEvents, toolAckEvent,
} from './mcp-tools/index.js'
import { text, err, checkRateLimit, type ToolResult } from './mcp-tools/utils.js'


const TOOLS = [
  // ── Dashboard & Navigation ──
  {
    name: 'my_dashboard',
    description: "Personal dashboard — task status, unread memos, notifications, today's standup",
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_sprints',
    description: 'List all sprints (shows active sprint)',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'activate_sprint',
    description: 'Activate a sprint (deactivates others)',
    inputSchema: {
      type: 'object',
      properties: { sprint_id: { type: 'string', description: 'Sprint ID (e.g. s55)' } },
      required: ['sprint_id'],
    },
  },
  {
    name: 'kickoff_sprint',
    description: 'Sprint kickoff — select stories from backlog + team + velocity check. Only available in planning state.',
    inputSchema: {
      type: 'object',
      properties: {
        sprint_id: { type: 'string', description: 'Sprint ID' },
        story_ids: { type: 'array', items: { type: 'number' }, description: 'Story IDs selected from backlog' },
        team_members: { type: 'array', items: { type: 'string' }, description: 'Participating team member names' },
        velocity: { type: 'number', description: 'Target velocity (SP)' },
      },
      required: ['sprint_id', 'story_ids'],
    },
  },
  {
    name: 'close_sprint',
    description: 'Close sprint — active→closed. Incomplete stories return to backlog + velocity saved + retro session created.',
    inputSchema: {
      type: 'object',
      properties: {
        sprint_id: { type: 'string', description: 'Sprint ID (e.g. s55)' },
      },
      required: ['sprint_id'],
    },
  },
  {
    name: 'create_initiative',
    description: 'Create initiative — register proposals discovered in conversations',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'One-line summary (required)' },
        content: { type: 'string', description: 'Details (what, why)' },
        decider: { type: 'string', description: 'Decider name (nullable)' },
        source_context: { type: 'string', description: 'Source context' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'list_initiatives',
    description: 'List initiatives',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'deferred'], description: 'Status filter' },
      },
    },
  },
  {
    name: 'update_initiative_status',
    description: 'Update initiative status (pending→approved/rejected/deferred)',
    inputSchema: {
      type: 'object',
      properties: {
        initiative_id: { type: 'number', description: 'Initiative ID' },
        status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'deferred'] },
        decision_note: { type: 'string', description: 'Decision comment' },
      },
      required: ['initiative_id', 'status'],
    },
  },
  {
    name: 'get_velocity',
    description: 'Velocity report — overall average + recent 3 sprint average',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'sprint_summary',
    description: 'Sprint status — progress by epic, workload by assignee, blockers',
    inputSchema: {
      type: 'object',
      properties: {
        sprint: { type: 'string', description: 'Sprint (default: active sprint)' },
      },
    },
  },
  {
    name: 'list_team_members',
    description: 'List team members (active users)',
    inputSchema: { type: 'object', properties: {} },
  },

  // ── Epics ──
  {
    name: 'list_epics',
    description: 'List epics with story counts',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'add_epic',
    description: 'Create new epic',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Epic title' },
        description: { type: 'string', description: 'Epic description' },
        owner: { type: 'string', description: 'Epic owner (default: token user)' },
        status: { type: 'string', enum: ['active', 'planned', 'completed', 'archived'], description: 'Status' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_epic',
    description: 'Update epic',
    inputSchema: {
      type: 'object',
      properties: {
        epic_id: { type: 'number', description: 'Epic ID' },
        title: { type: 'string', description: 'Title' },
        description: { type: 'string', description: 'Description' },
        status: { type: 'string', enum: ['active', 'planned', 'completed', 'archived'], description: 'Status' },
        owner: { type: 'string', description: 'Owner' },
      },
      required: ['epic_id'],
    },
  },
  {
    name: 'delete_epic',
    description: "Delete epic (stories' epic_id set to null)",
    inputSchema: {
      type: 'object',
      properties: { epic_id: { type: 'number', description: 'Epic ID' } },
      required: ['epic_id'],
    },
  },

  // ── Stories ──
  {
    name: 'list_stories',
    description: "List stories (filter by sprint/epic). sprint='backlog' shows unassigned stories",
    inputSchema: {
      type: 'object',
      properties: {
        sprint: { type: 'string', description: 'Sprint (default: active sprint)' },
        epic_id: { type: 'number', description: 'Epic ID filter' },
        status: { type: 'string', enum: ['draft', 'backlog', 'ready', 'in-progress', 'review', 'done'], description: 'Status' },
        assignee: { type: 'string', description: 'Assignee filter' },
      },
    },
  },
  {
    name: 'list_backlog',
    description: 'List backlog stories — unassigned (sprint IS NULL) stories only',
    inputSchema: {
      type: 'object',
      properties: {
        epic_id: { type: 'number', description: 'Epic ID filter' },
        status: { type: 'string', enum: ['draft', 'backlog', 'ready', 'in-progress', 'review', 'done'], description: 'Status' },
        assignee: { type: 'string', description: 'Assignee filter' },
      },
    },
  },
  {
    name: 'add_story',
    description: 'Create new story (under epic). If sprint not specified, creates as backlog',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Story title' },
        epic_id: { type: 'number', description: 'Epic ID (optional, unassigned if omitted)' },
        sprint: { type: 'string', description: 'Sprint. Enter "backlog" to move to backlog (sprint=NULL)' },
        description: { type: 'string', description: 'Story description' },
        acceptance_criteria: { type: 'string', description: 'Acceptance criteria' },
        assignee: { type: 'string', description: 'Assignee (comma-separated for multiple)' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Priority (default: medium)' },
        area: { type: 'string', enum: ['FE', 'BE', 'Design', 'Data', 'Infra', 'PO'], description: 'Area (default: FE)' },
        story_points: { type: 'number', description: 'Story points' },
        start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        due_date: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_story',
    description: 'Update story',
    inputSchema: {
      type: 'object',
      properties: {
        story_id: { type: 'number', description: 'Story ID' },
        title: { type: 'string', description: 'Title' },
        description: { type: 'string', description: 'Description' },
        acceptance_criteria: { type: 'string', description: 'Acceptance criteria' },
        assignee: { type: 'string', description: 'Assignee (comma-separated for multiple)' },
        status: { type: 'string', enum: ['draft', 'backlog', 'ready', 'in-progress', 'review', 'done'], description: 'Status' },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Priority' },
        area: { type: 'string', enum: ['FE', 'BE', 'Design', 'Data', 'Infra', 'PO'], description: 'Area' },
        story_points: { type: 'number', description: 'Story points' },
        figma_url: { type: 'string', description: 'Figma URL' },
        epic_id: { type: 'number', description: 'Epic ID' },
        sprint: { type: 'string', description: 'Sprint. Enter "backlog" to move to backlog (sprint=NULL)' },
      },
      required: ['story_id'],
    },
  },
  {
    name: 'delete_story',
    description: 'Delete story (tasks also deleted)',
    inputSchema: {
      type: 'object',
      properties: { story_id: { type: 'number', description: 'Story ID' } },
      required: ['story_id'],
    },
  },

  // ── Tasks ──
  {
    name: 'list_my_tasks',
    description: 'My task list (epic > story > task tree)',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['todo', 'in-progress', 'done'], description: 'Filter by status' },
        sprint: { type: 'string', description: 'Sprint (default: active sprint)' },
      },
    },
  },
  {
    name: 'get_task',
    description: 'Task detail + parent story context + sibling tasks',
    inputSchema: {
      type: 'object',
      properties: { task_id: { type: 'number', description: 'Task ID' } },
      required: ['task_id'],
    },
  },
  {
    name: 'update_task_status',
    description: 'Change task status',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'number', description: 'Task ID' },
        status: { type: 'string', enum: ['todo', 'in-progress', 'done'], description: 'New status' },
      },
      required: ['task_id', 'status'],
    },
  },
  {
    name: 'update_task',
    description: 'Update task (title, assignee, status, description)',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: { type: 'number', description: 'Task ID' },
        title: { type: 'string', description: 'Title' },
        assignee: { type: 'string', description: 'Assignee' },
        status: { type: 'string', enum: ['todo', 'in-progress', 'done'], description: 'Status' },
        description: { type: 'string', description: 'Description' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'add_task',
    description: 'Add new task (under story)',
    inputSchema: {
      type: 'object',
      properties: {
        story_id: { type: 'number', description: 'Story ID' },
        title: { type: 'string', description: 'Task title' },
        assignee: { type: 'string', description: 'Assignee (default: token user)' },
        description: { type: 'string', description: 'Task description' },
        story_points: { type: 'number', description: 'Story points (per task)' },
      },
      required: ['story_id', 'title'],
    },
  },
  {
    name: 'delete_task',
    description: 'Delete task',
    inputSchema: {
      type: 'object',
      properties: { task_id: { type: 'number', description: 'Task ID' } },
      required: ['task_id'],
    },
  },

  // ── Standup ──
  {
    name: 'get_standup',
    description: 'Get standup',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date (YYYY-MM-DD, default: today)' },
        sprint: { type: 'string', description: 'Sprint (default: active sprint)' },
      },
    },
  },
  {
    name: 'save_standup',
    description: 'Save standup (UPSERT)',
    inputSchema: {
      type: 'object',
      properties: {
        done_text: { type: 'string', description: 'Completed work' },
        plan_text: { type: 'string', description: "Today's plan" },
        plan_story_ids: { type: 'array', items: { type: 'number' }, description: 'Planned story ID array' },
        blockers: { type: 'string', description: 'Blockers' },
        date: { type: 'string', description: 'Date (YYYY-MM-DD, default: today)' },
        sprint: { type: 'string', description: 'Sprint (default: active sprint)' },
      },
    },
  },
  {
    name: 'list_standup_entries',
    description: 'List standup entries (filter by sprint/date)',
    inputSchema: {
      type: 'object',
      properties: {
        sprint: { type: 'string', description: 'Sprint (default: active sprint)' },
        date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
      },
    },
  },

  {
    name: 'review_standup',
    description: 'Write standup feedback (comment/approve/request_changes)',
    inputSchema: {
      type: 'object',
      properties: {
        standup_entry_id: { type: 'number', description: 'Target standup entry ID' },
        sprint: { type: 'string', description: 'Sprint ID' },
        target_user: { type: 'string', description: 'Standup author name' },
        feedback_text: { type: 'string', description: 'Feedback content' },
        review_type: { type: 'string', enum: ['comment', 'approve', 'request_changes'], description: 'Review type (default: comment)' },
      },
      required: ['standup_entry_id', 'sprint', 'target_user', 'feedback_text'],
    },
  },
  {
    name: 'get_standup_feedback',
    description: 'Get standup feedback',
    inputSchema: {
      type: 'object',
      properties: {
        standup_entry_id: { type: 'number', description: 'Standup entry ID' },
        sprint: { type: 'string', description: 'Sprint (used with user in get_standup_feedback)' },
        user: { type: 'string', description: 'Target user (used with sprint)' },
      },
    },
  },

  // ── Memos ──
  {
    name: 'send_memo',
    description: 'Send memo to team member. memo_type=decision requires title. review_required=true shows in dashboard approval queue.',
    inputSchema: {
      type: 'object',
      properties: {
        to_user: { type: 'string', description: 'Recipient name (comma-separated for multiple)' },
        content: { type: 'string', description: 'Memo content' },
        page_id: { type: 'string', description: 'Page ID (default: home)' },
        memo_type: { type: 'string', enum: ['memo', 'question', 'blocker', 'task', 'decision', 'feature_request', 'policy_request'], description: 'Memo type (default: memo)' },
        title: { type: 'string', description: 'Title — required for decision type' },
        supersedes_id: { type: 'number', description: 'Previous memo ID this supersedes' },
        review_required: { type: 'boolean', description: 'Review required (default: false)' },
      },
      required: ['to_user', 'content'],
    },
  },
  {
    name: 'list_my_memos',
    description: 'My received memos',
    inputSchema: {
      type: 'object',
      properties: {
        unread_only: { type: 'boolean', description: 'Unread only (default: false)' },
        sprint: { type: 'string', description: 'Sprint (default: active sprint)' },
      },
    },
  },
  {
    name: 'read_memo',
    description: 'Read memo detail + mark as read',
    inputSchema: {
      type: 'object',
      properties: { memo_id: { type: 'number', description: 'Memo ID' } },
      required: ['memo_id'],
    },
  },
  {
    name: 'reply_memo',
    description: 'Reply to memo (with review type)',
    inputSchema: {
      type: 'object',
      properties: {
        memo_id: { type: 'number', description: 'Memo ID' },
        content: { type: 'string', description: 'Reply content' },
        review_type: { type: 'string', enum: ['comment', 'approve', 'request_changes'], description: 'Review type (default: comment)' },
      },
      required: ['memo_id', 'content'],
    },
  },
  {
    name: 'resolve_memo',
    description: 'Resolve memo',
    inputSchema: {
      type: 'object',
      properties: { memo_id: { type: 'number', description: 'Memo ID' } },
      required: ['memo_id'],
    },
  },

  // ── Retro ──
  {
    name: 'get_retro_session',
    description: 'Get retro session (items + actions)',
    inputSchema: {
      type: 'object',
      properties: {
        sprint: { type: 'string', description: 'Sprint (default: active sprint)' },
      },
    },
  },
  {
    name: 'add_retro_item',
    description: 'Add retro item (keep/problem/try)',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'number', description: 'Session ID' },
        category: { type: 'string', enum: ['keep', 'problem', 'try'], description: 'Category' },
        content: { type: 'string', description: 'Content' },
      },
      required: ['session_id', 'category', 'content'],
    },
  },
  {
    name: 'vote_retro_item',
    description: 'Vote/unvote retro item',
    inputSchema: {
      type: 'object',
      properties: {
        item_id: { type: 'number', description: 'Item ID' },
      },
      required: ['item_id'],
    },
  },
  {
    name: 'change_retro_phase',
    description: 'Change retro session phase',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'number', description: 'Session ID' },
        phase: { type: 'string', enum: ['collect', 'vote', 'discuss', 'action', 'done'], description: 'Phase' },
      },
      required: ['session_id', 'phase'],
    },
  },
  {
    name: 'add_retro_action',
    description: 'Add retro action item',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'number', description: 'Session ID' },
        content: { type: 'string', description: 'Action content' },
        assignee: { type: 'string', description: 'Assignee' },
      },
      required: ['session_id', 'content'],
    },
  },
  {
    name: 'update_retro_action_status',
    description: 'Update retro action status',
    inputSchema: {
      type: 'object',
      properties: {
        action_id: { type: 'number', description: 'Action ID' },
        status: { type: 'string', enum: ['todo', 'in-progress', 'done'], description: 'Status' },
      },
      required: ['action_id', 'status'],
    },
  },
  {
    name: 'export_retro',
    description: 'Export full retro summary (keep/problem/try + actions + votes)',
    inputSchema: {
      type: 'object',
      properties: {
        sprint: { type: 'string', description: 'Sprint (default: active sprint)' },
      },
    },
  },

  // ── Notifications ──
  {
    name: 'check_notifications',
    description: 'Check my notifications — unread first',
    inputSchema: {
      type: 'object',
      properties: {
        unread_only: { type: 'boolean', description: 'Unread only (default: false)' },
      },
    },
  },
  {
    name: 'mark_notification_read',
    description: 'Mark notification as read',
    inputSchema: {
      type: 'object',
      properties: { notification_id: { type: 'number', description: 'Notification ID' } },
      required: ['notification_id'],
    },
  },
  {
    name: 'mark_all_notifications_read',
    description: 'Mark all notifications as read',
    inputSchema: { type: 'object', properties: {} },
  },

  // ── Agent Events (Push-Native) ──
  {
    name: 'emit_event',
    description: 'Emit agent event — push notification to target agent/user',
    inputSchema: {
      type: 'object',
      properties: {
        event_type: {
          type: 'string',
          enum: ['memo_assigned', 'memo_replied', 'memo_resolved', 'review_requested', 'task_status_changed', 'decision_needed', 'sprint_alert'],
          description: 'Event type',
        },
        target_agent: { type: 'string', description: 'Target agent (e.g. Oscar, Penny)' },
        target_user: { type: 'string', description: 'Target user name' },
        payload: { type: 'string', description: 'Event payload (JSON string)' },
        ttl_hours: { type: 'number', description: 'TTL hours (default: 24)' },
        source_agent: { type: 'string', description: 'Source agent name (default: calling user)' },
      },
      required: ['event_type', 'target_agent', 'target_user', 'payload'],
    },
  },
  {
    name: 'poll_events',
    description: 'Poll pending events (SSE fallback for unsupported clients)',
    inputSchema: {
      type: 'object',
      properties: {
        event_type: { type: 'string', description: 'Event type filter (optional)' },
        limit: { type: 'number', description: 'Max results (default: 20)' },
      },
    },
  },
  {
    name: 'ack_event',
    description: 'Acknowledge event',
    inputSchema: {
      type: 'object',
      properties: {
        event_id: { type: 'number', description: 'Event ID' },
      },
      required: ['event_id'],
    },
  },
]

// ── Tool Handlers ──


async function handleTool(name: string, args: Record<string, unknown>, user: string): Promise<ToolResult> {
  switch (name) {
    // Dashboard & Navigation
    case 'my_dashboard': return toolDashboard(user)
    case 'list_sprints': return toolListSprints()
    case 'activate_sprint': return toolActivateSprint(args)
    case 'kickoff_sprint': return toolKickoffSprint(args)
    case 'close_sprint': return toolCloseSprint(args)
    case 'get_velocity': return toolGetVelocity()
    case 'create_initiative': return toolCreateInitiative(user, args)
    case 'list_initiatives': return toolListInitiatives(args)
    case 'update_initiative_status': return toolUpdateInitiativeStatus(args)
    case 'assign_story_to_sprint': return toolAssignStory(args)
    case 'unassign_story_from_sprint': return toolUnassignStory(args)
    case 'checkin_sprint': return toolCheckinSprint(args)
    case 'add_absence': return toolAddAbsence(args)
    case 'reject_memo': return toolRejectMemo(args)
    case 'sprint_summary': return toolSprintSummary(args)
    case 'list_team_members': return toolListTeamMembers()

    // Epics
    case 'list_epics': return toolListEpics()
    case 'add_epic': return toolAddEpic(user, args)
    case 'update_epic': return toolUpdateEpic(args)
    case 'delete_epic': return toolDeleteEpic(args)

    // Stories
    case 'list_stories': return toolListStories(args)
    case 'list_backlog': return toolListBacklog(args)
    case 'add_story': return toolAddStory(user, args)
    case 'update_story': return toolUpdateStory(user, args)
    case 'delete_story': return toolDeleteStory(args)

    // Tasks
    case 'list_my_tasks': return toolListTasks(user, args)
    case 'get_task': return toolGetTask(args)
    case 'update_task_status': return toolUpdateTaskStatus(args)
    case 'update_task': return toolUpdateTask(user, args)
    case 'add_task': return toolAddTask(user, args)
    case 'delete_task': return toolDeleteTask(args)

    // Standup
    case 'get_standup': return toolGetStandup(user, args)
    case 'save_standup': return toolSaveStandup(user, args)
    case 'list_standup_entries': return toolListStandupEntries(args)
    case 'review_standup': return toolReviewStandup(user, args)
    case 'get_standup_feedback': return toolGetStandupFeedback(args)

    // Memos
    case 'send_memo': return toolSendMemo(user, args)
    case 'list_my_memos': return toolListMemos(user, args)
    case 'read_memo': return toolReadMemo(args)
    case 'reply_memo': return toolReplyMemo(user, args)
    case 'resolve_memo': return toolResolveMemo(user, args)

    // Retro
    case 'get_retro_session': return toolGetRetroSession(user, args)
    case 'add_retro_item': return toolAddRetroItem(user, args)
    case 'vote_retro_item': return toolVoteRetroItem(user, args)
    case 'change_retro_phase': return toolChangeRetroPhase(args)
    case 'add_retro_action': return toolAddRetroAction(user, args)
    case 'update_retro_action_status': return toolUpdateRetroActionStatus(args)
    case 'export_retro': return toolExportRetro(args)

    // Notifications
    case 'check_notifications': return toolCheckNotifications(user, args)
    case 'mark_notification_read': return toolMarkNotificationRead(args)
    case 'mark_all_notifications_read': return toolMarkAllNotificationsRead(user)

    // Agent Events
    case 'emit_event': return toolEmitEvent(user, args)
    case 'poll_events': return toolPollEvents(user, args)
    case 'ack_event': return toolAckEvent(user, args)

    default: return err(`Unknown tool: ${name}`)
  }
}

// ── JSON-RPC Handler ──

interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: string
  params?: Record<string, unknown>
  id?: string | number
}

function jsonrpcOk(id: string | number | undefined, result: unknown) {
  return { jsonrpc: '2.0', result, id }
}

function jsonrpcError(id: string | number | undefined, code: number, message: string) {
  return { jsonrpc: '2.0', error: { code, message }, id }
}

mcp.post('/', async (c) => {
  const user = c.get('userName')
  const body = await c.req.json() as JsonRpcRequest | JsonRpcRequest[]
  const requests = Array.isArray(body) ? body : [body]
  const responses: unknown[] = []

  for (const req of requests) {
    if (!req.method) {
      responses.push(jsonrpcError(req.id, -32600, 'Invalid request'))
      continue
    }

    switch (req.method) {
      case 'initialize':
        responses.push(jsonrpcOk(req.id, {
          protocolVersion: '2025-03-26',
          capabilities: { tools: {} },
          serverInfo: { name: 'pm-api', version: '2.0.0' },
        }))
        break

      case 'notifications/initialized':
        break

      case 'ping':
        responses.push(jsonrpcOk(req.id, {}))
        break

      case 'tools/list':
        responses.push(jsonrpcOk(req.id, { tools: TOOLS }))
        break

      case 'tools/call': {
        const params = req.params as { name: string; arguments?: Record<string, unknown> } | undefined
        if (!params?.name) {
          responses.push(jsonrpcError(req.id, -32602, 'Missing tool name'))
          break
        }
        try {
          const result = await handleTool(params.name, params.arguments ?? {}, user)
          responses.push(jsonrpcOk(req.id, result))
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Unknown error'
          responses.push(jsonrpcOk(req.id, { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true }))
        }
        break
      }

      default:
        if (req.id !== undefined) {
          responses.push(jsonrpcError(req.id, -32601, `Method not found: ${req.method}`))
        }
    }
  }

  if (responses.length === 0) return new Response(null, { status: 202 })
  if (!Array.isArray(body) && responses.length === 1) {
    return c.json(responses[0])
  }
  return c.json(responses)
})

mcp.get('/', async (c) => {
  const user = c.get('userName')
  const lastEventId = c.req.header('Last-Event-ID')

  // SSE implementation via ReadableStream
  const encoder = new TextEncoder()
  let cancelled = false

  const stream = new ReadableStream({
    async start(controller) {
      const send = (id: string, event: string, data: string) => {
        try {
          controller.enqueue(encoder.encode(`id: ${id}\nevent: ${event}\ndata: ${data}\n\n`))
        } catch { cancelled = true }
      }

      // Initial connection confirmation
      send('0', 'connected', JSON.stringify({ user, timestamp: new Date().toISOString() }))

      // Poll every 5s for up to 25s (5s buffer for CF Worker 30s limit)
      const MAX_DURATION = 25_000
      const POLL_INTERVAL = 5_000
      const startTime = Date.now()

      let minId = 0
      if (lastEventId) {
        const parsed = parseInt(lastEventId, 10)
        if (!isNaN(parsed)) minId = parsed
      }

      while (!cancelled && (Date.now() - startTime) < MAX_DURATION) {
        // Query pending events (only those with id > minId)
        const result = await query<{
          id: number; event_type: string; source_agent: string
          target_agent: string; payload: string; created_at: string
        }>(
          `SELECT id, event_type, source_agent, target_agent, payload, created_at
           FROM agent_events
           WHERE target_user = ? AND status = 'pending' AND id > ?
             AND (expires_at IS NULL OR expires_at > datetime('now'))
           ORDER BY id ASC LIMIT 10`,
          [user, minId],
        )

        if (!result.error && result.rows.length > 0) {
          for (const evt of result.rows) {
            let parsedPayload: unknown
            try { parsedPayload = JSON.parse(evt.payload) } catch { parsedPayload = evt.payload }
            send(
              String(evt.id),
              evt.event_type,
              JSON.stringify({
                id: evt.id,
                source_agent: evt.source_agent,
                target_agent: evt.target_agent,
                payload: parsedPayload,
                created_at: evt.created_at,
              }),
            )
            minId = evt.id

            // Update status to delivered
            await execute(
              `UPDATE agent_events SET status = 'delivered', delivered_at = datetime('now') WHERE id = ? AND status = 'pending'`,
              [evt.id],
            )
          }
        }

        // Heartbeat (keep connection alive)
        send('0', 'heartbeat', JSON.stringify({ t: new Date().toISOString() }))

        // Wait until next poll
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
      }

      // Close stream after 25s — client reconnects with Last-Event-ID
      controller.close()
    },
    cancel() {
      cancelled = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
})
mcp.delete('/', (c) => c.json({ error: 'No sessions to terminate' }, 405))

export default mcp
