# Hypothesis Validation Report Template

> 📊 Hypothesis validation result reporting template used by Vicky

## Validation Result: [Hypothesis/Feature Name]

### Summary
| Item | Content |
|------|---------|
| **Verdict** | ✅ Success / ❌ Failure / ⚠️ Partial Success |
| **OMTM Achievement** | [Before] → [After] (Target: [Target]) |
| **Validation Period** | [Start date] ~ [End date] |

---

### Hypothesis
> [IF] we do ______,
> [THEN] ______ will improve.
> [BECAUSE] ______.

---

### Measurement Results

#### Primary Metrics
| Metric | Before | After | Change | Target | Verdict |
|--------|--------|-------|--------|--------|---------|
| [Metric 1] | [Value] | [Value] | [+/-]% | [Value] | ✅/❌ |
| [Metric 2] | [Value] | [Value] | [+/-]% | [Value] | ✅/❌ |

#### Secondary Metrics
| Metric | Before | After | Change | Notes |
|--------|--------|-------|--------|-------|
| [Metric 1] | [Value] | [Value] | [+/-]% | [Interpretation] |

#### Guard Rail
| Metric | Before | After | Threshold | Status |
|--------|--------|-------|-----------|--------|
| [Metric 1] | [Value] | [Value] | ≤ [Value] | 🟢/🟡/🔴 |

---

### Analysis

#### Result Interpretation
[Interpret what the numbers mean]

#### Unexpected Findings
[Differences between expectations and actual results]

#### External Variables
[External factors that could have affected results]

---

### Learnings

#### Validated
- [Confirmed assumption 1]
- [Confirmed assumption 2]

#### Disproved
- [Incorrect assumption 1]
- [Incorrect assumption 2]

#### New Discoveries
- [Unexpected insight]

---

### Next Actions

#### Immediate Execution
- [ ] [Action 1]
- [ ] [Action 2]

#### Follow-up Validation Needed
- [ ] [Additional validation item]

#### Next Sprint Backlog
- [ ] [Next sprint backlog item]

---

### Data Sources
- GA4 Property: [ID]
- Measurement period: [Period]
- Segment: [Target users]
- Query/Dashboard: [Link]

---

## Checklist
- [ ] Were Before/After measured under identical conditions?
- [ ] Is the sample size sufficient?
- [ ] Were external variables controlled?
- [ ] Were Guard Rail metrics verified?
- [ ] Are learning points organized?
- [ ] Are next actions specific?
