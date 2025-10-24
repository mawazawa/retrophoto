-- Migration 015: Extend user_credits table for payment system
-- Feature: Payment Processing
-- Purpose: Add fields for negative balance support and payment tracking

-- Add new columns to user_credits (if they don't exist)
ALTER TABLE user_credits
  ADD COLUMN IF NOT EXISTS total_credits_purchased INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_expired INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMP WITH TIME ZONE;

-- Remove NOT NULL constraint to allow negative balance (post-refund scenario)
ALTER TABLE user_credits
  ALTER COLUMN available_credits DROP NOT NULL;

-- Add validation constraints
ALTER TABLE user_credits
  ADD CONSTRAINT IF NOT EXISTS chk_available_credits_limit
    CHECK (available_credits >= -1000), -- Prevent extreme negative values from bugs
  ADD CONSTRAINT IF NOT EXISTS chk_total_purchased_positive
    CHECK (total_credits_purchased >= 0),
  ADD CONSTRAINT IF NOT EXISTS chk_expired_positive
    CHECK (credits_expired >= 0);

-- Add comments
COMMENT ON COLUMN user_credits.available_credits IS 'Current usable credits - can be negative after refund if credits were already spent';
COMMENT ON COLUMN user_credits.total_credits_purchased IS 'Lifetime credits purchased through payment system';
COMMENT ON COLUMN user_credits.credits_expired IS 'Lifetime credits expired (1-year expiration policy)';
COMMENT ON COLUMN user_credits.last_purchase_date IS 'Most recent credit purchase date for UI display';

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
