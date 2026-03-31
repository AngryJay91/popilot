-- Migration 009: Add version column to docs for optimistic locking
-- Prevents silent data loss when multiple users edit the same document simultaneously.
-- Strategy: version-based (integer increment), not CRDT.
-- On save: WHERE version = ? + increment. If 0 rows updated → 409 Conflict.

ALTER TABLE docs ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
