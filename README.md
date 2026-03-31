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

## 🔌 MCP-PM 연결 (Claude Code / Codex)

Popilot의 PM 기능을 Claude Code나 Codex에 MCP 서버로 연결하는 방법입니다. 연결하면 에이전트가 52개 도구(스프린트, 에픽, 스토리, 회고 등)를 직접 호출할 수 있습니다.

### 1. PM API 배포

```bash
cd your-project
npx popilot deploy   # Cloudflare Workers에 pm-api 배포
# → https://your-project-pm-api.YOUR_ACCOUNT.workers.dev
```

### 2. API 토큰 발급

배포된 PM API에 Bearer 토큰을 등록합니다:

```bash
curl -X POST https://YOUR_PM_API_URL/api/v2/admin/members \
  -H "Content-Type: application/json" \
  -d '{"token":"my-secret-token","userName":"your-name"}'
```

### 3. .mcp.json 설정

```bash
cp .mcp.json.example .mcp.json
# .mcp.json 편집: PM_API_URL과 PM_TOKEN 값 교체
```

```json
{
  "mcpServers": {
    "pm": {
      "command": "node",
      "args": ["./mcp-pm/dist/index.js"],
      "env": {
        "PM_API_URL": "https://your-project-pm-api.workers.dev",
        "PM_TOKEN": "my-secret-token"
      }
    }
  }
}
```

### 4. Claude Code에서 확인

```
claude
> /mcp
```

pm 서버와 52개 도구 목록이 표시되면 연결 성공입니다.

> ⚠️ **주의:** `.mcp.json`에는 토큰이 포함되므로 `.gitignore`에 추가하세요.

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
  deploy [dir]    Deploy pm-api to Cloudflare Workers (Tier 2)
  migrate [dir]   Run SQL schema migrations on pm-api database (Tier 2)
  doctor [dir]    Check installation health
  help            Show this help

Options:
  --skip-spec-site       Skip spec-site (Vue 3 + Vite) scaffold
  --force                Overwrite existing files
  --platform=<id>        Target AI platform adapter (default: claude-code)
  -h, --help             Show this help

Examples:
  npx popilot init my-project
  npx popilot@latest hydrate
  npx popilot@latest hydrate --force
  npx popilot doctor
  npx popilot deploy
  npx popilot migrate
  npx popilot my-project          # same as: popilot init my-project
```

### Command Details

#### `init [dir]`

Scaffolds a new Popilot project, runs the interactive setup wizard, and hydrates all templates.

```bash
npx popilot init my-project
npx popilot init my-project --skip-spec-site
npx popilot init my-project --platform=codex
```

- Creates the full `.context/`, `spec-site/` (unless `--skip-spec-site`), and agent scaffold
- Runs the interactive setup wizard to collect project info, user preferences, and integrations
- Hydrates all `.hbs` template files using the collected config

#### `hydrate [dir]`

Syncs the latest scaffold templates and re-hydrates all `.hbs` files from the existing `project.yaml`. Use this after upgrading Popilot or editing `project.yaml` manually.

```bash
npx popilot@latest hydrate          # safe: adds missing files only
npx popilot@latest hydrate --force  # full refresh: overwrites scaffold files
```

- `hydrate` now syncs the latest scaffold before rendering.
- Use `--force` only when you intentionally want to replace existing scaffold-managed files.

#### `deploy [dir]`

Deploys the `pm-api` backend to Cloudflare Workers. Requires Tier 2 setup (pm-api present) and `wrangler` authentication.

```bash
npx popilot deploy
```

Prerequisites:
1. Run `npx wrangler login` to authenticate with Cloudflare
2. Ensure `project.yaml` is hydrated (run `popilot hydrate` first)
3. `pm-api/wrangler.toml` must exist

#### `migrate [dir]`

Runs SQL schema migrations against the Cloudflare D1 database configured in `pm-api/wrangler.toml`. Applies `schema-core.sql` plus feature-specific schemas based on `project.yaml` flags, then runs any numbered migration files (`NNN-*.sql`) in order.

```bash
npx popilot migrate
```

Applies migrations in this order:
1. `schema-core.sql` (always)
2. `schema-rewards.sql` (if `pm_api.features.rewards: true`)
3. `schema-meetings.sql` (if `pm_api.features.meetings: true`)
4. `schema-docs.sql` (if `pm_api.features.docs: true`)
5. `NNN-*.sql` numbered migrations (sorted by prefix)

Already-applied migrations are skipped automatically (duplicate column detection).

#### `doctor [dir]`

Checks the health of your Popilot installation and reports any missing or misconfigured files.

```bash
npx popilot doctor
```

Exits with code `0` if all checks pass, `1` if any checks fail.

### `--platform` Option

The `--platform` flag selects the AI coding agent adapter. Each adapter customizes the system prompt file, slash command directory, and platform-specific instructions.

| Platform ID | Target | Description |
|-------------|--------|-------------|
| `claude-code` | `CLAUDE.md` + `.claude/commands/` | Anthropic Claude Code (default) |
| `codex` | `AGENTS.md` + `.codex/commands/` | OpenAI Codex CLI |
| `gemini` | `GEMINI.md` + `.gemini/commands/` | Google Gemini CLI |

```bash
# Initialize for Claude Code (default)
npx popilot init my-project

