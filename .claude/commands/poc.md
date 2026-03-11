# /poc — Idea to Working PoC

Build a working proof-of-concept from a one-line idea.
No PO knowledge needed. No complex setup. Just describe what you want.

## How it works

This skill chains 4 phases automatically:
1. **Scope** — Narrow the idea to 3 buildable features
2. **Spec** — Write implementation-ready stories with ACs
3. **Build** — Generate working Vue 3 code in spec-site
4. **Verify** — Type-check, build, and launch preview

## Execution

### If `.context/poc/pipeline.yaml` does NOT exist:

Create it:

```yaml
idea: "$ARGUMENTS"
created_at: "[today's date]"
status: scoping
tech_stack: vue

phases:
  scope:
    status: in-progress
    output: scope.md
  spec:
    status: pending
    output: stories/
  build:
    status: pending
    total_stories: 0
    current_story: 0
    output: spec-site/src/pages/poc/
  verify:
    status: pending
```

Then read `.context/poc/_skills/scope.md` and execute Phase 1.

### If `.context/poc/pipeline.yaml` EXISTS:

Read it and resume from the current status:

| `status` value | Action |
|----------------|--------|
| `scoping`      | Read and execute `_skills/scope.md` |
| `speccing`     | Read and execute `_skills/spec.md` |
| `building`     | Read and execute `_skills/build.md` (resume from `current_story`) |
| `verifying`    | Read and execute `_skills/verify.md` |
| `done`         | Report: "PoC already complete. Delete `.context/poc/pipeline.yaml` to start fresh." |

### Resume behavior

If the user runs `/poc` with no arguments and pipeline.yaml exists,
resume from where it left off. This makes the pipeline crash-safe.

If the user runs `/poc [new idea]` and pipeline.yaml exists for a
different idea, ask: "A PoC for '[old idea]' is in progress. Replace it?"

## Important

- Do NOT stop between phases. Run all 4 phases in one session.
- Do NOT ask the user for confirmation between phases. Be proactive.
- If a phase fails, attempt to fix it. Only stop if unrecoverable.
- All generated code must compile (`vue-tsc --noEmit` pass).
