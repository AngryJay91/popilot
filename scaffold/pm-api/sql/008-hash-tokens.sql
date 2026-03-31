-- Migration 008: Add token_hash for SHA-256 hashed bearer tokens
-- Target table: auth_tokens (NOT members)

-- Add token_hash column
ALTER TABLE auth_tokens ADD COLUMN token_hash TEXT;

-- Unique index on token_hash
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_tokens_token_hash ON auth_tokens(token_hash);

-- Remove NOT NULL constraint on token by recreating (SQLite limitation)
-- For now, keep token NOT NULL during migration. New tokens store hash in token_hash
-- and a placeholder in token column. After backfill, token column can be dropped.

-- Backfill strategy: existing plaintext tokens will be hashed on next auth.
-- After all tokens re-issued: ALTER TABLE to drop token column.
