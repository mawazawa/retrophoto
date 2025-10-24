-- Migration 014: Create payment_refunds table
-- Feature: Payment Processing
-- Purpose: Track refunds linked to original transactions

-- Create payment_refunds table
CREATE TABLE IF NOT EXISTS payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
  stripe_refund_id TEXT NOT NULL UNIQUE,
  amount_refunded INTEGER NOT NULL CHECK (amount_refunded > 0),
  currency TEXT NOT NULL CHECK (length(currency) = 3),
  credits_deducted INTEGER NOT NULL CHECK (credits_deducted = 10),
  refund_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_refunds_transaction_id ON payment_refunds(transaction_id);
CREATE INDEX IF NOT EXISTS idx_refunds_stripe_id ON payment_refunds(stripe_refund_id);
CREATE INDEX IF NOT EXISTS idx_refunds_date ON payment_refunds(refund_date DESC);

-- Enable Row Level Security
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view refunds for their own transactions
CREATE POLICY "Users can view own refunds"
  ON payment_refunds FOR SELECT
  USING (
    transaction_id IN (
      SELECT id FROM payment_transactions
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Service role can create refunds
CREATE POLICY "Service can create refunds"
  ON payment_refunds FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE payment_refunds IS 'Tracks refunds linked to payment transactions with credit deduction';
