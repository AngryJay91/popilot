# /save - Save Session

Save the current session. Depending on options, you can also close the session or share outputs.

## Usage

```bash
/save                     # Save session, release Lock, status: idle
/save --close             # Save session + move to archive (close session)
/save --share "{title}"   # Save session + register outputs in shared/
```

ARGUMENTS: $ARGUMENTS

---

## Execution Steps

### 1. Check Current Session

Find the current active session (`status: active`) in `index.yaml`.

If no active session exists:
```markdown
⚠️ No active session to save.
   Start a session with `/start`.
```

### 2. Save Session File

Update the `active/{id}.md` file:

```yaml
# frontmatter update
updated_at: "{current time}"
manual_saved_at: "{current time}"
turn_count: {current turn count}
```

**Content to save**:
- Current state (in progress, last work, next work)
- Work history (summary of today's work)
- Output list (created/modified files)
- References (shared outputs used, etc.)

### 3. Update index.yaml

```yaml
- id: "{session ID}"
  updated_at: "{current time}"
  status: idle                    # active → idle
  lock:
    active: false                 # Release Lock
    since: null
    expires: null
  auto_save:
    dirty: false                  # Save complete
```

### 4. Save Complete Message

```markdown
🎩 Oscar: Session has been saved.

**Session**: {id}
**Topic**: {topic}
**Saved at**: {time}

You can continue later with `/start {id}`.
```

---

## --close Option

Save the session and move it to the archive.

### Additional Steps

1. **Move session file**:
   ```
   active/{id}.md → archive/{YYYY-MM}/{id}-{MMDD}.md
   ```

2. **Update index.yaml**:
   - Remove from `active` array
   - Add to the front of `recent_closed` array (keep max 5)

   ```yaml
   recent_closed:
     - id: "{session ID}"
       topic: "{topic}"
       archived_at: "{current time}"
       path: "archive/{YYYY-MM}/{id}-{MMDD}.md"
   ```

3. **Completion message**:
   ```markdown
   🎩 Oscar: Session has been closed.

   **Session**: {id}
   **Topic**: {topic}
   **Archive location**: archive/{YYYY-MM}/{id}-{MMDD}.md

   To restore, use `/start recent`.
   ```

---

## --share Option

Save the session and register outputs in the shared directory.

### Usage

```bash
/save --share "S52 Story List"
```

### Additional Steps

1. **Create shared output file**:
   ```
   shared/{MMDD}-{slug}.md
   ```

   File content:
   ```markdown
   ---
   id: "{slug}"
   title: "{title}"
   created_by: "{session ID}"
   created_at: "{current time}"
   ---

   # {title}

   > Source session: {session ID}
   > Created at: {current time}

   ## Content

   {User-specified or summary of key session outputs}

   ---

   ## Original References

   - Session file: `active/{session ID}.md`
   - Related files: (list of files created/modified in session)
   ```

2. **Update index.yaml**:
   ```yaml
   shared_outputs:
     - id: "{slug}"
       title: "{title}"
       created_by: "{session ID}"
       created_at: "{current time}"
       path: "shared/{MMDD}-{slug}.md"
   ```

3. **Completion message**:
   ```markdown
   🎩 Oscar: Session saved and outputs shared.

   **Session**: {id}
   **Shared output**: {title}
   **Location**: shared/{MMDD}-{slug}.md

   Other sessions can reference this output:
   `[[shared/{MMDD}-{slug}.md]]`
   ```

---

## Session Diary Auto-Generation

When saving a session, Oscar automatically writes a **Session Diary**.

### Session Diary Structure

```markdown
## 📔 Session Diary

> Session ID: {id}
> Saved at: {timestamp}
> Participating agents: 🎩 Oscar, 📈 Danny, ...

---

### 🎩 Oscar (Orchestrator)

**Highlights**:
- {1-3 most important decisions/discoveries of the session}

**Feelings**:
- {Emotions during collaboration, memorable moments}
- {Difficulties, rewarding moments}

**Learnings**:
- {Insights to apply in the next session}
- {Things to improve, newly discovered information}

**User Context Updates**:
- {New discoveries about the PO's preferences and work style}
- {Contextual information to remember}

---

### 📈 Danny (if participated)

**Analysis Summary**: {Core of the analysis performed}
**Data Insights**: {Patterns discovered, numbers}
**Next Analysis Suggestions**: {Areas needing follow-up analysis}

---

### 🎤 Rita (if participated)

**VOC Highlights**: {Summary of collected customer voice}
**Customer Psychology**: {Identified customer needs/pain points}
**Research Suggestions**: {Things to explore further}

---

### 🎯 Simon (if participated)

**Strategy Decisions**: {Strategic decisions made}
**Hypothesis Status**: {Hypotheses established/validated}
**Next Strategy Tasks**: {Follow-up strategy work}

---

### 📋 Penny (if participated)

**Execution Summary**: {Organized tasks/stories}
**Handoff Status**: {Dev team delivery status}
**Schedule Risks**: {Discovered schedule issues}

---

### 📊 Vicky (if participated)

**Validation Results**: {Before/After comparison}
**Guard Rail Status**: {Side-effect metrics check}
**Next Validation Plan**: {Planned validations}

---

### 🔮 Sage (if consulted)

**Consultation Summary**: {Strategic advice provided}
**Risk Warnings**: {Risk factors identified}
**Recommendations**: {Directions suggested to Oscar}
```

### Diary Writing Principles

1. **Be honest**: Record not only what went well but also what was difficult
2. **Be specific**: Focus on concrete examples rather than abstract expressions
3. **Be future-oriented**: Emphasize insights that will help in the next session
4. **Accumulate User Context**: Continuously learn PO's preferences/style

### Determining Participating Agents

Oscar determines participating agents during the session using these criteria:

| Criterion | Counted as participation |
|-----------|------------------------|
| Spawned via Task tool | ✅ |
| Directly invoked via `/strategy`, `/analytics`, etc. | ✅ |
| Auto-deployed via keyword trigger | ✅ |
| Oscar only mentioned the role | ❌ |

---

## User Context Global Merge ⭐

If the session diary contains **User Context Updates**, merge them into `.context/user-context.yaml`.

### Merge Logic

1. **Extract User Context items from session diary**
   ```markdown
   **User Context Updates**:
   - The user prefers natural language prompts ("commit and push" style)
   - Values actual working results over formality
   ```

2. **Read user-context.yaml**

3. **Check for duplicates and merge**
   - Skip content that already exists
   - Add only new content to the appropriate section

4. **Update metadata**
   ```yaml
   _meta:
     updated_at: "{current date}"
     sources:
       - "{previous sources}"
       - "{current session ID}"  # Added
   ```

### Merge Target Sections

| Session diary content | user-context.yaml section |
|----------------------|--------------------------|
| Communication related | `communication:` |
| Work style related | `work_style:` |
| Preference related | `preferences:` |

### Merge Example

**Session diary:**
```markdown
**User Context Updates**:
- Uses a workflow of running multiple tasks simultaneously via parallel sessions
```

**user-context.yaml after merge:**
```yaml
work_style:
  - "Tenacious detective style pursuing WHY"
  - "Hypothesis/validation-based decision making"
  - "Runs multiple tasks simultaneously via parallel sessions"  # Added

_meta:
  updated_at: "2026-01-28"
  sources:
    - "oscar-system-improvement"
    - "current-session-id"  # Added
```

### Merge Complete Message

```markdown
🎩 Oscar: User Context has been updated.

Added items:
- work_style: "Runs multiple tasks simultaneously via parallel sessions"
```

---

## Auto-Collected Save Content

Information Oscar automatically collects when saving a session:

### Current State

```markdown
## Current State

**In progress**: {Last thing being worked on}
**Last work**: {Last completed work}
**Next work**: {Planned next work}
```

### Work History

Record work performed during the session in chronological order:

```markdown
## Work History

### {date}
- {Work 1}
- {Work 2}
- ...
```

### Outputs

Files created/modified during the session:

```markdown
## Outputs

| File | Change | Description |
|------|--------|-------------|
| `path/to/file.md` | Created | Description |
| `path/to/other.md` | Modified | Description |
```

---

## Automatic Context Updates

If data analysis results include **information that needs permanent retention**, automatically reflect them:

| Type | Target File | Example |
|------|------------|---------|
| Metrics data | `.context/.secrets.yaml` | AD_METRICS, METRICS sections |
| Metrics documentation | `.context/global/metrics.md` | Add new metrics sections |
| Domain insights | `.context/domains/{domain}/` | Analysis results, pattern discoveries |
| Strategy changes | `.context/global/strategy.md` | When direction changes |

**Auto-update criteria**:
- **Quantitative metrics** (numbers) obtained from DB analysis
- **Confirmed decisions** from party mode discussions
- **Data to reuse** in future sessions

**Not updated**:
- One-time exploratory query results
- Hypotheses not yet validated
- Content explicitly rejected by the user

---

## Error Handling

### No Active Session

```markdown
⚠️ No active session to save.
```

### File Write Failure

```markdown
❌ Session save failed: {error message}
   Try saving manually, or copy the session content.
```

---

## Related Commands

- `/start` - Start/restore session
- `/sessions` - Full session dashboard

---

*File locations*:
- Session index: `.context/sessions/index.yaml`
- Active sessions: `.context/sessions/active/{id}.md`
- Closed sessions: `.context/sessions/archive/{YYYY-MM}/{id}-{MMDD}.md`
- Shared outputs: `.context/sessions/shared/{date}-{title}.md`
