#!/usr/bin/env node

/**
 * Vitest test runner for enhanced importer tests
 * Runs comprehensive tests for normalize, parse, and conflict resolution
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function main() {
  console.log('🧪 Running Enhanced Importer Tests with Vitest');
  console.log('===============================================');

  // Check if test files exist
  const testDir = 'test/vitest';
  if (!fs.existsSync(testDir)) {
    console.log('❌ Test directory not found:', testDir);
    process.exit(1);
  }

  const testFiles = fs.readdirSync(testDir)
    .filter(file => file.endsWith('.test.ts'))
    .map(file => path.join(testDir, file));

  if (testFiles.length === 0) {
    console.log('❌ No test files found in:', testDir);
    process.exit(1);
  }

  console.log(`📁 Found ${testFiles.length} test files:`);
  testFiles.forEach(file => console.log(`  - ${file}`));
  console.log('');

  try {
    console.log('🚀 Starting Vitest...');
    execSync('npx vitest run --config vitest.config.mjs', { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });
    console.log('\n✅ All Vitest tests passed!');
  } catch (error) {
    console.error('\n❌ Vitest tests failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