# Initialize for OpenAI Codex
npx popilot init my-project --platform=codex

# Initialize for Gemini CLI
npx popilot init my-project --platform=gemini

# Re-hydrate for a specific platform
npx popilot hydrate --platform=codex
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

## Troubleshooting

### `popilot init` fails with "Existing Popilot structure detected"

You're running `init` in a directory that already has Popilot files. Options:

```bash
# Overwrite existing files
npx popilot init my-project --force

# Or run in a fresh directory
npx popilot init new-project
```

### Templates not updating after editing `project.yaml`

Run `hydrate` to re-render all templates:

```bash
npx popilot@latest hydrate
```

If you want to also pull down the latest scaffold files from this version:

```bash
npx popilot@latest hydrate --force
```

### `deploy` fails: "wrangler.toml not found"

You need to hydrate first so the `.hbs` template is rendered:

```bash
npx popilot hydrate
npx popilot deploy
```

### `deploy` fails: "Not authenticated"

Log in to Cloudflare:

```bash
npx wrangler login
npx popilot deploy
```

### `migrate` fails with "duplicate column" / "already exists"

This is expected for idempotent re-runs — Popilot automatically skips migrations that have already been applied. Safe to ignore.

### MCP connection not working (`/mcp` shows no tools)

1. Ensure `mcp-pm` was built: `cd mcp-pm && npm run build` (generates `dist/index.js`)
2. Verify `.mcp.json` has the correct `PM_API_URL` and `PM_TOKEN`
3. Restart Claude Code to reload MCP servers

```bash
# Rebuild mcp-pm
cd your-project/mcp-pm
npm install
npm run build
```

### Oscar not responding / slash commands missing

Your system prompt file may not be hydrated. Run:

```bash
npx popilot@latest hydrate
```

Then re-open Claude Code — it loads `CLAUDE.md` (or `AGENTS.md` / `GEMINI.md`) on startup.

### `spec-site` fails to start

```bash
cd your-project/spec-site
npm install    # install/reinstall dependencies
npm run dev    # → http://localhost:5173
```

If `npm run dev` errors on a Turso/retro feature, ensure `VITE_TURSO_URL` and `VITE_TURSO_TOKEN` are set in `spec-site/.env.local` (or disable that feature in `project.yaml`).

### `doctor` reports failures

Run `popilot doctor` for a detailed health report:

```bash
npx popilot doctor
```

Fix each reported issue, then re-run to confirm all checks pass.

---

## License

MIT
