import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// [T017] E2E Test: Upload → Restore → Preview flow completes <30s (NSM)
// This test MUST fail initially (TDD approach)
// Expected to pass after T065 (landing page) implementation

test.describe('Upload → Restore → Preview Flow (NSM)', () => {
  test('[T017] should complete full flow within 30 seconds', async ({ page }) => {
    const startTime = Date.now();

    // Navigate to landing page
    await page.goto('/');

    // Wait for upload zone to be visible
    await expect(page.getByRole('button', { name: /upload/i })).toBeVisible();

    // Create a test image file
    const testImagePath = path.join(__dirname, '../fixtures/test-photo.png');
    if (!fs.existsSync(path.dirname(testImagePath))) {
      fs.mkdirSync(path.dirname(testImagePath), { recursive: true });
    }

    // Create minimal 1x1 PNG if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      fs.writeFileSync(testImagePath, pngBuffer);
    }

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for restore progress indicator
    await expect(page.getByText(/restoring/i)).toBeVisible({ timeout: 5000 });

    // Wait for restoration to complete and preview to appear
    await expect(page.locator('[data-testid="comparison-slider"]')).toBeVisible({
      timeout: 25000,
    });

    const endTime = Date.now();
    const nsmSeconds = (endTime - startTime) / 1000;

    // Constitutional requirement: NSM ≤30 seconds
    expect(nsmSeconds).toBeLessThanOrEqual(30);

    // Verify result page elements are visible
    await expect(page.getByRole('button', { name: /share/i })).toBeVisible();
    await expect(page.locator('[data-testid="comparison-slider"]')).toBeVisible();
  });

  test('should show upload zone on landing page', async ({ page }) => {
    await page.goto('/');

    // Verify upload zone is present
    await expect(page.getByText(/upload/i)).toBeVisible();
    await expect(page.locator('input[type="file"]')).toBeAttached();
  });

  test('should show progress indicator during restoration', async ({ page }) => {
    await page.goto('/');

    const testImagePath = path.join(__dirname, '../fixtures/test-photo.png');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Progress indicator should appear
    await expect(page.getByText(/restoring/i)).toBeVisible({ timeout: 5000 });

    // Shimmer effect should be visible (constitutional requirement)
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();
  });
});
