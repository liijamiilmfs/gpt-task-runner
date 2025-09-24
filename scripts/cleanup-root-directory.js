#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Root Directory Cleanup Script for Librán Dictionary
 * 
 * This script organizes the messy root directory by moving files
 * to their appropriate locations.
 */

console.log('🧹 Cleaning up root directory...\n');

// Define file organization structure
const fileOrganization = {
  // Documentation files
  'docs/': [
    'AI_INTEGRATION_SUMMARY.md',
    'DICTIONARY_AUDIT_SYSTEM.md',
    'DICTIONARY_BUILD_SYSTEM.md',
    'CHANGELOG.md',
    'changelog_v1.6.3_to_v1.7.0.md',
    'RELEASE_SUMMARY_v1.7.0.md',
    'V1_ROADMAP.md'
  ],
  
  // Scripts directory
  'scripts/': [
    'ai-enhanced-qa-pipeline.js',
    'analyze-duplicates.js',
    'audit-dictionary.js',
    'build-dictionary.js',
    'cleanup-audit-reports.js',
    'extract-v14-full.js',
    'generate_libran_v1_7_0.js',
    'manage-audit-reports.js',
    'manage-exclusions-v2.js',
    'manage-exclusions.js',
    'merge-tranches-to-v1.6.3.js',
    'quick-test.js',
    'review-proposed-words.js',
    'setup-ai-integration.js',
    'setup-json-priming.js',
    'setup-multi-format-priming.js',
    'test-atomic-save.js',
    'test-audit-simple.js',
    'test-baseline-reference.js',
    'test-cleanup-rule.js',
    'test-hot-reload.js',
    'test-qa-system.js',
    'validate-v1.6.3.js'
  ],
  
  // Examples directory
  'examples/': [
    'example-ai-usage.js',
    'example-json-priming-usage.js',
    'example-multi-format-priming.js',
    'sample-story.txt'
  ],
  
  // Test files
  'test/': [
    'test_fixed_importer.py',
    'test-memory-leak.html'
  ],
  
  // Configuration files (keep in root)
  'root/': [
    'package.json',
    'package-lock.json',
    'next.config.mjs',
    'next-env.d.ts',
    'tailwind.config.js',
    'postcss.config.js',
    'tsconfig.json',
    'tsconfig.test.json',
    'tsconfig.worker.json',
    'tsconfig.tsbuildinfo',
    'vitest.config.mjs',
    'vitest.config.ts',
    'commitlint.config.js',
    'ruleset.json',
    'pyproject.toml',
    'env.example'
  ],
  
  // Project files (keep in root)
  'root/': [
    'README.md',
    'LICENSE',
    'SECURITY.md',
    'CODE_OF_CONDUCT.md',
    'CONTRIBUTING.md',
    'branch_protection.json'
  ]
};

/**
 * Create necessary directories
 */
function createDirectories() {
  console.log('📁 Creating necessary directories...');
  
  const directories = ['docs', 'scripts', 'examples', 'test'];
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`  ✓ Created ${dir}/`);
    } else {
      console.log(`  ✓ ${dir}/ already exists`);
    }
  }
}

/**
 * Move files to their appropriate directories
 */
function moveFiles() {
  console.log('\n📦 Moving files to appropriate directories...');
  
  let movedCount = 0;
  let skippedCount = 0;
  
  for (const [targetDir, files] of Object.entries(fileOrganization)) {
    for (const filename of files) {
      const sourcePath = path.join('.', filename);
      const destPath = path.join(targetDir, filename);
      
      if (fs.existsSync(sourcePath)) {
        try {
          // Ensure target directory exists
          const dirPath = path.dirname(destPath);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          
          // Move file
          fs.renameSync(sourcePath, destPath);
          console.log(`  ✓ Moved ${filename} to ${targetDir}`);
          movedCount++;
        } catch (error) {
          console.log(`  ⚠️ Could not move ${filename}: ${error.message}`);
          skippedCount++;
        }
      } else {
        console.log(`  ⚠️ File not found: ${filename}`);
        skippedCount++;
      }
    }
  }
  
  console.log(`\n📊 Summary: ${movedCount} files moved, ${skippedCount} files skipped`);
}

/**
 * Clean up audit reports directory
 */
function cleanupAuditReports() {
  console.log('\n🧹 Cleaning up audit reports...');
  
  const auditDir = './audit-reports';
  if (fs.existsSync(auditDir)) {
    try {
      // Move to a more organized location
      const newAuditDir = './logs/audit-reports';
      if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs', { recursive: true });
      }
      
      if (!fs.existsSync(newAuditDir)) {
        fs.mkdirSync(newAuditDir, { recursive: true });
      }
      
      // Move all files from old to new location
      const items = fs.readdirSync(auditDir);
      for (const item of items) {
        const sourcePath = path.join(auditDir, item);
        const destPath = path.join(newAuditDir, item);
        
        if (fs.statSync(sourcePath).isDirectory()) {
          // Move directory
          fs.renameSync(sourcePath, destPath);
        } else {
          // Move file
          fs.renameSync(sourcePath, destPath);
        }
      }
      
      // Remove empty audit-reports directory
      fs.rmdirSync(auditDir);
      console.log(`  ✓ Moved audit reports to ${newAuditDir}`);
    } catch (error) {
      console.log(`  ⚠️ Could not move audit reports: ${error.message}`);
    }
  }
}

