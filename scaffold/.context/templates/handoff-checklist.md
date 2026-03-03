# Handoff Quality Verification Checklist

> 📋 Pre-handoff story quality verification used by Penny (BMAD-METHOD based)

---

## Verification Target

| Item | Value |
|------|-------|
| **Story ID** | [E-N-S-M] |
| **Story Title** | [Title] |
| **Reviewer** | [Penny / Person name] |
| **Review Date** | [YYYY-MM-DD] |

---

## Phase 1: Context & Requirements Verification

### User Story Verification
- [ ] Is the **Role** clearly defined?
- [ ] Is the **Feature (Want)** specifically described?
- [ ] Is the **Value (So that)** connected to business goals?

### Acceptance Criteria Verification
- [ ] Are all acceptance criteria **testable**?
- [ ] Is the **Given-When-Then** format complete?
- [ ] Is there **consistency** with PRD/Epic?
- [ ] Are **edge cases** included?

### Task Breakdown Verification
- [ ] Are tasks **mapped** to acceptance criteria?
- [ ] Are subtasks **specific** enough?
- [ ] Is the estimated workload **realistic**?

---

## Phase 2: Disaster Prevention Analysis

### Feature Duplication Check
- [ ] Confirmed whether **similar functionality** exists in current code?
- [ ] Identified **reusable components**?
- [ ] Is there an **integration plan** if duplicated?

**Duplicates Found**:
```
[None / Detail if found]
```

### Technical Error Check
- [ ] Are **library versions** compatible?
- [ ] Analyzed **API contract** change impact?
- [ ] Are **type definitions** consistent?

**Technical Cautions**:
```
[None / Detail if found]
```

### File Structure Check
- [ ] Does file creation location follow **project conventions**?
- [ ] No impact on **build process**?
- [ ] Are **import paths** correct?

### Regression Check
- [ ] Do **existing tests** pass?
- [ ] Created list of **affected features**?
- [ ] Reviewed **side effect** possibilities?

**Affected Features**:
```
[None / Detail if found]
```

### Implementation Ambiguity Check
- [ ] Are all **edge cases** defined?
- [ ] Are **error handling methods** specified?
- [ ] Is **null/undefined handling** defined?
- [ ] Is **concurrency/race condition** considered?

**Ambiguous Areas**:
```
[None / Detail with resolution plan if found]
```

---

## Phase 2.5: Screen Spec Verification (For UI Epics)

> Applies only to Epics with UI. N/A for backend-only Epics

### Screen Spec Completeness

- [ ] **Level 1~2** (IA/Main screen): Is the overall structure and layout expressed in ASCII?
- [ ] **Level 3** (Components): Are all state variants defined?
- [ ] **Level 4** (Modals): Are validation and save behavior defined?
- [ ] **Level 5** (External integration): Are connections with existing screens defined?
- [ ] **Level 6** (State-based UI): Are loading/empty/error states defined?
- [ ] **Level 7** (Policies): Are all policies organized in tables?

### Screen Spec Quality

- [ ] Are **specs (size, color, behavior)** specified for all UI elements?
- [ ] Are **ASCII diagrams** at a level developers can understand?
- [ ] Is the Epic Spec **business logic** reflected in the screen spec?
- [ ] Are **edge case UIs** defined?

### Story Linkage

- [ ] Is the screen spec **link added** to References in all related Stories?
- [ ] Are Story tasks **mapped** to screen spec Levels?

**Screen spec file**:
```
sprints/s{N}/design/{Epic-ID}-screen-spec.md
```

### spec-site Verification
- [ ] Does the interactive mockup match the ACs?
- [ ] Are all scenarios defined?
- [ ] Are empty/error states included in the mockup?

---

## Phase 3: AI Agent Optimization Verification

### Dev Notes Verification
- [ ] Is the **architecture pattern** specified?
- [ ] Is the **reference implementation** provided with accurate paths?
- [ ] Are **things to avoid** specified?

### Source Tree Verification
- [ ] Is the **affected file list** complete?
- [ ] Are **new files** marked?
- [ ] Are **change summaries** present?

### References Verification
- [ ] Is the PRD link **valid**?
- [ ] Is the design link **up to date**?
- [ ] Are reference implementation paths **accurate**?

### Conflict Detection Verification
- [ ] Are all conflict items in **✅ None** status?
- [ ] Are there resolution plans for **⚠️ Caution** items?

---

## Phase 4: Final Check

### Meta Information
- [ ] Is the **Story ID** correct?
- [ ] Is the **Epic connection** established?
- [ ] Is the **priority** set?
- [ ] Is the **size** estimated?

### Event Logging
- [ ] Are **required events** defined?
- [ ] Are **parameters** specified?
- [ ] Is **GA4 status** indicated?

### Status
- [ ] Is the status set to **`ready-for-dev`**?

---

## Verification Result

### Overall Assessment

| Phase | Result |
|-------|--------|
| Phase 1: Context & Requirements | ✅ PASS / ❌ FAIL |
| Phase 2: Disaster Prevention | ✅ PASS / ❌ FAIL |
| Phase 2.5: Screen Spec | ✅ PASS / ❌ FAIL / ⏭️ N/A |
| Phase 3: AI Agent Optimization | ✅ PASS / ❌ FAIL |
| Phase 4: Final Check | ✅ PASS / ❌ FAIL |

### Final Verdict

**✅ PASS** - Ready for handoff

or

**❌ FAIL** - Modifications required

### Required Modifications (If FAIL)

| Priority | Item | Description |
|----------|------|-------------|
| Required | [Item] | [Modification needed] |
| Recommended | [Item] | [Modification needed] |

---

**Reviewer**: [Name]
**Review Date**: [YYYY-MM-DD]
**Signature**: ✓
