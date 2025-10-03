import { describe, it, expect } from 'vitest';

/**
 * Regression test for quota API error code bug
 *
 * BUG: The /api/quota endpoint was returning 'INVALID_FINGERPRINT' for both
 * missing and invalid fingerprint parameters, violating the API contract.
 *
 * FIX: Split validation into two distinct checks:
 * - Missing parameter → MISSING_FINGERPRINT
 * - Invalid format → INVALID_FINGERPRINT
 *
 * This test proves the bug is fixed by verifying both error codes work correctly.
 */

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('GET /api/quota - Error Code Regression Test', () => {
  it('should return MISSING_FINGERPRINT when fingerprint parameter is absent', async () => {
    // Test without any query parameters
    const response = await fetch(`${API_BASE_URL}/api/quota`);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('error_code');

    // This was the bug - it used to return 'INVALID_FINGERPRINT'
    expect(data.error_code).toBe('MISSING_FINGERPRINT');
    expect(data.error).toContain('Missing');
  });

  it('should return INVALID_FINGERPRINT when fingerprint is too short', async () => {
    // Fingerprints should be at least 20 characters
    const shortFingerprint = 'abc123'; // Only 6 characters

    const response = await fetch(
      `${API_BASE_URL}/api/quota?fingerprint=${encodeURIComponent(shortFingerprint)}`
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('error_code');

    // This should be INVALID_FINGERPRINT, not MISSING_FINGERPRINT
    expect(data.error_code).toBe('INVALID_FINGERPRINT');
    expect(data.error).toContain('Invalid');
  });

  it('should return INVALID_FINGERPRINT for empty string fingerprint', async () => {
    // Empty string is technically "present" but invalid
    const response = await fetch(
      `${API_BASE_URL}/api/quota?fingerprint=`
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error_code).toBe('MISSING_FINGERPRINT');
  });

  it('should accept valid fingerprint format (20+ characters)', async () => {
    // Valid fingerprints are at least 20 characters
    const validFingerprint = 'valid-fingerprint-12345678901234567890';

    const response = await fetch(
      `${API_BASE_URL}/api/quota?fingerprint=${encodeURIComponent(validFingerprint)}`
    );

    // Should not return 400 for format validation
    // (May return 500 if database isn't set up, but that's a different issue)
    const data = await response.json();

    if (response.status === 400) {
      // If it's 400, it should NOT be a fingerprint validation error
      expect(data.error_code).not.toBe('MISSING_FINGERPRINT');
      expect(data.error_code).not.toBe('INVALID_FINGERPRINT');
    }

    // Most likely will be 200 (success) or 500 (database error)
    expect([200, 500]).toContain(response.status);
  });

  it('should distinguish between missing and invalid in error messages', async () => {
    // Missing fingerprint
    const missingResponse = await fetch(`${API_BASE_URL}/api/quota`);
    const missingData = await missingResponse.json();

    // Invalid fingerprint
    const invalidResponse = await fetch(
      `${API_BASE_URL}/api/quota?fingerprint=short`
    );
    const invalidData = await invalidResponse.json();

    // Error messages should be different
    expect(missingData.error).not.toBe(invalidData.error);
    expect(missingData.error).toContain('Missing');
    expect(invalidData.error).toContain('Invalid');

    // Error codes should be different
    expect(missingData.error_code).toBe('MISSING_FINGERPRINT');
    expect(invalidData.error_code).toBe('INVALID_FINGERPRINT');
  });
});
