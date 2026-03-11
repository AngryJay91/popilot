# Oscar Setup Workflow

The Setup workflow that Oscar runs on first project launch.

## Trigger Condition

When `/start` is executed and the `.context/project.yaml` file does not exist, the Setup Wizard begins.

---

## Phase 0: Project Type Detection

```
🎩 Oscar: Analyzing the project...
```

### Detection Logic

Check for the existence of the following files/folders in the project root:

| File/Folder | Meaning |
|-------------|---------|
| `package.json` | Node.js project |
| `requirements.txt` / `pyproject.toml` | Python project |
| `go.mod` | Go project |
| `Cargo.toml` | Rust project |
| `src/` / `app/` / `lib/` | Source code exists |
| `README.md` | Project documentation |

### Branching

```
├── Code/config files exist → Brownfield mode (Phase 0.5)
└── Nothing found → Greenfield mode (proceed to Phase 1)
```

---

## Phase 0.5: Brownfield Full Scan (When code exists)

```
🎩 Oscar: I see existing code. Let me analyze it first.
```

### Scan Targets

**Included:**
- Source folders: `src/`, `app/`, `lib/`, `components/`, `pages/`
- Config files: `package.json`, `requirements.txt`, `*.config.js`, `*.yaml`
- Documentation: `README.md`, `docs/`
- Environment variable examples: `.env.example`, `.env.sample`
- Schemas: `prisma/schema.prisma`, `*.sql`

**Excluded:**
- `node_modules/`, `venv/`, `.venv/`, `__pycache__/`
- `dist/`, `build/`, `.next/`, `out/`
- `.git/`
- `*.lock`, `package-lock.json`, `yarn.lock`
- Binary files, images, etc.

### Analysis Items

1. **Tech Stack**
   - Framework (Next.js, Django, etc.)
   - Language version
   - Key dependencies

2. **Project Structure**
   - Folder structure mapping
   - Architecture pattern inference

3. **README Parsing**
   - Project description
   - Installation method
   - Feature list

4. **Environment Variables**
   - Infer required external integrations

### Results Presentation

```markdown
🎩 Oscar: I've analyzed the code and here's what I found.

## Tech Stack
- Frontend: {detected stack}
- Backend: {detected stack}
- Infra: {detected infrastructure}

## Project Structure
{folder structure}

## Content from README
{key content}

───────────────────────────────────────
Does this analysis look correct? Let me know if anything needs to be modified or added.
```

### After User Confirmation

- Apply modifications
- Move to Phase 2 (supplementary interview)

---

## Phase 1: User Interview (🎩 Oscar)

```
🎩 Oscar: Hello! I'm Oscar. Nice to meet you.
         We'll be working together, so may I ask you a few questions first?
```

### Question List

1. **How to Address You**
   ```
   "What should I call you?"
   ```

2. **Communication Style**
   ```
   "Do you have a preferred communication style?"
   e.g., Concise answers / Detailed explanations / Presenting options, etc.
   ```

3. **Work Style**
   ```
   "What work style do you prefer?"
   e.g., Step-by-step confirmation / Autonomous execution / Fast execution, etc.
   ```

### Result

→ Create `.context/user-context.yaml`

```yaml
identity:
  name: "{input value}"
  preferred_name: "{input value}"

communication:
  - "{identified style}"

work_style:
  - "{identified approach}"

_meta:
  created_at: "{current timestamp}"
  updated_at: "{current timestamp}"
  sources: ["setup"]
```

---

## Phase 2: In-depth Project Interview (🎯 Simon deployed)

```
🎩 Oscar: I'm deploying Simon for a deeper understanding of the project.

🎯 Simon: Hello, {name}. Let's have an in-depth conversation about the project.
         Take your time. It should take about 15-20 minutes.
```

### Interview Structure

#### 1. Problem & Market

```
"What is the core problem this project aims to solve?"
"Who are the people experiencing this problem?"
"How are they currently solving this problem?"
"Why do you think this problem needs to be solved now?"
```

**If unsure:**
```
🎯 Simon: "Let me look into the relevant market..."
→ Use WebSearch tool for market research
→ Share results and discuss together
```

#### 2. Solution & Differentiation

```
"How do you plan to solve this problem?"
"What is the key differentiator compared to existing alternatives?"
"What changes will customers experience when using this service?"
"How would you describe this service in one sentence?"
```

