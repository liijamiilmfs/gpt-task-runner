const { runDictionaryAudit } = require('./lib/dictionary-builder/audit-process');

console.log('=== DICTIONARY AUDIT TOOL ===');
console.log('For Linguistics Team Use');
console.log('Date:', new Date().toISOString());
console.log('');

async function main() {
  try {
    console.log('🔍 Starting dictionary audit...\n');
    
    const auditResult = await runDictionaryAudit();
    
    console.log('\n=== AUDIT SUMMARY ===');
    console.log(`Overall Audit Score: ${auditResult.auditScore}%`);
    console.log(`Total Suspect Entries: ${auditResult.suspectEntries}`);
    
    if (auditResult.suspectEntries > 0) {
      console.log('\n📋 Issues by Category:');
      Object.values(auditResult.auditResults).forEach(result => {
        if (result.issues.length > 0) {
          console.log(`   ${result.category}: ${result.issues.length} issues`);
          console.log(`     - High: ${result.severityCounts.high}`);
          console.log(`     - Medium: ${result.severityCounts.medium}`);
          console.log(`     - Low: ${result.severityCounts.low}`);
        }
      });
      
      console.log('\n📄 Detailed reports generated:');
      console.log('   - audit-report-*.json (structured data)');
      console.log('   - audit-report-*.csv (spreadsheet format)');
      console.log('   - audit-detailed-*.txt (human-readable details)');
      
      console.log('\n🔧 Recommended Actions:');
      console.log('   1. Review high-severity issues first');
      console.log('   2. Check etymological inconsistencies');
      console.log('   3. Verify cultural appropriateness');
      console.log('   4. Validate donor language claims');
      
    } else {
      console.log('\n✅ No suspect entries found!');
      console.log('Dictionary appears to be in good condition.');
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    process.exit(1);
  }
}

main();
