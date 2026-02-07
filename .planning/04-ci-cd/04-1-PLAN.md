---
phase: 04-ci-cd
plan: 1
type: execute
wave: 2
depends_on: []
files_modified:
  - .github/workflows/ci.yml
autonomous: true
user_setup: []
must_haves:
  truths:
    - PRs to main trigger automated typecheck, lint, test, and build
    - CI fails fast on errors (parallel jobs where possible)
    - Caches node_modules and .next/cache for speed
    - Takes less than 5 minutes for a clean run
  artifacts:
    - .github/workflows/ci.yml (new)
  key_links:
    - package.json
    - tsconfig.json
    - vitest.config.ts
---

<objective>
Create a GitHub Actions CI workflow that runs quality gates on pull requests. This prevents broken code from reaching production.

Output artifacts:
- `.github/workflows/ci.yml` workflow file
</objective>

<tasks>

<task type="auto">
  <name>Create GitHub Actions CI workflow</name>
  <files>.github/workflows/ci.yml</files>
  <action>
    Create `.github/workflows/ci.yml`:

    ```yaml
    name: CI

    on:
      pull_request:
        branches: [main]
      push:
        branches: [main]

    jobs:
      quality:
        name: Quality Gates
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4

          - uses: actions/setup-node@v4
            with:
              node-version: 24
              cache: npm

          - name: Install dependencies
            run: npm ci

          - name: TypeScript check
            run: npm run typecheck

          - name: Lint
            run: npm run lint

          - name: Unit tests
            run: npm test -- --run

          - name: Production build
            run: npm run build
            env:
              NEXT_PUBLIC_SUPABASE_URL: https://placeholder.supabase.co
              NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder
              NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: pk_test_placeholder
              NEXT_PUBLIC_BASE_URL: http://localhost:3000
    ```

    Key decisions:
    - Node 24 LTS "Krypton" (current Active LTS; Node 20 EOL April 2026)
    - `npm ci` for reproducible installs
    - Sequential steps: typecheck → lint → test → build (each fails fast)
    - Placeholder env vars for NEXT_PUBLIC_ variables (needed for build but not for runtime)
    - Do NOT include real secrets in the workflow
    - Do NOT run integration or E2E tests in CI (they need real services)

    Create the `.github/workflows/` directory if it doesn't exist.
  </action>
  <verify>
    Run: `cat .github/workflows/ci.yml`
    Expected: valid YAML with all 4 quality steps

    Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" 2>&1 || echo "Invalid YAML"`
    Expected: no error (may need PyYAML — if not available, skip this check)
  </verify>
  <done>
    - .github/workflows/ci.yml exists
    - Triggers on PRs to main and pushes to main
    - Runs typecheck, lint, test, build
    - Uses Node 20 with npm cache
    - No real secrets in the workflow
  </done>
</task>

<task type="auto">
  <name>Verify production build succeeds locally</name>
  <files>N/A</files>
  <action>
    Run the full quality gate sequence locally to ensure CI will pass:

    1. `npm run typecheck` — must exit 0
    2. `npm run lint` — must exit 0 (warnings acceptable)
    3. `npm test -- --run` — must exit 0
    4. `npm run build` — must exit 0

    If any step fails, fix the issue before committing.
    Common issues:
    - Missing type imports (add `import type { ... }`)
    - Unused variables (prefix with _ or remove)
    - Build-time errors from missing env vars (add NEXT_PUBLIC_ placeholders)
  </action>
  <verify>
    All 4 commands exit with code 0.
  </verify>
  <done>
    - Local quality gates pass
    - CI workflow will succeed when pushed
  </done>
</task>

</tasks>

<verification>
  Goal-backward: What must be TRUE for CI to protect production?
  1. A PR with a TypeScript error fails CI
  2. A PR with a lint error fails CI
  3. A PR with a failing test fails CI
  4. A PR with a build error fails CI
  5. A clean PR passes CI in under 5 minutes
</verification>

<success_criteria>
  - CI workflow file exists and is valid YAML
  - Local build succeeds with all quality gates
  - No real secrets in workflow file
  - Ready to activate on first PR push
</success_criteria>

<output>
  Save execution summary to: .planning/04-ci-cd/04-1-SUMMARY.md
</output>
