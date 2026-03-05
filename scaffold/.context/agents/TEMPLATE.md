# Agent Prompt Universal Template v1.0

> Every agent persona file in the Oscar system must follow this template.
> Incorporates 10 quality patterns from the OMX (oh-my-codex) reference.

---

## Mandatory Structure (in order)

```markdown
---
name: "{Name}"
role: "{One-line role}"
icon: "{emoji}"
effort: "low | medium | high"          # Default reasoning intensity
model_tier: "opus | sonnet | haiku"    # Recommended model
read_only: true | false                # Whether this agent can modify files
---
```

### 1. Identity
- Name, role, icon, tagline

### 2. Persona
- Background (2-3 sentences)
- Communication style
- Speech examples (2-3)

### 3. Negative Scope (MANDATORY)
- "What I Do NOT Do" table: `| Task | Responsible Agent | Reason |`
- "Boundary Violations to Reject" — 3+ example requests with redirect responses
- Clear redirect phrasing when boundary is crossed

### 4. Core Principles
- 3-5 principles (one line each)

### 5. Success Criteria (MANDATORY)
- 5-7 measurable bullet points defining "done well"
- At least 1 must be quantitative

### 6. Activation Triggers
- Keyword / situation matching table

### 7. Workflow Menu
- Trigger code | Function | Deliverable

### 8. MCP Tool Usage (if applicable)
- Per-tool: purpose, usage, constraints
- Use `{{INTEGRATION_PROMPTS}}` marker for hydration-injected content

### 9. Handoff Protocol
- Outbound handoff: format + required fields
- Inbound handoff: verification checklist

### 10. Failure Modes to Avoid (MANDATORY)
- Minimum 4 named anti-patterns
- Each: Name, BAD example, GOOD example, FIX one-liner

### 11. Few-shot Examples (MANDATORY)
- Minimum 2 Good/Bad pairs
- Good: specific, evidence-based, structured response
- Bad: vague, ungrounded, unstructured response

### 12. Final Checklist (MANDATORY)
- 5-7 Yes/No verification questions before delivering output
- If any answer is No, revise before submitting

### 13. Evidence Principle (MANDATORY)
- "No evidence = no claim" declaration
- Definition of evidence (file:line, data, URL, etc.)
- BAD → GOOD transformation example

### 14. Context Budget (MANDATORY)
- Files to skip
- Reading strategy by file size (200+ lines → partial read)
- Max files per turn

### 15. Auto Context Load
- Files to load automatically on activation

---

## Quality Gate

| Section | Minimum Requirement | Gate |
|---------|-------------------|------|
| Negative Scope | 3+ "don't do" items with responsible agent named | Must redirect to a specific agent |
| Success Criteria | 5+ criteria | At least 1 quantitative |
| Failure Modes | 4+ anti-patterns | Each must have BAD/GOOD/FIX |
| Few-shot Examples | 2+ Good/Bad pairs | Bad must be a realistic failure, not a strawman |
| Final Checklist | 5-7 Yes/No items | Answerable without additional context |
| Evidence Principle | Declaration + 1 example | Must include BAD→GOOD transformation |
| Context Budget | 3+ rules | Must include "what to skip" guidance |

---

## Optional Sections (when applicable)

- **Read-Only Constraint**: For agents that must not modify files
- **Circuit Breaker**: Stop/escalation rules after 3 consecutive same-approach failures
- **Extension Modules**: References to conditionally loaded modules
- **Domain Knowledge**: Domain-specific knowledge references

---

## Naming Conventions

- Agent names: English first names (Oscar, Simon, Penny, ...)
- File names: `{role-english}.md.hbs` (orchestrator.md.hbs, strategist.md.hbs, ...)
- Icons: 1 emoji per agent, fixed

---

*Version*: v1.0
*Applies to*: All 15 agents in the Oscar system
