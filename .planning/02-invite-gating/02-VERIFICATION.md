# Phase 02 Verification — Invite-Only Gating

> Goal-backward verification. Tests what must be TRUE, not what tasks were completed.

## Automated Checks

```bash
# V1: Allowlist module exists and compiles
npx tsc --noEmit lib/auth/allowlist.ts

# V2: Integration tests pass
npx vitest run tests/integration/allowlist.test.ts

# V3: Waitlist component compiles
npx tsc --noEmit components/waitlist-gate.tsx

# V4: Full unit test suite passes (no regressions)
npm test -- --run

# V5: Full typecheck passes
npm run typecheck
```

## Manual Verification

### Scenario A: Beta mode disabled
- [ ] Remove `BETA_MODE_ENABLED` env var (or set to `false`)
- [ ] Any authenticated user can reach checkout
- [ ] No waitlist UI appears

### Scenario B: Allowlisted user
- [ ] Set `BETA_MODE_ENABLED=true`, `BETA_ALLOWED_EMAILS=test@example.com`
- [ ] Sign in as `test@example.com`
- [ ] Purchase button visible (not waitlist gate)
- [ ] Checkout endpoint returns 200 (session created)

### Scenario C: Non-allowlisted user
- [ ] Set `BETA_MODE_ENABLED=true`, `BETA_ALLOWED_EMAILS=test@example.com`
- [ ] Sign in as `other@example.com`
- [ ] Waitlist gate visible (purchase button hidden)
- [ ] Checkout endpoint returns 403 with `BETA_ACCESS_DENIED`

### Scenario D: Free tier (everyone)
- [ ] In an incognito window (no auth), navigate to `/app`
- [ ] Upload a photo → restoration works
- [ ] This works regardless of beta mode setting

## Pass/Fail Record

| Check | Result | Date | Notes |
|-------|--------|------|-------|
| V1: Module compiles | pending | — | — |
| V2: Integration tests | pending | — | — |
| V3: Component compiles | pending | — | — |
| V4: Unit tests | pending | — | — |
| V5: Typecheck | pending | — | — |
| Scenario A | pending | — | — |
| Scenario B | pending | — | — |
| Scenario C | pending | — | — |
| Scenario D | pending | — | — |

## Phase Status: `pending`
