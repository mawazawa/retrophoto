# Phase 02 Context — Invite-Only Gating

> Decisions locked before planning. Flows to researcher, planner, and checker agents.

## Domain Boundary

Build an email allowlist that gates premium features (purchasing credits) for non-invited users. Free tier remains accessible to everyone. This is lightweight, environment-variable-driven gating — not a full user management system.

## Locked Decisions

### Gating Scope
- **Decision**: Gate the CHECKOUT endpoint, not the `/app` page
- **Rationale**: Constitutional principle "Zero Friction to Wow" — let everyone experience the product. Block at payment, not at entry.
- **Constraint**: Free tier (1 restore via fingerprint) works for ALL users, invited or not.

### Allowlist Storage
- **Decision**: Environment variable (`BETA_ALLOWED_EMAILS`), comma-separated
- **Rationale**: No database table needed. Fast to update via Vercel dashboard. No deploy needed to add users.
- **Alternative rejected**: Supabase table — over-engineered for 10-50 beta testers.

### Domain Allowlist
- **Decision**: Optional `BETA_ALLOWED_DOMAINS` env var (e.g., `@company.com`)
- **Rationale**: Allows entire teams to be invited at once.

### Feature Toggle
- **Decision**: `BETA_MODE_ENABLED=true` enables gating; absent or `false` disables it
- **Rationale**: One env var change to switch from invite-only to public launch.

### Waitlist UI
- **Decision**: Show a "You're on the waitlist" component where the purchase button would be
- **Rationale**: Friendly, not an error. Maintains brand trust.
- **Constraint**: Must include a way for users to request access (email collection or link to contact form).

## Claude's Discretion

- Exact waitlist component copy and styling
- Whether to collect email in the waitlist component or link to existing contact page
- Where in the checkout flow to check the allowlist (prefer early — before creating Stripe session)
- Test file naming and structure
