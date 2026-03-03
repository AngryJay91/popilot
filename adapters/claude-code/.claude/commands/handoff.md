# /handoff - Inter-Agent Handoff

Perform standardized handoffs between agents.

## Usage

```
/handoff           # Generate handoff document for current work
/handoff to penny  # Simon → Penny handoff
/handoff to vicky  # Penny → Vicky handoff
/handoff to simon  # Vicky → Simon handoff
/handoff to dev    # Penny → Dev Team handoff
```

---

## Handoff Flow

```
🎯 Simon (PRD complete)
    ↓
📋 Penny (Sprint planning)
    ↓
👨‍💻 Dev Team (Implementation)
    ↓
📋 Penny (Dev completion confirmation)
    ↓
📊 Vicky (Validation)
    ↓
🎯 Simon (Result interpretation & next hypothesis)
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
- [ ] Break down tasks (for dev team)
- [ ] Review handoff checklist

### Reference Documents
- PRD: [Notion link]
- Design: [Figma link]
```

---

## 📋→👨‍💻 Penny → Dev Team (Story)

If `$ARGUMENTS` is `to dev`:

```markdown
## 📋 Handoff: [Story Name]

### Background
- PRD: [link]
- Why needed: [one-line explanation]

### Requirements
#### Functional Requirements
- [ ] FR1: [content]
- [ ] FR2: [content]

#### Non-Functional Requirements
- [ ] NFR1: [performance/security etc.]

### Definition of Done
- [ ] Feature works correctly
- [ ] Error cases are handled
- [ ] Event logging works
- [ ] QA test passed

### Event Logging
| Event Name | Trigger | Parameters |
|------------|---------|------------|
| `event_name` | [action] | param1, param2 |

### Reference Materials
- Design: [Figma link]
- API Spec: [link]
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
- [ ] Confirm event logging is working
- [ ] Collect After data after measurement period
- [ ] Report hypothesis validation results

### Measurement Target Events
| Event Name | Description |
|------------|-------------|
| `event_1` | [description] |
| `event_2` | [description] |

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

## Handoff Checklist

### PRD → Sprint (Simon → Penny)
- [ ] Is the One Question clear?
- [ ] Is the hypothesis in IF/THEN/BECAUSE format?
- [ ] Is the OMTM quantified?
- [ ] Are Guard Rails set?

### Story → Development (Penny → Dev)
- [ ] Is the spec document complete?
- [ ] Is the design finalized?
- [ ] Is event logging defined?
- [ ] Is the Definition of Done (DoD) clear?

### Development → Validation (Penny → Vicky)
- [ ] Is deployment complete?
- [ ] Is event logging working?
- [ ] Is baseline data available?
- [ ] Is the measurement period set?

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
| Story writing complete | "Shall we hand off to 👨‍💻 the dev team?" |
| Development confirmed complete | "Shall we request validation from 📊 Vicky?" |
| Validation complete | "Shall we deliver results to 🎯 Simon?" |

---

*Connected agents*: 🎯 Simon, 📋 Penny, 📊 Vicky
*Related commands*: `/strategy`, `/plan`, `/validate`, `/party`