**If competitors are unclear:**
```
🎯 Simon: "Let me find and compare similar services..."
→ Competitive analysis via WebSearch
→ Derive differentiators together
```

#### 3. Current State & Uncertainty

```
"How far have you progressed so far?"
  → Idea / Prototype / MVP / Launched / PMF / Growth
"What is the biggest uncertainty right now?"
"What do you want to validate next?"
"What is the nearest milestone?"
```

#### 3.5. Work Domains - Optional

```
"Are your main work areas divided into domains?"
  e.g., Marketing, CS, Payments / Frontend, Backend, Infra / None (single domain)
```

**If yes:**
```
"Can you briefly describe each domain?"
```

→ Reflect in the `operations.domains` section of `project.yaml`

**If no:**
→ Skip domains section (can be added later when needed)

#### 4. Validation & Learning

```
"What has been confirmed so far and what is still unknown?"
"Have you talked with customers? What was the most memorable feedback?"
"Have you experienced any failures or pivots?"
"What part of this project are you most confident about?"
```

### Summary & Confirmation

```
🎯 Simon: Let me summarize what I've understood.

## Project Summary
- **Core Problem**: ...
- **Target Customer**: ...
- **Solution**: ...
- **Differentiation**: ...
- **Current Stage**: ...
- **Key Uncertainty**: ...

Does this summary look correct? Let me know if anything needs to be modified or added.
```

### Result

→ Create `.context/project.yaml`

---

## Phase 3: Integration Setup (Based on Integration Registry)

```
🎩 Oscar: Let me set up external tool integrations. Please select only what you need.
```

### Integration Options Overview (Dynamically generated from Registry)

Dynamically reads categories and provider lists from the Integration Registry (`.context/integrations/`) and displays them.

```
🎩 Oscar: You can integrate the following tools.
```

**Category-based provider display logic:**

```
1. Read category list from _registry.yaml
2. Collect providers belonging to each category from *.yaml files in providers/ folder
3. Group by category and present to the user
```

Example output:
```
[Analytics]
□ GA4 (Google Analytics 4) — Event-based user behavior analysis
□ Mixpanel — Product analytics, funnels, retention
□ None

[Project Management]
□ Notion — Task management, document management, roadmap
□ Linear — Issue tracking, project management, roadmap
□ None

[Customer Feedback]
□ Channel.io — CS chat data, VOC collection/analysis
□ Intercom — Customer support, messaging, VOC analysis
□ None

[Database]
□ Production Database — Direct queries on production/snapshot DB
□ None

[AI Research]
□ NotebookLM — AI-powered customer/user insight exploration
□ None

Which of these are you currently using?
```

### Additional Questions Per Selected Provider

When a user selects a provider, ask the `setup_questions` from that provider's YAML in order.

```
e.g., When GA4 is selected:
🎩 Oscar: You're using GA4.
1. "Please provide your GA4 Property ID." (e.g., 462897329)

e.g., When DB is selected:
🎩 Oscar: You're using a DB. Let me ask a few more questions.
1. "What is the production DB MCP server name?" (e.g., prod_service_db)
2. "What is the snapshot DB MCP server name?" (optional, e.g., snapshot_service_db)
3. "What is the port forwarding tunnel script path?" (optional)
4. "What is the heavy table warning list?" (optional)
5. "What are the DB usage rules summary?" (optional)
```

### Integration Setup Result

→ Reflected in the `operations.integrations` section of `project.yaml`

```yaml
# Format stored in project.yaml (maintaining existing schema)
operations:
  integrations:
    ga4:
      enabled: true
      property_id: "462897329"
    notion:
      enabled: true
      workspace: "My Workspace"
      daily_page_id: "abc123..."
    # ... response values from each provider's setup_questions
```

### Sensitive Information Notice

```
🎩 Oscar: Please configure sensitive information needed for external integrations in .secrets.yaml.
         Would you like me to generate a template?
```

→ Create `.context/.secrets.yaml` template (optional)

### Dev Scope Setup (When a development dashboard exists)

```
🎩 Oscar: Do you have a separate development repository?
         If so, Derek (Development) and Quinn (QA) will work in that repo.
```

→ Reflected in the `dev_scope` section of `project.yaml`

---

## Phase 4: Template Hydration (Integration Registry Integrated)

```
🎩 Oscar: Adjusting agents and commands to fit the project based on the configuration.
```

### Hydration Procedure

#### Step 1: Integration Marker Substitution (New)

