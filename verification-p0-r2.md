# Verification Report — PR #2 Re-check (P0 blockers + review fixes)

Date: 2026-03-31
Verifier: Quinn (🧪)
Repo: `~/heavaa/dev/popilot`
Branch: `feat/p0-external-usability`

## 1) Diff stat (`main...feat/p0-external-usability`)

```bash
README.md                                |  4 ++--
bin/cli.mjs                              | 15 ++++++++++++---
scaffold/pm-api/sql/006-schema-fixes.sql | 14 ++++----------
scaffold/pm-api/src/routes/v2-kickoff.ts |  4 ++--
4 files changed, 20 insertions(+), 17 deletions(-)
```

## 2) Migration runner duplicate-column handling (`bin/cli.mjs`)

✅ Verified.

In `cmdMigrate`, migration failures now parse stderr/message and treat duplicate-column/already-exists cases as non-fatal:

- `const msg = err.stderr ? err.stderr.toString() : err.message;`
- `const isDuplicateColumn = /duplicate column|already exists/i.test(msg);`
- Duplicate column case logs warning and increments applied count:
  - `⚠️  ... skipped (columns already exist)`

This makes reruns idempotent for that class of schema drift.

## 3) `v2-kickoff.ts` uses `COALESCE(label, title)`

✅ Verified.

In `GET /:id/plan` query:

```sql
SELECT id, COALESCE(label, title) AS label, ... FROM nav_sprints WHERE id = ?
```

This addresses compatibility between older `title` and newer `label` values.

## 4) README tool count is 52 (not 49)

✅ Verified.

README updated in both MCP-PM mention points:
- “52개 도구 ... 직접 호출”
- “pm 서버와 52개 도구 목록 ... 연결 성공”

No remaining `49개 도구` references found in the changed README sections.

## 5) CLI build failure exposes stderr

✅ Verified.

In `bin/cli.mjs` (`mcp-pm` build step):

- Catch now captures `buildErr`
- Extracts stderr: `buildErr.stderr?.toString().slice(0, 500)`
- Prints stderr snippet with `📋 ...` when available

So build failures now surface actionable error output.

## 6) Build check (`scaffold/mcp-pm`)

✅ Passed.

Command:

```bash
cd scaffold/mcp-pm && npm run build
```

Output:

```text
> mcp-pm@1.0.0 build
> tsc
```

No TypeScript build errors.

## 7) Remaining issues

No blocking issues found from this re-verification scope.

## 8) Decision

## APPROVE ✅

All 4 previously requested fixes are present and validated. Build passes for `scaffold/mcp-pm`.
