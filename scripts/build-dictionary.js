const fs = require('fs');
const path = require('path');

console.log('=== UNIFIED LIBRAN DICTIONARY BUILD SYSTEM ===');
console.log('Version: 1.6.3+');
console.log('Date:', new Date().toISOString());
console.log('');

// Configuration
const CONFIG = {
  tranchesDir: './data/Tranches',
  mergedDir: './data/Tranches/merged',
  deleteDir: './data/Tranches/delete',
  outputFile: './data/UnifiedLibranDictionaryv1.6.3.json',
  qaThreshold: 95, // Minimum QA score required
  phrasebookFile: './data/phrasebook-v1.2.json' // Reference phrasebook
};

// Create directories if they don't exist
function ensureDirectories() {
  [CONFIG.mergedDir, CONFIG.deleteDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

// Main build process
async function buildDictionary() {
  try {
    console.log('🚀 Starting dictionary build process...\n');
    
    // Step 1: Merge tranches
    console.log('STEP 1: MERGING TRANCHES');
    const mergeResult = await mergeTranches();
    
    // Step 2: Move tranches to merged folder
    console.log('\nSTEP 2: MOVING TRANCHES TO MERGED FOLDER');
    await moveTranchesToMerged();
    
    // Step 3: Run QA Process
    console.log('\nSTEP 3: RUNNING QA PROCESS');
    const qaResult = await runQAProcess();
    
    // Step 4: Check QA Score
    console.log('\nSTEP 4: EVALUATING QA RESULTS');
    if (qaResult.overallScore >= CONFIG.qaThreshold) {
      console.log(`✅ QA PASSED: ${qaResult.overallScore}% (threshold: ${CONFIG.qaThreshold}%)`);
      
      // Step 5: Run Dictionary Audit
      console.log('\nSTEP 5: RUNNING DICTIONARY AUDIT');
      const auditResult = await runDictionaryAudit();
      
      // Step 6: Move tranches to delete folder
      console.log('\nSTEP 6: MOVING TRANCHES TO DELETE FOLDER');
      await moveTranchesToDelete();
      
      console.log('\n🎉 DICTIONARY BUILD COMPLETE!');
      console.log(`📊 Final Statistics:`);
      console.log(`   - Total entries: ${mergeResult.totalEntries}`);
      console.log(`   - QA Score: ${qaResult.overallScore}%`);
      console.log(`   - Audit Score: ${auditResult.auditScore}%`);
      console.log(`   - Suspect entries: ${auditResult.suspectEntries}`);
      console.log(`   - Files processed: ${mergeResult.filesProcessed}`);
      
      if (auditResult.suspectEntries > 0) {
        console.log('\n⚠️  AUDIT ALERT: Suspect entries detected');
        console.log('📋 Review audit reports for detailed analysis:');
        console.log('   - Check generated audit-report-*.json for details');
        console.log('   - Review audit-detailed-*.txt for specific issues');
      }
      
    } else {
      console.log(`❌ QA FAILED: ${qaResult.overallScore}% (threshold: ${CONFIG.qaThreshold}%)`);
      console.log('📋 Issues to address:');
      qaResult.issues.forEach(issue => {
        console.log(`   - ${issue.category}: ${issue.count} issues`);
      });
      console.log('\n🔄 Tranches remain in merged folder for review.');
      console.log('🔧 Please address QA issues and run build again.');
    }
    
  } catch (error) {
    console.error('❌ Build process failed:', error.message);
    process.exit(1);
  }
}

// Import the merge function (we'll create this)
async function mergeTranches() {
  const { mergeTranchesToUnified } = require('./lib/dictionary-builder/merge-process');
  return await mergeTranchesToUnified();
}

// Import the QA function (we'll create this)
async function runQAProcess() {
  const { runComprehensiveQA } = require('./lib/dictionary-builder/qa-process');
  return await runComprehensiveQA();
}

// Import the audit function
async function runDictionaryAudit() {
  const { runDictionaryAudit } = require('./lib/dictionary-builder/audit-process');
  return await runDictionaryAudit();
}

// Move tranches to merged folder
async function moveTranchesToMerged() {
  const files = fs.readdirSync(CONFIG.tranchesDir)
    .filter(file => file.endsWith('.json'))
    .filter(file => !file.includes('UnifiedLibranDictionary'))
    .filter(file => !file.includes(' (1)'))
    .filter(file => !file.startsWith('merged'))
    .filter(file => !file.startsWith('delete'));
  
  for (const file of files) {
    const sourcePath = path.join(CONFIG.tranchesDir, file);
    const destPath = path.join(CONFIG.mergedDir, file);
    
    fs.renameSync(sourcePath, destPath);
    console.log(`📦 Moved: ${file} → merged/`);
  }
  
  console.log(`✅ Moved ${files.length} files to merged folder`);
}

// Move tranches to delete folder
async function moveTranchesToDelete() {
  const files = fs.readdirSync(CONFIG.mergedDir)
    .filter(file => file.endsWith('.json'));
  
  for (const file of files) {
    const sourcePath = path.join(CONFIG.mergedDir, file);
    const destPath = path.join(CONFIG.deleteDir, file);
    
    fs.renameSync(sourcePath, destPath);
    console.log(`🗑️  Moved: ${file} → delete/`);
  }
  
  console.log(`✅ Moved ${files.length} files to delete folder`);
}

// Initialize and run
ensureDirectories();
buildDictionary();
