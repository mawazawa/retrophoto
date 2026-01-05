# Next 10 Highest-Leverage Actions (21-30)

> Generated: 2025-12-28
> Status: In Progress
> Previous: NEXT_10_ACTIONS_V2.md (Actions 11-20)

## Overview

This document outlines the next 10 highest-leverage improvements for RetroPhoto, focusing on:
- **Logging Consistency** - Replace console.log with structured logger
- **User Experience** - Toast notifications, loading states
- **Security** - CSRF protection, input sanitization
- **Performance** - Image optimization, query batching
- **Testing** - Enable skipped tests

---

## Action 21: Replace Console Logging with Structured Logger

**Impact**: Medium | **Effort**: Low | **Files**: 4-5

### Problem
API routes mix `console.log/error` calls with structured `logger` calls, causing inconsistent log formats and missing Sentry context.

### Tasks
- [ ] 21.1 Audit `app/api/restore/route.ts` for console.* calls (~20 instances)
- [ ] 21.2 Replace all console.log with logger.info or logger.debug
- [ ] 21.3 Replace all console.error with logger.error
- [ ] 21.4 Audit and fix `app/api/quota/route.ts`
- [ ] 21.5 Audit and fix `app/api/create-checkout-session/route.ts`
- [ ] 21.6 Remove console.* from components (upgrade-prompt, purchase-credits-button)

### Success Criteria
- Zero `console.log` or `console.error` calls in production code
- All logs include structured context (sessionId, fingerprint, etc.)

---

## Action 22: Implement Toast Notification System

**Impact**: Medium | **Effort**: Medium | **Files**: 4-5

### Problem
User errors shown via `alert()` dialogs - poor UX and blocks the main thread.

### Tasks
- [ ] 22.1 Create toast provider component using shadcn/ui toast
- [ ] 22.2 Add Toaster component to root layout
- [ ] 22.3 Create useToast hook for triggering notifications
- [ ] 22.4 Replace alert() in purchase-credits-button.tsx
- [ ] 22.5 Replace alert() in upgrade-prompt.tsx
- [ ] 22.6 Replace alert() in page.tsx (if any)
- [ ] 22.7 Add success/error/warning toast variants

### Success Criteria
- Zero `alert()` calls in codebase
- All user-facing errors shown via toast notifications
- Toast auto-dismisses after 5 seconds

---

## Action 23: Enable Skipped E2E Tests

**Impact**: Medium | **Effort**: Low | **Files**: 1-2

### Problem
Zoom flow test is skipped, reducing test coverage and potentially hiding bugs.

### Tasks
- [ ] 23.1 Review `tests/e2e/zoom-flow.spec.ts` skipped test
- [ ] 23.2 Identify why test was skipped (mobile viewport issue)
- [ ] 23.3 Fix test assertions for desktop viewport
- [ ] 23.4 Unskip test and verify it passes
- [ ] 23.5 Review other test files for skipped tests

### Success Criteria
- All E2E tests enabled and passing
- Test coverage includes zoom functionality

---

## Action 24: Optimize Images with Next.js Image Component

**Impact**: High | **Effort**: Medium | **Files**: 3-4

### Problem
Plain `<img>` tags used instead of Next.js Image, missing automatic WebP conversion, lazy loading, and responsive sizing.

### Tasks
- [ ] 24.1 Update comparison-slider.tsx to use Next.js Image
- [ ] 24.2 Update zoom-viewer.tsx to use Next.js Image
- [ ] 24.3 Update result-client.tsx to use Next.js Image
- [ ] 24.4 Configure next.config.js with image domains (Supabase storage)
- [ ] 24.5 Add proper width/height/priority props
- [ ] 24.6 Test image loading performance improvement

### Success Criteria
- All user-uploaded images use Next.js Image component
- Lighthouse image optimization score improves
- Images served in WebP format when supported

---

## Action 25: Add Loading States to Form Buttons

**Impact**: Medium | **Effort**: Low | **Files**: 2-3

### Problem
Submit buttons don't disable during form submission, allowing double-submit bugs.

### Tasks
- [ ] 25.1 Add `disabled={isUploading}` to upload-zone.tsx submit button
- [ ] 25.2 Add loading spinner to button during upload
- [ ] 25.3 Update button opacity/cursor for disabled state
- [ ] 25.4 Prevent form resubmission during processing
- [ ] 25.5 Add loading state to checkout button

