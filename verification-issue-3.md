# PR #10 Verification — Token hashing with SHA-256

## Scope reviewed
- Branch diff: `main...fix/issue-3-token-hashing`
- Files:
  - `scaffold/pm-api/src/utils/hash.ts` (new)
  - `scaffold/pm-api/src/auth.ts`
  - `scaffold/pm-api/src/routes/v2-admin.ts`
  - `scaffold/pm-api/sql/008-hash-tokens.sql` (new)

## 1) Diff stat
```bash
scaffold/pm-api/sql/008-hash-tokens.sql |  9 +++++++++
scaffold/pm-api/src/auth.ts             | 11 ++++++++---
scaffold/pm-api/src/routes/v2-admin.ts  | 17 +++++++++++------
scaffold/pm-api/src/utils/hash.ts       | 12 ++++++++++++
4 files changed, 40 insertions(+), 9 deletions(-)
```

## 2) Web Crypto API check (CF Workers compatible)
- ✅ `hashToken` uses `crypto.subtle.digest('SHA-256', ...)` with `TextEncoder`.
- ✅ No `node:crypto` import in `utils/hash.ts`.

## 3) Auth comparison supports hashed + plaintext during migration
- ✅ `auth.ts` checks `WHERE (token_hash = ? OR token = ?) ...`.
- ✅ This supports existing plaintext rows and new hashed rows.

## 4) Token creation hashes before storing
- ✅ `v2-admin.ts` computes `tokenHash = await hashToken(body.token)` before insert.
- ⚠️ But plaintext token is still stored in `token` column as well.

## 5) Migration adds `token_hash`
- ✅ `008-hash-tokens.sql` adds `token_hash TEXT` and index `idx_auth_tokens_token_hash`.

---

## Potential issues (>=3)

### 1) Plaintext token is still persisted for all newly created/regenerated tokens (security gap)
**Where:** `v2-admin.ts` insert/update SQL still writes `token = ?`.

**Impact:** If DB is leaked, active bearer tokens are immediately usable. This weakens the main purpose of hashing-at-rest.

**Recommendation:**
- Store only `token_hash` for new/regenerated tokens.
- Keep `token` nullable only for temporary legacy rows.
- Add migration plan to null/clear legacy plaintext tokens after rollover.

### 2) `/api/auth/verify` route is not migrated to hash-aware lookup
**Where:** `src/routes/auth.ts` still does `WHERE token = ?` only.

**Impact:** Auth behavior is inconsistent across code paths. If `token` column is later removed/cleared, this endpoint will fail while middleware may still work.

**Recommendation:** Update `routes/auth.ts` to use same dual-lookup logic as `auth.ts` during migration.

### 3) No backfill step for existing rows (`token_hash` remains NULL)
**Where:** `008-hash-tokens.sql` adds column/index only; no data migration.

**Impact:** Legacy rows never become hash-searchable unless manually regenerated. Migration can remain half-complete indefinitely.

**Recommendation:** Add explicit backfill strategy (app-side script or phased re-issue) and track completion criteria.

### 4) No uniqueness constraint on `token_hash`
**Where:** migration creates non-unique index only.

**Impact:** Accidental duplicate token values can create ambiguous ownership/validation behavior.

**Recommendation:** Add `UNIQUE` constraint/index on `token_hash` (after backfill cleanup), plus conflict handling.

---

## Verdict
**REQUEST_CHANGES**

핵심 보안 목표(토큰 평문 비저장)가 아직 완전히 달성되지 않았고, 인증 경로 일관성(`/verify`) 및 마이그레이션 완결성(backfill/unique) 이슈가 남아 있습니다.