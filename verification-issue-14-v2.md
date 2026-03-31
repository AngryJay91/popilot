# Verification — Issue #14 (v2)

PR: **#21** (`fix/issue-14-standup-n1-v2`)
Reviewer: **Quinn (🧪)**
Date: 2026-03-31

## Verdict
**REQUEST_CHANGES**

## Checklist

### 1) Diff scope: only pm-api files
Command:
```bash
git diff main...fix/issue-14-standup-n1-v2 --stat
```
Result:
- `scaffold/pm-api/src/mcp-tools/standup.ts`
- `scaffold/pm-api/src/mcp.ts`
- `scaffold/pm-api/src/routes/v2-standup.ts`

✅ Scope is limited to expected `pm-api` files.

---

### 2) N+1 elimination
- In MCP tool (`toolListStandupEntries`), feedback is fetched via one `IN (...)` query when `with_feedback=true`.
- In API route (`GET /entries-with-feedback`), entries are fetched first, then all feedback in one `IN (...)` query.

✅ N+1 pattern is eliminated in both new/extended paths.

---

### 3) Existing response format maintained
- Existing `GET /entries` route response remains `{ entries: [...] }` and unchanged.
- Existing MCP `list_standup_entries` output format is unchanged when `with_feedback` is not provided/false.

✅ Backward-compatible for existing consumers in default path.

---

### 4) New MCP tool added
- No **new MCP tool name** was added.
- Existing `list_standup_entries` was extended with a new optional param: `with_feedback`.

⚠️ If requirement strictly means “new tool”, this is **not met**.

---

## Potential Issues (3+)

### 1. Boolean parsing bug for `with_feedback` (High)
In `toolListStandupEntries`:
```ts
const withFeedback = Boolean(args.with_feedback)
```
If caller sends string `'false'` (common in loosely typed clients), `Boolean('false') === true`, so feedback is unexpectedly included.

**Impact:** surprising behavior, extra DB load, incorrect semantics.

**Fix suggestion:** strict parse:
- `args.with_feedback === true || args.with_feedback === 'true'`
- or schema-level coercion/validation before tool handler.

---

### 2. Silent failure on feedback query in MCP path (Medium)
In `toolListStandupEntries`, feedback query errors are ignored:
```ts
if (!fbResult.error) { ... }
```
When feedback query fails, tool still returns standup entries without any warning.

**Impact:** hidden data loss; operators cannot detect partial failures.

**Fix suggestion:**
- Return error when `with_feedback=true` and feedback fetch fails, or
- include explicit warning in output (`⚠️ feedback unavailable: ...`).

---

### 3. `entries-with-feedback` uses `SELECT *` for both tables (Medium)
Route query uses:
- `SELECT e.* FROM pm_standup_entries e ...`
- `SELECT * FROM pm_standup_feedback ...`

**Impact:** response shape can change unintentionally on schema evolution, larger payloads than needed, tighter coupling to DB schema.

**Fix suggestion:** enumerate required columns explicitly.

---

### 4. Potentially unbounded result size in new endpoint (Medium)
`GET /entries-with-feedback` has no `LIMIT` (unlike sprint-only path in `/entries`, which limits to 50 for sprint query).

**Impact:** large responses and heavy `IN (...)` list for large sprints/date ranges.

**Fix suggestion:** add pagination/limit defaults and explicit max cap.

---

## Summary
- Core N+1 fix intent is good and correctly implemented with batch fetch.
- However, there are correctness/operability concerns (boolean coercion, silent partial failures, unbounded payload, `SELECT *`).
- Also, requirement wording says “new MCP tool added”, but implementation extends existing tool instead.

**Final: REQUEST_CHANGES**