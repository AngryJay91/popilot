# Popilot

> *"Developers have Copilot. Product Owners have Popilot."*

**Popilot** is a multi-agent AI assistant for Product Owners and Product Managers, built on [Claude Code](https://docs.anthropic.com/en/docs/claude-code). It scaffolds a complete agent team — 15 specialized personas, 30+ slash commands, document templates, and workflow automation — so you can focus on product decisions while AI handles the heavy lifting.

---

## Why Popilot?

Product work is messy. You juggle strategy, sprint planning, data analysis, customer research, and developer handoffs — often switching context dozens of times a day.

Popilot solves this with a **team of specialized agents**, each with deep expertise in one domain:

- **No more context-switching** — Oscar routes your request to the right agent automatically
- **Structured workflows** — From PRD to Screen Spec to Story to Dev Handoff, nothing falls through the cracks
- **Data-driven decisions** — Danny queries your analytics; Vicky validates your hypotheses; Tara governs data quality
- **Full PO coverage** — Strategy, market research, GTM, sprint planning, screen specs, tracking, operations, and more
- **Living specs, not dead docs** — spec-site turns static markdown into interactive, scenario-based mockups that developers actually use

---

## Quick Start

```bash
npx popilot init my-project
cd my-project
```

Then open [Claude Code](https://docs.anthropic.com/en/docs/claude-code) and type `/start` — Oscar will greet you and begin an onboarding interview to understand your product.

---

## The Agent Team

### PO Team (10 + Orchestrator)

| Icon | Name | Command | Role | Specialty |
|------|------|---------|------|-----------|
| :tophat: | **Oscar** | *(default)* | Orchestrator | Routing, coordination, proactive alerts |
| :dart: | **Simon** | `/strategy` | Strategist | PRD, hypotheses, product strategy |
| :world_map: | **Marco** | `/market` | Market Researcher | Competitive analysis, positioning |
| :loudspeaker: | **Mia** | `/gtm` | GTM Strategist | Go-to-market strategy, launch planning, messaging |
| :clipboard: | **Penny** | `/plan` | Planner | Sprint planning, stories, backlog |
| :triangular_ruler: | **Hank** | `/handoff` | Handoff Specialist | Screen specs, dev handoff, release readiness |
| :bar_chart: | **Vicky** | `/validate` | Validator | Hypothesis validation, guard rails, OKR tracking |
| :chart_with_upwards_trend: | **Danny** | `/analytics` | Analyst | Data analysis, cohorts, insights |
| :microphone: | **Rita** | `/research` | Researcher | VOC pipeline, customer insights |
| :satellite: | **Tara** | `/tracking` | Tracking Governor | Event taxonomy, data quality, metrics governance |
| :calendar: | **Nora** | `/daily` | Operations | Daily logs, retrospectives, status reports |

### Dev Team (2)

| Icon | Name | Command | Role | Specialty |
|------|------|---------|------|-----------|
| :hammer: | **Derek** | `/dev` | Developer | Dashboard + spec-site development |
| :test_tube: | **Quinn** | `/qa` | QA Engineer | Testing, quality review |

### Internal Agents

| Icon | Name | Command | Role | Specialty |
|------|------|---------|------|-----------|
| :tophat::sparkles: | **Ollie** | *(internal)* | Task Creator | Parallel task execution for Oscar |
| :crystal_ball: | **Sage** | *(internal)* | Advisor | Strategic advisory for Oscar |

### Agent Lanes

```
Strategy:   Simon ←→ Marco
GTM:        Mia ←→ Simon + Marco
Execute:    Penny → Hank → Derek + Quinn
Insight:    Danny ←→ Rita
Measure:    Vicky ←→ Tara
Operations: Nora
Command:    Oscar → Ollie (×N) + Sage
```

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
| `/market` | Activate Marco (competitive analysis, positioning) |
| `/gtm` | Activate Mia (GTM strategy, launch planning, messaging) |
| `/plan` | Activate Penny (sprint planning) |
| `/validate` | Activate Vicky (hypothesis validation) |
| `/analytics` | Activate Danny (data analysis) |
| `/research` | Activate Rita (VOC, customer insights) |
| `/tracking` | Activate Tara (event taxonomy, data quality) |
| `/dev` | Activate Derek (development) |
| `/party` | Team discussion mode (all agents) |
| `/handoff` | Agent-to-agent handoff (via Hank) |
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
├── .claude/commands/                  # 30+ slash commands
├── .context/
│   ├── project.yaml                   # Project config (from setup wizard)
│   ├── user-context.yaml              # User preferences (gitignored)
│   ├── .secrets.yaml                  # Sensitive data (gitignored)
│   ├── WORKFLOW.md                    # Workflow guide (hydrated)
│   │
│   ├── agents/                        # 15 agent personas (+ TEMPLATE.md)
│   ├── oscar/workflows/               # Oscar extension modules
│   ├── templates/                     # 12 document templates
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

## spec-site: The Heart of Popilot

Traditional PO work treats wireframes, storyboards, and screen specs as "documents" — static markdown files that developers skim and misinterpret. Popilot takes a different approach.

**spec-site** is a Vue 3 + Vite interactive spec viewer that ships with every Popilot project. Instead of writing a 50-page spec doc, you build a living mockup where stakeholders can switch scenarios, see state transitions, and read contextual specs — all in one place.

This isn't just a nice-to-have. When you create specs AI-natively — generating interactive mockups with scenario-driven state — the result is dramatically more intuitive than any static document. Developers see exactly what to build. Edge cases are visible, not buried in paragraphs.

### Why It Matters

```
Before (static docs):
  PO writes markdown → Developer reads (maybe) → "What did you mean by...?" → Repeat

After (spec-site):
  PO builds interactive mockup → Developer clicks through scenarios → Builds exactly that
```

### How It Works

Every feature page follows the **SplitPaneLayout** pattern:

```
┌────────────────────────────────────────────────┐
│                   AppHeader                     │
├─────────────────────┬──────────────────────────┤
│                     │                          │
│   Interactive       │     Spec Panel           │
│   Mockup            │     (contextual docs)    │
│                     │                          │
│   ← Click, hover,   │     ← Spec updates       │
│     switch states    │       per scenario       │
│                     │                          │
├─────────────────────┴──────────────────────────┤
│              ScenarioSwitcher                   │
│   [ Default ] [ Empty ] [ Error ] [ Premium ]   │
└────────────────────────────────────────────────┘
```

Left pane: a real, clickable mockup. Right pane: specs that update as you switch scenarios. Bottom: scenario selector to see different user types and states.

### Adding a Page

Each feature = 3 files + 2 registrations:

```
spec-site/src/pages/{feature}/
├── {feature}Data.ts          # Scenarios, spec areas, version info
├── {Feature}Mockup.vue       # Interactive mockup component
└── {Feature}SpecPanel.vue    # Spec document panel
```

Register in `wireframeRegistry.ts` and `navigation.ts`. That's it.

### Running Locally

```bash
cd spec-site
npm install    # already done by popilot init
npm run dev    # → http://localhost:5173
```

### Built-in Pages

| Page | Route | Purpose |
|------|-------|---------|
| Home | `/` | Dashboard overview, navigation |
| Epic Specs | `/policies` | Browse and read Epic Spec documents |
| Wireframes | `/wireframe/:id` | Interactive mockups per feature |
| Retro Board | `/retro` | Sprint retrospective (Turso/LibSQL) |

### Deployment

spec-site is a standard Vite app. Deploy anywhere:

```bash
cd spec-site
npm run build    # → dist/
# Deploy dist/ to Vercel, Netlify, AWS Amplify, etc.
```

Set `spec_site.deploy_url` in `project.yaml` — agents will use this URL in handoff documents.

---

## Document Templates

| Template | Owner | File | Purpose |
|----------|-------|------|---------|
| Sprint PRD | Simon | `templates/prd.md` | One Question, hypothesis, OMTM |
| GTM Plan | Mia | `templates/gtm-plan.md` | ICP, messaging, channel mix, launch KPI gates |
| Epic Spec | PO | `templates/epic-spec.md` | WHY, WHAT, HOW, edge cases |
| Story v2 | Penny | `templates/story-v2.md` | AC (Given-When-Then), task breakdown |
| Screen Spec | Hank | `templates/screen-spec.md` | 7-level UI specification |
| Sprint Plan | Penny | `templates/sprint-plan.md` | Sprint goals and KRs |
| Sprint Status | Penny | `templates/sprint-status.yaml` | Progress dashboard |
| Validation Report | Vicky | `templates/validation-report.md` | Before/After analysis |
| Guard Rail | Vicky | `templates/guardrail.md` | Safety metrics definition |
| Retrospective | Nora | `templates/retrospective.md` | Sprint retro template |
| Handoff Checklist | Hank | `templates/handoff-checklist.md` | Dev handoff verification |
| Dev Guide | Derek | `templates/dev-guide.md` | Implementation guidelines |

---

## CLI Reference

```
popilot <command> [target-dir] [options]

Commands:
  init [dir]      Scaffold + interactive setup + hydration (default)
  hydrate [dir]   Sync latest scaffold templates + re-hydrate from project.yaml
  doctor [dir]    Check installation health
  help            Show this help

Options:
  --skip-spec-site   Skip spec-site (Vue 3 + Vite) scaffold
  --force            Overwrite existing files

Examples:
  npx popilot init my-project
  npx popilot@latest hydrate
  npx popilot@latest hydrate --force
  npx popilot doctor
  npx popilot my-project          # same as: popilot init my-project
```

---

## Upgrading Existing Projects

For projects initialized with older Popilot versions:

```bash
# Safe upgrade (adds missing latest templates/files, then hydrates)
npx popilot@latest hydrate

# Full refresh (overwrites existing scaffold files, then hydrates)
npx popilot@latest hydrate --force
```

- `hydrate` now syncs the latest scaffold before rendering.
- Use `--force` only when you intentionally want to replace existing scaffold-managed files.

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
