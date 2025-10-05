# Contributing to RetroPhoto

Thank you for considering contributing to RetroPhoto! This document outlines the development workflow and code standards.

## 📋 Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account (for database testing)
- Replicate API key (for AI restoration testing)

## 🚀 Getting Started

1. **Fork and Clone**

```bash
git clone https://github.com/YOUR_USERNAME/retrophoto.git
cd retrophoto
npm install
```

2. **Environment Setup**

```bash
cp .env.local.example .env.local
# Edit .env.local with your test credentials
```

3. **Run Database Migrations**

```bash
# See supabase/migrations/README.md for instructions
```

4. **Start Development Server**

```bash
npm run dev
```

## 🏗️ Development Workflow

### Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `fix/*`: Bug fixes
- `docs/*`: Documentation updates

### Feature Development

1. **Create Feature Branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Write Tests First** (TDD approach)

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

3. **Implement Feature**

Follow constitutional principles (see `.specify/memory/constitution.md`)

4. **Type Check**

```bash
npm run typecheck
```

5. **Run Linter**

```bash
npm run lint
```

6. **Commit with Conventional Commits**

```bash
git commit -m "feat: add zoom gesture support for mobile

- Implement pinch-to-zoom for iOS/Android
- Add double-tap to zoom
- Test on iPhone 13 and Pixel 7

Closes #123

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

7. **Push and Create PR**

```bash
git push origin feature/your-feature-name
```

## 📝 Code Standards

### TypeScript

- **Strict mode**: Always enabled
- **No `any`**: Use proper typing
- **Prefer interfaces**: For object shapes
- **Use const assertions**: For literal types

```typescript
// ✅ Good
interface UploadResult {
  sessionId: string
  restoredUrl: string
}

// ❌ Bad
function processUpload(data: any) {
  // ...
}
```

### React Components

- **Functional components**: No class components
- **Named exports**: For components
- **Props interfaces**: Always define prop types
- **Client components**: Mark with `"use client"` when needed

```typescript
// ✅ Good
interface ButtonProps {
  label: string
  onClick: () => void
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>
}

// ❌ Bad
export default function({ label, onClick }) {
  return <button onClick={onClick}>{label}</button>
}
```

### File Organization

- **Max 500 lines**: Split larger files into modules
- **Co-locate tests**: `component.tsx` + `component.test.tsx`
- **Barrel exports**: Use `index.ts` for clean imports

### Naming Conventions

- **PascalCase**: Components, types, interfaces
- **camelCase**: Functions, variables
- **snake_case**: Database tables, fields
- **SCREAMING_SNAKE_CASE**: Constants

```typescript
// ✅ Good
const MAX_FILE_SIZE = 20 * 1024 * 1024
interface UploadSession { ... }
function validateImage(file: File) { ... }

// ❌ Bad
const maxfilesize = 20971520
interface upload_session { ... }
function ValidateImage(file: File) { ... }
```

### Performance

- **Lazy loading**: For heavy components
- **Memoization**: Use `useMemo` for expensive calculations
- **Debounce**: For frequent events
- **Image optimization**: Always use next/image when possible

```typescript
// ✅ Good
const ComparisonSlider = lazy(() => import('./comparison-slider'))

const expensiveResult = useMemo(() => {
  return processLargeDataset(data)
}, [data])

// ❌ Bad
import ComparisonSlider from './comparison-slider' // Eager load
const result = processLargeDataset(data) // Runs every render
```

### Accessibility

- **44px touch targets**: Minimum (constitutional requirement)
- **ARIA labels**: For all interactive elements
- **Keyboard navigation**: Tab, Arrow keys, Space, Enter
- **Focus indicators**: Visible on all focusable elements
- **Alt text**: For all images

```tsx
// ✅ Good
<button
  className="min-touch-44"
  aria-label="Upload photo"
  onClick={handleUpload}
>
  Upload
</button>