1. **Collect list of enabled provider IDs from project.yaml**
   ```
   e.g., [ga4, prod_db, notion, channel_io, notebooklm]
   ```

2. **Read each provider YAML** (`integrations/providers/{id}.yaml`)

3. **Build capabilities map**
   ```yaml
   capabilities:
     analytics: true      # ga4 is analytics category
     database: true        # prod_db is database category
     pm_tool: true         # notion is pm_tool category
     customer_feedback: true  # channel_io is customer_feedback category
     ai_research: true     # notebooklm is ai_research category
   ```

4. **Agent-level marker substitution**

   For each agent .hbs file:

   a. Check which categories map to the agent in `_registry.yaml`
   b. Collect `agent_prompts.{agent_name}` from enabled providers in those categories
   c. Replace `{{config.KEY}}` in prompts → with project.yaml config values
   d. Expand `{{#each config.KEY}}` in prompts → array expansion
   e. Combine collected prompts
   f. Replace `{{INTEGRATION_PROMPTS}}` marker → with combined prompts
   g. Replace `{{INTEGRATION_TOOLS_FOOTER}}` → with combined `footer_tool_line`
   h. Replace `{{INTEGRATION_CAUTION_LIST}}` → with database provider's `caution_list`

5. **Command-level marker substitution**

   For each command .hbs file:

   a. Check which categories map to the command in `_registry.yaml`
   b. Collect `command_prompts.{command_name}` from enabled providers in those categories
   c. Substitute config then combine
   d. Replace `{{INTEGRATION_PROMPTS}}` marker → with combined prompts

6. **System file marker substitution**

   For CLAUDE.md.hbs, WORKFLOW.md.hbs:

   a. Check categories where `system_files` includes the file in `_registry.yaml`
   b. Collect `safety_rules` / `workflow_rules` from enabled providers in those categories
   c. Substitute config then combine
   d. Replace `{{INTEGRATION_SAFETY_RULES}}` marker → with combined `safety_rules` (for CLAUDE.md)
   e. Replace `{{INTEGRATION_WORKFLOW_RULES}}` marker → with combined `workflow_rules` (for WORKFLOW.md)

#### Step 2: Standard Handlebars Rendering

1. **Collect `.hbs` file list**
   ```
   .context/agents/*.md.hbs
   .context/WORKFLOW.md.hbs
   .claude/commands/*.md.hbs
   CLAUDE.md.hbs
   ```

2. **Build variable context**
   - Extract project, integrations, domains, dev_scope, spec_site from `project.yaml`
   - **Add capabilities map** (generated in Step 1)
   - Convert to flat namespace

3. **Render each `.hbs` → `.md`**
   - `{{var}}` → value substitution
   - `{{#if path}}...{{/if}}` → conditional include/exclude
   - `{{#if capabilities.pm_tool}}...{{/if}}` → capability-based conditional
   - `{{#each path}}...{{/each}}` → iteration generation

4. **Delete `.hbs` originals**

5. **Auto-generate domain commands**
   - Render `_domain.md.hbs` template for each domain
   - Result: `.claude/commands/{domain_id}.md` (e.g., ads.md, marketing.md)
   - Delete `_domain.md.hbs` original

### Hydration Verification

```
🎩 Oscar: Hydration is complete.

[Integration Registry]
• Active providers: {active list}
• Capabilities: {capability list}

[Transformed files]
• agents/orchestrator.md ✅
• agents/strategist.md ✅
• agents/market-researcher.md ✅
• agents/gtm-strategist.md ✅
• agents/planner.md ✅
• agents/handoff-specialist.md ✅
• agents/validator.md ✅
• agents/analyst.md ✅
• agents/researcher.md ✅
• agents/tracking-governor.md ✅
• agents/operations.md ✅
• agents/developer.md ✅
• agents/qa.md ✅
• WORKFLOW.md ✅
• CLAUDE.md ✅
• commands/analytics.md ✅
• commands/daily.md ✅

[Generated domain commands]
• commands/{each domain id}.md

[Remaining .hbs files]
None ✅
```

### How to Add a New Provider

1. Drop `integrations/providers/{new_provider}.yaml` file
2. Add configuration at `operations.integrations.{id}` in `project.yaml`
3. Re-run `/start` → Setup Wizard automatically reflects it in hydration

> **Important**: No modification of agent .hbs files needed! Just add the Provider YAML.

---

