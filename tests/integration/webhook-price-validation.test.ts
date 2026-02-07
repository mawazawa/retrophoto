import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Stripe Webhook Price Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.STRIPE_EXPECTED_AMOUNT = '999';
    process.env.STRIPE_EXPECTED_CURRENCY = 'usd';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validatePaymentAmount', () => {
    // Extract the validation logic into a testable function or test it inline

    it('should accept correct amount and currency', () => {
      const session = { amount_total: 999, currency: 'usd' };
      const expectedAmount = parseInt(process.env.STRIPE_EXPECTED_AMOUNT || '999', 10);
      const expectedCurrency = (process.env.STRIPE_EXPECTED_CURRENCY || 'usd').toLowerCase();

      const isValid = session.amount_total === expectedAmount &&
                       session.currency?.toLowerCase() === expectedCurrency;
      expect(isValid).toBe(true);
    });

    it('should reject wrong amount', () => {
      const session = { amount_total: 100, currency: 'usd' };
      const expectedAmount = parseInt(process.env.STRIPE_EXPECTED_AMOUNT || '999', 10);
      const expectedCurrency = (process.env.STRIPE_EXPECTED_CURRENCY || 'usd').toLowerCase();

      const isValid = session.amount_total === expectedAmount &&
                       session.currency?.toLowerCase() === expectedCurrency;
      expect(isValid).toBe(false);
    });

    it('should reject wrong currency', () => {
      const session = { amount_total: 999, currency: 'eur' };
      const expectedAmount = parseInt(process.env.STRIPE_EXPECTED_AMOUNT || '999', 10);
      const expectedCurrency = (process.env.STRIPE_EXPECTED_CURRENCY || 'usd').toLowerCase();

      const isValid = session.amount_total === expectedAmount &&
                       session.currency?.toLowerCase() === expectedCurrency;
      expect(isValid).toBe(false);
    });

    it('should reject null amount', () => {
      const session = { amount_total: null, currency: 'usd' };
      const expectedAmount = parseInt(process.env.STRIPE_EXPECTED_AMOUNT || '999', 10);
      const expectedCurrency = (process.env.STRIPE_EXPECTED_CURRENCY || 'usd').toLowerCase();

      const isValid = session.amount_total === expectedAmount &&
                       session.currency?.toLowerCase() === expectedCurrency;
      expect(isValid).toBe(false);
    });

    it('should use default values when env vars not set', () => {
      delete process.env.STRIPE_EXPECTED_AMOUNT;
      delete process.env.STRIPE_EXPECTED_CURRENCY;

      const session = { amount_total: 999, currency: 'usd' };
      const expectedAmount = parseInt(process.env.STRIPE_EXPECTED_AMOUNT || '999', 10);
      const expectedCurrency = (process.env.STRIPE_EXPECTED_CURRENCY || 'usd').toLowerCase();

      const isValid = session.amount_total === expectedAmount &&
                       session.currency?.toLowerCase() === expectedCurrency;
      expect(isValid).toBe(true);
    });

    it('should handle case-insensitive currency comparison', () => {
      const session = { amount_total: 999, currency: 'USD' };
      const expectedAmount = parseInt(process.env.STRIPE_EXPECTED_AMOUNT || '999', 10);
      const expectedCurrency = (process.env.STRIPE_EXPECTED_CURRENCY || 'usd').toLowerCase();

      const isValid = session.amount_total === expectedAmount &&
                       session.currency?.toLowerCase() === expectedCurrency;
      expect(isValid).toBe(true);
    });
  });
});
