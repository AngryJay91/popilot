-- PM API Core Schema
-- Run this SQL to initialize the database

-- Authentication
CREATE TABLE IF NOT EXISTS auth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  is_active INTEGER DEFAULT 1,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Team Members
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'member',
  is_active INTEGER DEFAULT 1,
  webhook_url TEXT,
  wallet_address TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Sprints
CREATE TABLE IF NOT EXISTS nav_sprints (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  theme TEXT,
  status TEXT DEFAULT 'planning',
  active INTEGER DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  velocity INTEGER,
  team_size INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Sprint Members
CREATE TABLE IF NOT EXISTS sprint_members (
  sprint_id TEXT NOT NULL,
  member_id INTEGER NOT NULL,
  working_days INTEGER DEFAULT 0,
  PRIMARY KEY (sprint_id, member_id),
  FOREIGN KEY (sprint_id) REFERENCES nav_sprints(id),
  FOREIGN KEY (member_id) REFERENCES members(id)
);

-- Member Absences
CREATE TABLE IF NOT EXISTS member_absences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sprint_id TEXT NOT NULL,
  member_id INTEGER NOT NULL,
  absence_date TEXT NOT NULL,
  reason TEXT,
  UNIQUE(sprint_id, member_id, absence_date),
  FOREIGN KEY (sprint_id) REFERENCES nav_sprints(id),
  FOREIGN KEY (member_id) REFERENCES members(id)
);

-- Epics
CREATE TABLE IF NOT EXISTS pm_epics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Stories
CREATE TABLE IF NOT EXISTS pm_stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  epic_id INTEGER,
  epic_uid TEXT,
  sprint TEXT,
  title TEXT NOT NULL,
  description TEXT,
  acceptance_criteria TEXT,
  assignee TEXT,
  assignee_id INTEGER,
  status TEXT DEFAULT 'backlog',
  priority TEXT DEFAULT 'medium',
  area TEXT DEFAULT 'FE',
  story_points INTEGER,
  figma_url TEXT,
  sort_order INTEGER DEFAULT 0,
  start_date TEXT,
  due_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (epic_id) REFERENCES pm_epics(id),
  FOREIGN KEY (sprint) REFERENCES nav_sprints(id),
  FOREIGN KEY (assignee_id) REFERENCES members(id)
);

-- Tasks
CREATE TABLE IF NOT EXISTS pm_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  assignee TEXT,
  assignee_id INTEGER,
  status TEXT DEFAULT 'todo',
  description TEXT,
  story_points INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (story_id) REFERENCES pm_stories(id),
  FOREIGN KEY (assignee_id) REFERENCES members(id)
);

-- Standup Entries
CREATE TABLE IF NOT EXISTS pm_standup_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sprint TEXT NOT NULL,
  user_name TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  done_text TEXT,
  plan_text TEXT,
  plan_story_ids TEXT,
  blockers TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(sprint, user_name, entry_date)
);

-- Standup Feedback
CREATE TABLE IF NOT EXISTS pm_standup_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  standup_entry_id INTEGER NOT NULL,
  sprint TEXT NOT NULL,
  target_user TEXT NOT NULL,
  feedback_by TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  review_type TEXT DEFAULT 'comment',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (standup_entry_id) REFERENCES pm_standup_entries(id)
);

-- Memos v2
CREATE TABLE IF NOT EXISTS memos_v2 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id TEXT DEFAULT 'home',
  content TEXT NOT NULL,
  memo_type TEXT DEFAULT 'memo',
  title TEXT,
  created_by TEXT NOT NULL,
  created_by_id INTEGER,
  assigned_to TEXT,
  assigned_to_id INTEGER,
  status TEXT DEFAULT 'open',
  resolved_by TEXT,
  resolved_at TEXT,
  related_decisions TEXT,
  review_required INTEGER DEFAULT 0,
  supersedes_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Memo Replies
CREATE TABLE IF NOT EXISTS memo_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  memo_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  review_type TEXT DEFAULT 'comment',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (memo_id) REFERENCES memos_v2(id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  source_type TEXT,
  source_id TEXT,
  page_id TEXT,
  actor TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Initiatives
CREATE TABLE IF NOT EXISTS initiatives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  decider TEXT,
  status TEXT DEFAULT 'pending',
  decision_note TEXT,
  decided_at TEXT,
  source_context TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Retro Sessions
CREATE TABLE IF NOT EXISTS retro_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sprint TEXT NOT NULL UNIQUE,
  title TEXT DEFAULT 'Sprint Retrospective',
  phase TEXT DEFAULT 'collect',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Retro Items
CREATE TABLE IF NOT EXISTS retro_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES retro_sessions(id)
);

-- Retro Votes
CREATE TABLE IF NOT EXISTS retro_votes (
  item_id INTEGER NOT NULL,
  voter TEXT NOT NULL,
  PRIMARY KEY (item_id, voter),
  FOREIGN KEY (item_id) REFERENCES retro_items(id)
);

-- Retro Actions
CREATE TABLE IF NOT EXISTS retro_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  assignee TEXT,
  status TEXT DEFAULT 'todo',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES retro_sessions(id)
);

-- Agent Events (Push-Native)
CREATE TABLE IF NOT EXISTS agent_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  source_agent TEXT NOT NULL,
  target_agent TEXT NOT NULL,
  target_user TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  expires_at TEXT,
  delivered_at TEXT,
  acked_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_title TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Nudge Log
CREATE TABLE IF NOT EXISTS nudge_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Navigation Pages (for spec-site wireframes/screens)
CREATE TABLE IF NOT EXISTS nav_pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  parent_id TEXT,
  is_visible INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Page Content (spec-site page sections)
CREATE TABLE IF NOT EXISTS page_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id TEXT NOT NULL,
  sprint TEXT,
  section_type TEXT DEFAULT 'content',
  content TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (page_id) REFERENCES nav_pages(id)
);

-- Scenarios (spec-site scenario definitions)
CREATE TABLE IF NOT EXISTS scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id TEXT NOT NULL,
  sprint TEXT,
  name TEXT NOT NULL,
  description TEXT,
  is_default INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (page_id) REFERENCES nav_pages(id)
);

-- Story Comments
CREATE TABLE IF NOT EXISTS story_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (story_id) REFERENCES pm_stories(id)
);
