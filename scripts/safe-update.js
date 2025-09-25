#!/usr/bin/env node

/**
 * Safe dependency update script
 * This script helps avoid dependency hell by:
 * 1. Creating a backup of package.json and package-lock.json
 * 2. Running updates in a controlled manner
 * 3. Testing after each update
 * 4. Providing rollback instructions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUP_DIR = path.join(__dirname, '..', '.dependency-backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

function createBackup() {
  console.log('📦 Creating backup of current dependencies...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const backupPath = path.join(BACKUP_DIR, TIMESTAMP);
  fs.mkdirSync(backupPath, { recursive: true });
  
  // Backup package files
  fs.copyFileSync('package.json', path.join(backupPath, 'package.json'));
  fs.copyFileSync('package-lock.json', path.join(backupPath, 'package-lock.json'));
  
  console.log(`✅ Backup created at: ${backupPath}`);
  return backupPath;
}

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function runTests() {
  console.log('\n🧪 Running tests to verify everything still works...');
  return runCommand('npm test -- --run', 'Test suite');
}

function runTypeCheck() {
  console.log('\n🔍 Running TypeScript type check...');
  return runCommand('npm run type-check', 'TypeScript compilation');
}

function runBuild() {
  console.log('\n🏗️ Running build to verify everything compiles...');
  return runCommand('npm run build', 'Next.js build');
}

function restoreBackup(backupPath) {
  console.log('\n🔄 Restoring from backup...');
  try {
    fs.copyFileSync(path.join(backupPath, 'package.json'), 'package.json');
    fs.copyFileSync(path.join(backupPath, 'package-lock.json'), 'package-lock.json');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Backup restored successfully');
  } catch (error) {
    console.error('❌ Failed to restore backup:', error.message);
  }
}

function main() {
  const args = process.argv.slice(2);
  const updateType = args[0] || 'audit';
  
  console.log('🚀 Safe Dependency Update Tool');
  console.log('================================');
  
  // Create backup
  const backupPath = createBackup();
  
  let success = false;
  
  try {
    switch (updateType) {
      case 'audit':
        console.log('\n🔒 Running npm audit fix (non-breaking only)...');
        success = runCommand('npm audit fix', 'Security audit fix');
        break;
        
      case 'audit-force':
        console.log('\n⚠️  WARNING: Running npm audit fix --force (may break things!)');
        success = runCommand('npm audit fix --force', 'Force security audit fix');
        break;
        
      case 'update':
        console.log('\n📈 Running npm update...');
        success = runCommand('npm update', 'Package updates');
        break;
        
      default:
        console.log('Usage: node safe-update.js [audit|audit-force|update]');
        process.exit(1);
    }
    
    if (!success) {
      console.log('\n❌ Update failed. Restoring backup...');
      restoreBackup(backupPath);
      process.exit(1);
    }
    
    // Test everything still works
    const testsPass = runTests();
    const typesPass = runTypeCheck();
    const buildPass = runBuild();
    
    if (testsPass && typesPass && buildPass) {
      console.log('\n🎉 SUCCESS! All updates completed and verified.');
      console.log(`💾 Backup available at: ${backupPath}`);
      console.log('🗑️  You can delete the backup if everything looks good.');
    } else {
      console.log('\n❌ Something broke after the update. Restoring backup...');
      restoreBackup(backupPath);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Unexpected error:', error.message);
    restoreBackup(backupPath);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createBackup, runCommand, runTests, runTypeCheck, runBuild, restoreBackup };
