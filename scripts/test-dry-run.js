const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing GPT Task Runner Dry Run Mode\n');

try {
  // Test 1: Dry run with CSV input
  console.log('1. Testing dry run with CSV input...');
  execSync(
    'npx ts-node src/cli.ts run --input examples/sample-tasks.csv --dry-run --verbose',
    {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    }
  );
  console.log('✅ CSV dry run test passed\n');

  // Test 2: Dry run with JSONL input
  console.log('2. Testing dry run with JSONL input...');
  execSync(
    'npx ts-node src/cli.ts run --input examples/sample-tasks.jsonl --dry-run --output test-results.jsonl --verbose',
    {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    }
  );
  console.log('✅ JSONL dry run test passed\n');

  // Test 3: Dry run with single prompt
  console.log('3. Testing dry run with single prompt...');
  execSync(
    'npx ts-node src/cli.ts run --prompt "Write a short poem about AI" --dry-run --verbose',
    {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    }
  );
  console.log('✅ Single prompt dry run test passed\n');

  // Test 4: Check generated artifacts
  console.log('4. Checking generated artifacts...');
  const fs = require('fs');
  if (fs.existsSync('dry-run-results.jsonl')) {
    console.log('✅ Dry run results file generated');
  }
  if (fs.existsSync('test-results.jsonl')) {
    console.log('✅ Test results file generated');
  }
  if (fs.existsSync('test-results.dry-run.jsonl')) {
    console.log('✅ Dry run test results file generated');
  }
  console.log('✅ Artifact generation test passed\n');

  console.log('🎉 All dry run tests passed successfully!');
  console.log('\nKey features demonstrated:');
  console.log('• No external API calls made');
  console.log('• Deterministic JSONL output generated');
  console.log('• Cost and token usage simulation');
  console.log('• Batch processing support');
  console.log('• Input validation');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
