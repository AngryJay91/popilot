# Verification Report — PR #10 (fix/issue-3-token-hashing) — R2

## Scope checked
`git diff main...fix/issue-3-token-hashing`

Files relevant to this re-check:
- `scaffold/pm-api/src/routes/v2-admin.ts`
- `scaffold/pm-api/src/routes/auth.ts`
- `scaffold/pm-api/sql/008-hash-tokens.sql`

## Checklist

1. **Diff reviewed** ✅
2. **`v2-admin.ts`: new tokens store `token = NULL`, only `token_hash`** ✅
   - `INSERT INTO auth_tokens (token, token_hash, ...) VALUES (NULL, ?, ...)`
   - Regenerate path also sets `token = NULL, token_hash = ?`
3. **Auth verify route uses dual lookup** ✅
   - `WHERE (token_hash = ? OR token = ?) AND is_active = 1`
4. **`008-hash-tokens.sql`: UNIQUE index + backfill comment** ⚠️ **Partially**
   - UNIQUE index exists, but targets the wrong table:
     - `CREATE UNIQUE INDEX ... ON members(token_hash);` ❌
     - Should be on `auth_tokens(token_hash)`.
   - Backfill comment exists, but also references wrong table:
     - `UPDATE members SET token = NULL ...` ❌
     - Should reference `auth_tokens`.

## Additional blocking concern
- Current base schema (`schema-core.sql`) defines `auth_tokens.token` as `TEXT NOT NULL UNIQUE`.
- This PR now inserts `token = NULL` for new rows, so without a migration to relax/remove `NOT NULL`, inserts can fail.

## Verdict
**REQUEST_CHANGES**

## Required fixes before approval
1. In `008-hash-tokens.sql`, change UNIQUE index target to:
   - `auth_tokens(token_hash)`
2. Fix backfill comment table name to `auth_tokens`.
3. Add/confirm schema migration step for making `auth_tokens.token` nullable (or otherwise compatible with storing `NULL`).
