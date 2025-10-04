import '@testing-library/jest-dom';

// Set test environment variables for Stripe
// These must be set before any modules load
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_testing'
process.env.STRIPE_CREDITS_PRICE_ID = 'price_test_fake_price_id'
