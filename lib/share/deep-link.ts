/**
 * Generates a deep link URL for sharing restoration results
 * @param sessionId - The unique session identifier for the restoration
 * @returns A fully-qualified URL to the result page
 * @throws {Error} If sessionId is invalid (empty, null, undefined, or contains path traversal)
 */
export function generateDeepLink(sessionId: string): string {
  // Validate input
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Session ID is required and must be a non-empty string');
  }

  // Trim whitespace
  const trimmedId = sessionId.trim();

  if (trimmedId.length === 0) {
    throw new Error('Session ID cannot be empty or whitespace');
  }

  // Check for path traversal attempts
  if (trimmedId.includes('../') || trimmedId.includes('..\\')) {
    throw new Error('Session ID contains invalid path traversal characters');
  }

  // Check for path separators that could break routing
  if (trimmedId.includes('/') || trimmedId.includes('\\')) {
    throw new Error('Session ID cannot contain path separators');
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://retrophoto.app';

  // URL-encode the session ID to handle special characters safely
  const encodedId = encodeURIComponent(trimmedId);

  return `${baseUrl}/result/${encodedId}`;
}
