# /start - Session Start

Start a new work session or restore an existing session.

## Usage

```bash
/start                    # Display active session list → select
/start {id}               # Restore a specific session (partial matching OK)
/start new "{topic}"      # Create a new session (slug auto-generated)
/start new {id} "{topic}" # Create a new session (slug specified)
/start recent             # Restore from recently closed session list
/start parallel           # Quick start parallel session (ignore Lock warnings)
```

ARGUMENTS: $ARGUMENTS

---

## Execution Steps

### -1. Setup Check (First Run Detection) ⭐

**First**, check whether the `.context/project.yaml` file exists.

```
project.yaml exists?
├── Yes → Normal flow (proceed to step 0)
└── No  → Start Setup Wizard
```

#### Setup Wizard Start

If `.context/project.yaml` does not exist, treat this as a first run and start the Setup Wizard.

```markdown
🎩 Oscar: Hello! I'm Oscar.
         This is our first meeting in this project. Let me walk you through the Setup.
```

**Setup Workflow** (details: `.context/oscar/workflows/setup.md`)

1. **Phase 0: Project Type Detection**
   - Check for the presence of source code/config files
   - Branch into Brownfield (code exists) vs Greenfield (no code)

2. **Phase 0.5: Brownfield Full Scan** (if code exists)
   - Scan sources excluding `node_modules/`, `venv/`, etc.
   - Analyze tech stack, project structure, README
   - Present results and request confirmation

3. **Phase 1: User Interview** (🎩 Oscar)
   - "What should I call you?" (preferred name)
   - Communication style, work style preferences
   - → Generate `user-context.yaml`

4. **Phase 2: In-depth Project Interview** (🎯 Simon deployed)
   - Core problem, target customers, market
   - Solution, differentiators, expected outcomes
   - Current stage, uncertainties, milestones
   - What's validated / what needs validation
   - Research unknown areas together via WebSearch
   - → Generate `project.yaml`

5. **Phase 3: Sensitive Information Guidance** (🎩 Oscar)
   - Suggest creating `.secrets.yaml` template

```markdown
🎩 Oscar: Setup is complete!

Generated files:
- .context/user-context.yaml (gitignore)
- .context/project.yaml
- .context/.secrets.yaml (gitignore) - optional

What would you like to start working on?
```

---

### 0. Load Secret Variables (Required)

**Must be done first**: Read the `.context/.secrets.yaml` file.
(If the file doesn't exist, proceed without warning - it's an optional file)

### 0.5. Load User Context (New) ⭐

