---
phase: 02-invite-gating
plan: 2
type: execute
wave: 2
depends_on:
  - 02-1
files_modified:
  - components/waitlist-gate.tsx
  - components/credits/purchase-credits-button.tsx
autonomous: true
user_setup: []
must_haves:
  truths:
    - Non-allowlisted users see a waitlist message instead of purchase button
    - Waitlist UI is friendly and on-brand (not an error page)
    - Purchase button works normally for allowlisted users
    - Free tier CTA remains visible for everyone
  artifacts:
    - components/waitlist-gate.tsx (new)
    - components/credits/purchase-credits-button.tsx (patched)
  key_links:
    - .planning/02-invite-gating/02-CONTEXT.md
    - components/credits/purchase-credits-button.tsx
    - components/upgrade-prompt.tsx
---

<objective>
Build the client-side waitlist UI that shows non-allowlisted users a friendly "you're on the waitlist" message where the purchase button would normally appear.

This plan handles the user-facing side of invite gating. The server-side enforcement (Plan 02-1) is the actual security boundary — this UI is for user experience only.

Output artifacts:
- New `components/waitlist-gate.tsx` component
- Patched purchase button with conditional rendering
</objective>

<tasks>

<task type="auto">
  <name>Create waitlist gate component</name>
  <files>components/waitlist-gate.tsx</files>
  <action>
    Create a client component that displays a friendly waitlist message. Follow existing component patterns:
    - Use `cn()` from `lib/utils` for class merging
    - Use Tailwind CSS classes consistent with the dark-first design system
    - Minimum 44px touch targets per constitutional principles
    - Mobile-first layout

    The component should:
    1. Display "You're on the waitlist" heading
    2. Brief explanation: "We're rolling out access gradually. You'll be notified when it's your turn."
    3. Link to the contact page (`/contact`) for requesting access
    4. Be visually consistent with the upgrade prompt component
    5. Accept className prop for flexible placement

    Do NOT:
    - Add email collection (use existing contact page instead)
    - Make API calls (this is a pure presentational component)
    - Add complex state management
  </action>
  <verify>
    Run: `npx tsc --noEmit components/waitlist-gate.tsx`
    Expected: no type errors
  </verify>
  <done>
    - `components/waitlist-gate.tsx` exists
    - Renders waitlist message with link to contact page
    - Follows design system conventions (dark-first, 44px touch targets)
    - No TypeScript errors
  </done>
</task>

<task type="auto">
  <name>Conditionally render waitlist gate in purchase flow</name>
  <files>components/credits/purchase-credits-button.tsx</files>
  <action>
    Read the existing purchase credits button component. Modify it to:

    1. Accept an optional `isBetaGated` prop (boolean, default false)
    2. When `isBetaGated` is true, render `<WaitlistGate />` instead of the purchase button
    3. The parent page (`app/app/page.tsx` or wherever the button is rendered) will need to pass this prop based on the user's allowlist status

    Alternatively, if the component already fetches user state, add the check there.

    The key pattern:
    ```tsx
    if (isBetaGated) {
      return <WaitlistGate className={className} />
    }
    // ... existing purchase button code
    ```

    Keep it simple. The server-side check (Plan 02-1) is the real enforcement.
    This UI is purely for user experience.
  </action>
  <verify>
    Run: `npx tsc --noEmit`
    Expected: no type errors across the project
  </verify>
  <done>
    - Purchase button conditionally renders waitlist gate
    - TypeScript compiles without errors
    - No changes to server-side logic (already handled in Plan 02-1)
  </done>
</task>

</tasks>

<verification>
  Goal-backward: What must be TRUE for the user experience to be correct?
  1. A non-allowlisted user sees "You're on the waitlist" where purchase button would be
  2. An allowlisted user sees the normal purchase button
  3. Everyone sees the free tier CTA and can try one restoration
  4. The waitlist message is friendly, not an error
  5. Mobile layout looks correct (44px targets, single column)
</verification>

<success_criteria>
  - Waitlist component renders correctly
  - Purchase button conditionally shows waitlist or purchase
  - TypeScript compiles without errors
  - Visual consistency with existing design system
</success_criteria>

<output>
  Save execution summary to: .planning/02-invite-gating/02-2-SUMMARY.md
</output>