### Success Criteria
- All form buttons disabled during submission
- Visual loading indicator on buttons
- No double-submit possible

---

## Action 26: Add Input Validation for Session IDs

**Impact**: High | **Effort**: Low | **Files**: 2-3

### Problem
Session IDs from URL parameters not validated as UUIDs before database queries.

### Tasks
- [ ] 26.1 Create UUID validation utility function
- [ ] 26.2 Validate session ID in result/[id]/page.tsx before query
- [ ] 26.3 Return 400 error for invalid session IDs
- [ ] 26.4 Validate session_id in API responses
- [ ] 26.5 Add validation to og-card/[sessionId]/route.tsx

### Success Criteria
- All session IDs validated as UUIDs
- Invalid IDs return 400 Bad Request
- No SQL injection possible via session ID

---

## Action 27: Batch Database Queries

**Impact**: Medium | **Effort**: Medium | **Files**: 1-2

### Problem
Result page makes 2 sequential database queries that could be combined.

### Tasks
- [ ] 27.1 Analyze current query pattern in result/[id]/page.tsx
- [ ] 27.2 Create single query with join
- [ ] 27.3 Update TypeScript types for joined response
- [ ] 27.4 Test query performance improvement
- [ ] 27.5 Apply pattern to other N+1 query locations

### Success Criteria
- Result page makes single database query
- Query latency reduced by ~50%

---

## Action 28: Implement CSRF Protection

**Impact**: High | **Effort**: Medium | **Files**: 3-4

### Problem
No CSRF token validation on form submissions, vulnerable to cross-site attacks.

### Tasks
- [ ] 28.1 Create CSRF token generation utility
- [ ] 28.2 Add CSRF token to form submissions
- [ ] 28.3 Validate CSRF token in middleware
- [ ] 28.4 Protect /api/restore endpoint
- [ ] 28.5 Protect /api/create-checkout-session endpoint
- [ ] 28.6 Add double-submit cookie pattern

### Success Criteria
- All state-changing endpoints validate CSRF token
- CSRF token rotates per session
- Failed validation returns 403 Forbidden

---

## Action 29: Add Error Handling to Share Functionality

**Impact**: Low | **Effort**: Low | **Files**: 1

### Problem
Share sheet clipboard operations fail silently without user feedback.

### Tasks
- [ ] 29.1 Add try-catch around navigator.clipboard.writeText
- [ ] 29.2 Show toast on successful copy
- [ ] 29.3 Show toast on failed copy with fallback instructions
- [ ] 29.4 Handle native share API rejection
- [ ] 29.5 Log share failures via structured logger

### Success Criteria
- All share operations provide user feedback
- Clipboard failures show fallback instructions
- Share analytics tracked

---

## Action 30: Add Client-Side Error Toasts for Async Operations

**Impact**: Medium | **Effort**: Low | **Files**: 3-4

### Problem
Components catch errors with console.error but don't inform users.

### Tasks
- [ ] 30.1 Update credit-balance.tsx to show error toast on fetch failure
- [ ] 30.2 Update purchase-history.tsx to show error toast
- [ ] 30.3 Update share-sheet.tsx to show error toast
- [ ] 30.4 Update comparison-slider.tsx error handling
- [ ] 30.5 Add retry button for recoverable errors

### Success Criteria
- All async operation failures show user-friendly toast
- Users can retry failed operations
- Error context logged for debugging

---

## Summary

| Action | Description | Impact | Status |
|--------|-------------|--------|--------|
| 21 | Replace console.* with structured logger | Medium | Pending |
| 22 | Implement toast notification system | Medium | Pending |
| 23 | Enable skipped E2E tests | Medium | Pending |
| 24 | Optimize images with Next.js Image | High | Pending |
| 25 | Add loading states to form buttons | Medium | Pending |
| 26 | Add input validation for session IDs | High | Pending |
| 27 | Batch database queries | Medium | Pending |
| 28 | Implement CSRF protection | High | Pending |
| 29 | Add error handling to share functionality | Low | Pending |
| 30 | Add client-side error toasts | Medium | Pending |

**Total Subtasks**: 58
**Estimated Files Modified**: ~20
