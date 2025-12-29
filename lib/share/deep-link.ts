// UUID v4 pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate that a string is a valid UUID
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Generates a deep link URL for sharing restoration results
 * @param sessionId - The unique session identifier for the restoration (must be valid UUID)
 * @returns A fully-qualified URL to the result page
 * @throws {Error} If sessionId is invalid (empty, null, undefined, not UUID, or contains path traversal)
 */
export function generateDeepLink(sessionId: string, baseUrlOverride?: string): string {
  // Validate input
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Session ID is required and must be a non-empty string');
  }

  // Trim whitespace
  const trimmedId = sessionId.trim();

  if (trimmedId.length === 0) {
    throw new Error('Session ID cannot be empty or whitespace');
  }

  // Validate UUID format for additional security
  if (!isValidUUID(trimmedId)) {
    throw new Error('Session ID must be a valid UUID format');
  }

  // Check for path traversal attempts (extra security layer)
  if (trimmedId.includes('../') || trimmedId.includes('..\\')) {
    throw new Error('Session ID contains invalid path traversal characters');
  }

  // Check for path separators that could break routing
  if (trimmedId.includes('/') || trimmedId.includes('\\')) {
    throw new Error('Session ID cannot contain path separators');
  }

  // Prefer an explicit base URL provided by the caller (e.g., request origin),
  // then environment variable, then a safe production default.
  let baseUrl =
    baseUrlOverride?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'https://retrophotoai.com';
  // Normalize to avoid double slashes when concatenating
  baseUrl = baseUrl.replace(/\/+$/, '');

  // URL-encode the session ID to handle special characters safely
  const encodedId = encodeURIComponent(trimmedId);

  return `${baseUrl}/result/${encodedId}`;
}
