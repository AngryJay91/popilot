# /sessions - Session Dashboard

View the full session dashboard or perform management tasks.

## Usage

```bash
/sessions                 # Full session dashboard
/sessions clean           # Clean up stale locks, delete old archives
```

ARGUMENTS: $ARGUMENTS

---

## Execution Steps

### /sessions (Dashboard)

Read `index.yaml` and display the full session dashboard:

```markdown
🎩 Oscar: Here is the session dashboard.

## Active Sessions (2)
┌────┬─────────────────┬────────┬───────────┬─────────────────────────────┐
│ #  │ ID              │ Status │ Last      │ Topic                        │
├────┼─────────────────┼────────┼───────────┼─────────────────────────────┤
│ 1  │ notion-tasks    │ 🟢 idle│ 10m ago   │ Sprint 52 Notion Tasks       │
│ 2  │ surface-cvr     │ 🔒 in use│ just now │ Surface Layer CVR Optimization│
└────┴─────────────────┴────────┴───────────┴─────────────────────────────┘

## Recently Closed (3)
┌────┬─────────────────┬───────────┬─────────────────────────────┐
│ #  │ ID              │ Closed    │ Topic                        │
├────┼─────────────────┼───────────┼─────────────────────────────┤
│ 1  │ ir-prep         │ 01/25     │ IR Material Preparation      │
│ 2  │ story-review    │ 01/24     │ Story Review                 │
│ 3  │ deep-layer      │ 01/23     │ Deep Layer Improvement       │
└────┴─────────────────┴───────────┴─────────────────────────────┘

## Shared Outputs (1)
┌────┬──────────────────────┬───────────┬─────────────────┐
│ #  │ Title                │ Created   │ Source Session   │
├────┼──────────────────────┼───────────┼─────────────────┤
│ 1  │ S52 Story List       │ 01/26     │ notion-tasks    │
└────┴──────────────────────┴───────────┴─────────────────┘

---

**Commands**:
- `/start {id}` - Start/restore session
- `/start new "{topic}"` - Create new session
- `/start recent` - Restore closed session
- `/save` - Save current session
- `/sessions clean` - Clean up tasks
```

---

### /sessions clean

Perform management tasks:

1. **Clean up stale Locks**: Release Locks for sessions where `lock.expires < now`
2. **Delete old archives**: Delete archive files older than 30 days (optional)
3. **Clean up orphan files**: Detect files in `active/` that are not in `index.yaml`

```markdown
🎩 Oscar: Performing cleanup tasks.

## Stale Lock Cleanup
- notion-tasks: Lock released (expired: 2 hours ago)

## Old Archives
- archive/2025-12/old-session-1225.md (32 days ago)
  → Delete? [y/n]

## Orphan Files
- active/unknown-session.md (not in index.yaml)
  → Delete? [y/n]

---

Cleanup complete.
```

---

## Status Display Rules

### Session Status

| Status | Icon | Condition |
|--------|------|-----------|
| In use | 🔒 | `status: active` AND `lock.active: true` AND `lock.expires >= now` |
| idle | 🟢 | `status: idle` OR `lock.active: false` |
| stale | ⚠️ | `lock.active: true` AND `lock.expires < now` |

### Last Activity Time

- Less than 1 minute: "just now"
- Less than 1 hour: "Nm ago"
- Less than 24 hours: "Nh ago"
- Otherwise: "MM/DD"

---

## Dashboard Information Sources

### Active Sessions

From the `active` array in `index.yaml`:
- id, topic, status, lock state
- Calculate last activity time from `auto_save.last_turn`

### Recently Closed

From the `recent_closed` array in `index.yaml`:
- id, topic, archived_at
- Display up to 5

### Shared Outputs

From the `shared_outputs` array in `index.yaml`:
- title, created_at, created_by
- Display all

---

## Related Commands

- `/start` - Start/restore session
- `/save` - Save session

---

*File location*:
- Session index: `.context/sessions/index.yaml`
