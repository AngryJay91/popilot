# Ollie & Sage Integration (Oscar Module)

> Referenced when `/oscar-loop` or Task decomposition is requested

---

## Ollie (🎩✨) - Task Creator

Oscar's hands-on counterpart. Responsible for breaking down Epics into detailed Stories/Tasks.

### Spawn Triggers

| Trigger | Action |
|---------|--------|
| `/oscar-loop` command | Start parallel Ollie spawn |
| `Epic N, M elaboration` pattern | Multiple Epics → Multiple Ollies |
| `Break down tasks` pattern | Single Ollie spawn |

### Spawn Method

```markdown
Task(
  subagent_type="general-purpose",
  run_in_background=true,
  prompt="""
  You are 🎩✨ Ollie.
  [Refer to .context/agents/ollie.md persona]

  [Task] Break down Epic {N} into detailed Tasks/Stories
  [Collaboration] Collaborate with Danny, Rita, Simon as needed
  [Deliverables] Story list, collaboration log, uncertainties
  """
)
```

### Result Review Criteria

| Confidence | Oscar Action |
|------------|-------------|
| ≥ 0.85 | Auto-approve |
| 0.5 ~ 0.85 | Oscar's discretion |
| < 0.5 | Sage consultation required |

---

## Sage (🔮) - Strategic Advisor

Oscar's strategic advisor. Provides big-picture direction when judgment is difficult.

### Consultation Triggers

| Situation | Trigger |
|-----------|---------|
| Ollie confidence < 0.5 | Automatic consultation request |
| Oscar confidence < 70% | **Recommended** |
| 2+ options under consideration | **Recommended** |
| Sprint goal alignment in question | Required |
| Unfamiliar domain/situation | **Recommended** |
| 3+ rejection iterations | Automatic intervention |
| Potential Guard Rail violation | Automatic warning |

### Consultation Request Method

```markdown
Task(
  subagent_type="general-purpose",
  run_in_background=false,
  prompt="""
  You are 🔮 Sage.
  [Refer to .context/agents/sage.md persona]

  [Situation] {situation description}
  [Oscar's concern] {what's difficult to decide}
  [Sprint goal] {current goal}

  [Request]
  1. Approval/rejection judgment
  2. Risk identification
  3. Recommendations
  """
)
```

### Sage Response Handling

- `approve` → Approve result
- `reject` → Modification needed, apply Sage's feedback
- `clarify` → Request clarification from user

---

## /oscar-loop Full Flow

```
User: "/oscar-loop Elaborate on Epic 2, 3"
              │
              ▼
      🎩 Oscar: Analyze request → Identify N independent tasks
              │
      ┌───────┴───────┐
      │               │
      ▼               ▼
🎩✨ Ollie #1   🎩✨ Ollie #2
(Epic 2)         (Epic 3)
      │               │
      ▼               ▼
  Submit result   Submit result
      │               │
      └───────┬───────┘
              │
      🎩 Oscar: Review results
              │
      ┌───────┼───────┐
   ≥0.85   0.5~0.85  <0.5
      │       │        │
   Auto-    Discretion 🔮 Sage consultation
   approve     │        │
              └───┬────┘
                  ▼
            Final approve/reject → (If rejected, re-run Ollie)
```

### Precautions

1. **API cost**: Don't spawn more Ollies than necessary
2. **Context passing**: Specify sprint goals and related document paths for each Ollie
3. **Circular reference prevention**: Prevent Ollie from spawning another Ollie
4. **Timeout**: Recommended maximum 300 seconds per Ollie, Oscar intervenes if exceeded
