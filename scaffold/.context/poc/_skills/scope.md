# Phase 1: Scope

You are scoping a PoC (Proof of Concept) from a one-line idea.
Your job is to produce a tight, buildable scope — NOT a full PRD.

## Input

Read the `idea` field from `.context/poc/pipeline.yaml`.

## Rules

1. **Max 3 features**. A PoC proves a concept, not ships a product.
2. **No real backends**. All data is mock/local. No API keys, no databases.
3. **Name concrete UI elements**. "Dashboard" is vague. "3-column kanban board with drag-and-drop cards" is buildable.
4. **Explicitly list Out of Scope** to prevent creep.

## Output

Write `.context/poc/scope.md` in this exact format:

```markdown
# PoC Scope

## Problem
[1-2 sentences: what pain point does this solve?]

## Target User
[1 sentence: who is this for?]

## Core Features
1. **[Feature Name]** — [One sentence description with specific UI element]
2. **[Feature Name]** — [One sentence description with specific UI element]
3. **[Feature Name]** — [One sentence description with specific UI element]

## Mock Data Strategy
[What fake data will be used? localStorage? Hardcoded JSON? In-memory state?]

## Out of Scope
- [Thing that might seem needed but isn't for PoC]
- [Another thing]
- [Another thing]
```

## After completion

Update `.context/poc/pipeline.yaml`:
- Set `phases.scope.status: done`
- Set `status: speccing`

Then immediately proceed to Phase 2 (read `.context/poc/_skills/spec.md`).
