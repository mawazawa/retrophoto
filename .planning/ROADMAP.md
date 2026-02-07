# Roadmap — Invite-Only Beta Launch

> 7 phases. Phases 3-4 can run in parallel. Each phase has 1-2 executable plans with 2-3 atomic tasks.

## Phase 01: Security Fixes [BLOCKING]
> Fix 3 security vulnerabilities. No user should touch production until these are resolved.

| Plan | Tasks | Status | Requirements |
|------|-------|--------|--------------|
| 01-1 | CSRF localhost fix, credential removal | `completed` | REQ-SEC-01, REQ-SEC-02 |
| 01-2 | Stripe price validation | `completed` | REQ-SEC-03 |

**Depends on**: nothing
**Estimated effort**: 2-3 hours
**Verification**: `grep -r "localhost" lib/security/csrf.ts` returns 0 matches in production; `grep -r "Karmaisabitch" .` returns 0; webhook rejects mismatched amounts

---

## Phase 02: Invite-Only Gating [BLOCKING]
> Build email allowlist and waitlist UI for controlled beta access.

| Plan | Tasks | Status | Requirements |
|------|-------|--------|--------------|
| 02-1 | Allowlist module, middleware integration, checkout gating | `completed` | REQ-ACL-01 through REQ-ACL-05 |
| 02-2 | Waitlist UI component, upgrade prompt modification | `completed` | REQ-ACL-03 |

**Depends on**: Phase 01
**Estimated effort**: 3-4 hours
**Verification**: Non-allowlisted user cannot checkout; allowlisted user can; free tier works for all

---

## Phase 03: Environment Configuration [BLOCKING]
> Configure Vercel, Stripe live mode, cron, Supabase plan.

| Plan | Tasks | Status | Requirements |
|------|-------|--------|--------------|
| 03-1 | Vercel env vars, Stripe live webhook, live product/price | `pending (manual)` | REQ-INF-01 through REQ-INF-03 |
| 03-2 | Vercel cron configuration, Supabase Pro upgrade | `code complete` | REQ-INF-04, REQ-INF-05 |

**Depends on**: Phase 01 (security fixes must be in the deployed code)
**Can parallel with**: Phase 02, Phase 04
**Estimated effort**: 2-3 hours
**Verification**: `curl https://retrophotoai.com/api/quota?fingerprint=test` returns valid response; Stripe webhook test succeeds

---

## Phase 04: CI/CD Pipeline [NON-BLOCKING]
> Automate quality gates on pull requests.

| Plan | Tasks | Status | Requirements |
|------|-------|--------|--------------|
| 04-1 | GitHub Actions workflow, build verification | `completed` | REQ-CI-01, REQ-CI-02 |

**Depends on**: nothing
**Can parallel with**: Phase 02, Phase 03
**Estimated effort**: 1-2 hours
**Verification**: PR with TypeScript error → CI fails; fix → CI passes

---

## Phase 05: Operational Readiness [BLOCKING]
> Configure monitoring, rate limiting, database, domain.

| Plan | Tasks | Status | Requirements |
|------|-------|--------|--------------|
| 05-1 | Sentry sampling, Upstash Redis setup | `code complete` | REQ-OPS-01, REQ-OPS-02 |
| 05-2 | Production migrations, custom domain | `pending` | REQ-OPS-03, REQ-OPS-04 |

**Depends on**: Phase 03 (env vars must be set)
**Estimated effort**: 2-3 hours
**Verification**: Sentry receives events; rate limiter persists across cold starts; all tables exist in prod DB; domain resolves with SSL

---

## Phase 06: Smoke Testing [BLOCKING]
> Validate every critical path in production environment.

| Plan | Tasks | Status | Requirements |
|------|-------|--------|--------------|
| 06-1 | Free tier, payment, and auth manual smoke tests | `pending` | REQ-VAL-01 through REQ-VAL-03 |
| 06-2 | E2E test suite against production | `pending` | REQ-VAL-04 |

**Depends on**: Phase 05
**Estimated effort**: 2-3 hours
**Verification**: All smoke test checklists pass; Playwright report shows green

---

## Phase 07: Launch [FINAL]
> Send invitations, begin monitoring.

| Plan | Tasks | Status | Requirements |
|------|-------|--------|--------------|
| 07-1 | Pre-launch checklist, beta invitations, 24h monitoring | `pending` | REQ-LCH-01 through REQ-LCH-03 |

**Depends on**: Phase 06
**Estimated effort**: 1 hour
**Verification**: Beta testers can sign up, purchase, and restore

---

## Dependency Graph

```
Phase 01 (Security) ──┬──> Phase 02 (Gating) ──┐
                       │                         │
                       ├──> Phase 03 (Config) ───┤──> Phase 05 (Ops) ──> Phase 06 (Smoke) ──> Phase 07 (Launch)
                       │                         │
Phase 04 (CI/CD) ─────┘ (parallel, non-blocking)│
```

## Execution Waves

| Wave | Phases | Parallelism |
|------|--------|-------------|
| Wave 1 | 01 (Security) | Sequential — must complete first |
| Wave 2 | 02 (Gating), 03 (Config), 04 (CI/CD) | All three in parallel |
| Wave 3 | 05 (Operations) | Sequential — needs Phase 03 |
| Wave 4 | 06 (Smoke Testing) | Sequential — needs Phase 05 |
| Wave 5 | 07 (Launch) | Sequential — needs Phase 06 |

**Total estimated effort**: 13-19 hours
