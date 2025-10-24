-- Migration 010: Create user_credits table (base table for payment system)
-- Feature: Credit System Foundation
-- Purpose: Create base user_credits table if it doesn't exist

-- Create user_credits table
CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  available_credits INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);

-- Enable Row Level Security
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own credits
CREATE POLICY IF NOT EXISTS "Users can view own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can manage all credits
CREATE POLICY IF NOT EXISTS "Service can manage credits"
  ON user_credits FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE user_credits IS 'User credit balances for paid restoration system';
COMMENT ON COLUMN user_credits.available_credits IS 'Current usable credits (can become negative after refunds)';
COMMENT ON COLUMN user_credits.credits_used IS 'Lifetime credits consumed for restorations';
