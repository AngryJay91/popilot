# /oscar-loop - Autonomous Parallel Execution Slash Command

## Overview

A command where Oscar spawns Ollies in parallel to perform tasks,
then reviews/approves the results in an autonomous loop.

ARGUMENTS: $ARGUMENTS

---

## Usage

```
/oscar-loop <request>
```

### Examples
```
/oscar-loop Enhance Sprint Epic 2, 3, 10
/oscar-loop Analyze churn and create response plan as Tasks
/oscar-loop Organize the next Sprint backlog
```

---

## Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     /oscar-loop Execution                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Phase 1: Request Analysis]                                │
│  Oscar parses the request and identifies work units         │
│  → Identify N independent tasks                            │
│                                                             │
│  [Phase 2: Parallel Ollie Spawning]                         │
│  Spawn 1 Ollie per task (background)                       │
│  → Task tool × N (parallel)                                │
│                                                             │
│  [Phase 3: Result Collection]                               │
│  Wait for all Ollies to complete                           │
│  → Collect via TaskOutput                                  │
│                                                             │
│  [Phase 4: Oscar Review]                                    │
│  Individually review each Ollie result                     │
│  ├─ Clear → Direct approval                                │
│  └─ Ambiguous → Consult Sage then decide                   │
│                                                             │
│  [Phase 5: Rework Loop]                                     │
│  Rejected items are re-executed by the respective Ollie    │
│  → Return to Phase 4 (until approved)                      │
│                                                             │
│  [Phase 6: Final Report]                                    │
│  Comprehensive report when all results are approved        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### Phase 1: Request Analysis

```markdown
## Oscar Request Parsing

[Input]
User request: "Enhance Sprint Epic 2, 3, 10"

[Analysis]
1. Keyword extraction: "Epic", "enhance"
2. Target identification: Epic 2, Epic 3, Epic 10
3. Work type: Task enhancement (write detailed Stories)
4. Parallelizable: ✅ Each Epic is independent

[Output]
Task list:
- Task 1: Enhance Epic 2
- Task 2: Enhance Epic 3
- Task 3: Enhance Epic 10

Parallel execution: Possible (3 simultaneous)
```

### Phase 2: Parallel Ollie Spawning

```markdown
## Ollie Spawning

Invoke Task tool for each task:

### Ollie #1 (Epic 2)
Task(
  subagent_type="general-purpose",
  run_in_background=true,
  prompt="""
  You are 🎩✨ Ollie.

  [Persona]
  See .context/agents/ollie.md

  [Task]
  Break down Epic 2 into detailed Tasks/Stories.

  [Collaborators]
  - 📈 Danny: Request related data
  - 🎤 Rita: Request VOC/customer insights
  - 🎯 Simon: Confirm strategic direction

  [Deliverables]
  - Story list (title, description, success criteria, estimated effort)
  - Expert collaboration log
  - Uncertain/needs-confirmation items

  [Format]
  Return results in JSON format
  """
)

### Ollie #2 (Epic 3) - Simultaneous execution
Task(...)

### Ollie #3 (Epic 10) - Simultaneous execution
Task(...)
```

### Phase 3: Result Collection

```markdown
## Result Collection

[Wait]
Wait for all 3 Ollies to complete
(or set timeout)

[Collection]
results = []
for task_id in ollie_task_ids:
    result = TaskOutput(task_id=task_id)
    results.append({
        "task_id": task_id,
        "epic": epic_name,
        "output": result,
        "status": "pending_review"
    })

[Output]
├─ Ollie #1 complete: Epic 2 results (5 stories)
├─ Ollie #2 complete: Epic 3 results (3 stories)
└─ Ollie #3 complete: Epic 10 results (4 stories)
```

### Phase 4: Oscar Review

```markdown
## Oscar Review Process

for each result in results:

    [Quality Check]
    - Do all Stories have success criteria?
    - Are estimated efforts realistic?
    - Was expert collaboration sufficient?
    - Are uncertain items resolvable?

    [Confidence Assessment]
    confidence = result.confidence  # Provided by Ollie

    if confidence >= 0.8 and quality_check_passed:
        # Direct approval
        result.status = "approved"

    elif confidence < 0.5 or critical_issue_found:
        # Sage consultation required
        advice = consult_sage(result)
        decision = oscar_decide_with_advice(result, advice)

    else:
        # Oscar discretionary judgment
        if revision_needed:
            result.status = "revision_needed"
            result.feedback = "Story 3 success criteria need more detail"
        else:
            result.status = "approved"
```

### Sage Consultation Process

```markdown
## Sage Consultation

[Trigger Conditions]
1. Ollie confidence < 0.5
2. Oscar lacks certainty
3. Strategic alignment questionable
4. Rejected 3+ times

[Consultation Request]
Task(
  subagent_type="general-purpose",
  run_in_background=false,  # Synchronous execution (wait for response)
  prompt="""
  You are 🔮 Sage.

  [Persona]
  See .context/agents/sage.md

  [Situation]
  Oscar is having difficulty reviewing Ollie results.

  [Ollie Results]
  {result}

  [Oscar's Concern]
  {concern}

  [Sprint Goal]
  {sprint_goal}

  [Request]
  1. Judge whether these results should be approved
  2. Identify any risks
  3. Provide recommendations
  """
)
```

