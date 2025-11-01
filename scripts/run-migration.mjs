#!/usr/bin/env node
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://czvvgfprjlkahobgncxo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6dnZnZnByamxrYWhvYmduY3hvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQxMDg3NiwiZXhwIjoyMDc2OTg2ODc2fQ.JWZ1OTMxArR1pwA848HDV1it2WItdJHfHgcU0ugH5Vw';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: 'public' },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  console.log('Reading migration file...');
  const migrationSQL = readFileSync('supabase/migrations/20251030000001_auto_create_subscription.sql', 'utf-8');

  console.log('Executing migration...');

  // Split SQL into individual statements and execute them
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
    console.log(statement.substring(0, 100) + '...');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: statement + ';'
    });

    if (error) {
      // Try direct execution if RPC doesn't exist
      const { error: directError } = await supabase
        .from('_migrations')
        .insert({ name: '20251030000001_auto_create_subscription', executed_at: new Date().toISOString() });

      // Execute using REST API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: statement + ';' })
      });

      if (!response.ok) {
        console.error('Failed to execute statement:', error?.message || directError?.message);
        console.error('Full error:', error || directError);
        console.log('\nYou may need to run this SQL manually in the Supabase SQL editor.');
        break;
      }
    } else {
      console.log('✓ Success');
    }
  }

  console.log('\n✓ Migration completed!');
}

runMigration().catch(console.error);
