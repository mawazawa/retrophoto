/**
 * Integration tests for quota tracking
 *
 * These tests require a Supabase database connection.
 * Run with: npm run test:integration
 *
 * Note: These tests require SUPABASE_URL and SUPABASE_KEY env vars.
 * They will be skipped if the database is not configured.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { checkQuota, incrementQuota } from '@/lib/quota/tracker';

// Skip tests if Supabase is not configured
const skipTests = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

describe.skipIf(skipTests)('Quota Tracker Integration', () => {
  let testFingerprint: string;

  beforeAll(async () => {
    // Generate a unique fingerprint for testing
    testFingerprint = `test-${Date.now()}-${Math.random()}`;
  });

  // Note: Fingerprint generation is client-side only (uses FingerprintJS browser library)
  // and is tested separately in unit tests with proper mocking

  describe('Quota Checking', () => {
    it('should return true for new fingerprint', async () => {
      const newFingerprint = `test-new-${Date.now()}-${Math.random()}`;
      const hasQuota = await checkQuota(newFingerprint);

      expect(hasQuota).toBe(true);
    });

    it('should return false after quota used', async () => {
      const usedFingerprint = `test-used-${Date.now()}-${Math.random()}`;

      // Use the quota
      await incrementQuota(usedFingerprint);

      // Check quota - should return false (no quota remaining)
      const hasQuota = await checkQuota(usedFingerprint);

      expect(hasQuota).toBe(false);
    });

    it('should persist quota state across checks', async () => {
      const persistFingerprint = `test-persist-${Date.now()}-${Math.random()}`;

      // Use quota
      await incrementQuota(persistFingerprint);

      // Verify quota is exhausted
      const hasQuota1 = await checkQuota(persistFingerprint);
      expect(hasQuota1).toBe(false);

      // Check again
      const hasQuota2 = await checkQuota(persistFingerprint);
      expect(hasQuota2).toBe(false);
    });
  });

  describe('Quota Enforcement', () => {
    it('should allow first restore', async () => {
      const newFingerprint = `test-first-${Date.now()}-${Math.random()}`;

      const hasQuota = await checkQuota(newFingerprint);
      expect(hasQuota).toBe(true);
    });

    it('should block second restore', async () => {
      const blockFingerprint = `test-block-${Date.now()}-${Math.random()}`;

      // First restore
      await incrementQuota(blockFingerprint);

      // Second restore attempt
      const hasQuota = await checkQuota(blockFingerprint);
      expect(hasQuota).toBe(false);
    });
  });
});
