import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

// Contract tests for POST /api/restore
// These tests MUST fail initially (TDD approach)
// Expected to pass after T050 implementation

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';
const TEST_FINGERPRINT = 'test-fingerprint-abc123def456';

describe('POST /api/restore - Contract Tests', () => {
  let testImageBuffer: Buffer;

  beforeAll(() => {
    // Create a minimal test image (1x1 PNG)
    testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
  });

  it('[T011] should return 200 with session_id for valid image upload', async () => {
    const formData = new FormData();
    formData.append('file', new Blob([testImageBuffer], { type: 'image/png' }), 'test.png');
    formData.append('fingerprint', TEST_FINGERPRINT);

    const response = await fetch(`${API_BASE_URL}/api/restore`, {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('session_id');
    expect(data).toHaveProperty('restored_url');
    expect(data).toHaveProperty('og_card_url');
    expect(data).toHaveProperty('gif_url');
    expect(data).toHaveProperty('deep_link');
    expect(data).toHaveProperty('ttm_seconds');

    // Validate types
    expect(typeof data.session_id).toBe('string');
    expect(typeof data.restored_url).toBe('string');
    expect(typeof data.og_card_url).toBe('string');
    expect(typeof data.gif_url).toBe('string');
    expect(typeof data.deep_link).toBe('string');
    expect(typeof data.ttm_seconds).toBe('number');

    // Validate TTM meets constitutional requirement (≤12s)
    expect(data.ttm_seconds).toBeLessThanOrEqual(12);
  });

  it('[T012] should return 400 for oversized image (>20MB)', async () => {
    // Create a buffer that simulates >20MB (21MB of zeros)
    const oversizedBuffer = Buffer.alloc(21 * 1024 * 1024);

    const formData = new FormData();
    formData.append('file', new Blob([oversizedBuffer], { type: 'image/jpeg' }), 'large.jpg');
    formData.append('fingerprint', TEST_FINGERPRINT);

    const response = await fetch(`${API_BASE_URL}/api/restore`, {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('error_code');
    expect(data.error_code).toBe('FILE_TOO_LARGE');
  });

  it('[T013] should return 400 for invalid file type', async () => {
    const textContent = Buffer.from('This is not an image');

    const formData = new FormData();
    formData.append('file', new Blob([textContent], { type: 'text/plain' }), 'test.txt');
    formData.append('fingerprint', TEST_FINGERPRINT);

    const response = await fetch(`${API_BASE_URL}/api/restore`, {
      method: 'POST',
      body: formData,
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('error_code');
    expect(data.error_code).toBe('INVALID_FILE_TYPE');
  });

  it('[T014] should return 429 when quota exhausted', async () => {
    const exhaustedFingerprint = 'exhausted-fingerprint-xyz789';

    // First, exhaust the quota by making one successful restore
    const formData1 = new FormData();
    formData1.append('file', new Blob([testImageBuffer], { type: 'image/png' }), 'test.png');
    formData1.append('fingerprint', exhaustedFingerprint);

    const response1 = await fetch(`${API_BASE_URL}/api/restore`, {
      method: 'POST',
      body: formData1,
    });

    // First restore should succeed (or may already be exhausted)
    if (response1.status === 200) {
      // Now try a second restore
      const formData2 = new FormData();
      formData2.append(
        'file',
        new Blob([testImageBuffer], { type: 'image/png' }),
        'test2.png'
      );
      formData2.append('fingerprint', exhaustedFingerprint);

      const response2 = await fetch(`${API_BASE_URL}/api/restore`, {
        method: 'POST',
        body: formData2,
      });

      expect(response2.status).toBe(429);

      const data = await response2.json();
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('error_code');
      expect(data.error_code).toBe('QUOTA_EXCEEDED');
      expect(data).toHaveProperty('upgrade_url');
    } else if (response1.status === 429) {
      // Quota already exhausted, test passes
      const data = await response1.json();
      expect(data.error_code).toBe('QUOTA_EXCEEDED');
    }
  });
});
