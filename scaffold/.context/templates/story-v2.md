# Story Template v2

> 📋 AI Agent-optimized story template used by Penny (BMAD-METHOD based)

---

# Story: [Story Title]

## Meta

| Item | Value |
|------|-------|
| **Story ID** | E-[N]-S-[M] |
| **Epic** | [Epic title + link] |
| **Status** | `ready-for-dev` |
| **Priority** | P0 / P1 / P2 |
| **Size** | S / M / L / XL |
| **Assigned Developer** | [Name] |

---

## User Story

> As a **[role]**,
> I want **[feature/action]**,
> So that **[benefit/value]**.

---

## Acceptance Criteria

### AC-01: [Criteria Title]

| Item | Content |
|------|---------|
| **Given** | [Precondition: user/system state] |
| **When** | [Trigger: user action] |
| **Then** | [Expected result: system response] |

### AC-02: [Criteria Title]

| Item | Content |
|------|---------|
| **Given** | [Precondition] |
| **When** | [Trigger] |
| **Then** | [Expected result] |

### AC-03: [Criteria Title] (Edge Case)

| Item | Content |
|------|---------|
| **Given** | [Exception scenario] |
| **When** | [Trigger] |
| **Then** | [Error handling/fallback] |

---

## Task Breakdown

### Task 1: [Task Name] `AC-01`

- [ ] **1.1**: [Detailed work - be specific]
- [ ] **1.2**: [Detailed work]
- [ ] **1.3**: [Detailed work]

### Task 2: [Task Name] `AC-02`

- [ ] **2.1**: [Detailed work]
- [ ] **2.2**: [Detailed work]

### Task 3: Write Tests `AC-01, AC-02, AC-03`

- [ ] **3.1**: Write unit tests
- [ ] **3.2**: Write integration tests
- [ ] **3.3**: Edge case tests

### Task 4: Wrap-up

- [ ] **4.1**: Code cleanup and comments
- [ ] **4.2**: Verify event logging
- [ ] **4.3**: Create PR

---

## Dev Notes (AI Agent Optimized)

### Architecture Pattern

| Item | Content |
|------|---------|
| **Pattern to Use** | [e.g., Repository Pattern, CQRS, Event Sourcing, etc.] |
| **Reference Implementation** | [Existing code path - similar implementation example] |
| **Things to Avoid** | [Anti-patterns, cautions] |

### Affected Source Tree

```
src/
├── [directory1-to-modify]/
│   ├── [file1-to-modify.ts]      # [Change summary]
│   └── [file2-to-modify.ts]      # [Change summary]
├── [directory2-to-modify]/
│   └── [new-file.ts]             # 🆕 New file
└── tests/
    └── [test-file.test.ts]       # 🆕 New file
```

### Tech Stack

| Item | Technology | Version |
|------|-----------|---------|
| Framework | [e.g., Next.js] | [Version] |
| Library | [e.g., React Query] | [Version] |
| DB | [e.g., PostgreSQL] | [Version] |

### Test Criteria

| Type | Required | Target/Scenario |
|------|----------|----------------|
| Unit Test | ✅/❌ | [Target function/class] |
| Integration Test | ✅/❌ | [API endpoint] |
| E2E Test | ✅/❌ | [User scenario] |

### Conflict Detection

| Item | Status | Description |
|------|--------|-------------|
| Existing code conflict | ✅ None / ⚠️ Caution | [Detailed description] |
| API contract change | ✅ None / ⚠️ Caution | [Detailed description] |
| DB schema change | ✅ None / ⚠️ Caution | [Migration needed?] |
| Environment variable change | ✅ None / ⚠️ Caution | [Variables to add] |

---

## References

| Source | Path/Link | Reference Section |
|--------|----------|-------------------|
| PRD | [Notion link] | [Section name] |
| Epic Spec | [epic-specs/E-XX-xxx.md](../epic-specs/E-XX-xxx.md) | [Section name] |
| **Screen Spec** | [design/E-XX-screen-spec.md](../design/E-XX-screen-spec.md) | Level [N] |
| Design | [Figma link] | [Frame name] |
| API Spec | [Swagger link] | [Endpoint] |
| Reference Implementation | `src/[path]/[file]` | [Function/class name] |
| External Docs | [Link] | [Related content] |

### spec-site Integration (Optional)

When interactive mockups exist, add spec-site link:

| Source | Path | Reference |
|--------|------|-----------|
| **spec-site Mockup** | `spec-site/src/pages/{feature}/` | Per-scenario interactive mockup |

---

## Event Logging

| Event Name | Trigger | Parameters | GA4 |
|------------|---------|------------|-----|
| `[event_name]` | [When triggered] | `{key: value}` | ✅/❌ |
| `[event_name]` | [When triggered] | `{key: value}` | ✅/❌ |

---

## Dev Agent Record

| Item | Value |
|------|-------|
| **Created By Agent** | [Model name: Claude Opus 4.5, etc.] |
| **Created Date** | [YYYY-MM-DD] |
| **Last Modified** | [YYYY-MM-DD] |
| **Reviewer** | [Penny / Person name] |

### Completion Notes

```
[Recorded after development completion]
- Notable items:
- Changed parts:
- Additional considerations:
```

### Modified File List

```
[Recorded automatically/manually after development completion]
- src/...
- src/...
- tests/...
```

### Related PR

- PR #[Number]: [Title]

---

## Pre-Handoff Checklist

### Context & Requirements
- [ ] Is the user story clear? (role, feature, value)
- [ ] Are acceptance criteria in Given-When-Then format?
- [ ] Are all edge cases defined?

### Disaster Prevention
- [ ] Checked for similar functionality in existing code?
- [ ] No ⚠️ items in conflict detection?
- [ ] Verified library version compatibility?

### AI Agent Optimization
- [ ] Are Dev Notes sufficiently detailed?
- [ ] Are References accurate?
- [ ] Is the task breakdown specific enough?

### Final Check
- [ ] Is event logging defined?
- [ ] Is status set to `ready-for-dev`?

---

**Validation Result**: ✅ PASS / ❌ FAIL
**Validation Date**: [YYYY-MM-DD]

---

*Created: [Date]*
*Last Modified: [Date]*
