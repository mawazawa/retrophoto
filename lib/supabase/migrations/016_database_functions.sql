-- Migration 016: Create database functions for payment processing
-- Feature: Payment Processing
-- Purpose: Server-side logic for credit lifecycle management

-- Function 1: add_credits
-- Purpose: Add credits after successful payment
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_credits_to_add INTEGER,
  p_transaction_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_batch_id UUID;
  v_new_balance INTEGER;
BEGIN
  -- Update user credits
  UPDATE user_credits
  SET
    available_credits = COALESCE(available_credits, 0) + p_credits_to_add,
    total_credits_purchased = COALESCE(total_credits_purchased, 0) + p_credits_to_add,
    last_purchase_date = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING available_credits INTO v_new_balance;

  -- If user doesn't exist, create record
  IF NOT FOUND THEN
    INSERT INTO user_credits (
      user_id,
      available_credits,
      total_credits_purchased,
      credits_used,
      credits_expired,
      last_purchase_date
    ) VALUES (
      p_user_id,
      p_credits_to_add,
      p_credits_to_add,
      0,
      0,
      NOW()
    )
    RETURNING available_credits INTO v_new_balance;
  END IF;

  -- Create credit batch (1-year expiration)
  INSERT INTO credit_batches (
    user_id,
    purchase_date,
    expiration_date,
    credits_purchased,
    credits_remaining,
    transaction_id
  ) VALUES (
    p_user_id,
    NOW(),
    NOW() + INTERVAL '365 days',
    p_credits_to_add,
    p_credits_to_add,
    p_transaction_id
  ) RETURNING id INTO v_batch_id;

  RETURN jsonb_build_object(
    'new_balance', v_new_balance,
    'batch_id', v_batch_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION add_credits IS 'Adds credits to user account and creates batch with 1-year expiration';

-- Function 2: deduct_credit (FIFO)
-- Purpose: Deduct credit from oldest batch first
CREATE OR REPLACE FUNCTION deduct_credit(p_user_id UUID) RETURNS JSONB AS $$
DECLARE
  v_batch_id UUID;
  v_remaining INTEGER;
BEGIN
  -- Find oldest batch with credits (FIFO)
  SELECT id, credits_remaining INTO v_batch_id, v_remaining
  FROM credit_batches
  WHERE user_id = p_user_id
    AND credits_remaining > 0
  ORDER BY purchase_date ASC
  LIMIT 1;

  IF v_batch_id IS NULL THEN
    RAISE EXCEPTION 'No credits available';
  END IF;

  -- Deduct from batch
  UPDATE credit_batches
  SET credits_remaining = credits_remaining - 1
  WHERE id = v_batch_id;

  -- Update user credits
  UPDATE user_credits
  SET
    available_credits = available_credits - 1,
    credits_used = COALESCE(credits_used, 0) + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'batch_id', v_batch_id,
    'remaining_in_batch', v_remaining - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION deduct_credit IS 'Deducts credit using FIFO (First In First Out) from oldest batch';

-- Function 3: process_refund
-- Purpose: Handle refund by deducting credits (can go negative)
CREATE OR REPLACE FUNCTION process_refund(
  p_transaction_id UUID,
  p_stripe_refund_id TEXT,
  p_amount_refunded INTEGER,
  p_currency TEXT
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_credits_deducted INTEGER := 10;
  v_new_balance INTEGER;
BEGIN
  -- Get user ID from transaction
  SELECT user_id INTO v_user_id
  FROM payment_transactions
  WHERE id = p_transaction_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Transaction not found: %', p_transaction_id;
  END IF;

  -- Update transaction status
  UPDATE payment_transactions
  SET status = 'refunded', updated_at = NOW()
  WHERE id = p_transaction_id;

  -- Deduct credits (can go negative if credits already used)
  UPDATE user_credits
  SET
    available_credits = available_credits - v_credits_deducted,
    updated_at = NOW()
  WHERE user_id = v_user_id
  RETURNING available_credits INTO v_new_balance;

  -- Record refund
  INSERT INTO payment_refunds (
    transaction_id,
    stripe_refund_id,
    amount_refunded,
    currency,
    credits_deducted
  ) VALUES (
    p_transaction_id,
    p_stripe_refund_id,
    p_amount_refunded,
    p_currency,
    v_credits_deducted
  );

  RETURN jsonb_build_object(
    'new_balance', v_new_balance,
    'credits_deducted', v_credits_deducted
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_refund IS 'Processes refund by deducting credits (supports negative balance)';

-- Function 4: expire_credits
-- Purpose: Expire credits and update balances (cron job)
CREATE OR REPLACE FUNCTION expire_credits() RETURNS JSONB AS $$
DECLARE
  v_users_affected INTEGER;
  v_total_credits_expired INTEGER := 0;
  v_batch_record RECORD;
BEGIN
  -- Iterate through expired batches and update users
  FOR v_batch_record IN
    SELECT user_id, credits_remaining
    FROM credit_batches
    WHERE expiration_date <= NOW()
      AND credits_remaining > 0
  LOOP
    -- Update user credits
    UPDATE user_credits
    SET
      available_credits = available_credits - v_batch_record.credits_remaining,
      credits_expired = COALESCE(credits_expired, 0) + v_batch_record.credits_remaining,
      updated_at = NOW()
    WHERE user_id = v_batch_record.user_id;

    -- Accumulate total
    v_total_credits_expired := v_total_credits_expired + v_batch_record.credits_remaining;
  END LOOP;

  -- Expire batches (set credits_remaining to 0)
  UPDATE credit_batches
  SET credits_remaining = 0
  WHERE expiration_date <= NOW()
    AND credits_remaining > 0;

  GET DIAGNOSTICS v_users_affected = ROW_COUNT;

  RETURN jsonb_build_object(
    'users_affected', v_users_affected,
    'total_credits_expired', v_total_credits_expired
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expire_credits IS 'Expires credits from batches past their expiration date (run daily via cron)';