## Phase 5: spec-site Initialization (NEW)

```
🎩 Oscar: Initializing spec-site.
```

### Initialization Steps

1. **Set index.html title**
   ```html
   <title>{project.name} Spec</title>
   ```

2. **Create first sprint folder**
   ```
   .context/sprints/s1/
   └── context.md (empty template)
   ```

3. **Deployment setup (optional)**
   ```
   🎩 Oscar: Where would you like to deploy spec-site?

   □ Vercel — Auto-deploy with GitHub integration
   □ AWS Amplify — AWS-based deployment
   □ Later
   ```

4. **Reflect spec_site info in `project.yaml`**
   ```yaml
   spec_site:
     title: "{project.name} Spec"
     deploy_url: ""  # Set after deployment
   ```

---

## Phase 6: Domain Structure Creation (NEW)

Executed when domains are defined in Phase 2.

```
🎩 Oscar: Creating domain folders.
```

### Creation Procedure

For each domain:

1. **Create domain folder**
   ```
   .context/domains/{domain_id}/
   └── index.md (basic structure)
   ```

2. **Initialize domain index file**
   ```markdown
   # {domain_name} Domain

   ## Overview
   {domain description - collected during Setup interview}

   ## Key Context
   - (to be added as work progresses)

   ## Related Files
   - `global/product/{domain_id}.md` — Product analysis
   ```

3. **Create additional default folders**
   ```
   .context/global/product/     (empty — filled during analysis)
   .context/global/database/    (empty — filled when needed)
   .context/global/tracking/    (empty — when event definitions are made)
   .context/metrics/            (empty)
   .context/daily/              (empty)
   .context/sessions/
   ├── index.yaml               (empty session index)
   ├── active/                  (empty)
   └── archive/                 (empty)
   ```

---

## Setup Complete

```
🎩 Oscar: {name}, Oscar system setup is complete!

## Created Files
- .context/user-context.yaml (gitignore)
- .context/project.yaml
- .context/.secrets.yaml (gitignore) - optional
- CLAUDE.md (hydration complete)
- 15 agents (hydration complete)
- WORKFLOW.md (hydration complete)

## Project Summary
{summary of project.yaml key content}

## Integration Status
{list of enabled integrations}

## Domains
{list of created domains}

───────────────────────────────────────
What would you like to start working on?
```

---

## Brownfield vs Greenfield Comparison

| Item | Brownfield | Greenfield |
|------|------------|------------|
| Phase 0 | Code scan | Skip |
| Phase 0.5 | Analysis results confirmation | None |
| Phase 1 | Same (User interview) | Same |
| Phase 2 | Supplementary questions only (10-15 min) | Full interview (15-20 min) |
| Phase 3 | Same (Integration setup) | Same |
| Phase 4 | Same (Hydration) | Same |
| Phase 5 | Same (spec-site) | Same |
| Phase 6 | Same (Domain structure) | Same |
| **Total Time** | **20-25 min** | **25-30 min** |

---

## Setup Re-initialization for Project Expansion

When adding a new product line or independent service, you can re-initialize Setup with a separate Oscar context.

### Files to Re-initialize

```bash
# Delete when initializing context for a new product
rm .context/project.yaml          # Project config (newly created during Setup)
rm -f .context/user-context.yaml  # User config (newly created during Setup)
rm -f .context/.secrets.yaml      # Sensitive info (newly created during Setup)

# Clean existing data (when needed)
rm -rf .context/sprints/          # Sprint data
rm -rf .context/domains/          # Domain data
rm -rf .context/sessions/         # Session records
rm -rf .context/metrics/          # Metrics data
rm -rf .context/global/           # Strategy/product documents
```

### Retained Files (Oscar Core)

| File/Folder | Description |
|-------------|-------------|
| `oscar/` | Oscar workflows |
| `agents/` | Agent personas (re-hydratable if .hbs files exist) |
| `templates/` | Document templates |
| `WORKFLOW.md` | Workflow guide |
| `.claude/commands/` | Slash commands |
| `CLAUDE.md` | Oscar system description |

### After Re-initialization

```bash
# When /start is run and project.yaml doesn't exist, Setup Wizard auto-starts
/start
```

---

## Related Files

- `/start` command: `.claude/commands/start.md`
- user-context structure: `.context/user-context.yaml`
- project structure: `.context/project.yaml.example`
- Agent persona: `.context/agents/strategist.md` (Simon)
