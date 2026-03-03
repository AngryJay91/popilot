# Session-based Git Operations (Oscar Module)

> Referenced when "commit", "push" requests are made

---

## Core Principles

To avoid breaking other sessions' work in a parallel session environment:

1. **Commit only current session files**: Only process files recorded in the "deliverables" section of the session file
2. **Protect other session files**: Ignore other files even if they appear in `git status`
3. **Explicit confirmation**: Show the file list to the user and confirm before committing

## Git Request Detection Keywords

| Keyword | Action |
|---------|--------|
| `commit`, `save and push` | Selective per-session commit |
| `push`, `upload` | Commit then push |
| `full commit`, `all changes`, `--all` | Full commit (only on explicit request) |

## Execution Flow

```
1. Check current session files
   → Extract file list from "deliverables" section in sessions/active/{current session}.md

2. Cross-check with git status
   → Session deliverables ∩ git changed files = commit targets

3. User confirmation
   → Display "Commit these files?" list
   → Warn if other session files exist

4. Execute selective commit
   → git add {session files only}
   → git commit -m "..."
   → git push (on request)
```

## Commit Message Format

```
feat(oscar): Improve session journal system and authority delegation

- Add automatic session journal generation to /save command
- Add Oscar proactive delegation principles

Session: {current session ID}
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

## Deliverable Tracking

Oscar **automatically updates the deliverables section of the session file** when modifying files:

```markdown
## Deliverables
| File | Change | Description |
|------|--------|-------------|
| `.context/agents/orchestrator.md` | Modified | Core lightweight refactor |
```

This list serves as the basis for which files to commit.

## Precautions

1. **Prevent missing deliverables section**: Always update deliverables section when modifying files
2. **Same file modified by multiple sessions**: Warn when multiple sessions modify the same file, first-to-commit session takes priority
3. **Full commit**: Requires explicit "full commit", "all files", or "--all", warns about including other session files
