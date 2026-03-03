# Popilot

> *"Developers have Copilot. Product Owners have Popilot."*

**Popilot** is a multi-agent AI assistant for Product Owners and Product Managers, built on [Claude Code](https://docs.anthropic.com/en/docs/claude-code). It scaffolds a complete agent team — 10 specialized personas, 29 slash commands, document templates, and workflow automation — so you can focus on product decisions while AI handles the heavy lifting.

---

## Why Popilot?

Product work is messy. You juggle strategy, sprint planning, data analysis, customer research, and developer handoffs — often switching context dozens of times a day.

Popilot solves this with a **team of specialized agents**, each with deep expertise in one domain:

- **No more context-switching** — Oscar routes your request to the right agent automatically
- **Structured workflows** — From PRD to Epic Spec to Story to Handoff, nothing falls through the cracks
- **Data-driven decisions** — Danny queries your analytics; Vicky validates your hypotheses
- **Living documentation** — Interactive spec-site replaces static docs with scenario-based mockups

---

## Quick Start

```bash
npx popilot init my-project
cd my-project
```

Then open [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and type `/start` — Oscar will greet you and begin an onboarding interview to understand your product.

---

## The Agent Team

| Icon | Name | Command | Role | Specialty |
|------|------|---------|------|-----------|
| :tophat: | **Oscar** | *(default)* | Orchestrator | Routing, coordination, proactive alerts |
| :dart: | **Simon** | `/strategy` | Strategist | PRD, hypotheses, product strategy |
| :clipboard: | **Penny** | `/plan` | Planner | Sprint planning, stories, dev handoff |
| :bar_chart: | **Vicky** | `/validate` | Validator | Hypothesis validation, guard rails |
| :chart_with_upwards_trend: | **Danny** | `/analytics` | Analyst | Data analysis, cohorts, insights |
| :microphone: | **Rita** | `/research` | Researcher | VOC analysis, customer insights |
| :hammer: | **Derek** | `/dev` | Developer | Dashboard development, code review |
| :test_tube: | **Quinn** | `/qa` | QA Engineer | Testing, quality review |
| :tophat::sparkles: | **Ollie** | *(internal)* | Task Creator | Parallel task execution for Oscar |
| :crystal_ball: | **Sage** | *(internal)* | Advisor | Strategic advisory for Oscar |

---

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (CLI)
- Node.js 18+
- npm / npx

---

## Setup Flow

When you run `npx popilot init`, the CLI walks you through:

```
  :rocket: Popilot — Multi-agent PO/PM System
  ══════════════════════════════════════

  :bust_in_silhouette: User Preferences
    What should the agents call you? [there]: Yoonjae
    Your role/title (optional): PO
    Preferred response language: Korean (ko)
    Communication style: Concise

  :memo: Project Setup
    Project name [my-project]: sellerking
    Tagline (optional): Amazon seller analytics
    Project type: brownfield (existing codebase)

  :electric_plug: Integrations
    [Analytics]: GA4
    [PM Tool]: Notion
    [Database]: Production DB

  :gear: Hydrating templates...
     CLAUDE.md ✅
     .context/agents/orchestrator.md ✅
     ...

  ✅ Popilot is ready!
```

After setup, open Claude Code and type `/start`. Oscar can run a **deep interview** (15-20 min with Simon) to fully understand your product context.

---

## Slash Commands

### Session & Context

| Command | Description |
|---------|-------------|
| `/start` | List active sessions or start Setup Wizard |
| `/start {id}` | Restore a specific session |
| `/start new "{topic}"` | Create a new session |
| `/start recent` | Restore most recently closed session |
| `/start parallel` | Start a parallel session (skip lock warnings) |
| `/save` | Save session (release lock) |
| `/save --close` | Save and archive session |
| `/save --share "{title}"` | Save and share deliverables |
| `/sessions` | Session dashboard |
| `/sessions clean` | Clean up stale locks |

### Sprint & Metrics

| Command | Description |
|---------|-------------|
| `/sprint` | Sprint dashboard |
| `/sprint new` | Create new sprint |
| `/retro` | Sprint retrospective |
| `/metrics` | Core metrics review |
| `/daily` | Daily work log (uploads to Notion) |
| `/daily --dry-run` | Preview daily log (no upload) |

### Agent Activation

| Command | Description |
|---------|-------------|
| `/strategy` | Activate Simon (strategy, PRD) |
| `/plan` | Activate Penny (sprint planning) |
| `/validate` | Activate Vicky (hypothesis validation) |
| `/analytics` | Activate Danny (data analysis) |
| `/research` | Activate Rita (VOC, customer insights) |
| `/dev` | Activate Derek (development) |
| `/party` | Team discussion mode (all agents) |
| `/handoff` | Agent-to-agent handoff |
| `/oscar-loop` | Autonomous parallel task creation |
| `/task` | Story/Task status management |

### Domain Loading

| Command | Description |
|---------|-------------|
| `/{domain-id}` | Load domain-specific context (configured in project.yaml) |

---

## Integration Support

Popilot supports 9 integrations out of the box. Enable them during setup or later in `project.yaml`:

| Integration | Category | What It Enables |
|-------------|----------|-----------------|
| **GA4** | Analytics | Event analysis, funnel reports, real-time data |
| **Mixpanel** | Analytics | Product analytics, cohort analysis |
| **Notion** | PM Tool | Task management, sprint boards, meeting notes |
| **Linear** | PM Tool | Issue tracking, project management |
| **Channel.io** | Customer | CS chat analysis, VOC extraction |
| **Intercom** | Customer | Customer feedback, support analytics |
| **Production DB** | Database | Direct SQL queries with safety rules |
| **NotebookLM** | AI Research | Source-grounded research, citation-backed answers |
| **Corti** | Decision | Interview transcription, decision tracking |

---

## Architecture

```
my-project/
├── CLAUDE.md                          # System instructions (hydrated)
├── .claude/commands/                  # 29 slash commands
├── .context/
│   ├── project.yaml                   # Project config (from setup wizard)
│   ├── user-context.yaml              # User preferences (gitignored)
│   ├── .secrets.yaml                  # Sensitive data (gitignored)
│   ├── WORKFLOW.md                    # Workflow guide (hydrated)
│   │
│   ├── agents/                        # 10 agent personas
│   ├── oscar/workflows/               # Oscar extension modules
│   ├── templates/                     # 11 document templates
│   ├── integrations/                  # Provider configs + registry
│   ├── metrics/                       # Metrics data
│   ├── daily/                         # Daily work logs
│   │
│   ├── global/                        # Cross-cutting context
│   │   ├── database/                  # DB schema docs
│   │   ├── product/                   # Product specs per domain
│   │   ├── tracking/                  # GA4/GTM events
│   │   ├── strategy.md                # Strategic direction
│   │   └── metrics.md                 # Core metrics definitions
│   │
│   ├── domains/                       # Domain-specific context
│   ├── sprints/                       # Sprint folders (current + archive)
│   │
│   └── sessions/                      # Parallel session management
│       ├── index.yaml                 # Session index + locks
│       ├── active/                    # Active sessions
│       └── archive/                   # Archived sessions (monthly)
│
└── spec-site/                         # Interactive spec viewer (Vue 3 + Vite)
```

---

## Document Templates

| Template | Owner | File | Purpose |
|----------|-------|------|---------|
| Sprint PRD | Simon | `templates/prd.md` | One Question, hypothesis, OMTM |
| Epic Spec | PO | `templates/epic-spec.md` | WHY, WHAT, HOW, edge cases |
| Story v2 | Penny | `templates/story-v2.md` | AC (Given-When-Then), task breakdown |
| Screen Spec | PO | `templates/screen-spec.md` | 7-level UI specification |
| Sprint Plan | Penny | `templates/sprint-plan.md` | Sprint goals and KRs |
| Sprint Status | Penny | `templates/sprint-status.yaml` | Progress dashboard |
| Validation Report | Vicky | `templates/validation-report.md` | Before/After analysis |
| Guard Rail | Vicky | `templates/guardrail.md` | Safety metrics definition |
| Retrospective | Team | `templates/retrospective.md` | Sprint retro template |
| Handoff Checklist | Penny | `templates/handoff-checklist.md` | Dev handoff verification |
| Dev Guide | Derek | `templates/dev-guide.md` | Implementation guidelines |

---

## CLI Reference

```
popilot <command> [target-dir] [options]

Commands:
  init [dir]      Scaffold + interactive setup + hydration (default)
  hydrate [dir]   Re-hydrate .hbs templates from existing project.yaml
  doctor [dir]    Check installation health
  help            Show this help

Options:
  --skip-spec-site   Skip spec-site (Vue 3 + Vite) scaffold
  --force            Overwrite existing files

Examples:
  npx popilot init my-project
  npx popilot hydrate
  npx popilot doctor
  npx popilot my-project          # same as: popilot init my-project
```

---

## How It Works

1. **`npx popilot init`** copies the scaffold and runs the setup wizard
2. **Setup Wizard** collects project info, user preferences, and integration config
3. **Hydration engine** renders `.hbs` templates into `.md` files using your project config
4. **Claude Code** loads `CLAUDE.md` as system instructions — Oscar is now active
5. **Oscar** routes your natural language requests to the right agent
6. **Agents** use your `.context/` files, integrations, and templates to do real work

---

## License

MIT
