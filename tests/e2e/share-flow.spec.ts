import { test, expect } from '@playwright/test';
import path from 'path';

// [T019] E2E Test: Share button opens native share sheet with OG card
// This test MUST fail initially (TDD approach)
// Expected to pass after T060 (ShareSheet) and T066 (result page) implementation

test.describe('Share Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Upload an image to reach result page
    await page.goto('/');

    const testImagePath = path.join(__dirname, '../fixtures/test-photo.png');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for result page
    await expect(page.locator('[data-testid="comparison-slider"]')).toBeVisible({
      timeout: 30000,
    });
  });

  test('[T019] should open native share sheet when share button clicked', async ({
    page,
    browserName,
  }) => {
    const shareButton = page.getByRole('button', { name: /share/i });
    await expect(shareButton).toBeVisible();

    // Note: Native share sheet cannot be directly tested in Playwright
    // We test that the share button triggers the Web Share API call

    // Mock navigator.share to verify it's called
    await page.evaluate(() => {
      if (navigator.share) {
        const originalShare = navigator.share.bind(navigator);
        (navigator as any).share = async (data: ShareData) => {
          // Store share data in window for test verification
          (window as any).__shareData = data;
          return Promise.resolve();
        };
      }
    });

    await shareButton.click();

    // Verify share data was populated correctly
    const shareData = await page.evaluate(() => (window as any).__shareData);

    expect(shareData).toBeDefined();
    expect(shareData.title).toContain('RetroPhoto');
    expect(shareData.text).toBeTruthy();
    expect(shareData.url).toContain('/result/');
  });

  test('should show copy link fallback if Web Share API unavailable', async ({ page }) => {
    // Disable Web Share API
    await page.evaluate(() => {
      delete (navigator as any).share;
    });

    await page.goto('/');

    const testImagePath = path.join(__dirname, '../fixtures/test-photo.png');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    await expect(page.locator('[data-testid="comparison-slider"]')).toBeVisible({
      timeout: 30000,
    });

    const shareButton = page.getByRole('button', { name: /share/i });
    await shareButton.click();

    // Fallback should show copy link option
    await expect(page.getByText(/copy link/i)).toBeVisible({ timeout: 2000 });
  });

  test('should generate share artifacts (OG card, GIF, deep link)', async ({ page }) => {
    // Verify share artifacts are available in the result data
    const shareButton = page.getByRole('button', { name: /share/i });
    await expect(shareButton).toBeVisible();

    // Check that result page loaded with share data
    const pageUrl = page.url();
    expect(pageUrl).toContain('/result/');

    // Extract session ID from URL
    const sessionId = pageUrl.split('/result/')[1];
    expect(sessionId).toBeTruthy();

    // Verify OG card endpoint exists
    const ogCardUrl = `/api/og-card/${sessionId}`;
    const ogResponse = await page.request.get(ogCardUrl);
    expect(ogResponse.ok()).toBeTruthy();
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    const shareButton = page.getByRole('button', { name: /share/i });
    await shareButton.focus();

    await expect(shareButton).toBeFocused();

    // Press Enter to trigger share
    await page.keyboard.press('Enter');

    // Share sheet or fallback should appear
    // (We can't fully test native share sheet, but button should trigger action)
  });
});
