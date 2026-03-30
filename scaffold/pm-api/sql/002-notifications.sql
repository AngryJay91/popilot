-- Notifications table for per-user alert management

CREATE TABLE IF NOT EXISTS notifications (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name   TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'memo_assigned',
  title       TEXT NOT NULL,
  body        TEXT,
  source_type TEXT NOT NULL DEFAULT 'memo',
  source_id   INTEGER NOT NULL,
  page_id     TEXT NOT NULL,
  actor       TEXT NOT NULL,
  is_read     INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_name, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_source ON notifications(source_type, source_id);
