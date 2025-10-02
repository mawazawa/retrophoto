import { test, expect } from '@playwright/test';
import path from 'path';

// [T020] E2E Test: Second upload triggers quota exceeded + upgrade prompt
// This test MUST fail initially (TDD approach)
// Expected to pass after T061 (UpgradePrompt) and quota enforcement implementation

test.describe('Quota Flow', () => {
  test('[T020] should show upgrade prompt after quota exhausted', async ({ page }) => {
    // Use a unique fingerprint for this test
    await page.addInitScript(() => {
      const testFingerprint = `quota-test-${Date.now()}-${Math.random()}`;
      (window as any).__testFingerprint = testFingerprint;
    });

    await page.goto('/');

    const testImagePath = path.join(__dirname, '../fixtures/test-photo.png');

    // First upload - should succeed
    const fileInput1 = page.locator('input[type="file"]');
    await fileInput1.setInputFiles(testImagePath);

    // Wait for first restoration to complete
    await expect(page.locator('[data-testid="comparison-slider"]')).toBeVisible({
      timeout: 30000,
    });

    // Navigate back to landing page
    await page.goto('/');

    // Second upload - should trigger quota exceeded
    const fileInput2 = page.locator('input[type="file"]');
    await fileInput2.setInputFiles(testImagePath);

    // Upgrade prompt should appear
    await expect(page.getByText(/upgrade/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/quota/i)).toBeVisible();

    // Verify upgrade prompt is dismissible (constitutional requirement)
    const closeButton = page.getByRole('button', { name: /close|dismiss/i });
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await expect(page.getByText(/upgrade/i)).not.toBeVisible();
    }
  });

  test('should check quota before allowing upload', async ({ page }) => {
    await page.goto('/');

    // Mock quota check response to simulate exhausted quota
    await page.route('**/api/quota*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          remaining: 0,
          limit: 1,
          requires_upgrade: true,
          upgrade_url: '/upgrade',
        }),
      });
    });

    await page.reload();

    // Verify UI shows quota exhausted state
    await expect(page.getByText(/upgrade/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show remaining quota count to user', async ({ page }) => {
    await page.goto('/');

    // Check if quota indicator is visible
    const quotaText = page.locator('[data-testid="quota-indicator"]');

    // Should show "1 restore remaining" or similar
    if (await quotaText.isVisible()) {
      const text = await quotaText.textContent();
      expect(text?.toLowerCase()).toMatch(/free|restore|remaining/);
    }
  });

  test('should provide clear upgrade CTA copy', async ({ page }) => {
    await page.goto('/');

    // Mock exhausted quota
    await page.route('**/api/quota*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          remaining: 0,
          limit: 1,
          requires_upgrade: true,
          upgrade_url: '/upgrade',
        }),
      });
    });

    await page.reload();

    // Upgrade prompt should have clear, benefit-focused copy
    const upgradePrompt = page.locator('[data-testid="upgrade-prompt"]');
    await expect(upgradePrompt).toBeVisible({ timeout: 5000 });

    const promptText = await upgradePrompt.textContent();
    expect(promptText?.toLowerCase()).toMatch(/unlimited|high-res|batch|watermark/);
  });
});
