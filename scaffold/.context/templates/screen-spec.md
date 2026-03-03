# {Epic Name} Screen Specification

> **Note**: Level 2/3 detailed UI specs can be replaced with spec-site Vue components ({Feature}Mockup.vue).
> Using interactive mockups instead of static ASCII art allows real-time demonstration of state-based branching.
>
> spec-site page structure:
> - `{feature}Data.ts` — Scenario + spec area definitions
> - `{Feature}Mockup.vue` — Interactive mockup
> - `{Feature}SpecPanel.vue` — Spec document panel

> 📋 Detailed screen specification at service planner level, written by Penny
> Written after Epic Spec → Story breakdown, before handoff

---

## Meta

| Item | Value |
|------|-------|
| **Epic ID** | E-XX |
| **Document Type** | Screen Specification |
| **Created Date** | YYYY-MM-DD |
| **Version** | v1.0 |
| **Status** | `draft` / `review` / `approved` |
| **Related Document** | [E-XX Epic Spec](../epic-specs/E-XX-xxx.md) |

> Version management: Update version on major changes + record in changelog section

---

## Table of Contents

1. [Level 1. Overall IA & Entry Points](#level-1-overall-ia--entry-points)
2. [Level 2. Main Screen](#level-2-main-screen)
3. [Level 3. Component Details](#level-3-component-details)
4. [Level 4. Modals & Dialogs](#level-4-modals--dialogs)
5. [Level 5. External Integration](#level-5-external-integration)
6. [Level 6. State-based UI](#level-6-state-based-ui)
7. [Level 7. Policy Summary](#level-7-policy-summary)

---

## Level 1. Overall IA & Entry Points

> Define where this feature sits within the overall service structure

### 1.1 Information Architecture (IA)

```
[Top Menu] (GNB/LNB)
├── [Existing Menu 1]
│   └── (existing structure)
│
├── [Existing Menu 2]
│   └── (existing structure)
│
└── [New/Changed Feature] ← Scope of this screen spec
    ├── [Sub-element 1]
    │   ├── [Detail a]
    │   └── [Detail b]
    └── [Sub-element 2]
```

### 1.2 Entry Point Flows

| Entry Point | Location | User Action | System Response | Notes |
|-------------|----------|-------------|-----------------|-------|
| **A** | [Location detail] | [Click/tap, etc.] | [Navigate/modal open, etc.] | [Priority/frequency] |
| **B** | [Location detail] | [Click/tap, etc.] | [Navigate/modal open, etc.] | |
| **C** | [Location detail] | [Click/tap, etc.] | [Navigate/modal open, etc.] | |

### 1.3 Menu Position Policy

| Item | Policy | Rationale |
|------|--------|-----------|
| **Menu Position** | [GNB/LNB/Tab, etc.] | [User accessibility, information architecture, etc.] |
| **Menu Name** | "[Menu name]" | [Naming convention, user language, etc.] |
| **Icon** | [Icon name/emoji] | [Visual association, consistency, etc.] |
| **Access Permission** | [All/Paid/Admin, etc.] | [Business policy] |
| **Display Condition** | [Always/Conditional] | [Details if conditional] |

### 1.4 URL Design (For web)

| Screen | URL Pattern | Query Parameters |
|--------|------------|-----------------|
| Main | `/[path]` | - |
| Detail | `/[path]/:id` | - |
| With filter | `/[path]` | `?filter=xxx&sort=xxx` |

---

## Level 2. Main Screen

> Overall layout of the main screen and details for each area

### 2.1 Overall Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [Header / GNB Area]                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 2.2 Page Header                             [Action Btn]  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 2.3 Filter/Sort Area                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  2.4 Content Area                                         │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ [Item 1]                                            │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ [Item 2]                                            │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │                       2.5 Pagination                      │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Page Header

```
┌─────────────────────────────────────────────────────────────────┐
│ [Icon] Page Title                           [Button1] [Button2]  │
│ Subtitle or description text (optional)                          │
└─────────────────────────────────────────────────────────────────┘
```

| Element | Spec | Policy |
|---------|------|--------|
| Icon | [Icon name] | [Display condition] |
| Title | "[Text]" | Fixed / Dynamic |
| Subtitle | "[Text]" | [Display condition] |
| Action Button 1 | "[Button name]" - Primary | [Click action] |
| Action Button 2 | "[Button name]" - Secondary | [Click action] |

### 2.3 Filter/Sort Area

> Write if filters exist, otherwise note "Not applicable"

```
┌─────────────────────────────────────────────────────────────────┐
│ [Tab1] [Tab2] [Tab3]    [Dropdown ▼]  [Search 🔍]    Total N    │
└─────────────────────────────────────────────────────────────────┘
```

#### 2.3.1 Tab/Filter Structure

| Filter | Type | Behavior | Default |
|--------|------|----------|---------|
| [Filter1] | Tab | [Behavior detail] | ✅ Default selected |
| [Filter2] | Dropdown | [Behavior detail] | [Default value] |
| [Search] | Text input | [Search target, method] | - |

#### 2.3.2 Dropdown Options (If applicable)

```
┌─────────────────────────┐
│ [Dropdown name] ▼       │
├─────────────────────────┤
│ ○ Option 1 (default)    │
│ ● Option 2              │
│ ○ Option 3              │
└─────────────────────────┘
```

| Option | Behavior | Sort/Filter Criteria |
|--------|----------|---------------------|
| Option 1 | [Behavior] | [Criteria] |
| Option 2 | [Behavior] | [Criteria] |

#### 2.3.3 Count Display

| State | Display Format |
|-------|---------------|
| Total | "Total {N}" |
| Filter applied | "[Filter name] {N}" |
| 0 items | "[Empty state message]" (hide count) |

### 2.4 Content Area

> Details defined in Level 3

| Policy | Content |
|--------|---------|
| Sort order | [Sort criteria] (ASC/DESC) |
| Grouping | [Grouping criteria] / None |
| Item spacing | [N]px |

### 2.5 Pagination

| Policy | Content |
|--------|---------|
| Method | **Infinite scroll** / [Load more] button / Page numbers |
| Initial load | [N] items |
| Additional load | [N] items at a time |
| Load trigger | [Trigger condition: bottom Npx reached, etc.] |
| End reached | "[Message]" |

### 2.6 Main Screen Policy Summary

| Item | Policy |
|------|--------|
| Sort order | [Criteria] |
| Sort on edit | [Maintain position / Re-sort] |
| New item added | [Top / Sorted position] |
| On deletion | [Immediate removal / Animation] |
| Real-time update | Yes / No (reflected on refresh) |
| Caching | [Caching policy: TTL, etc.] |
| URL state | [Query parameter persistence] |
| Back navigation | [State restoration] |

---

## Level 3. Component Details

> Detailed definition of key components displayed on the main screen

### 3.1 Component Type Classification

```
[Component Name]
├── Type A: [Type description]
│   ├── State 1: [State description]
│   ├── State 2: [State description]
│   └── State 3: [State description]
│
└── Type B: [Type description]
    ├── State 1: [State description]
    └── State 2: [State description]
```

### 3.2 Common Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ [3.3 Header Area]                                [Time] [···]    │
│                                                                 │
│ [3.4 Body Area]                                                 │
│                                                                 │
│ [3.5 Supplementary Info Area - Optional]                        │
│                                                                 │
│ [3.6 Action Area - Optional]                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Header Area

```
[Icon/Badge] [Title Text]                         [Time] [More]
```

| Element | Spec | Policy |
|---------|------|--------|
| Icon/Badge | [Icon name] | [Per-type branching] |
| Title | [Text format] | Max [N] chars, truncate with (...) if exceeded |
| Time | [Format] | Today/Yesterday/Date branching (see Level 7) |
| More [···] | Dropdown menu | [Menu items] |

#### More Menu

```
┌─────────────────┐
│ [Icon] Menu 1    │
│ [Icon] Menu 2    │
│ ─────────────── │
│ [Icon] Delete    │  ← Dangerous actions separated
└─────────────────┘
```

| Menu | Action | Condition |
|------|--------|-----------|
| Menu 1 | [Action] | [Display condition] |
| Menu 2 | [Action] | [Display condition] |
| Delete | Delete confirmation dialog | [Display condition] |

### 3.4 Body Area (Per Type)

#### Type A: [Type Name]

```
┌─────────────────────────────────────────────────────────────────┐
│ [Type A body layout]                                            │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  [Sub-element 1]                                        │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

| Element | Spec | Policy |
|---------|------|--------|
| [Element name] | [Value/format] | [Rule] |

#### Type B: [Type Name]

```
┌─────────────────────────────────────────────────────────────────┐
│ [Type B body layout]                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 3.5 Supplementary Info Area

> Optional area, specify display conditions

| Element | Display Condition | Spec |
|---------|------------------|------|
| [Element name] | [Condition] | [Spec] |

### 3.6 Action Area

> Interaction elements within the component

| Action | Trigger | Result |
|--------|---------|--------|
| [Action name] | [Click/hover, etc.] | [Behavior] |

### 3.7 State Variants

#### State 1: [State Name]

```
┌─────────────────────────────────────────────────────────────────┐
│ [State 1 layout]                                                │
└─────────────────────────────────────────────────────────────────┘
```

| Condition | [State entry condition] |
|-----------|------------------------|

| Element | Spec |
|---------|------|
| [Element] | [Spec for this state] |

#### State 2: [State Name]

```
┌─────────────────────────────────────────────────────────────────┐
│ [State 2 layout]                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 3.8 Component Style Policy

| Item | Value |
|------|-------|
| Card spacing | [N]px |
| Card background | [Color code] |
| Card border | [Spec: Npx solid #color] |
| Card radius | [N]px |
| Card padding | [N]px |
| Hover effect | [Effect description] |
| Click area | [Entire / Specific element] |

---

## Level 4. Modals & Dialogs

> Define all modals/dialogs used on the screen

### 4.1 Modal Types

| Modal | Trigger | Purpose | Type |
|-------|---------|---------|------|
| [Modal 1] | [Where it opens from] | [Purpose] | Form / Confirm / Info |
| [Modal 2] | [Where it opens from] | [Purpose] | Form / Confirm / Info |

### 4.2 [Modal 1] Details

#### 4.2.1 Overall Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                           [✕]   │
│  [Modal Title]                                                  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [Section 1 Label]                                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [Input field / Selection UI / Info display]                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [Section 2 Label] (Optional)                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ [Input field]                                               ││
│  └─────────────────────────────────────────────────────────────┘│
│  0/[max characters]                                             │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ☐ [Checkbox option]                                            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│                                     [Cancel]  [Confirm]         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 Section Details

| Section | Element | Type | Spec | Required |
|---------|---------|------|------|----------|
| Header | Title | Text | "[Title]" | - |
| Header | Close | Button | [✕] | - |
| [Section1] | [Field name] | [input/select/textarea, etc.] | [placeholder, default] | ✅/❌ |
| [Section2] | [Field name] | [Type] | [Spec] | ✅/❌ |
| Option | [Checkbox name] | checkbox | Default: [checked/unchecked] | - |

#### 4.2.3 Validation

| Field | Rule | Error Message |
|-------|------|---------------|
| [Field name] | Required | "Please enter [field name]" |
| [Field name] | Numbers only | "Please enter numbers only" |
| [Field name] | Range [N~M] | "Please enter a value between [N] and [M]" |
| [Field name] | Max [N] chars | (Input restriction enforced) |

#### 4.2.4 Post-save Behavior

| Step | Action |
|------|--------|
| 1 | API call ([METHOD] /[endpoint]) |
| 2 | Show loading spinner |
| 3 | On success: Close modal |
| 4 | On success: Toast "[Message]" |
| 5 | On success: [Follow-up action: refresh list, etc.] |
| 6 | On failure: Error toast + keep modal open |

### 4.3 Delete Confirmation Dialog

> For confirming dangerous actions like delete/cancel

```
┌─────────────────────────────────────────────┐
│ [Icon] [Confirmation question]              │
│                                             │
│ [Additional description - optional]         │
│                                             │
│               [Cancel]  [Delete/Confirm]    │
└─────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| Icon | [Warning/info icon] |
| Question | "[Question text]" |
| Description | "[Description text]" |
| Cancel button | Secondary |
| Confirm button | Danger / Primary |

### 4.4 Common Modal Policies

#### 4.4.1 Behavior Policy

| Item | Policy |
|------|--------|
| Overlay | Semi-transparent black (rgba(0,0,0,0.5)) |
| Overlay click | Close modal / Keep open |
| ESC key | Close modal / Ignore |
| Scroll | Scroll within modal only, body fixed |
| Focus | First input field on modal open |
| Focus trap | Tab movement within modal only |

#### 4.4.2 Size Policy

| Device | Width | Height |
|--------|-------|--------|
| Desktop | [N]px | auto (max [N]vh) |
| Tablet | [N]px | auto |
| Mobile | 100% - [N]px | auto (max [N]vh) |

#### 4.4.3 Saving State

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         [Loading spinner]                       │
│                         Saving...                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| State | Behavior |
|-------|----------|
| Save clicked | Disable button + spinner |
| Input fields | All disabled |
| Close | Not allowed |

### 4.5 Toast Message Summary

| Situation | Message | Type |
|-----------|---------|------|
| [Situation1] | "[Message]" | success |
| [Situation2] | "[Message]" | info |
| [Situation3] | "[Message]" | error |

---

## Level 5. External Integration

> Define connections with existing screens/components

### 5.1 Integration Overview

| Integration Target | Integration Method | Description |
|-------------------|-------------------|-------------|
| [Screen/Component name] | [Button/Link/Auto] | [Integration content] |

### 5.2 [Integration Target 1] Details

#### 5.2.1 Integration Location

```
┌─────────────────────────────────────────────────────────────────┐
│ [Existing screen/component]                                     │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Integration point display]                                 │ │
│ │                                                             │ │
│ │ [Button/Link] ← Connects to this feature from here         │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2.2 Integration Behavior

| Trigger | Action | Data Passed |
|---------|--------|-------------|
| [Trigger] | [Result] | [Data passed] |

#### 5.2.3 Data Integration

| Data | Direction | Purpose |
|------|-----------|---------|
| [Data name] | [From] → [To] | [Purpose] |

---

## Level 6. State-based UI

> Define special states like loading, empty, error

### 6.1 Loading State

#### 6.1.1 Initial Loading

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │
│  │ ░░░░░░░░░░░░░░░░░░░                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  │
│  │ ░░░░░░░░░░░░░░░░░░░                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Situation | UI Type | Description |
|-----------|---------|-------------|
| Initial loading | Skeleton / Spinner | [Count, shape] |
| Additional loading | [Method] | [Position] |

#### 6.1.2 Partial Loading

| Area | Loading UI |
|------|-----------|
| [Area name] | [Skeleton/Spinner/Inline] |

### 6.2 Empty State

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    [Illustration/Icon]                           │
│                                                                 │
│                    [Main message]                                │
│                    [Sub message - optional]                      │
│                                                                 │
│                    [CTA button - optional]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Situation | Icon | Message | CTA |
|-----------|------|---------|-----|
| [Situation1] | [Icon] | "[Message]" | [Button name] / None |
| [Situation2] | [Icon] | "[Message]" | [Button name] / None |

### 6.3 Error State

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    [Error icon]                                  │
│                                                                 │
│                    [Error message]                               │
│                                                                 │
│                    [Retry button]                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

| Error Type | Message | Action |
|-----------|---------|--------|
| Network error | "[Message]" | [Retry button] |
| Server error | "[Message]" | [Notice] |
| No permission | "[Message]" | [Notice/button] |
| No data | "[Message]" | [Notice] |

### 6.4 Permission/Access Restriction State

| Condition | UI | Message |
|-----------|-----|---------|
| [Condition1] | [Full block / Partial block] | "[Message]" |
| [Condition2] | [UI type] | "[Message]" |

---

## Level 7. Policy Summary

> Organize policies applied across the entire screen by category

### 7.1 UI Policy

| Item | Policy | Notes |
|------|--------|-------|
| Responsive | [Support range: Desktop/Tablet/Mobile] | [breakpoint] |
| Dark mode | Supported / Not supported | |
| Accessibility | [Considerations] | |

### 7.2 Time Display Policy

| Condition | Format | Example |
|-----------|--------|---------|
| Today | "HH:MM" / "AM/PM H:MM" | "10:30 AM" |
| Yesterday | "Yesterday HH:MM" | "Yesterday 14:20" |
| This year (within 7 days) | "N days ago" | "3 days ago" |
| This year (after 7 days) | "M/D" | "1/27" |
| Before this year | "YYYY/M/D" | "2025/12/15" |

### 7.3 Text Policy

| Item | Policy |
|------|--------|
| Truncation | "..." after [N] characters |
| Line breaks | [Allowed/Not allowed, max lines] |
| Empty value | "[Replacement text]" or "-" |

### 7.4 Interaction Policy

| Item | Policy |
|------|--------|
| Button double-click | [Prevention enabled/disabled] |
| Form resubmission | [Prevention enabled/disabled] |
| External links | New tab / Current tab |

### 7.5 Data Policy

| Item | Policy |
|------|--------|
| Caching | [Strategy: TTL, invalidation conditions] |
| Real-time updates | [Support status, method] |
| Offline | [Support status, behavior] |

### 7.6 Business Policy

| Item | Policy | Rationale |
|------|--------|-----------|
| [Policy1] | [Content] | [Reason] |
| [Policy2] | [Content] | [Reason] |

---

## Checklist

### Screen Spec Completeness

- [ ] Level 1: Are IA and entry points clear?
- [ ] Level 2: Is the main screen layout expressed in ASCII?
- [ ] Level 3: Are all state variants defined for components?
- [ ] Level 4: Are modal validation and save behavior defined?
- [ ] Level 5: Are external screen integrations defined? (if applicable)
- [ ] Level 6: Are loading/empty/error states defined?
- [ ] Level 7: Are all policies organized in tables?

### Quality Check

- [ ] Are specs (size, color, behavior) specified for all elements?
- [ ] Are ASCII diagrams sufficiently detailed?
- [ ] Is this at a level where developers can implement immediately?
- [ ] Is the Epic Spec business logic reflected?
- [ ] Are edge case UIs defined?

---

**Created**: YYYY-MM-DD
**Last Modified**: YYYY-MM-DD
**Author**: 📋 Penny
