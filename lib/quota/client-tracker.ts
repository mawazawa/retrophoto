/**
 * Client-side quota tracking utilities
 *
 * This file is safe to import in client components
 */
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export async function generateFingerprint(): Promise<string> {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId;
}
