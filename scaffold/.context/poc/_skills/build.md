# Phase 3: Build

You are implementing PoC stories as working Vue 3 code inside the spec-site scaffold.

## Input

- Read `.context/poc/pipeline.yaml` to find `current_story`
- Read the corresponding `.context/poc/stories/S-{NN}.md`
- Read `.context/poc/scope.md` for context (mock data strategy)

## Target

All generated code goes into `spec-site/src/pages/poc/`.
Shared composables go into `spec-site/src/composables/poc/`.

## Rules

### Code Style
1. **Vue 3 `<script setup lang="ts">`** — no Options API.
2. **Composition API** with `ref`, `computed`, `watch`.
3. **Scoped CSS** in every component. Use CSS variables from `spec-site/src/styles/variables.css`.
4. **No external dependencies**. Only use what's already in spec-site's package.json (vue, vue-router, marked).
5. **TypeScript strict**. No `any`. Define interfaces from the story's Data Model.

### Data
6. **Mock data only**. Use `ref()` with hardcoded initial data or localStorage.
7. If the story says localStorage, use a consistent key prefix: `poc-{feature}-`.

### Structure
8. **One page component** per story that composes smaller components.
9. **One composable** per story for state management.
10. **Register route** in `spec-site/src/router.ts` under `/poc/` prefix.

### Quality
11. Every AC must be verifiable by viewing the page and interacting with it.
12. Transitions/animations: use simple CSS transitions only. No animation libraries.
13. Responsive: must look acceptable at 375px and 1280px widths.

## Implementation Steps (per story)

```
1. Create composable: src/composables/poc/use{Feature}Store.ts
   - Define interfaces from Data Model
   - Implement reactive state + actions
   - Add localStorage persistence if specified

2. Create components: src/pages/poc/{Component}.vue
   - Follow UI Components table from story
   - Import and use the composable
   - Implement all AC interactions

3. Create page: src/pages/poc/{Feature}Page.vue
   - Compose all components
   - Handle layout

4. Register route in src/router.ts
   - Lazy import: () => import('@/pages/poc/{Feature}Page.vue')
   - Path: /poc/{path} as specified in story

5. Update pipeline.yaml
   - Increment current_story
   - If all stories done: set phases.build.status = done
```

## After ALL stories are built

Update `.context/poc/pipeline.yaml`:
- Set `phases.build.status: done`
- Set `status: verifying`

Then immediately proceed to Phase 4 (read `.context/poc/_skills/verify.md`).

## On build error

If `vue-tsc` or `vite build` fails:
1. Read the error
2. Fix it
3. Retry (max 3 attempts per story)
4. If still failing, add `error: "[message]"` to pipeline.yaml under that story and move on