// ❌ Bad
<div onClick={handleUpload}>Upload</div>
```

## 🧪 Testing Guidelines

### Unit Tests (Vitest)

- **Test behavior**: Not implementation
- **Arrange-Act-Assert**: Clear structure
- **Mock external deps**: Database, API calls
- **Edge cases**: Null, undefined, empty, large values

```typescript
describe('validateImageFile', () => {
  it('should accept valid JPEG files', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

    const result = validateImageFile(file)

    expect(result.valid).toBe(true)
  })
})
```

### E2E Tests (Playwright)

- **User perspective**: Test like a user
- **Page Object Model**: Organize selectors
- **Wait for elements**: Never use hard-coded delays
- **Test data**: Use fixtures

```typescript
test('should upload and restore photo', async ({ page }) => {
  await page.goto('/')

  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles('fixtures/test-photo.jpg')

  await expect(page.locator('[data-testid="result"]')).toBeVisible({
    timeout: 15000
  })
})
```

## 📊 Performance Requirements (Constitutional)

All features must meet these thresholds:

- **TTM p95**: ≤12 seconds
- **TTM p50**: ≤6 seconds
- **NSM**: ≤30 seconds
- **First Interactive**: <1.5 seconds
- **LCP**: <2.5s
- **CLS**: <0.1

Run Lighthouse CI before submitting:

```bash
npm run lighthouse
```

## 🎨 Design System

Follow constitutional design system (Principle XVII):

- **Typography**: 36/24/18/14px hierarchy
- **Colors**: Calm, muted tones
- **Progress**: Shimmer effect (not spinners)
- **Success**: Confetti pulse (2s, dismissible)
- **Haptics**: 50ms tap on key moments

## 📚 Documentation

- **JSDoc**: For complex functions
- **Inline comments**: For non-obvious logic
- **README updates**: For new features
- **Changelog**: Use conventional commits

```typescript
/**
 * Generates a shareable deep link for a restoration result.
 *
 * @param sessionId - UUID of the upload session
 * @param baseUrlOverride - Optional base URL (e.g., request origin)
 * @returns Fully-qualified URL (e.g., https://retrophoto.app/result/abc123)
 *
 * @example
 * const link = generateDeepLink('550e8400-e29b-41d4-a716-446655440000')
 * // Returns: "https://retrophoto.app/result/550e8400-e29b-41d4-a716-446655440000"
 */
export function generateDeepLink(sessionId: string, baseUrlOverride?: string): string {
  const baseUrl = baseUrlOverride || process.env.NEXT_PUBLIC_BASE_URL
  return `${baseUrl}/result/${sessionId}`
}
```

## 🔍 Code Review Checklist

Before requesting review, ensure:

- [ ] All tests pass (`npm test && npm run test:e2e`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Linter passes (`npm run lint`)
- [ ] Performance targets met (`npm run lighthouse`)
- [ ] Accessibility verified (keyboard, screen reader)
- [ ] Touch targets ≥44px
- [ ] No console errors
- [ ] Constitutional principles followed
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow conventional commits

## 🐛 Bug Reports

Include:

1. **Description**: What happened vs. what should happen
2. **Steps to Reproduce**: Numbered list
3. **Environment**: OS, browser, device
4. **Screenshots**: If applicable
5. **Session ID**: From URL or console (for debugging)

## 💡 Feature Requests

Include:

1. **Problem**: What problem does this solve?
2. **User Impact**: Who benefits and how?
3. **Proposed Solution**: How would it work?
4. **Alternatives Considered**: Other approaches
5. **Constitutional Alignment**: Which principles does this support?

## 🤝 Pull Request Guidelines

### PR Title

Use conventional commits format:

```
feat: add zoom gesture support for mobile
fix: resolve quota check race condition
docs: update API documentation
```

### PR Description

Template:

```markdown
## Summary
[Brief description of changes]

## Motivation
[Why is this change needed?]

## Changes
- [Change 1]
- [Change 2]

## Test Plan
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing on [devices/browsers]

## Performance Impact
[Lighthouse scores, bundle size changes]

## Screenshots
[If applicable]

## Constitutional Compliance
- Principle [X]: [How this aligns]

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Review Process

1. **CI Checks**: Must pass before review
2. **Code Review**: At least one approval
3. **Performance Check**: Lighthouse CI must pass
4. **Accessibility Check**: WCAG AA compliance
5. **Merge**: Squash and merge to main

## 📦 Release Process

1. **Version Bump**: `npm version [major|minor|patch]`
2. **Changelog**: Update with conventional commits
3. **Tag**: `git tag v1.0.0`
4. **Push**: `git push origin main --tags`
5. **Deploy**: Auto-deploys via Vercel

## 🙏 Thank You!

Your contributions make RetroPhoto better for everyone. Questions? Open an issue or reach out on [Discord/Slack/Email].

---

**Remember**: We're building for 75 million self-represented litigants who deserve access to justice. Every line of code matters.
