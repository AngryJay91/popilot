-- Agent events table for push-based inter-agent communication

CREATE TABLE IF NOT EXISTS agent_events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type   TEXT NOT NULL,
  source_agent TEXT NOT NULL,
  target_agent TEXT NOT NULL,
  target_user  TEXT NOT NULL,
  payload      TEXT NOT NULL,
  status       TEXT DEFAULT 'pending',
  delivered_at TIMESTAMP,
  acked_at     TIMESTAMP,
  expires_at   TIMESTAMP,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_target
  ON agent_events(target_user, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_type
  ON agent_events(event_type, status);
