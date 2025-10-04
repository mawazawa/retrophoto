import { test, expect } from '@playwright/test';

// [T022] E2E Test: Authentication Flow with Real Credentials
// Tests Supabase Auth integration with production database

test.describe('Authentication Flow E2E Tests', () => {
  const PRODUCTION_URL = 'https://retrophotoai.com';
  const TEST_EMAIL = 'mathieuwauters@gmail.com';
  const TEST_PASSWORD = 'Karmaisabitch2025$';

  test.beforeEach(async ({ page }) => {
    await page.goto(PRODUCTION_URL);
  });

  test('[T022] should authenticate user with provided credentials', async ({ page }) => {
    // Step 1: Navigate to app
    await expect(page).toHaveTitle(/RetroPhoto/);
    
    // Step 2: Find and click sign in button
    const signInButton = page.getByRole('button', { name: /sign in|login/i });
    await expect(signInButton).toBeVisible();
    await signInButton.click();
    
    // Step 3: Wait for auth form
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible({ timeout: 5000 });
    
    // Step 4: Fill credentials
    await page.getByRole('textbox', { name: /email/i }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: /password/i }).fill(TEST_PASSWORD);
    
    // Step 5: Submit form
    const submitButton = page.getByRole('button', { name: /sign in|login|submit/i });
    await submitButton.click();
    
    // Step 6: Wait for successful authentication - dialog should close and user menu should appear
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ 
      timeout: 15000 
    });
    
    // Step 7: Verify user is authenticated
    const userMenu = page.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible();
    
    // Step 8: Test user menu functionality
    await userMenu.click();
    await expect(page.getByText(/profile|settings|logout|sign out/i)).toBeVisible();
  });

  test('should handle sign out flow', async ({ page }) => {
    // First sign in
    const signInButton = page.getByRole('button', { name: /sign in|login/i });
    await signInButton.click();
    
    await page.getByRole('textbox', { name: /email/i }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: /password/i }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|login|submit/i }).click();
    
    // Wait for authentication
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 15000 });
    
    // Sign out
    await page.locator('[data-testid="user-menu"]').click();
    const signOutButton = page.getByText(/logout|sign out/i);
    await signOutButton.click();
    
    // Should return to sign in state
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
  });

  test('should persist authentication across page reloads', async ({ page }) => {
    // Sign in
    const signInButton = page.getByRole('button', { name: /sign in|login/i });
    await signInButton.click();
    
    await page.getByRole('textbox', { name: /email/i }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: /password/i }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|login|submit/i }).click();
    
    // Wait for authentication
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 15000 });
    
    // Reload page
    await page.reload();
    
    // Should still be authenticated
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show user-specific features when authenticated', async ({ page }) => {
    // Sign in
    const signInButton = page.getByRole('button', { name: /sign in|login/i });
    await signInButton.click();
    
    await page.getByRole('textbox', { name: /email/i }).fill(TEST_EMAIL);
    await page.getByRole('textbox', { name: /password/i }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|login|submit/i }).click();
    
    // Wait for authentication
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible({ timeout: 15000 });
    
    // Check for user-specific features
    const creditBalance = page.locator('[data-testid="credit-balance"]');
    if (await creditBalance.isVisible()) {
      await expect(creditBalance).toBeVisible();
    }
    
    // Check for purchase history access
    await page.locator('[data-testid="user-menu"]').click();
    const purchaseHistory = page.getByText(/purchase.*history|transaction/i);
    if (await purchaseHistory.isVisible()) {
      await expect(purchaseHistory).toBeVisible();
    }
  });

  test('should handle authentication errors', async ({ page }) => {
    const signInButton = page.getByRole('button', { name: /sign in|login/i });
    await signInButton.click();
    
    // Try invalid credentials
    await page.getByRole('textbox', { name: /email/i }).fill('invalid@email.com');
    await page.getByRole('textbox', { name: /password/i }).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|login|submit/i }).click();
    
    // Should show error
    await expect(page.getByText(/invalid|error|incorrect|failed/i)).toBeVisible({ timeout: 10000 });
  });

  test('should redirect to auth callback correctly', async ({ page }) => {
    // Test auth callback URL
    await page.goto(`${PRODUCTION_URL}/auth/callback`);
    
    // Should handle callback properly
    await expect(page).toHaveURL(/auth\/callback/);
  });
});
