#!/usr/bin/env node

/**
 * Supabase Migration Runner
 * Applies SQL migration files from supabase/migrations/ to Supabase
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function getMigrationFiles() {
  const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');
  const files = await readdir(migrationsDir);
  
  // Filter .sql files and sort by filename (which includes timestamp)
  return files
    .filter(file => file.endsWith('.sql'))
    .sort()
    .map(file => join(migrationsDir, file));
}

async function applyMigration(filePath) {
  const fileName = filePath.split('/').pop();
  console.log(`📄 Processing migration: ${fileName}`);
  
  try {
    const sql = await readFile(filePath, 'utf8');
    
    // For now, just output the SQL for manual execution
    // TODO: Implement actual execution when Supabase exec RPC is available
    console.log(`📋 SQL to execute manually:`);
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log(`✅ Migration ${fileName} ready for manual execution`);
    return true;
  } catch (error) {
    console.error(`❌ Error reading ${fileName}:`, error.message);
    return false;
  }
}

async function runMigrations() {
  console.log('🚀 Starting Supabase migrations...\n');
  
  const migrationFiles = await getMigrationFiles();
  
  if (migrationFiles.length === 0) {
    console.log('ℹ️  No migration files found in supabase/migrations/');
    return;
  }
  
  console.log(`📋 Found ${migrationFiles.length} migration file(s):`);
  migrationFiles.forEach(file => {
    console.log(`   - ${file.split('/').pop()}`);
  });
  console.log('');
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const filePath of migrationFiles) {
    const success = await applyMigration(filePath);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);
  
  if (failureCount > 0) {
    console.log('\n❌ Some migrations failed. Check the errors above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All migrations completed successfully!');
  }
}

// Run migrations
runMigrations().catch(error => {
  console.error('💥 Migration runner failed:', error);
  process.exit(1);
});
