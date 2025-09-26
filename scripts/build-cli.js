const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building CLI...');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Compile CLI with TypeScript
try {
  execSync(
    'npx tsc src/cli.ts --outDir dist --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck --declaration',
    { stdio: 'inherit' }
  );

  // Also compile the utils and database files that CLI depends on
  execSync(
    'npx tsc src/utils/schedule-validator.ts --outDir dist/src/utils --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck',
    { stdio: 'inherit' }
  );
  execSync(
    'npx tsc src/database/database.ts --outDir dist/src/database --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck',
    { stdio: 'inherit' }
  );
  execSync(
    'npx tsc src/types.ts --outDir dist/src --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck',
    { stdio: 'inherit' }
  );
  execSync(
    'npx tsc src/logger.ts --outDir dist/src --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck',
    { stdio: 'inherit' }
  );
  execSync(
    'npx tsc src/utils/error-taxonomy.ts --outDir dist/src/utils --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck',
    { stdio: 'inherit' }
  );
  execSync(
    'npx tsc src/utils/exit-codes.ts --outDir dist/src/utils --target es2020 --module commonjs --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck',
    { stdio: 'inherit' }
  );

  console.log('✓ CLI build completed successfully');
} catch (error) {
  console.error('❌ CLI build failed:', error.message);
  process.exit(1);
}
