#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function findTests(dir) {
  const testFiles = [];
  
  function scanDirectory(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (file.endsWith('.test.js') && !file.includes('vitest')) {
        testFiles.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return testFiles;
}

function main() {
  const testDir = 'dist-test/test';
  const isCI = process.env.CI === 'true';
  
  console.log(`Running in CI: ${isCI}`);
  
  if (!fs.existsSync(testDir)) {
    console.log('No test directory found. Run "npm run build:test" first.');
    process.exit(1);
  }
  
  const testFiles = findTests(testDir);
  
  if (testFiles.length === 0) {
    console.log('No test files found');
    process.exit(0);
  }
  
  console.log(`Found ${testFiles.length} test files:`);
  testFiles.forEach(file => console.log(`  - ${file}`));
  console.log('');
  
  try {
    const command = `node --test --test-reporter=spec ${testFiles.join(' ')}`;
    console.log(`Running: ${command}`);
    execSync(command, { 
      stdio: 'inherit',
      env: { ...process.env, CI: isCI ? 'true' : 'false' }
    });
    console.log('All tests passed!');
  } catch (error) {
    console.error('Tests failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
