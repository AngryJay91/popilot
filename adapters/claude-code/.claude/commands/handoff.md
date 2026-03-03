# /handoff - Inter-Agent Handoff

Perform standardized handoffs between agents.

## Usage

```
/handoff              # Generate handoff document for current work
/handoff to penny     # Simon → Penny handoff (PRD complete)
/handoff to hank      # Penny → Hank handoff (screen spec request)
/handoff to dev       # Hank → Dev Team handoff (spec complete)
/handoff to vicky     # Penny → Vicky handoff (validation request)
/handoff to simon     # Vicky → Simon handoff (validation results)
/handoff to tara      # Hank → Tara handoff (tracking review)
/handoff to nora      # Penny → Nora handoff (retro/ceremony data)
```

---

## Handoff Flow

```
🎯 Simon (PRD complete)
    ↓
📋 Penny (Sprint planning + story writing)
    ↓
📐 Hank (Screen spec + handoff package)
    ↓ ←→ 📡 Tara (tracking review)
🔨 Derek + 🧪 Quinn (Implementation + QA)
    ↓
📋 Penny (Dev completion confirmation)
    ↓
📊 Vicky (Validation)
    ↓
🎯 Simon (Result interpretation + next hypothesis)
```

---

## 🎯→📋 Simon → Penny (PRD Complete)

If `$ARGUMENTS` is `to penny`:

```markdown
## 🎯→📋 Handoff: [Feature Name]

### PRD Summary
- **One Question**: [Question]
- **Hypothesis**: IF [condition] THEN [result] BECAUSE [reason]
- **OMTM**: [Metric] | Before: [value] | Target: [value]
- **Validation Period**: [start] ~ [end]

### Guard Rail
- [Metric]: ≤[threshold]

### Request to Penny
- [ ] Write sprint plan
- [ ] Break down stories
- [ ] Route to Hank for screen specs (if UI)
- [ ] Route to Tara for tracking plan

### Reference Documents
- PRD: [link]
- Market data (Marco): [if available]
```

---

## 📋→📐 Penny → Hank (Screen Spec Request)

If `$ARGUMENTS` is `to hank`:

```markdown
## 📋→📐 Spec Request: [Story ID]

### Context
- PRD: [reference]
- Story: [story title and AC summary]
- Sprint: S{N}

### Scope
- [ ] Screen spec needed (which screens?)
- [ ] Release readiness check needed

### Priority
- Sprint deadline: [date]
```

---

## 📐→🔨 Hank → Dev Team (Spec Complete)

If `$ARGUMENTS` is `to dev`:

```markdown
## 📐→🔨 Dev Handoff: [Feature/Story]

### Screen Spec
[7-level spec attached or linked]

### Handoff Checklist
- [ ] All screens specified (Level 1-5 complete)
- [ ] Data sources identified (Level 3)
- [ ] Edge cases documented (Level 5)
- [ ] Tracking events specified (Level 6, reviewed by Tara)
- [ ] Acceptance criteria testable (Level 7)
- [ ] Design assets linked
- [ ] API contracts defined

### Open Questions
[None / list if any]
```

---

## 📋→📊 Penny → Vicky (Validation Request)

If `$ARGUMENTS` is `to vicky`:

```markdown
## 📋→📊 Handoff: [Feature Name] Validation Request

### Development Complete
- Deploy date: [date]
- Deploy scope: [full/partial]

### Request to Vicky
- [ ] Collect baseline data (Before)
- [ ] Confirm event logging is working (coordinate with Tara)
- [ ] Collect After data after measurement period
- [ ] Report hypothesis validation results

### Measurement Target Events
| Event Name | Description |
|------------|-------------|
| `event_1` | [description] |

### Success/Failure Criteria
- Success: [metric] ≥ [value]
- Failure: [metric] < [value]
```

---

## 📊→🎯 Vicky → Simon (Validation Results)

If `$ARGUMENTS` is `to simon`:

```markdown
## 📊→🎯 Validation Results: [Feature Name]

### Verdict: ✅ Success / ❌ Failure / 🟡 Partial Success

### Measurement Results
| Metric | Before | After | Change | Target | Verdict |
|--------|--------|-------|--------|--------|---------|
| OMTM | [value] | [value] | +[N]% | [target] | ✅/❌ |

### Guard Rail
| Metric | Before | After | Allowed Range | Status |
|--------|--------|-------|---------------|--------|
| [metric] | [value] | [value] | ≤[threshold] | 🟢/🔴 |

### Learnings
- ✅ Validated: [content]
- ❌ Disproved: [content]
- 💡 New discovery: [content]

### Next Hypothesis Proposal
- [proposal content]
```

---

## 📐→📡 Hank → Tara (Tracking Review)

If `$ARGUMENTS` is `to tara`:

```markdown
## 📐→📡 Tracking Review: [Feature/Screen]

### Screen Spec Level 6 (Draft)
| Event | Trigger | Parameters |
|-------|---------|------------|
| ... | ... | ... |

### Questions
- Naming convention check?
- Missing events?
- Parameter types correct?
```

---

## 📋→🗓️ Penny → Nora (Ceremony Data)

If `$ARGUMENTS` is `to nora`:

```markdown
## 📋→🗓️ Sprint Data: S{N}

### Sprint Summary
- Goal: [One Question]
- Planned SP: [N] | Completed SP: [N] | Velocity: [N]%
- Stories completed: [N]/[total]
- Blockers encountered: [list]
```

---

## Handoff Checklist

### PRD → Sprint (Simon → Penny)
- [ ] Is the One Question clear?
- [ ] Is the hypothesis in IF/THEN/BECAUSE format?
- [ ] Is the OMTM quantified?
- [ ] Are Guard Rails set?

### Story → Spec (Penny → Hank)
- [ ] Are story ACs in Given/When/Then format?
- [ ] Are UI screens identified?
- [ ] Is the sprint deadline communicated?

### Spec → Development (Hank → Dev)
- [ ] Is the 7-level spec complete?
- [ ] Has Tara reviewed Level 6 (tracking)?
- [ ] Are acceptance criteria testable?

### Development → Validation (Penny → Vicky)
- [ ] Is deployment complete?
- [ ] Is event logging working?
- [ ] Is baseline data available?

### Validation → Strategy (Vicky → Simon)
- [ ] Is the Before/After clear?
- [ ] Has statistical significance been reviewed?
- [ ] Have Guard Rails been checked?
- [ ] Are learning points summarized?

---

## Automatic Handoff Suggestions

Automatically suggest handoff at work completion:

| Situation | Suggestion |
|-----------|-----------|
| PRD writing complete | "Shall we hand off to 📋 Penny?" |
| Story writing complete | "Shall we request screen specs from 📐 Hank?" |
| Screen spec complete | "Shall we hand off to 🔨 Derek?" |
| Spec has tracking events | "Shall we request review from 📡 Tara?" |
| Development confirmed complete | "Shall we request validation from 📊 Vicky?" |
| Validation complete | "Shall we deliver results to 🎯 Simon?" |

---

*Connected agents*: 🎯 Simon, 📋 Penny, 📐 Hank, 📡 Tara, 🔨 Derek, 🧪 Quinn, 📊 Vicky, 🗓️ Nora
*Related commands*: `/strategy`, `/plan`, `/market`, `/tracking`, `/validate`, `/retro`