### Phase 5: Rework Loop

```markdown
## Rework Process

[Handle Rejected Items]
for result in results:
    if result.status == "revision_needed":

        # Re-execute Ollie (with feedback)
        revised = Task(
            subagent_type="general-purpose",
            prompt=f"""
            You are 🎩✨ Ollie.

            Oscar has requested revisions.

            [Previous Submission]
            {result.output}

            [Feedback]
            {result.feedback}

            [Request]
            Please submit revised results incorporating the feedback.
            """
        )

        result.output = revised
        result.status = "pending_review"

[Loop Condition]
- Repeat until all result.status == "approved"
- Max retries: 3 (if exceeded, Oscar judgment or user escalation)
```

### Phase 6: Final Report

```markdown
## Final Report

🎩 Oscar: /oscar-loop Complete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Summary
- Epics processed: 3
- Stories generated: 12
- Total estimated effort: 28 SP

## Detailed Results

### Epic 2: User Onboarding Improvement
| Story | Title | Effort | Status |
|-------|-------|--------|--------|
| S2-1 | Simplify account linking | 5 SP | ✅ |
| S2-2 | Auto-save feature | 3 SP | ✅ |
| S2-3 | Progress UI | 2 SP | ✅ |

### Epic 3: Surface Layer MVP
| Story | Title | Effort | Status |
|-------|-------|--------|--------|
| S3-1 | Diagnosis result display | 8 SP | ✅ |
| S3-2 | Recommended action suggestions | 5 SP | ✅ |
| S3-3 | Notification integration | 5 SP | ✅ |

### Epic 10: Churn Prevention
| Story | Title | Effort | Status |
|-------|-------|--------|--------|
| S10-1 | Churn prediction model | 3 SP | ✅ |
| ... | ... | ... | ... |

## Processing Log
- Ollie #1: 1 submission → approved
- Ollie #2: 2 submissions (1 revision) → approved
- Ollie #3: 1 submission → approved
- Sage consultation: 1 (Epic 3 related)

## Next Steps
1. Story handoff to dev team
2. Finalize at Sprint planning meeting

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Configuration Options

```yaml
# oscar-loop settings

parallel:
  max_ollies: 5           # Max simultaneous Ollies
  timeout_per_ollie: 300  # Timeout per Ollie (seconds)

review:
  auto_approve_threshold: 0.85  # Auto-approve confidence threshold
  sage_consult_threshold: 0.5   # Sage consultation required threshold
  max_revisions: 3              # Max rework count

output:
  format: "markdown"      # Output format
  save_to_file: true      # Save results to file
  file_path: ".context/sessions/oscar-loop-{timestamp}.md"
```

---

## Error Handling

### Ollie Timeout
```
Ollie #2 timed out (exceeded 300 seconds)

[Handling]
1. Cancel that Ollie
2. Report to Oscar
3. Present options:
   A) Retry
   B) Skip that Epic
   C) Request user judgment
```

### Ollie Failure
```
Ollie #3 error occurred

[Handling]
1. Collect error logs
2. Auto-retry once
3. On repeat failure, escalate to Oscar
4. Oscar handles directly or notifies user
```

### Sage Consultation Unavailable
```
No Sage response

[Handling]
1. Oscar proceeds with own judgment
2. Explicitly record judgment rationale
3. Mark "Judged without Sage consultation" in final report
```

---

## State Management

```markdown
## Loop State (Using TodoWrite)

[Real-time State Tracking]
- [ ] Phase 1: Request analysis
- [ ] Phase 2: Ollie spawning
  - [ ] Ollie #1 (Epic 2)
  - [ ] Ollie #2 (Epic 3)
  - [ ] Ollie #3 (Epic 10)
- [ ] Phase 3: Result collection
- [ ] Phase 4: Oscar review
  - [ ] Epic 2 review
  - [ ] Epic 3 review
  - [ ] Epic 10 review
- [ ] Phase 5: Rework (if needed)
- [ ] Phase 6: Final report
```

---

## Trigger Keywords

| Keyword | Action |
|---------|--------|
| `enhance`, `detail`, `break down` | Task breakdown mode |
| `Epic N, M, K` | Multiple Epic parallel processing |
| `Sprint backlog` | Full backlog organization mode |
| `analyze and plan` | Analysis + Task creation pipeline |

---

## Limitations

```
[What /oscar-loop does NOT do]
- Actual development/coding work
- Direct database manipulation
- External system deployment
- Apply changes without user consent

[What /oscar-loop DOES do]
- Draft Tasks/Stories
- Coordinate expert collaboration
- Quality review and approval
- Document generation and organization
```

---

## Related Files

- `.context/agents/orchestrator.md` - Oscar(PO) persona
- `.context/agents/ollie.md` - Ollie persona
- `.context/agents/sage.md` - Sage persona
- `.context/agents/analyst.md` - Danny persona
- `.context/agents/researcher.md` - Rita persona
- `.context/agents/strategist.md` - Simon persona
