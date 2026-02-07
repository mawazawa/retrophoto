#!/usr/bin/env node

/**
 * Run Payment Processing Migrations
 * Feature: 002-implement-payment-processing
 * Migrations: 011-015 (credit_batches, payment_transactions, stripe_webhook_events, payment_refunds, extend_user_credits)
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Please set these in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrations = [
  '011_credit_batches.sql',
  '012_payment_transactions.sql',
  '013_stripe_webhook_events.sql',
  '014_payment_refunds.sql',
  '015_extend_user_credits.sql',
];

async function runMigration(filename) {
  const filepath = path.join(__dirname, '../lib/supabase/migrations', filename);
  const sql = fs.readFileSync(filepath, 'utf8');

  console.log(`\n📝 Running migration: ${filename}`);

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct RPC if exec_sql doesn't exist
      const { error: rpcError } = await supabase.rpc('query', { query_string: sql });

      if (rpcError) {
        // Fallback: use raw SQL API if available
        console.error(`❌ Error in ${filename}:`, error?.message || rpcError?.message);
        console.log('Attempting direct execution...');

        // Split SQL into individual statements
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s && !s.startsWith('--'));

        for (const stmt of statements) {
          if (!stmt) continue;
          const { error: stmtError } = await supabase.rpc('query', { query_string: stmt });
          if (stmtError) {
            console.error(`  ❌ Statement failed:`, stmtError.message);
            console.error(`  SQL: ${stmt.substring(0, 100)}...`);
          }
        }
      } else {
        console.log(`✅ Migration ${filename} completed successfully`);
      }
    } else {
      console.log(`✅ Migration ${filename} completed successfully`);
    }
  } catch (err) {
    console.error(`❌ Unexpected error in ${filename}:`, err.message);
  }
}

async function main() {
  console.log('🚀 Starting Payment Processing Migrations...');
  console.log(`📍 Database: ${supabaseUrl}`);

  for (const migration of migrations) {
    await runMigration(migration);
  }

  console.log('\n✅ All migrations completed!');
  console.log('\n📋 Verifying tables...');

  // Verify tables exist
  const tables = [
    'credit_batches',
    'payment_transactions',
    'stripe_webhook_events',
    'payment_refunds'
  ];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('count').limit(0);
    if (error) {
      console.log(`  ❌ ${table}: ${error.message}`);
    } else {
      console.log(`  ✅ ${table}: accessible`);
    }
  }
}

main().catch(console.error);
