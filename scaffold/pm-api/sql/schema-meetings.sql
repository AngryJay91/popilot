-- Meetings Module (Optional)
-- Enable via project.yaml: operations.pm_api.features.meetings = true

CREATE TABLE IF NOT EXISTS meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sprint TEXT,
  title TEXT NOT NULL,
  meeting_type TEXT DEFAULT 'general',
  meeting_date TEXT NOT NULL,
  attendees TEXT,
  agenda TEXT,
  notes TEXT,
  action_items TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
