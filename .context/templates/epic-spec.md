# Epic Spec Template

> Detailed epic specification written by the PO
> This document must be finalized before Story creation

---

## [Epic ID]: [Epic Name]

### Meta

| Item | Value |
|------|-------|
| **Epic ID** | E-XX |
| **Sprint** | SXX |
| **Status** | `draft` / `review` / `approved` |
| **PO Approval Date** | YYYY-MM-DD |
| **Assigned Developer** | - |

---

## 1. WHY: Why is this feature needed?

### Problem Definition

[What problem are we trying to solve? Describe the specific situation]

```
[Example]
Currently, users cannot determine "whether this is good or bad" even after viewing dashboard metrics.
They cannot tell what their key metrics look like relative to their goals, preventing them from making appropriate decisions.
```

### Supporting Data

| Metric | Value | Source |
|--------|-------|--------|
| [Problem severity metric] | [Value] | [GA4/DB/VOC] |

```
[Example]
| Metric | Value | Source |
|--------|-------|--------|
| No action after entering detail page | 64% | GA4 |
| "Don't understand what the metrics mean" VOC | 12/month | Channel.io |
```

### Expected Outcome

[What changes are expected when this feature is deployed?]

---

## 2. WHAT: Detailed Requirements

### Core Features

| # | Feature | Description | Required |
|---|---------|-------------|----------|
| 1 | [Feature name] | [Description] | Required/Optional |
| 2 | [Feature name] | [Description] | Required/Optional |

### Business Logic

#### [Logic 1: Name]

```
[Detailed formulas/rules/conditions]

Example:
Conversion rate = (Conversions / Visits) × 100
Goal achievement rate = (Current value / Target value) × 100

Conditions:
- If no target value → Show "Set a goal for more accuracy" guidance
- If achievement rate is below threshold → Show "Warning", red color
```

#### [Logic 2: Name]

```
[Detailed formulas/rules/conditions]
```

### User Scenarios

```
[Concrete usage flow]

1. User enters the dashboard page
2. Sees "75% of goal achieved" displayed next to 15% conversion rate on the "Item A" card
3. User understands "I have 25% left to reach my goal"
4. ...
```

---

## 3. HOW: Flow & Screens

### User Flow

```
[Start] → [Step 1] → [Step 2] → [Branch] → [Complete]
                              ↓
                           [Exception]
```

### Wireframe

```
[ASCII or Figma link]

┌────────────────────────────────────────┐
│ Item A                      🟢 Good    │
├────────────────────────────────────────┤
│                                        │
│ Conversion Rate 15%                    │
│ ───────────────────────                │
│ 📊 75% of goal achieved               │
│                                        │
│ [View Details →]                       │
└────────────────────────────────────────┘
```

### Design Requirements

| Item | Content |
|------|---------|
| Tone & Manner | [e.g., Friendly and easy expressions] |
| Colors | [e.g., Positive=green, Negative=red] |
| Reference Design | [Link] |

---

## 4. EDGE: Exceptions & Edge Cases

### Data Exceptions

| Situation | Handling Method |
|-----------|----------------|
| Required input missing | [How to handle?] |
| Data value is 0 | [How to handle?] |
| No data available | [How to handle?] |

### User Exceptions

| Situation | Handling Method |
|-----------|----------------|
| [Exception scenario] | [Handling method] |

### System Exceptions

| Situation | Handling Method |
|-----------|----------------|
| API failure | [How to handle?] |
| Timeout | [How to handle?] |

---

## 5. Success Metrics

### Success Criteria for This Epic

| Metric | Before | Target | Measurement Method |
|--------|--------|--------|-------------------|
| [Metric 1] | [Current value] | [Target value] | [Method] |
| [Metric 2] | [Current value] | [Target value] | [Method] |

### GA4 Event Definitions

| Event Name | Trigger | Parameters |
|------------|---------|------------|
| [event_name] | [When] | [What] |

---

## 6. Dependencies & Constraints

### Technical Dependencies

| Dependency | Status | Notes |
|-----------|--------|-------|
| [API/Data/Feature] | Confirmed/Unconfirmed | [Description] |

### Constraints

- [Constraint 1: e.g., Maintain existing UI layout]
- [Constraint 2: e.g., No mobile support]

---

## 7. Story List (Planned)

> To be broken down by 📋 Penny after Epic Spec is finalized

| Story ID | Title | Size | Status |
|----------|-------|------|--------|
| E-XX-S-01 | [Title] | S/M/L | draft |
| E-XX-S-02 | [Title] | S/M/L | draft |

---

## Checklist

### Pre-PO Approval Check

- [ ] Is the problem definition clear?
- [ ] Is the business logic specific? (formulas, conditions, etc.)
- [ ] Is there a wireframe/flow?
- [ ] Are edge cases defined?
- [ ] Are success metrics measurable?
- [ ] Are technical dependencies confirmed?

### Approval

| Item | Confirmation |
|------|-------------|
| PO Approval | ☐ |
| Approval Date | YYYY-MM-DD |
| Notes | - |

---

*Created: YYYY-MM-DD*
*Last Modified: YYYY-MM-DD*
