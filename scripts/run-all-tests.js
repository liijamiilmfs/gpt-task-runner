#!/usr/bin/env node

/**
 * Comprehensive test runner for both Node.js and Python components
 * Runs translator, API, and importer tests with proper organization
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
  coverage: process.argv.includes('--coverage') || process.argv.includes('-c'),
  parallel: process.argv.includes('--parallel') || process.argv.includes('-p'),
  ci: process.env.CI === 'true' || process.env.NODE_ENV === 'test'
};

function log(message, level = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = config.ci ? `[${timestamp}]` : '';
  
  switch (level) {
    case 'error':
      console.error(`${prefix} ❌ ${message}`);
      break;
    case 'warn':
      console.warn(`${prefix} ⚠️  ${message}`);
      break;
    case 'success':
      console.log(`${prefix} ✅ ${message}`);
      break;
    default:
      console.log(`${prefix} 🔧 ${message}`);
  }
}

function runCommand(command, description, options = {}) {
  log(`Running: ${description}`);
  if (config.verbose) {
    log(`Command: ${command}`);
  }
  
  try {
    const result = execSync(command, { 
      stdio: config.verbose ? 'inherit' : 'pipe',
      encoding: 'utf8',
      ...options
    });
    
    if (!config.verbose && result) {
      log(`Completed: ${description}`, 'success');
    }
    return { success: true, output: result };
  } catch (error) {
    log(`Failed: ${description}`, 'error');
    if (config.verbose) {
      console.error(error.message);
    }
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

function checkPrerequisites() {
  log('Checking prerequisites...');
  
  // Check Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    log(`Node.js version: ${nodeVersion}`, 'success');
  } catch (error) {
    log('Node.js not found', 'error');
    process.exit(1);
  }
  
  // Check npm
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log(`npm version: ${npmVersion}`, 'success');
  } catch (error) {
    log('npm not found', 'error');
    process.exit(1);
  }
  
  // Check Python
  try {
    const pythonVersion = execSync('python --version', { encoding: 'utf8' }).trim();
    log(`Python version: ${pythonVersion}`, 'success');
  } catch (error) {
    log('Python not found', 'error');
    process.exit(1);
  }
  
  // Check if tools/dict_importer exists
  if (!fs.existsSync('tools/dict_importer')) {
    log('tools/dict_importer directory not found', 'error');
    process.exit(1);
  }
  
  log('Prerequisites check completed', 'success');
}

function runNodeJSTests() {
  log('Starting Node.js tests (translator, API, frontend)...');
  
  // Install dependencies
  const installResult = runCommand('npm ci', 'Installing Node.js dependencies');
  if (!installResult.success) {
    return installResult;
  }
  
  // Run linting
  const lintResult = runCommand('npm run lint', 'Running ESLint');
  if (!lintResult.success) {
    return lintResult;
  }
  
  // Run type checking
  const typeCheckResult = runCommand('npm run type-check', 'Running TypeScript type checking');
  if (!typeCheckResult.success) {
    return typeCheckResult;
  }
  
  // Run tests
  const testCommand = config.coverage ? 'npm run test:coverage' : 'npm test';
  const testResult = runCommand(testCommand, 'Running Node.js tests');
  if (!testResult.success) {
    return testResult;
  }
  
  // Build application
  const buildResult = runCommand('npm run build', 'Building application');
  if (!buildResult.success) {
    log('Build failed, trying with clean cache...', 'warn');
    const cleanBuildResult = runCommand('rm -rf .next && npm run build', 'Building with clean cache');
    if (!cleanBuildResult.success) {
      return cleanBuildResult;
    }
  }
  
  log('Node.js tests completed successfully', 'success');
  return { success: true };
}

function runPythonTests() {
  log('Starting Python tests (importer)...');
  
  const importerDir = 'tools/dict_importer';
  
  // Install Python dependencies
  const installResult = runCommand(
    `cd ${importerDir} && python -m pip install --user -e ".[dev]"`,
    'Installing Python dependencies',
    { cwd: process.cwd() }
  );
  if (!installResult.success) {
    return installResult;
  }
  
  // Verify installation
  const verifyResult = runCommand(
    `cd ${importerDir} && python -c "import dict_importer; print('Dictionary importer imported successfully')"`,
    'Verifying Python installation'
  );
  if (!verifyResult.success) {
    return verifyResult;
  }
  
  // Run unit tests
  const unitTestCommand = config.coverage 
    ? `cd ${importerDir} && python -m pytest tests/test_normalize.py tests/test_parse_tables.py tests/test_validation.py --cov=dict_importer --cov-report=xml --cov-report=html -v`
    : `cd ${importerDir} && python -m pytest tests/test_normalize.py tests/test_parse_tables.py tests/test_validation.py -v`;
    
  const unitResult = runCommand(unitTestCommand, 'Running importer unit tests');
  if (!unitResult.success) {
    return unitResult;
  }
  
  // Run integration tests
  const integrationTestCommand = config.coverage
    ? `cd ${importerDir} && python -m pytest tests/test_integration.py tests/test_json_importer.py tests/test_libran_json_importer.py --cov=dict_importer --cov-report=xml --cov-report=html -v`
    : `cd ${importerDir} && python -m pytest tests/test_integration.py tests/test_json_importer.py tests/test_libran_json_importer.py -v`;
    
  const integrationResult = runCommand(integrationTestCommand, 'Running importer integration tests');
  if (!integrationResult.success) {
    return integrationResult;
  }
  
  // Test CLI
  const cliResult = runCommand(
    `cd ${importerDir} && dict-importer --help`,
    'Testing importer CLI'
  );
  if (!cliResult.success) {
    return cliResult;
  }
  
  log('Python tests completed successfully', 'success');
  return { success: true };
}

function generateReport() {
  if (!config.coverage) {
    return;
  }
  
  log('Generating coverage report...');
  
  // Node.js coverage
  if (fs.existsSync('coverage/coverage-summary.json')) {
    log('Node.js coverage summary:', 'success');
    try {
      const summary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
      console.log(JSON.stringify(summary, null, 2));
    } catch (error) {
      log('Could not parse Node.js coverage summary', 'warn');
    }
  }
  
  // Python coverage
  const pythonCoverageFile = 'tools/dict_importer/coverage.xml';
  if (fs.existsSync(pythonCoverageFile)) {
    log('Python coverage report generated', 'success');
  }
}

function main() {
  log('🚀 Starting comprehensive test suite...');
  log(`Configuration: ${JSON.stringify(config, null, 2)}`);
  
  const startTime = Date.now();
  let allTestsPassed = true;
  
  try {
    checkPrerequisites();
    
    if (config.parallel) {
      log('Running tests in parallel...');
      // In a real implementation, you'd use Promise.all or similar
      // For now, we'll run sequentially
    }
    
    // Run Node.js tests
    const nodeResult = runNodeJSTests();
    if (!nodeResult.success) {
      allTestsPassed = false;
    }
    
    // Run Python tests
    const pythonResult = runPythonTests();
    if (!pythonResult.success) {
      allTestsPassed = false;
    }
    
    generateReport();
    
    const duration = Date.now() - startTime;
    
    if (allTestsPassed) {
      log(`🎉 All tests passed! (${duration}ms)`, 'success');
      process.exit(0);
    } else {
      log(`❌ Some tests failed! (${duration}ms)`, 'error');
      process.exit(1);
    }
    
  } catch (error) {
    log(`💥 Test runner crashed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node scripts/run-all-tests.js [options]

Options:
  -v, --verbose    Show detailed output
  -c, --coverage   Generate coverage reports
  -p, --parallel   Run tests in parallel (not implemented yet)
  -h, --help       Show this help message

Environment Variables:
  CI=true          Enable CI mode with reduced output
  NODE_ENV=test    Enable test mode
`);
  process.exit(0);
}

if (require.main === module) {
  main();
}
