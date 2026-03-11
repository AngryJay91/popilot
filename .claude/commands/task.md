# /task - Story/Task Status Management

Manage Story status and Task checkboxes integrated with the VitePress kanban board.

## Usage

```bash
# Change Story status
/task status E-10-S-01 done        # draft → done
/task status E-10-S-01 in-progress # draft → in-progress

# Mark Task as complete
/task done E-10-S-01 1.1           # Complete Task 1.1
/task done E-10-S-01 1.1 1.2 2.1   # Complete multiple Tasks at once

# Undo Task completion
/task undo E-10-S-01 1.1           # Revert Task 1.1 to incomplete

# View Story info
/task E-10-S-01                    # Story detail information
/task list                         # All Stories in current sprint
```

## Status Values

| Status | Description |
|--------|-------------|
| `draft` | Draft |
| `ready` | Ready for development |
| `in-progress` | In development |
| `review` | Under review |
| `done` | Complete |
| `blocked` | Blocked |

---

## Execution Logic

### 1. Change Story Status (`/task status`)

**Find file location**:
```
Extract "Current Sprint: **{N}**" from CLAUDE.md → s{N}
.context/sprints/s{N}/stories/{STORY_ID}.md
```

**Pattern to modify**:
```markdown
| **Status** | `{OLD_STATUS}` |
→
| **Status** | `{NEW_STATUS}` |
```

**Execution example**:
```bash
/task status E-10-S-01 done
```

1. Read `.context/sprints/s52/stories/E-10-S-01.md` file
2. Find `| **Status** | \`draft\` |`
3. Change to `| **Status** | \`done\` |`
4. Save file
5. Output result

**Output**:
```
✅ E-10-S-01 status changed: draft → done

📋 Story: WorkNote Table Design and API
📁 File: .context/sprints/s52/stories/E-10-S-01.md
```

---

### 2. Mark Task Complete (`/task done`)

**Pattern to modify**:
```markdown
- [ ] **{TASK_ID}**: {description}
→
- [x] **{TASK_ID}**: {description}
```

**Execution example**:
```bash
/task done E-10-S-01 1.1 1.2
```

1. Read `.context/sprints/s52/stories/E-10-S-01.md` file
2. Find `- [ ] **1.1**:` pattern
3. Change to `- [x] **1.1**:`
4. Find `- [ ] **1.2**:` pattern
5. Change to `- [x] **1.2**:`
6. Save file
7. Calculate and output progress

**Output**:
```
✅ E-10-S-01 Tasks marked complete

Completed Tasks:
- [x] 1.1: WorkNote table schema definition
- [x] 1.2: Migration file generation

📊 Progress: 2/14 tasks (14%)
```

---

### 3. Undo Task Completion (`/task undo`)

**Pattern to modify**:
```markdown
- [x] **{TASK_ID}**: {description}
→
- [ ] **{TASK_ID}**: {description}
```

---

### 4. View Story Info (`/task {STORY_ID}`)

**Execution example**:
```bash
/task E-10-S-01
```

**Output**:
```
📋 E-10-S-01: WorkNote Table Design and API

| Item | Value |
|------|-------|
| Status | draft |
| Priority | P0 |
| Size | M (2 SP) |
| Owner | TBD (BE) |

## Tasks (0/14 complete)

### Task 1: Table Design
- [ ] 1.1: WorkNote table schema definition
- [ ] 1.2: Migration file generation
- [ ] 1.3: Add indexes

### Task 2: Note Creation API
- [ ] 2.1: Create POST endpoint
...
```

---

### 5. Full Story List (`/task list`)

**Execution example**:
```bash
/task list
/task list in-progress    # Specific status only
/task list [owner]        # Specific owner only
```

**Output**:
```
📋 Sprint 52 Stories (63 total)

| Status | Count |
|--------|-------|
| draft | 45 |
| in-progress | 5 |
| done | 13 |

## In Progress (5)
- E-03-S-02: Dashboard Card Component ([owner], M)
- E-04-S-01: Metrics Visualization UI ([owner], L)
...
```

---

## Auto Sprint Detection

Current sprint number is automatically extracted from `CLAUDE.md`:

```markdown
## Current Sprint: **52**
```

→ Uses path `.context/sprints/s52/stories/`

---

## VitePress Auto-Reflection

When Story files are modified, they are automatically reflected on the VitePress kanban board:
- Dev server running: Instantly reflected via Hot Reload
- On build: Reflected in next build

---

## Example Workflow

```bash
# 1. Start work
/task status E-10-S-01 in-progress

# 2. Check off Tasks as completed
/task done E-10-S-01 1.1
/task done E-10-S-01 1.2 1.3

# 3. Complete Story
/task status E-10-S-01 done

# 4. Check progress
/task list in-progress
```

---

*Related features*: VitePress kanban board (`docs/kanban.md`)
*Data source*: `.context/sprints/s{N}/stories/*.md`
