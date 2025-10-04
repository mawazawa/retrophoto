#!/usr/bin/env node
/**
 * Apply Payment Processing Migrations to Supabase
 *
 * This script applies migrations 011-016 for the payment processing feature.
 * Uses Supabase service role to execute SQL directly.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sbwgkocarqvonkdlitdx.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNid2drb2NhcnF2b25rZGxpdGR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ2MzI1MiwiZXhwIjoyMDc1MDM5MjUyfQ.6Z5fd4YiRJPw-8Nf7b7cHnWU50WaGSbNP61Qx9YKQns'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkTableExists(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(0)

  return !error
}

async function applySQLFile(filePath, migrationName) {
  console.log(`\n📄 Applying ${migrationName}...`)

  const sql = readFileSync(filePath, 'utf8')

  // Use Supabase SQL execution via REST API
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  }).catch(async () => {
    // Fallback: try to execute via pg-promise or direct SQL
    console.log('   Using alternative execution method...')

    // Create a function to execute raw SQL (this will fail gracefully if not supported)
    const { data, error } = await supabase.rpc('exec', { sql }).catch(() => ({ error: new Error('RPC not available') }))

    if (error) {
      // Last resort: manually execute each statement
      console.log('   Executing statements individually...')
      const statements = sql.split(';').filter(s => s.trim().length > 10)

      for (const statement of statements) {
        // This won't work via supabase-js, but we'll log it
        console.log(`   Statement: ${statement.substring(0, 50)}...`)
      }

      throw new Error('Cannot execute SQL - please apply migrations manually via Supabase Dashboard')
    }

    return { ok: !error, json: async () => ({ data, error }) }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(`Failed to apply ${migrationName}: ${JSON.stringify(error)}`)
  }

  console.log(`✅ ${migrationName} applied successfully`)
  return true
}

async function main() {
  console.log('🚀 Payment Migrations Application Script')
  console.log('=========================================')

  // Check if migrations already applied
  console.log('\n🔍 Checking existing tables...')
  const creditBatchesExists = await checkTableExists('credit_batches')
  const paymentTransactionsExists = await checkTableExists('payment_transactions')

  if (creditBatchesExists && paymentTransactionsExists) {
    console.log('✅ Payment tables already exist. Migrations may have been applied.')
    console.log('\nTo verify, run:')
    console.log('  SELECT COUNT(*) FROM credit_batches;')
    console.log('  SELECT COUNT(*) FROM payment_transactions;')
    return
  }

  console.log('\n⚠️  IMPORTANT: Supabase JS client cannot execute DDL statements directly.')
  console.log('Please apply migrations manually via Supabase Dashboard:\n')
  console.log('1. Go to: https://supabase.com/dashboard/project/sbwgkocarqvonkdlitdx/sql/new')
  console.log('2. Copy and paste the SQL from each migration file in order:')
  console.log('   - lib/supabase/migrations/011_credit_batches.sql')
  console.log('   - lib/supabase/migrations/012_payment_transactions.sql')
  console.log('   - lib/supabase/migrations/013_stripe_webhook_events.sql')
  console.log('   - lib/supabase/migrations/014_payment_refunds.sql')
  console.log('   - lib/supabase/migrations/015_extend_user_credits.sql')
  console.log('   - lib/supabase/migrations/016_database_functions.sql')
  console.log('3. Click "Run" for each migration')
  console.log('\nOr use Supabase CLI:')
  console.log('  supabase db push --include-all\n')

  // Show migration file contents for convenience
  const migrationsDir = join(__dirname, '..', 'lib', 'supabase', 'migrations')
  const migrations = [
    '011_credit_batches.sql',
    '012_payment_transactions.sql',
    '013_stripe_webhook_events.sql',
    '014_payment_refunds.sql',
    '015_extend_user_credits.sql',
    '016_database_functions.sql'
  ]

  console.log('📋 Migration file locations:')
  migrations.forEach(file => {
    const fullPath = join(migrationsDir, file)
    console.log(`   ${fullPath}`)
  })
}

main().catch(error => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})
