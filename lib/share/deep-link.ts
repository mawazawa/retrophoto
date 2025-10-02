export function generateDeepLink(sessionId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://retrophoto.app';
  return `${baseUrl}/result/${sessionId}`;
}
