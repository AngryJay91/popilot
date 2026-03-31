# PR #8 Verification — Issue #7 (DB Indexes)

## Scope Reviewed
- Repo: `~/heavaa/dev/popilot`
- PR branch: `fix/issue-7-indexes`
- Compared against: `main`
- Expected change: single new file `scaffold/pm-api/sql/007-indexes.sql`

## 1) Diff stat
```bash
git diff main...fix/issue-7-indexes --stat
```
Result:
- `scaffold/pm-api/sql/007-indexes.sql | 27 +++++++++++++++++++++++++++`
- `1 file changed, 27 insertions(+)`

## 2) `CREATE INDEX IF NOT EXISTS` usage
✅ Pass. All index statements use `CREATE INDEX IF NOT EXISTS`.

## 3) Naming convention `idx_{table}_{column}`
✅ Pass. All index names follow the expected pattern:
- `idx_pm_stories_sprint`
- `idx_pm_stories_epic_id`
- `idx_pm_stories_status`
- `idx_pm_stories_assignee`
- `idx_pm_tasks_story_id`
- `idx_pm_tasks_status`
- `idx_pm_tasks_assignee`
- `idx_pm_epics_status`
- `idx_meetings_date`
- `idx_meetings_meeting_date`
- `idx_members_display_name`
- `idx_nav_sprints_status`

## 4) Required table/column coverage
✅ Pass. All requested columns are covered:
- `pm_stories`: `sprint`, `epic_id`, `status`, `assignee`
- `pm_tasks`: `story_id`, `status`, `assignee`
- `pm_epics`: `status`
- `meetings`: `date`, `meeting_date`
- `members`: `display_name`
- `nav_sprints`: `status`

## 5) TypeScript file modifications
✅ Pass. No TypeScript files were modified.

## 6) Potential issues (at least 3)
1. **Migration locking risk on large tables** (non-blocking but important):
   - Uses standard `CREATE INDEX` (not `CONCURRENTLY`). On large production tables, this may take stronger locks and impact write availability during migration.
2. **No composite indexes for likely multi-column filters** (non-blocking):
   - If frequent queries combine filters (e.g., `pm_tasks(story_id, status)` or `pm_stories(epic_id, status)`), single-column indexes may not provide optimal plans.
3. **Write overhead increase from many single-column indexes** (non-blocking):
   - 12 new indexes can increase insert/update cost and storage usage. Worth validating with query patterns and `EXPLAIN ANALYZE` before/after.
4. **Potential redundancy risk if schema already has overlapping indexes** (non-blocking):
   - `IF NOT EXISTS` prevents duplicate-name creation but does not prevent semantically duplicate indexes under different names.

## 7) Verdict
✅ **APPROVE**

All checklist requirements are satisfied, and the migration is idempotent and convention-compliant. Recommend follow-up performance validation (query plans + migration window strategy) in staging/production rollout notes.
