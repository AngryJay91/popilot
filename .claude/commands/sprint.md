# /sprint - Sprint Management

Perform sprint-related tasks.

## Usage

```
/sprint          # Display current sprint dashboard
/sprint new      # Create new sprint
/sprint archive  # Archive previous sprint
/sprint status   # Quick status check
```

## Determine Current Sprint Number

Find the pattern "Current Sprint: **{number}**" in `CLAUDE.md` and extract the number.

## Sprint Dashboard (Default) ⭐ NEW

If `$ARGUMENTS` is empty, **auto-generate the dashboard**:

1. Check the current sprint number (N) from `CLAUDE.md`
2. Load `.context/sprints/s{N}/context.md`
3. Generate the dashboard as 📋 Penny:

```markdown
## 📋 Sprint {N} Dashboard

### 🎯 Goal
[One Question or Sprint Goal]

### 📊 KR Progress
| KR | Current | Target | Progress | Status |
|----|---------|--------|----------|--------|
| KR1 | 15% | 20% | ███████░░░ 75% | 🟢 |
| KR2 | 18% | 15% | ██████████ 100% | ✅ |
| KR3 | 50% | 100% | █████░░░░░ 50% | 🟡 |

### 📝 Work Status
| Task | Owner | Status | Notes |
|------|-------|--------|-------|
| [Task 1] | Dev Team | 🔄 In Progress | - |
| [Task 2] | Marketing | ✅ Done | - |
| [Task 3] | Dev Team | ⏳ Waiting | Dependency: [Task 1] |

### 🚧 Blockers
- [ ] [Blocker description]

### 📅 Schedule
- Sprint period: [Start date] ~ [End date]
- Current: D-{N} days
```

4. If possible, query current metric values from GA4 (📊 Vicky integration)
5. Highlight risks/blockers if present

### Status Display Criteria
- ✅ Goal achieved (≥100%)
- 🟢 On track (≥70%)
- 🟡 Needs attention (≥40%)
- 🔴 At risk (<40%)

## New Sprint Creation (`new`)

If `$ARGUMENTS` is `new`:

1. Check current sprint number
2. Create new sprint folder (e.g., `s52/`)
3. Generate `context.md` template:
   ```markdown
   # Sprint [N] Context

   > **PRD**: [Notion link]
   > **Period**: [Start date] ~ [End date]

   ## Goal
   [Sprint goal in one sentence]

   ## Key Results
   | KR | Metrics | Current | Target | Owner |
   |----|---------|---------|--------|-------|
   | KR1 | | | | |

   ## Key Tasks
   - [ ]

   ## Related Documents
   | Document | Link |
   |----------|------|
   ```

4. Check if `results.md` was generated for the previous sprint

## Archive (`archive`)

If `$ARGUMENTS` is `archive`:

1. Move the completed sprint folder to `_archive/`
2. Check if a results summary exists
3. If not, suggest having 📊 Vicky write a results report

## CLAUDE.md Update

When creating a new sprint:
- Update only the "Current Sprint: **{number}**" line in `CLAUDE.md`
- Example: `## Current Sprint: **51**` → `## Current Sprint: **52**`
