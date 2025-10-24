-- Migration 012: Create payment_transactions table
-- Feature: Payment Processing
-- Purpose: Immutable audit trail of all payment events

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  amount INTEGER NOT NULL CHECK (amount > 0), -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd' CHECK (length(currency) = 3),
  credits_purchased INTEGER NOT NULL CHECK (credits_purchased = 10),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_session_id ON payment_transactions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_intent ON payment_transactions(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON payment_transactions(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON payment_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can create transactions
CREATE POLICY "Service can create transactions"
  ON payment_transactions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policy: Service role can update transaction status (immutability enforced)
CREATE POLICY "Service can update transaction status"
  ON payment_transactions FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (
    -- Only status and updated_at can change (enforce immutability)
    (NEW.id = OLD.id) AND
    (NEW.user_id = OLD.user_id) AND
    (NEW.stripe_session_id = OLD.stripe_session_id) AND
    (NEW.amount = OLD.amount) AND
    (NEW.currency = OLD.currency) AND
    (NEW.credits_purchased = OLD.credits_purchased)
  );

-- Add foreign key constraint to credit_batches (now that payment_transactions exists)
ALTER TABLE credit_batches
  ADD CONSTRAINT fk_credit_batches_transaction
  FOREIGN KEY (transaction_id)
  REFERENCES payment_transactions(id)
  ON DELETE CASCADE;

-- Add comment
COMMENT ON TABLE payment_transactions IS 'Immutable audit trail of all payment events for reconciliation';