Read `.context/user-context.yaml` to understand user preferences.
(If the file doesn't exist, use defaults)

### 0.7. Load Project Context (New) ⭐

Read `.context/project.yaml` to understand the project context.

### 1. Load index.yaml

Read `.context/sessions/index.yaml` to determine the current session state.

### 2. Branch Based on Arguments

#### Case A: `/start` (no arguments)

Display active session list and recently closed sessions:

```markdown
🎩 Oscar: Here is the session list.

## Active Sessions
┌────┬─────────────────┬────────┬─────────────────────────────┐
│ #  │ ID              │ Status │ Topic                        │
├────┼─────────────────┼────────┼─────────────────────────────┤
│ 1  │ notion-tasks    │ 🟢 idle│ Sprint 52 Notion Tasks       │
│ 2  │ surface-cvr     │ 🔒 in use│ Surface Layer CVR Optimization│
└────┴─────────────────┴────────┴─────────────────────────────┘

## Recently Closed
  • ir-prep (01/25) - IR Material Preparation

---
Select: number, ID, or "new {topic}"
```

#### Case B: `/start {id}`

Restore a specific session (partial matching supported):

1. Find the session in `index.yaml`
2. Check Lock status (see Lock Check section below)
3. Load `active/{id}.md`
4. Acquire Lock and start session

#### Case C: `/start new "{topic}"` or `/start new {id} "{topic}"`

Create a new session:

1. Generate slug (auto or specified)
   - Auto: Extract keywords from topic → English slug
   - Example: "Sprint 52 Notion Tasks" → `sprint-notion-tasks`
2. Create `active/{slug}.md` (using session file template)
3. Register in `index.yaml`
4. Acquire Lock
5. Ask about work type

#### Case D: `/start recent`

Display recently closed sessions → restore from archive to active upon selection.

#### Case E: `/start parallel`

**Quick start parallel session** (useful when working in another terminal):

1. Load `.context/.secrets.yaml`
2. Load `.context/WORKFLOW.md`
3. Check current active sessions in `index.yaml`
4. **Ignore Lock warnings** - proceed without warning even if another session is in use
5. Load current sprint context
6. Ask about work type

```markdown
🎩 Oscar: Starting quickly in parallel session mode.

## 📋 Current Sprint: 52 (D-5)
- Goal: [Sprint Goal]
- D-Day: 2026-02-01

## Active Sessions Reference
- parallel-session (idle): Parallel Session Management System Design

---
What would you like to work on today?
```

**Characteristics**:
- Skips Lock check → use with awareness of potential conflicts
- Does not auto-enter an existing session (assumes new work)
- Only loads sprint context

---

## Lock Check Logic

```
Check Lock status
├── lock.active == false → Proceed normally
├── lock.active == true
│   ├── lock.expires < now → Stale Lock, proceed normally
│   └── lock.expires >= now → Display warning
│       ├── User selects "Continue" → Force acquire Lock
│       └── User selects "Cancel" → Return to session selection
```

**Warning message example**:
```markdown
⚠️ This session was **in use 5 minutes ago** in another terminal.
   Continuing may cause conflicts.

   [1] Continue (accept conflict risk)
   [2] Cancel (select another session)
```

---

## Abnormal Termination Recovery

When restoring a session, if `dirty: true` and `manual_saved_at < auto_saved_at`:

```markdown
⚠️ This session appears to have been terminated abnormally.

   Last manual save: 10:30 (45 minutes ago)
   Last auto save: 11:10 (5 minutes ago)

   State at auto save point:
   - In progress: E-03 series creation
   - Last completed: E-03-S-05

   [1] Continue from auto save point (recommended)
   [2] Roll back to manual save point
```

---

## Lock Acquisition

Acquire Lock when starting a session:

```yaml
# index.yaml update
- id: "notion-tasks"
  status: active
  lock:
    active: true
    since: "2026-01-26T12:00:00"    # Current time
    expires: "2026-01-26T12:30:00"  # +30 minutes
```

---

## Context Loading After Session Start

### Load Workflow

Read `.context/WORKFLOW.md`

### Work Type Question (for new sessions)

```markdown
What would you like to work on today?

1. 🏃 Sprint Work (Sprint 52)
2. 📊 [Domain 1]
3. 📣 [Domain 2]
4. 💬 [Domain 3]
5. 🎯 Strategy Discussion
6. 📈 Metrics Review
```

### Context Loading

| Work Type | Files to Load |
|-----------|--------------|
| Sprint | `.context/sprints/s{N}/context.md` |
| [Domain 1] | `.context/domains/[domain1]/*.md` |
| [Domain 2] | `.context/domains/[domain2]/*.md` |
| [Domain 3] | `.context/domains/[domain3]/*.md` |
| Strategy | `.context/global/strategy.md` |
| Metrics | `.context/global/metrics.md` |

---

## Session File Template

Used when creating a new session:

```markdown
---
id: {slug}
topic: "{topic}"
created_at: "{ISO8601}"
updated_at: "{ISO8601}"
auto_saved_at: null
manual_saved_at: null
turn_count: 0
tags: []
---

# Session: {slug}

> Last updated: {date}

## Current State
<!-- Updated on auto save -->

**In progress**: None
**Last work**: Session started
**Next work**: TBD

---

## Work History
<!-- Organized on /save -->

---

## Outputs
<!-- Created files, decisions, etc. -->

---

## References
<!-- Related files, shared outputs, etc. -->

---

## 📔 Session Diary
<!-- Auto-generated on /save - retrospective per participating agent -->

### 🎩 Oscar (Orchestrator)

**Highlights**:
- (Written on save)

**Feelings**:
- (Written on save)

**Learnings**:
- (Written on save)

**User Context Updates**:
- (Written on save)

<!-- Sections for each participating agent are added on /save -->

---

*End session: `/save` or `/save --close`*
```

---

## Auto Save (Oscar Internal Behavior)

After session start, Oscar performs the following every turn:

1. **Lightweight save**: Update `last_turn` and `lock.expires` in `index.yaml`
2. **Conditional full save**: Full session file save under these conditions:
   - Every 10 turns
   - Agent handoff completed
   - TodoWrite invoked
   - File created/modified
   - MCP tool invoked

---

## Related Commands

- `/save` - Save session
- `/save --close` - Save and close session (archive)
- `/save --share "{title}"` - Save session and share outputs
- `/sessions` - Full session dashboard

---

*File locations*:
- Session index: `.context/sessions/index.yaml`
- Active sessions: `.context/sessions/active/{id}.md`
- Closed sessions: `.context/sessions/archive/{YYYY-MM}/{id}-{MMDD}.md`
- Shared outputs: `.context/sessions/shared/{date}-{title}.md`
