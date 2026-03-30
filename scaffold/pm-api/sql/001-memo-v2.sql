-- Memo v2 migration — authentication, user activity, memos, replies

-- 1. Auth tokens
CREATE TABLE IF NOT EXISTS auth_tokens (
  token      TEXT PRIMARY KEY,
  user_name  TEXT NOT NULL,
  user_email TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active  INTEGER DEFAULT 1
);

-- 2. User activity tracking
CREATE TABLE IF NOT EXISTS user_activity (
  user_name      TEXT PRIMARY KEY,
  last_seen_at   TIMESTAMP,
  last_memo_seen TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Memos v2
CREATE TABLE IF NOT EXISTS memos_v2 (
  id          INTEGER PRIMARY KEY,
  page_id     TEXT NOT NULL,
  content     TEXT NOT NULL,
  memo_type   TEXT DEFAULT 'memo',
  status      TEXT DEFAULT 'open',
  created_by  TEXT NOT NULL,
  assigned_to TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMP,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memos_v2_page ON memos_v2(page_id);
CREATE INDEX IF NOT EXISTS idx_memos_v2_assigned ON memos_v2(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_memos_v2_type ON memos_v2(memo_type, status);

-- 4. Memo replies
CREATE TABLE IF NOT EXISTS memo_replies (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  memo_id    INTEGER NOT NULL,
  content    TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memo_replies_memo ON memo_replies(memo_id);
