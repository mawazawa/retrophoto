-- Migration 011: Create credit_batches table
-- Feature: Payment Processing
-- Purpose: Track credit purchases by batch for FIFO expiration (1-year lifecycle)

-- Create credit_batches table
CREATE TABLE IF NOT EXISTS credit_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expiration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  credits_purchased INTEGER NOT NULL CHECK (credits_purchased = 10),
  credits_remaining INTEGER NOT NULL CHECK (credits_remaining >= 0 AND credits_remaining <= credits_purchased),
  transaction_id UUID, -- Will reference payment_transactions(id) after migration 012
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Enforce 1-year expiration
  CONSTRAINT expiration_is_one_year CHECK (
    expiration_date = purchase_date + INTERVAL '365 days'
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_batches_user_id ON credit_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_batches_user_fifo ON credit_batches(user_id, purchase_date ASC) WHERE credits_remaining > 0;
CREATE INDEX IF NOT EXISTS idx_credit_batches_expiration ON credit_batches(expiration_date) WHERE credits_remaining > 0;
CREATE INDEX IF NOT EXISTS idx_credit_batches_expiring ON credit_batches(expiration_date) WHERE credits_remaining > 0;

-- Enable Row Level Security
ALTER TABLE credit_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own batches
CREATE POLICY "Users can view own batches"
  ON credit_batches FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can manage all batches
CREATE POLICY "Service can manage batches"
  ON credit_batches FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE credit_batches IS 'Tracks credit purchases by batch for FIFO expiration (1 year from purchase)';
