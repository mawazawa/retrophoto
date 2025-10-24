-- Migration 013: Create stripe_webhook_events table
-- Feature: Payment Processing
-- Purpose: Webhook audit log with idempotency protection

-- Create stripe_webhook_events table
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE, -- Stripe event.id for idempotency
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_status TEXT NOT NULL CHECK (processing_status IN ('pending', 'success', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count <= 3),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_event_id ON stripe_webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON stripe_webhook_events(processing_status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON stripe_webhook_events(created_at DESC);

-- Enable Row Level Security
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role only (no user access to raw webhook data)
CREATE POLICY "Service can manage webhook events"
  ON stripe_webhook_events FOR ALL
  USING (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE stripe_webhook_events IS 'Audit log and idempotency protection for Stripe webhooks';
COMMENT ON COLUMN stripe_webhook_events.event_id IS 'Stripe event.id - unique constraint provides idempotency';