/**
 * Create a .gitignore update
 */
function updateGitignore() {
  console.log('\n📝 Updating .gitignore...');
  
  const gitignoreAdditions = `
# Cleanup additions
audit-reports/
*.log
*.tmp
*.temp
.DS_Store
Thumbs.db
`;

  try {
    let gitignoreContent = '';
    if (fs.existsSync('.gitignore')) {
      gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
    }
    
    if (!gitignoreContent.includes('# Cleanup additions')) {
      fs.appendFileSync('.gitignore', gitignoreAdditions);
      console.log('  ✓ Updated .gitignore');
    } else {
      console.log('  ✓ .gitignore already updated');
    }
  } catch (error) {
    console.log(`  ⚠️ Could not update .gitignore: ${error.message}`);
  }
}

/**
 * Create a README for the cleaned structure
 */
function createStructureREADME() {
  console.log('\n📚 Creating structure documentation...');
  
  const readmeContent = `# Project Structure

This project has been organized for better maintainability and clarity.

## Directory Structure

- **app/**: Next.js application files
- **lib/**: Core library code
  - **ai-integration/**: AI and machine learning integration
  - **translator/**: Translation engine
- **docs/**: Documentation files
- **scripts/**: Utility and build scripts
- **examples/**: Example usage files
- **test/**: Test files and test utilities
- **data/**: Data files (dictionaries, tranches, etc.)
- **logs/**: Log files and audit reports
- **tools/**: Development tools

## Root Directory

The root directory now contains only essential configuration files:
- Package management: \`package.json\`, \`package-lock.json\`
- Build configuration: \`next.config.mjs\`, \`tsconfig.json\`
- Linting: \`commitlint.config.js\`, \`tailwind.config.js\`
- Project info: \`README.md\`, \`LICENSE\`

## Adding New Files

When adding new files:
- **Scripts**: Place in \`scripts/\`
- **Documentation**: Place in \`docs/\`
- **Examples**: Place in \`examples/\`
- **Tests**: Place in \`test/\`
- **Data**: Place in \`data/\` (follow data organization guidelines)

This structure makes the project easier to navigate and maintain.
`;

  fs.writeFileSync('STRUCTURE.md', readmeContent);
  console.log('  ✓ Created STRUCTURE.md');
}

/**
 * Validate the cleanup
 */
function validateCleanup() {
  console.log('\n✅ Validating cleanup...');
  
  const rootFiles = fs.readdirSync('.').filter(item => {
    const stat = fs.statSync(item);
    return stat.isFile() && !item.startsWith('.');
  });
  
  const expectedRootFiles = [
    'package.json',
    'package-lock.json',
    'next.config.mjs',
    'next-env.d.ts',
    'tailwind.config.js',
    'postcss.config.js',
    'tsconfig.json',
    'tsconfig.test.json',
    'tsconfig.worker.json',
    'tsconfig.tsbuildinfo',
    'vitest.config.mjs',
    'vitest.config.ts',
    'commitlint.config.js',
    'ruleset.json',
    'pyproject.toml',
    'env.example',
    'README.md',
    'LICENSE',
    'SECURITY.md',
    'CODE_OF_CONDUCT.md',
    'CONTRIBUTING.md',
    'branch_protection.json',
    'STRUCTURE.md'
  ];
  
  const unexpectedFiles = rootFiles.filter(file => !expectedRootFiles.includes(file));
  
  if (unexpectedFiles.length === 0) {
    console.log('  ✅ Root directory cleanup successful!');
  } else {
    console.log('  ⚠️ Some unexpected files remain:');
    unexpectedFiles.forEach(file => console.log(`    - ${file}`));
  }
  
  return unexpectedFiles.length === 0;
}

/**
 * Main cleanup function
 */
async function cleanupRootDirectory() {
  try {
    console.log('🎯 Starting root directory cleanup...\n');
    
    // Step 1: Create directories
    createDirectories();
    
    // Step 2: Move files
    moveFiles();
    
    // Step 3: Clean up audit reports
    cleanupAuditReports();
    
    // Step 4: Update .gitignore
    updateGitignore();
    
    // Step 5: Create structure documentation
    createStructureREADME();
    
    // Step 6: Validate cleanup
    const isValid = validateCleanup();
    
    console.log('\n🎉 Root directory cleanup completed!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Files organized into appropriate directories');
    console.log('  ✅ Audit reports moved to logs/');
    console.log('  ✅ .gitignore updated');
    console.log('  ✅ Structure documentation created');
    console.log(`  ${isValid ? '✅' : '⚠️'} Cleanup validation: ${isValid ? 'PASSED' : 'COMPLETED WITH WARNINGS'}`);
    
    console.log('\n📚 Next Steps:');
    console.log('  1. Review the new structure');
    console.log('  2. Update any scripts that reference moved files');
    console.log('  3. Commit the cleaned structure');
    console.log('  4. Update your IDE workspace if needed');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  cleanupRootDirectory();
}

module.exports = {
  cleanupRootDirectory,
  createDirectories,
  moveFiles,
  validateCleanup
};
