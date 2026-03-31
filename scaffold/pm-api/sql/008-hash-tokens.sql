-- Migration 008: Add token_hash column to auth_tokens table
-- Stores SHA-256 hex digest of the bearer token.
-- The old `token` column is kept during migration period for backward compatibility.
-- Once all tokens are re-issued with hashes, `token` can be removed or cleared.

ALTER TABLE auth_tokens ADD COLUMN token_hash TEXT;

-- Index for fast lookups by hash
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token_hash ON auth_tokens(token_hash);
