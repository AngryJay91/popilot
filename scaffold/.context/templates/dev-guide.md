# Developer Agent Guide

> Development workflow guide for AI Agent Driven Development

---

## Overview

This guide defines the workflow that AI development agents (Claude Code, etc.) must follow when performing story-based development.

---

## Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Dev Agent Workflow                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Load Story                                                   │
│     └─→ Check for ready-for-dev in sprint-status.yaml           │
│                                                                 │
│  2. Understand Context                                           │
│     ├─→ Understand user story                                    │
│     ├─→ Review acceptance criteria                               │
│     └─→ Study Dev Notes                                          │
│                                                                 │
│  3. Review References                                            │
│     ├─→ Check PRD                                                │
│     ├─→ Check design                                             │
│     └─→ Review existing implementations                          │
│                                                                 │
│  4. Check Conflict Detection                                     │
│     └─→ Resolve ⚠️ items first                                   │
│                                                                 │
│  5. Implement Tasks in Order                                     │
│     └─→ Update checkboxes on subtask completion                  │
│                                                                 │
│  6. Completion Processing                                        │
│     ├─→ Update Dev Agent Record                                  │
│     ├─→ Record modified file list                                │
│     └─→ Change status to review                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Steps

### Step 1: Load Story

1. Check `sprint-status.yaml` file
2. Select a story with `status: ready-for-dev`
3. Load the story document

```yaml
# sprint-status.yaml example
- id: E-01-S-01
  title: "Landing page redesign"
  status: ready-for-dev  # ← Select this story
  assignee: null
```

### Step 2: Understand Context

**Required checks**:

| Section | What to Check |
|---------|--------------|
| User Story | Understand role, feature, value |
| Acceptance Criteria | Understand Given-When-Then conditions |
| Dev Notes | Verify architecture pattern, tech stack |
| Task Breakdown | Determine implementation order |

### Step 3: Review References

Check and understand all reference documents:

- **PRD**: Original business requirements
- **Design**: UI/UX details
- **Existing Implementation**: Code with similar patterns

### Step 4: Check Conflict Detection

Check the "Conflict Detection" section in Dev Notes:

| Status | Meaning | Action |
|--------|---------|--------|
| ✅ None | No conflicts | Proceed |
| ⚠️ Caution | Potential conflict | **Resolve first, then proceed** |

### Step 5: Implement Tasks in Order

**Rules**:

1. **Do not change task order** - Dependencies have been considered
2. **Do not add features beyond acceptance criteria** - Prevent scope creep
3. **Update checkboxes on each subtask completion**

```markdown
### Task 1: Implement API endpoint `AC-01`
- [x] **1.1**: Create Controller  ← Check on completion
- [x] **1.2**: Implement Service logic
- [ ] **1.3**: Connect Repository   ← In progress
```

### Step 6: Completion Processing

1. **Update Dev Agent Record**

```markdown
## Dev Agent Record

| Item | Value |
|------|-------|
| Created By Agent | Claude Opus 4.5 |
| Created Date | 2026-01-24 |
| Last Modified | 2026-01-24 |

### Completion Notes
- Notable items: Maintained compatibility with existing API schema
- Changed parts: Added method to UserController
- Additional considerations: Cache invalidation logic needed
```

2. **Record modified file list**

```markdown
### Modified File List
- src/controllers/UserController.ts
- src/services/UserService.ts
- src/repositories/UserRepository.ts
- tests/UserController.test.ts (new)
```

3. **Change status**

Change status to `review` in `sprint-status.yaml`:

```yaml
- id: E-01-S-01
  status: review  # ready-for-dev → review
```

---

## Precautions

### DO

- ✅ Implement tasks in order
- ✅ Only implement features defined in acceptance criteria
- ✅ Resolve conflict detection items first
- ✅ Record all modified files
- ✅ Write tests (when specified in Dev Notes)
- ✅ Follow code style guide

### DON'T

- ❌ Change task order
- ❌ Add features beyond acceptance criteria
- ❌ Proceed ignoring ⚠️ conflicts
- ❌ Skip Dev Agent Record update
- ❌ Skip file list recording
- ❌ Skip status change

---

## Error Handling

### When a Blocker Occurs During Implementation

1. Revert story status to `backlog`
2. Record blocker details in Dev Agent Record
3. Notify PO/responsible person

```markdown
### Completion Notes
- Blocker: External API authentication key required
- Required action: Request API key from DevOps team
- Estimated resolution time: 1 day
```

### When Acceptance Criteria Are Unclear

1. Stop implementation
2. Request clarification via AskUserQuestion
3. Update story document then proceed

---

## Quality Criteria

Pre-completion checks:

- [ ] All acceptance criteria met
- [ ] All task checkboxes completed
- [ ] Tests written and passing (if applicable)
- [ ] No linting errors
- [ ] Event logging verified (if applicable)
- [ ] Dev Agent Record updated
- [ ] Modified file list recorded

---

## Related Documents

| Document | Location |
|----------|----------|
| Story Template | `.context/templates/story-v2.md` |
| Sprint Status | `.context/sprints/s[N]/sprint-status.yaml` |
| Handoff Checklist | `.context/templates/handoff-checklist.md` |

---

*Last updated: 2026-01-19*
