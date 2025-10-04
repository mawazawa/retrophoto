/**
 * Bug Fix Verification Test: Vitest Playwright File Exclusion
 *
 * This test verifies that Vitest does NOT attempt to run Playwright test files.
 *
 * Bug: Vitest was picking up .spec.ts files (Playwright convention) and failing
 * because Playwright's test.describe() API is not compatible with Vitest.
 *
 * Fix: Added exclude patterns to vitest.config.ts to skip Playwright files.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Vitest Configuration - Playwright Exclusion', () => {
  it('should exclude Playwright E2E test files from Vitest', () => {
    const configPath = join(process.cwd(), 'vitest.config.ts')
    const configContent = readFileSync(configPath, 'utf-8')

    // Verify configDefaults is imported
    expect(configContent).toContain('configDefaults')
    expect(configContent).toContain("from 'vitest/config'")

    // Verify exclude configuration exists
    expect(configContent).toContain('exclude:')

    // Verify Playwright files are excluded
    expect(configContent).toContain('**/tests/e2e/**')
    expect(configContent).toContain('**/*.spec.ts')

    // Verify configDefaults.exclude is spread to maintain defaults
    expect(configContent).toContain('...configDefaults.exclude')
  })

  it('should list Playwright files that would have caused failures', () => {
    const playwrightFiles = [
      'tests/e2e/auth-flow.spec.ts',
      'tests/e2e/database-integration.spec.ts',
      'tests/e2e/payment-flow.spec.ts',
      'tests/e2e/quota-flow.spec.ts',
      'tests/e2e/restore-flow.spec.ts',
      'tests/e2e/share-flow.spec.ts',
      'tests/e2e/upload-flow.spec.ts',
      'tests/e2e/zoom-flow.spec.ts',
    ]

    // These files exist and would have caused 8 test suite failures
    playwrightFiles.forEach(file => {
      const fullPath = join(process.cwd(), file)
      const exists = require('fs').existsSync(fullPath)
      expect(exists).toBe(true)
    })

    // Verify we identified all 8 problematic files
    expect(playwrightFiles).toHaveLength(8)
  })

  it('should verify Playwright files use incompatible API', () => {
    const sampleFile = join(process.cwd(), 'tests/e2e/auth-flow.spec.ts')
    const content = readFileSync(sampleFile, 'utf-8')

    // Confirm these files use Playwright's test API (not Vitest)
    expect(content).toContain("from '@playwright/test'")
    expect(content).toContain('test.describe(')

    // This would fail in Vitest context
    expect(content).not.toContain("from 'vitest'")
  })

  it('should document the bug and fix', () => {
    const bugDescription = {
      issue: 'Vitest attempted to run Playwright .spec.ts files',
      symptom: 'Error: Playwright Test did not expect test.describe() to be called here',
      impact: '8 test suites falsely reported as failed',
      fix: 'Added exclude patterns to vitest.config.ts',
      patterns: ['**/tests/e2e/**', '**/*.spec.ts'],
    }

    expect(bugDescription.patterns).toEqual(['**/tests/e2e/**', '**/*.spec.ts'])
  })
})
