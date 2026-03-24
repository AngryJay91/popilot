-- Rewards Module (Optional)
-- Enable via project.yaml: operations.pm_api.features.rewards = true

CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('reward', 'penalty')),
  amount REAL NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  issued_by TEXT NOT NULL,
  tx_hash TEXT,
  paid_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
