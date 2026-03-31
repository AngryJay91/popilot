# PR #11 Verification — issue-4 auth guard

## Scope & Diff

- Branch reviewed: `fix/issue-4-auth-guard`
- Command: `git diff main...fix/issue-4-auth-guard --stat`
- Result:
  - `scaffold/spec-site/src/pages/LoginPage.vue` (new)
  - `scaffold/spec-site/src/router.ts` (modified)
- ✅ Constraint check passed: only `scaffold/spec-site/` files changed.

---

## Checklist Verification

1. **Diff stat checked**
   - ✅ Done

2. **`beforeEach` guard exists in router config**
   - ✅ Present in `scaffold/spec-site/src/router.ts`
   - Logic includes static mode bypass, public route allow, token check, redirect to `/login`

3. **Public routes whitelisted (`/login`, landing)**
   - ✅ `/login` has `meta: { public: true }`
   - ✅ `/` has `meta: { public: true }`

4. **Protected routes redirect to `/login` when no token**
   - ✅ In API mode, any route without `meta.public` requires localStorage token (`spec-auth-token`)
   - ✅ Missing token redirects to `/login?redirect=<originalPath>`

5. **Login page/component exists**
   - ✅ `LoginPage.vue` added and wired via router
   - Includes token input + submit + auto-login flow

---

## Potential Issues (at least 3)

### 1) Redirect parameter is not sanitized (possible open-redirect behavior)
- **Where:** `LoginPage.vue`
- **Code pattern:**
  - `const redirectTo = (route.query.redirect as string) || '/'`
  - `router.replace(redirectTo)`
- **Risk:** If `redirect` accepts arbitrary string values, this can become an open-redirect vector or at least allow unintended navigation targets.
- **Suggestion:** Validate `redirectTo` to allow only internal app paths (e.g., starts with `/` and not `//`, no protocol).

### 2) Guard trusts token existence only; no validity check before granting route access
- **Where:** `router.ts` global `beforeEach`
- **Code pattern:** `const token = localStorage.getItem(AUTH_STORAGE_KEY); if (token) return true`
- **Risk:** Expired/revoked/garbage token still unlocks protected routes at router level; user sees protected shell until downstream API failures occur.
- **Suggestion:** Add lightweight auth state validation on app boot/first navigation (or central `useAuth` state), and redirect to login when validation fails.

### 3) `requiresAuth` meta is introduced but not used by guard logic
- **Where:** `router.ts` (`/dashboard` sets `meta: { ..., requiresAuth: true }`)
- **Risk:** Inconsistent authorization model (some routes use `requiresAuth`, guard ignores it and enforces auth by `!public`). Future contributors may misconfigure routes due to mixed semantics.
- **Suggestion:** Standardize one pattern:
  - Either auth by default except `public`, **or**
  - enforce only when `requiresAuth` is true.
  Document and apply consistently.

### 4) Auto-login path can trigger repeated verify requests to API
- **Where:** `LoginPage.vue` + `useAuth.ts`
- **Risk:** Visiting `/login` with a stored token always calls `tryAutoLogin()` → `login(stored)` → `/api/auth/verify`. This may add unnecessary auth traffic and slow UX on unstable networks.
- **Suggestion:** Cache recent verification status or use in-memory authenticated state first, with periodic/background revalidation.

---

## Verdict

**REQUEST_CHANGES**

Auth guard and login wiring are mostly correct and functional, but I recommend changes before approval due to security/robustness concerns (especially redirect sanitization and token-validation behavior at route entry).
