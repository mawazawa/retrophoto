import { describe, it, expect } from 'vitest';

// Contract tests for GET /api/quota
// These tests MUST fail initially (TDD approach)
// Expected to pass after T051 implementation

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('GET /api/quota - Contract Tests', () => {
  it('[T015] should return remaining: 1 for new fingerprint', async () => {
    const newFingerprint = `new-fingerprint-${Date.now()}-${Math.random()}`;

    const response = await fetch(
      `${API_BASE_URL}/api/quota?fingerprint=${encodeURIComponent(newFingerprint)}`
    );

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('remaining');
    expect(data).toHaveProperty('limit');
    expect(data).toHaveProperty('requires_upgrade');

    expect(data.remaining).toBe(1);
    expect(data.limit).toBe(1);
    expect(data.requires_upgrade).toBe(false);
    expect(data).not.toHaveProperty('upgrade_url'); // Not present when remaining > 0
  });

  it('[T016] should return remaining: 0 after 1 restore', async () => {
    const usedFingerprint = `used-fingerprint-${Date.now()}-${Math.random()}`;

    // First, make a restore to exhaust quota
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const formData = new FormData();
    formData.append('file', new Blob([testImageBuffer], { type: 'image/png' }), 'test.png');
    formData.append('fingerprint', usedFingerprint);

    const restoreResponse = await fetch(`${API_BASE_URL}/api/restore`, {
      method: 'POST',
      body: formData,
    });

    // Restore should succeed (200) or quota already exhausted (429)
    expect([200, 429]).toContain(restoreResponse.status);

    // Now check quota
    const quotaResponse = await fetch(
      `${API_BASE_URL}/api/quota?fingerprint=${encodeURIComponent(usedFingerprint)}`
    );

    expect(quotaResponse.status).toBe(200);

    const data = await quotaResponse.json();
    expect(data.remaining).toBe(0);
    expect(data.limit).toBe(1);
    expect(data.requires_upgrade).toBe(true);
    expect(data).toHaveProperty('upgrade_url'); // Present when quota exhausted
    expect(data.upgrade_url).toContain('/upgrade');
  });

  it('should return 400 for missing fingerprint parameter', async () => {
    const response = await fetch(`${API_BASE_URL}/api/quota`);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('error_code');
    expect(data.error_code).toBe('MISSING_FINGERPRINT');
  });

  it('should return 400 for invalid fingerprint format', async () => {
    const invalidFingerprint = 'short'; // Too short (< 20 chars)

    const response = await fetch(
      `${API_BASE_URL}/api/quota?fingerprint=${encodeURIComponent(invalidFingerprint)}`
    );

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('error_code');
    expect(data.error_code).toBe('INVALID_FINGERPRINT');
  });
});
