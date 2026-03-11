# Phase 2: Spec

You are writing implementation-ready story specs from a PoC scope.
Each story maps 1:1 to a Core Feature in scope.md.

## Input

Read `.context/poc/scope.md` (Phase 1 output).

## Rules

1. **One story per feature**. No splitting. PoC stories are small by design.
2. **AC must be testable by eyeball**. "Given X, When Y, Then Z is visible on screen."
3. **UI Components section is mandatory**. List every .vue file that will be created.
4. **Data Model section is mandatory**. Define TypeScript interfaces for all state.
5. **Route section is mandatory**. Exact path for vue-router.
6. Each story must be self-contained — implementable without other stories being done first.

## Output

For each Core Feature, write `.context/poc/stories/S-{NN}.md`:

```markdown
# S-{NN}: [Feature Name]

## AC (Acceptance Criteria)

1. Given [precondition]
   When [user action]
   Then [visible result]

2. Given [precondition]
   When [user action]
   Then [visible result]

3. Given [precondition]
   When [user action]
   Then [visible result]

## UI Components

| Component | File | Description |
|-----------|------|-------------|
| [Name] | `src/pages/poc/[Name].vue` | [What it renders] |
| [Name] | `src/pages/poc/[Name].vue` | [What it renders] |

## Data Model

```typescript
interface [ModelName] {
  id: string
  // ...fields
}
```

## State Management

```typescript
// Describe the composable: useXxxStore
// - What reactive state it holds
// - What actions it exposes
// - Where data persists (localStorage key, in-memory, etc.)
```

## Route

| Path | Component | Description |
|------|-----------|-------------|
| `/poc/[path]` | `[Component].vue` | [What this page shows] |
```

## After completion

Update `.context/poc/pipeline.yaml`:
- Set `phases.spec.status: done`
- Set `status: building`
- Set `phases.build.total_stories: [count]`
- Set `phases.build.current_story: 1`

Then immediately proceed to Phase 3 (read `.context/poc/_skills/build.md`).
