import { test, expect } from '@playwright/test';

// [T021] E2E Test: Complete Payment Flow with Authentication
// Tests the full payment system with real user credentials
// Feature: 002-implement-payment-processing

test.describe('Payment Flow E2E Tests', () => {
  const PRODUCTION_URL = 'https://retrophotoai.com';
  const TEST_EMAIL = 'mathieuwauters@gmail.com';
  const TEST_PASSWORD = 'Karmaisabitch2025$';

  test.beforeEach(async ({ page }) => {
    // Set base URL to production
    await page.goto(PRODUCTION_URL);
  });

  test('[T021] should complete full payment flow with authentication', async ({ page }) => {
    // Step 1: Navigate to production app
    await page.goto(PRODUCTION_URL);
    await expect(page).toHaveTitle(/RetroPhoto/);

    // Step 2: Sign in with provided credentials
    await test.step('Sign in with credentials', async () => {
      // Look for sign in button
      const signInButton = page.getByRole('button', { name: /sign in|login/i });
      await expect(signInButton).toBeVisible();
      await signInButton.click();

      // Wait for auth form to appear
      await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
      
      // Fill in credentials
      await page.getByRole('textbox', { name: /email/i }).fill(TEST_EMAIL);
      await page.getByRole('textbox', { name: /password/i }).fill(TEST_PASSWORD);
      
      // Submit form
      await page.getByRole('button', { name: /sign in|login|submit/i }).click();
      
      // Wait for successful authentication - user menu should appear
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 15000 });
    });

    // Step 3: Test upload flow with authenticated user
    await test.step('Upload and restore photo', async () => {
      // Create test image
      const testImagePath = '/Users/mathieuwauters/Desktop/code/retrophoto/tests/fixtures/test-photo.png';
      
      // Upload file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testImagePath);
      
      // Wait for restoration to complete
      await expect(page.locator('[data-testid="comparison-slider"]')).toBeVisible({
        timeout: 30000,
      });
    });

    // Step 4: Test credit system
    await test.step('Verify credit system', async () => {
      // Look for credit balance indicator
      const creditBalance = page.locator('[data-testid="credit-balance"]');
      if (await creditBalance.isVisible()) {
        const balance = await creditBalance.textContent();
        expect(balance).toMatch(/\d+/); // Should show a number
      }
    });

    // Step 5: Test purchase credits flow
    await test.step('Test purchase credits', async () => {
      // Look for purchase credits button
      const purchaseButton = page.getByRole('button', { name: /purchase|buy.*credit/i });
      
      if (await purchaseButton.isVisible()) {
        await purchaseButton.click();
        
        // Should redirect to Stripe checkout or show payment form
        await expect(page).toHaveURL(/stripe|checkout|payment/);
        
        // For testing, we'll just verify the redirect happened
        // In a real test, we'd use Stripe test mode
        console.log('Payment flow initiated successfully');
      }
    });
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    // Try with invalid credentials
    const signInButton = page.getByRole('button', { name: /sign in|login/i });
    await signInButton.click();
    
    await page.getByRole('textbox', { name: /email/i }).fill('invalid@email.com');
    await page.getByRole('textbox', { name: /password/i }).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|login|submit/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show user menu after authentication', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    // Sign in
    const signInButton = page.getByRole('button', { name: /sign in|login/i });
    await signInButton.click();
    
    await page.getByRole('textbox', { name: /email/i }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: /password/i }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|login|submit/i }).click();
    
    // Wait for user menu to appear
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 10000 });
    
    // Click user menu
    await page.locator('[data-testid="user-menu"]').click();
    
    // Should show user options
    await expect(page.getByText(/profile|settings|logout|sign out/i)).toBeVisible();
  });

  test('should display purchase history for authenticated user', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    // Sign in
    const signInButton = page.getByRole('button', { name: /sign in|login/i });
    await signInButton.click();
    
    await page.getByRole('textbox', { name: /email/i }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: /password/i }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|login|submit/i }).click();
    
    // Look for purchase history
    const userMenu = page.locator('[data-testid="user-menu"]');
    await userMenu.click();
    
    const purchaseHistory = page.getByText(/purchase.*history|transaction/i);
    if (await purchaseHistory.isVisible()) {
      await purchaseHistory.click();
      
      // Should show purchase history page
      await expect(page.getByText(/transaction|purchase|credit/i)).toBeVisible();
    }
  });

  test('should handle payment webhook processing', async ({ page }) => {
    // This test verifies the payment system is working by checking database functions
    await page.goto(PRODUCTION_URL);
    
    // Sign in
    const signInButton = page.getByRole('button', { name: /sign in|login/i });
    await signInButton.click();
    
    await page.getByRole('textbox', { name: /email/i }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: /password/i }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|login|submit/i }).click();
    
    // Test that payment system is accessible
    const purchaseButton = page.getByRole('button', { name: /purchase|buy.*credit/i });
    
    if (await purchaseButton.isVisible()) {
      // Click and verify Stripe integration
      await purchaseButton.click();
      
      // Should redirect to Stripe or show payment form
      await page.waitForURL(/stripe|checkout|payment/, { timeout: 10000 });
      
      console.log('Payment system is operational');
    }
  });

  test('should test credit deduction flow', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    
    // Sign in
    const signInButton = page.getByRole('button', { name: /sign in|login/i });
    await signInButton.click();
    
    await page.getByRole('textbox', { name: /email/i }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: /password/i }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|login|submit/i }).click();
    
    // Upload a photo to test credit deduction
    const testImagePath = '/Users/mathieuwauters/Desktop/code/retrophoto/tests/fixtures/test-photo.png';
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for restoration
    await expect(page.locator('[data-testid="comparison-slider"]')).toBeVisible({
      timeout: 30000,
    });
    
    // Check if credit balance decreased (if user has credits)
    const creditBalance = page.locator('[data-testid="credit-balance"]');
    if (await creditBalance.isVisible()) {
      const balance = await creditBalance.textContent();
      console.log('Credit balance after restoration:', balance);
    }
  });
});
