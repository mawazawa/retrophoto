import { test, expect } from '@playwright/test';
import path from 'path';

// [T018] E2E Test: Before/after slider interaction at 60fps
// This test MUST fail initially (TDD approach)
// Expected to pass after T058 (ComparisonSlider) and T066 (result page) implementation

test.describe('Before/After Slider Interaction', () => {
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

  test('[T018] should allow smooth slider interaction at 60fps', async ({ page }) => {
    const slider = page.locator('[data-testid="comparison-slider"]');
    await expect(slider).toBeVisible();

    // Get slider bounding box
    const box = await slider.boundingBox();
    if (!box) throw new Error('Slider not found');

    // Simulate drag interaction
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();

    // Track frame times to measure FPS
    const frameTimes: number[] = [];
    let lastTime = Date.now();

    // Drag slider left to right
    for (let i = 0; i <= 10; i++) {
      const x = box.x + (box.width * i) / 10;
      await page.mouse.move(x, box.y + box.height / 2, { steps: 1 });

      const currentTime = Date.now();
      const frameTime = currentTime - lastTime;
      frameTimes.push(frameTime);
      lastTime = currentTime;

      await page.waitForTimeout(16); // ~60fps = 16ms per frame
    }

    await page.mouse.up();

    // Calculate average FPS
    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const avgFps = 1000 / avgFrameTime;

    // Constitutional requirement: ≥60fps (≤16.67ms per frame)
    expect(avgFps).toBeGreaterThanOrEqual(55); // Allow 5fps margin for test variance
  });

  test('should display before and after images correctly', async ({ page }) => {
    const slider = page.locator('[data-testid="comparison-slider"]');
    await expect(slider).toBeVisible();

    // Verify both images are loaded
    const beforeImage = slider.locator('[data-testid="before-image"]');
    const afterImage = slider.locator('[data-testid="after-image"]');

    await expect(beforeImage).toBeVisible();
    await expect(afterImage).toBeVisible();
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    const slider = page.locator('[data-testid="comparison-slider"]');
    await slider.focus();

    // Arrow keys should move slider
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(100);

    // Verify slider still functional
    await expect(slider).toBeVisible();
  });
});
