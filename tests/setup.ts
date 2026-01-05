import '@testing-library/jest-dom';

// Set test environment variables for Stripe
// These must be set before any modules load
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_testing'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_fake_secret_for_testing'
process.env.STRIPE_CREDITS_PRICE_ID = 'price_test_fake_price_id'

// Set Supabase environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_key'
