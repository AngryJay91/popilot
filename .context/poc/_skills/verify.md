# Phase 4: Verify

You are verifying the PoC builds and runs correctly.

## Steps

### 1. Type Check

```bash
cd spec-site && npx vue-tsc --noEmit
```

If errors exist, fix them. Max 3 retry cycles.

### 2. Build

```bash
cd spec-site && npx vite build
```

If build fails, fix and retry. Max 3 cycles.

### 3. Add PoC Entry Point

If not already present, add a link to the PoC pages from the spec-site index.
Add a simple navigation component at `src/pages/poc/PocIndex.vue` that lists
all PoC routes with links.

Register `/poc` route in router.ts pointing to PocIndex.vue.

### 4. Launch Preview

```bash
cd spec-site && npx vite preview &
```

### 5. Report

Output to the user:

```
PoC complete!

Routes:
- /poc           — PoC Index
- /poc/[route1]  — [Feature 1 name]
- /poc/[route2]  — [Feature 2 name]
- /poc/[route3]  — [Feature 3 name]

Preview: http://localhost:4173/poc

Stories built: N/N
Build status: success | partial (list failures)
```

## After completion

Update `.context/poc/pipeline.yaml`:
- Set `phases.verify.status: done`
- Set `status: done`
