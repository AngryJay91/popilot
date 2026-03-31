# Verification Report — PR #10 (fix/issue-3-token-hashing)

## Verdict: REQUEST_CHANGES ❌

## Scope reviewed
- `git diff main...fix/issue-3-token-hashing`
- Focus files:
  - `scaffold/pm-api/sql/008-hash-tokens.sql`
  - `scaffold/pm-api/src/routes/v2-admin.ts`
  - `scaffold/pm-api/src/auth.ts`
  - `scaffold/pm-api/src/routes/auth.ts`

## Required checks

### 1) Diff reviewed
- Reviewed all relevant auth-token hashing changes in PR diff.

### 2) `008-hash-tokens.sql` targets `auth_tokens` table (NOT members)
- ✅ PASS
- Migration clearly modifies `auth_tokens`.

### 3) UNIQUE index on `auth_tokens(token_hash)`
- ✅ PASS
- `CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_tokens_token_hash ON auth_tokens(token_hash);`

### 4) `v2-admin.ts`: INSERT stores original token + token_hash (NOT NULL compat)
- ✅ PASS (for INSERT path)
- Both insert branches include `(token, token_hash, ...)` and pass original token plus hash.

### 5) `auth.ts` + `routes/auth.ts`: dual lookup on `auth_tokens`
- ✅ PASS
- Both use `(token_hash = ? OR token = ?)` with hashed+raw token inputs.

## Blocking issue found

### 🔴 `v2-admin.ts` regenerate path breaks NOT NULL/PK compatibility
- File: `scaffold/pm-api/src/routes/v2-admin.ts`
- Current code in `/members/:token/regenerate`:
  - `UPDATE auth_tokens SET token = NULL, token_hash = ?, ...`
- Problem:
  - In existing schema (`001-memo-v2.sql`), `auth_tokens.token` is `TEXT PRIMARY KEY` (implicitly NOT NULL).
  - Setting `token = NULL` violates PK/NOT NULL constraint and will fail at runtime.
- This also contradicts the stated migration strategy of keeping legacy token column during transition.

## Recommendation to pass
- In regenerate flow, keep `token` non-null (store new plaintext token placeholder or actual new token) while updating `token_hash`.
- Example direction:
  - `SET token = ?, token_hash = ? ...`
  - with lookup fallback `WHERE token = ? OR token_hash = ?` as currently intended.

---

Given the blocking schema-compatibility bug above, this PR is **not safe to approve yet**.
