-- Migration 017: Extend upload_sessions table for payment system integration
-- Feature: Credit System Integration
-- Purpose: Link upload sessions to authenticated users for credit tracking

-- Add user_id column to track authenticated users (nullable for guest uploads)
ALTER TABLE upload_sessions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for efficient user lookups
CREATE INDEX IF NOT EXISTS idx_upload_sessions_user_id ON upload_sessions(user_id);

-- Add comment
COMMENT ON COLUMN upload_sessions.user_id IS 'User ID if authenticated (null for guest uploads with fingerprint only)';

-- Note: This maintains backward compatibility - existing guest sessions remain valid
-- New sessions from authenticated users will have user_id populated
