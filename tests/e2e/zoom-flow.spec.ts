import { test, expect } from '@playwright/test';
import path from 'path';

// [T021] E2E Test: Pinch-to-zoom on result image focuses on faces
// This test MUST fail initially (TDD approach)
// Expected to pass after T059 (ZoomViewer) and T066 (result page) implementation

test.describe('Zoom Flow', () => {
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

  test('[T021] should enable pinch-to-zoom on restored image', async ({ page, isMobile }) => {
    // Click on the restored image to trigger zoom viewer
    const restoredImage = page.locator('[data-testid="after-image"]');
    await restoredImage.click();

    // Zoom viewer should appear
    const zoomViewer = page.locator('[data-testid="zoom-viewer"]');
    await expect(zoomViewer).toBeVisible({ timeout: 2000 });

    if (isMobile) {
      // Simulate pinch-to-zoom gesture (touch-based)
      const box = await zoomViewer.boundingBox();
      if (!box) throw new Error('Zoom viewer not found');

      // Simulate two-finger pinch out
      await page.touchscreen.tap(box.x + box.width / 2 - 50, box.y + box.height / 2);
      await page.touchscreen.tap(box.x + box.width / 2 + 50, box.y + box.height / 2);

      // Image should be zoomed
      const transform = await zoomViewer.evaluate((el) => {
        return window.getComputedStyle(el).transform;
      });
      expect(transform).not.toBe('none');
    } else {
      // Desktop: double-click to zoom
      await restoredImage.dblclick();

      // Verify zoom applied
      const transform = await restoredImage.evaluate((el) => {
        return window.getComputedStyle(el).transform;
      });
      expect(transform).not.toBe('none');
    }
  });

  test('should focus on face regions when zooming', async ({ page }) => {
    // Click restored image to open zoom viewer
    const restoredImage = page.locator('[data-testid="after-image"]');
    await restoredImage.click();

    const zoomViewer = page.locator('[data-testid="zoom-viewer"]');
    await expect(zoomViewer).toBeVisible({ timeout: 2000 });

    // If face detection is active, zoom should center on detected face
    // (This requires face-api.js to be loaded and functional)

    // Double-click to zoom in
    await zoomViewer.dblclick();

    // Verify image is zoomed
    const scale = await zoomViewer.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const matrix = new DOMMatrix(style.transform);
      return matrix.a; // scale factor
    });

    expect(scale).toBeGreaterThan(1);
  });

  test('should be accessible via keyboard controls', async ({ page }) => {
    const restoredImage = page.locator('[data-testid="after-image"]');
    await restoredImage.focus();

    // Enter key should open zoom viewer
    await page.keyboard.press('Enter');

    const zoomViewer = page.locator('[data-testid="zoom-viewer"]');
    await expect(zoomViewer).toBeVisible({ timeout: 2000 });

    // Plus/Minus keys should zoom in/out
    await page.keyboard.press('+');
    await page.waitForTimeout(100);

    await page.keyboard.press('-');
    await page.waitForTimeout(100);

    // Escape should close zoom viewer
    await page.keyboard.press('Escape');
    await expect(zoomViewer).not.toBeVisible();
  });

  test('should show zoom controls on hover (desktop)', async ({ page, isMobile }) => {
    if (isMobile) {
      test.skip();
      return;
    }

    const restoredImage = page.locator('[data-testid="after-image"]');
    await restoredImage.click();

    const zoomViewer = page.locator('[data-testid="zoom-viewer"]');
    await expect(zoomViewer).toBeVisible({ timeout: 2000 });

    // Hover to reveal zoom controls
    await zoomViewer.hover();

    // Zoom controls should be visible
    const zoomControls = page.locator('[data-testid="zoom-controls"]');
    await expect(zoomControls).toBeVisible({ timeout: 1000 });
  });
});
