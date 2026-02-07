/**
 * Data Access Layer: Upload Sessions
 *
 * Centralized data access for restoration session operations.
 * Sessions have 24-hour TTL and auto-cleanup via cron.
 *
 * Following Next.js 15 best practices:
 * - Server-only data access
 * - Proper error handling
 * - Typed return values
 * - Structured logging
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/observability/logger'
import type { Database } from '@/lib/supabase/types'

type UploadSessionRow = Database['public']['Tables']['upload_sessions']['Row']
type UploadSessionInsert = Database['public']['Tables']['upload_sessions']['Insert']
type SessionStatus = Database['public']['Enums']['session_status']

/**
 * Create a new upload session
 *
 * Sessions are used to track restoration progress and link:
 * - Original uploaded image
 * - Restoration results (via restoration_results table)
 * - User fingerprint
 * - Processing status
 *
 * TTL: 24 hours (auto-cleanup via cron)
 *
 * @param data - Session creation data
 * @param data.original_url - URL of uploaded original image
 * @param data.user_fingerprint - Browser fingerprint
 * @param data.status - Initial status (default: 'pending')
 * @returns Created session record
 * @throws Error if session creation fails
 *
 * @example
 * const session = await createSession({
 *   original_url: 'https://...',
 *   user_fingerprint: fingerprint,
 *   status: 'pending'
 * })
 * console.log(`Created session ${session.id}`)
 */
export async function createSession(data: {
  original_url: string
  user_fingerprint: string
  status?: SessionStatus
}): Promise<UploadSessionRow> {
  const supabase = await createClient()

  const sessionData: UploadSessionInsert = {
    original_url: data.original_url,
    user_fingerprint: data.user_fingerprint,
    status: data.status || 'pending',
    // TTL is set to 24 hours from now by database default
  }

  const { data: session, error } = await supabase
    .from('upload_sessions')
    .insert(sessionData)
    .select()
    .single()

  if (error) {
    logger.error('Failed to create upload session', {
      fingerprint: data.user_fingerprint,
      error: error.message,
      code: error.code,
      operation: 'dal.createSession',
    })
    throw new Error(`Failed to create session: ${error.message}`)
  }

  if (!session) {
    throw new Error('Session created but no data returned')
  }

  logger.debug('Upload session created', {
    sessionId: session.id,
    fingerprint: data.user_fingerprint,
    status: session.status,
    operation: 'dal.createSession',
  })

  return session
}

/**
 * Get session by ID
 *
 * @param sessionId - UUID of the session
 * @returns Session record or null if not found
 * @throws Error if database query fails (excluding PGRST116)
 *
 * @example
 * const session = await getSession(sessionId)
 * if (!session) {
 *   return { error: 'Session not found', error_code: 'SESSION_NOT_FOUND' }
 * }
 * console.log(`Session status: ${session.status}`)
 */
export async function getSession(
  sessionId: string
): Promise<UploadSessionRow | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('upload_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  // PGRST116 = "no rows returned" - expected when session doesn't exist or expired
  if (error && error.code !== 'PGRST116') {
    logger.error('Failed to get upload session', {
      sessionId,
      error: error.message,
      code: error.code,
      operation: 'dal.getSession',
    })
    throw new Error(`Failed to get session: ${error.message}`)
  }

  return data || null
}

/**
 * Update session status
 *
 * Status flow: pending → processing → complete/failed
 * Also increments retry_count when status changes to 'processing'
 *
 * @param sessionId - UUID of the session
 * @param status - New status ('pending', 'processing', 'complete', 'failed')
 * @returns Updated session record
 * @throws Error if update fails
 *
 * @example
 * // Start processing
 * await updateSessionStatus(sessionId, 'processing')
 *
 * // Mark complete
 * await updateSessionStatus(sessionId, 'complete')
 *
 * // Handle failure
 * await updateSessionStatus(sessionId, 'failed')
 */
export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus
): Promise<UploadSessionRow> {
  const supabase = await createClient()

  // Get current session to check retry count
  const { data: currentSession } = await supabase
    .from('upload_sessions')
    .select('retry_count')
    .eq('id', sessionId)
    .single()

  const updateData: Partial<UploadSessionRow> = {
    status,
  }

  // Increment retry count when moving to 'processing' status
  if (status === 'processing' && currentSession) {
    updateData.retry_count = currentSession.retry_count + 1
  }

  const { data, error } = await supabase
    .from('upload_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update session status', {
      sessionId,
      status,
      error: error.message,
      code: error.code,
      operation: 'dal.updateSessionStatus',
    })
    throw new Error(`Failed to update session status: ${error.message}`)
  }

  if (!data) {
    throw new Error('Session updated but no data returned')
  }

  logger.debug('Session status updated', {
    sessionId,
    oldStatus: currentSession?.retry_count === data.retry_count ? undefined : 'unknown',
    newStatus: status,
    retryCount: data.retry_count,
    operation: 'dal.updateSessionStatus',
  })

  return data
}

/**
 * Get session with restoration results
 *
 * Joins with restoration_results table to get complete session data.
 * Useful for result pages and status checks.
 *
 * @param sessionId - UUID of the session
 * @returns Session with restoration results or null if not found
 * @throws Error if database query fails
 *
 * @example
 * const session = await getSessionWithResults(sessionId)
 * if (session?.restoration_results) {
 *   console.log(`Restored image: ${session.restoration_results.restored_url}`)
 * }
 */
export async function getSessionWithResults(sessionId: string): Promise<
  | (UploadSessionRow & {
      restoration_results:
        | Database['public']['Tables']['restoration_results']['Row']
        | null
    })
  | null
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('upload_sessions')
    .select(
      `
      *,
      restoration_results (*)
    `
    )
    .eq('id', sessionId)
    .single()

  // PGRST116 = "no rows returned" - expected when session doesn't exist
  if (error && error.code !== 'PGRST116') {
    logger.error('Failed to get session with results', {
      sessionId,
      error: error.message,
      code: error.code,
      operation: 'dal.getSessionWithResults',
    })
    throw new Error(`Failed to get session with results: ${error.message}`)
  }

  // Handle Supabase join syntax - restoration_results may be an array
  if (data && Array.isArray((data as any).restoration_results)) {
    const results = (data as any).restoration_results[0] || null
    return {
      ...data,
      restoration_results: results,
    } as any
  }

  return data as any
}

/**
 * Get sessions by fingerprint
 *
 * Returns all sessions for a given fingerprint, ordered by creation date.
 * Useful for user history and debugging.
 *
 * @param fingerprint - Browser fingerprint
 * @param limit - Maximum number of sessions to return (default: 10)
 * @returns Array of sessions
 * @throws Error if database query fails
 *
 * @example
 * const sessions = await getSessionsByFingerprint(fingerprint, 5)
 * console.log(`User has ${sessions.length} recent sessions`)
 */
export async function getSessionsByFingerprint(
  fingerprint: string,
  limit = 10
): Promise<UploadSessionRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('upload_sessions')
    .select('*')
    .eq('user_fingerprint', fingerprint)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    logger.error('Failed to get sessions by fingerprint', {
      fingerprint,
      error: error.message,
      code: error.code,
      operation: 'dal.getSessionsByFingerprint',
    })
    throw new Error(`Failed to get sessions: ${error.message}`)
  }

  return data || []
}
