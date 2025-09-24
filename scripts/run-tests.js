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
      } else if (file.endsWith('.test.js') && !file.includes('vitest') && !file.includes('phrase-service')) {
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
  console.log(`Node.js version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Architecture: ${process.arch}`);
  console.log(`Working directory: ${process.cwd()}`);
  
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
    // Check Node.js version to determine if --test-reporter is supported
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    const supportsTestReporter = majorVersion >= 20;
    
    // Build command based on Node.js version
    let command;
    if (supportsTestReporter) {
      command = `node --test --test-reporter=spec ${testFiles.join(' ')}`;
    } else {
      command = `node --test ${testFiles.join(' ')}`;
      console.log(`Node.js ${nodeVersion} detected - using basic test runner (no spec reporter)`);
    }
    
    console.log(`Running: ${command}`);
    
    // Add timeout for CI environment
    const timeoutMs = isCI ? 300000 : 0; // 5 minutes for CI, no timeout for local
    
    if (timeoutMs > 0) {
      console.log(`Running with ${timeoutMs/1000}s timeout for CI environment`);
    }
    
    console.log('Starting test execution...');
    const startTime = Date.now();
    
    execSync(command, { 
      stdio: 'inherit',
      env: { ...process.env, CI: isCI ? 'true' : 'false' },
      timeout: timeoutMs
    });
    
    const endTime = Date.now();
    console.log(`Test execution completed in ${endTime - startTime}ms`);
    console.log('All tests passed!');
  } catch (error) {
    console.error('Tests failed:', error.message);
    console.error('Error details:', {
      name: error.name,
      signal: error.signal,
      code: error.code,
      stack: error.stack
    });
    if (error.signal === 'SIGTERM') {
      console.error('Tests timed out!');
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
