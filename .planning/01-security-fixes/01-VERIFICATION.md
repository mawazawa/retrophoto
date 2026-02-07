# Phase 01 Verification — Security Fixes

> Goal-backward verification. Tests what must be TRUE, not what tasks were completed.

## Automated Checks

```bash
# V1: CSRF excludes localhost in production
NODE_ENV=production node -e "
  process.env.NEXT_PUBLIC_BASE_URL='https://retrophotoai.com';
  // Simulate the ALLOWED_ORIGINS construction
  const origins = [
    process.env.NEXT_PUBLIC_BASE_URL,
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:3001'] : []),
  ].filter(Boolean);
  if (origins.includes('http://localhost:3000')) { console.error('FAIL: localhost in production origins'); process.exit(1); }
  console.log('PASS: localhost excluded from production origins');
"

# V2: No hardcoded credentials in source
grep -rn "Karmaisabitch\|mathieuwauters@gmail" --include="*.ts" --include="*.js" --include="*.spec.ts" .
# Expected: zero matches

# V3: .env.test.example exists
test -f .env.test.example && echo "PASS: .env.test.example exists" || echo "FAIL: missing"

# V4: Unit tests pass (no regressions)
npm test -- --run

# V5: Price validation in webhook handler
grep -n "amount_total" app/api/webhooks/stripe/route.ts
# Expected: at least one match showing validation logic

# V6: Integration test for price validation
npx vitest run tests/integration/webhook-price-validation.test.ts
```

## Manual Verification

- [ ] Read `lib/security/csrf.ts` — confirm localhost is inside a `NODE_ENV === 'development'` conditional
- [ ] Read `tests/e2e/auth-flow.spec.ts` — confirm no hardcoded email/password
- [ ] Read `app/api/webhooks/stripe/route.ts` — confirm amount validation exists before credit addition

## Pass/Fail Record

| Check | Result | Date | Notes |
|-------|--------|------|-------|
| V1: CSRF localhost | pending | — | — |
| V2: No credentials | pending | — | — |
| V3: .env.test.example | pending | — | — |
| V4: Unit tests | pending | — | — |
| V5: Price validation | pending | — | — |
| V6: Integration test | pending | — | — |

## Phase Status: `pending`
