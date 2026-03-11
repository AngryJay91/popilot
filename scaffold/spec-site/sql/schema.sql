-- spec-site database schema
-- Compatible with: SQLite, Turso/LibSQL, PostgreSQL (with minor adjustments)
--
-- This schema supports the full interactive mode (Tier 2) of spec-site.
-- Run this migration to set up your backend database.

-- ── Navigation ──

CREATE TABLE IF NOT EXISTS sprints (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS nav_epics (
  sprint TEXT NOT NULL,
  epic_id TEXT NOT NULL,
  label TEXT NOT NULL,
  badge TEXT,
  category TEXT NOT NULL DEFAULT 'policy',
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  uid TEXT,
  origin_sprint TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (sprint, epic_id)
);

-- ── PM (Project Management) ──

CREATE TABLE IF NOT EXISTS pm_epics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  owner TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pm_stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  epic_id INTEGER REFERENCES pm_epics(id),
  sprint TEXT NOT NULL,
  epic_uid TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT,
  acceptance_criteria TEXT,
  assignee TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  priority TEXT NOT NULL DEFAULT 'medium',
  area TEXT NOT NULL DEFAULT 'FE',
  story_points INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pm_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id INTEGER NOT NULL REFERENCES pm_stories(id),
  title TEXT NOT NULL,
  assignee TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Page Content ──

CREATE TABLE IF NOT EXISTS page_rules (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  rule_group TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  condition TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'info',
  home_message TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL DEFAULT '',
  data_source TEXT NOT NULL DEFAULT '',
  impl_status TEXT NOT NULL DEFAULT 'new-data',
  impl_note TEXT,
  action_route TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS page_scenarios (
  page_id TEXT NOT NULL,
  sprint TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  label TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  is_default INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  author TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (page_id, sprint, scenario_id)
);

CREATE TABLE IF NOT EXISTS page_spec_areas (
  page_id TEXT NOT NULL,
  area_id TEXT NOT NULL,
  label TEXT NOT NULL,
  short_label TEXT NOT NULL DEFAULT '',
  rule_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (page_id, area_id)
);

CREATE TABLE IF NOT EXISTS page_versions (
  page_id TEXT NOT NULL,
  sprint TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '0.1.0',
  last_updated TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'draft',
  changelog TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (page_id, sprint)
);

CREATE TABLE IF NOT EXISTS wireframe_meta (
  page_id TEXT NOT NULL,
  sprint TEXT NOT NULL,
  default_scenario_id TEXT NOT NULL DEFAULT 'default',
  spec_title TEXT NOT NULL DEFAULT '',
  route_title TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (page_id, sprint)
);

-- ── Scenario Data (custom user scenarios) ──

CREATE TABLE IF NOT EXISTS scenario_data (
  page_id TEXT NOT NULL,
  sprint TEXT NOT NULL,
  scenario_id TEXT NOT NULL,
  label TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  author TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (page_id, sprint, scenario_id)
);

-- ── Retro ──

CREATE TABLE IF NOT EXISTS retro_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sprint TEXT NOT NULL UNIQUE,
  title TEXT,
  phase TEXT NOT NULL DEFAULT 'write',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS retro_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES retro_sessions(id),
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS retro_votes (
  item_id INTEGER NOT NULL REFERENCES retro_items(id),
  voter TEXT NOT NULL,
  PRIMARY KEY (item_id, voter)
);

CREATE TABLE IF NOT EXISTS retro_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL REFERENCES retro_sessions(id),
  content TEXT NOT NULL,
  assignee TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Memos ──

CREATE TABLE IF NOT EXISTS memos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Auth ──

CREATE TABLE IF NOT EXISTS auth_tokens (
  token TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS user_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'login',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Indexes ──

CREATE INDEX IF NOT EXISTS idx_nav_epics_sprint ON nav_epics(sprint);
CREATE INDEX IF NOT EXISTS idx_pm_stories_sprint ON pm_stories(sprint);
CREATE INDEX IF NOT EXISTS idx_pm_stories_epic ON pm_stories(epic_id);
CREATE INDEX IF NOT EXISTS idx_pm_tasks_story ON pm_tasks(story_id);
CREATE INDEX IF NOT EXISTS idx_page_rules_page ON page_rules(page_id);
CREATE INDEX IF NOT EXISTS idx_retro_items_session ON retro_items(session_id);
CREATE INDEX IF NOT EXISTS idx_memos_page ON memos(page_id);
