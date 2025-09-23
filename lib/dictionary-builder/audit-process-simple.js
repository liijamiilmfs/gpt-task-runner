const fs = require('fs');

/**
 * Simplified Dictionary Audit System
 * Focus on the most important checks for linguistics team
 */
async function runDictionaryAudit() {
  console.log('🔍 Starting dictionary audit...');
  
  // Load the unified dictionary
  const dictPath = './data/UnifiedLibranDictionaryv1.6.3.json';
  const dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
  const entries = dictionary.sections.Unified.data;
  
  console.log(`📊 Auditing ${entries.length} entries...`);
  
  // Run simplified audit checks
  const results = {
    suspiciousPatterns: await checkSuspiciousPatterns(entries),
    etymologicalIssues: await checkEtymologicalIssues(entries),
    culturalAnachronisms: await checkCulturalAnachronisms(entries),
    missingNotes: await checkMissingNotes(entries)
  };
  
  // Calculate overall score
  const totalIssues = Object.values(results).reduce((sum, result) => sum + result.issues.length, 0);
  const auditScore = Math.max(0, 100 - (totalIssues * 0.5)); // Simple scoring
  
  // Generate reports
  generateAuditReports(results, entries.length, auditScore);
  
  console.log(`📈 Audit Results:`);
  console.log(`   Audit Score: ${auditScore}%`);
  console.log(`   Total Issues: ${totalIssues}`);
  
  return {
    auditScore,
    totalIssues,
    results
  };
}

/**
 * Check for suspicious patterns (English-like formations)
 */
async function checkSuspiciousPatterns(entries) {
  console.log('  🔍 Checking suspicious patterns...');
  
  const issues = [];
  
  entries.forEach((entry, index) => {
    // Check for English + -or/-on patterns in Ancient
    if (entry.ancient && entry.english) {
      const english = entry.english.toLowerCase();
      const ancient = entry.ancient.toLowerCase();
      
      // Simple similarity check
      if (ancient.includes(english) && (ancient.endsWith('or') || ancient.endsWith('on'))) {
        issues.push({
          type: 'english_or_on_suffix',
          severity: 'high',
          entry,
          index,
          reason: `Ancient form "${entry.ancient}" appears to be English + suffix`,
          recommendation: 'Replace with authentic donor language formation'
        });
      }
    }
    
    // Check for English-like Modern forms
    if (entry.modern && entry.english) {
      const english = entry.english.toLowerCase();
      const modern = entry.modern.toLowerCase();
      
      // Check for obvious English patterns
      if (modern.includes(english) || 
          modern.endsWith('ing') || 
          modern.endsWith('tion') || 
          modern.endsWith('ness')) {
        issues.push({
          type: 'english_like_modern',
          severity: 'medium',
          entry,
          index,
          reason: `Modern form "${entry.modern}" appears English-like`,
          recommendation: 'Use authentic donor language phonology'
        });
      }
    }
  });
  
  return {
    category: 'Suspicious Patterns',
    issues,
    summary: `${issues.length} suspicious patterns found`
  };
}

/**
 * Check for etymological issues
 */
async function checkEtymologicalIssues(entries) {
  console.log('  📚 Checking etymological issues...');
  
  const issues = [];
  
  entries.forEach((entry, index) => {
    // Check for missing notes on complex forms
    if (entry.ancient && entry.ancient.length > 8 && !entry.notes) {
      issues.push({
        type: 'complex_no_notes',
        severity: 'medium',
        entry,
        index,
        reason: `Complex Ancient form "${entry.ancient}" lacks donor language notes`,
        recommendation: 'Add donor language explanation'
      });
    }
    
    // Check for claims without evidence
    if (entry.notes) {
      const notes = entry.notes.toLowerCase();
      
      // Check for Latin claims
      if (notes.includes('lat') && !entry.ancient.match(/us$|um$|ae$|is$/i)) {
        issues.push({
          type: 'latin_claim_mismatch',
          severity: 'low',
          entry,
          index,
          reason: `Claims Latin origin but Ancient form doesn't have Latin ending`,
          recommendation: 'Verify Latin claim or adjust form'
        });
      }
      
      // Check for Hungarian claims
      if (notes.includes('hu') && !entry.modern.match(/á|é|í|ó|ú|ő|ű|cs|dz|gy|ly|ny|sz|ty|zs/)) {
        issues.push({
          type: 'hungarian_claim_mismatch',
          severity: 'low',
          entry,
          index,
          reason: `Claims Hungarian origin but Modern form lacks Hungarian features`,
          recommendation: 'Verify Hungarian claim or adjust form'
        });
      }
    }
  });
  
  return {
    category: 'Etymological Issues',
    issues,
    summary: `${issues.length} etymological issues found`
  };
}

/**
 * Check for cultural anachronisms
 */
async function checkCulturalAnachronisms(entries) {
  console.log('  🏛️ Checking cultural anachronisms...');
  
  const issues = [];
  const anachronisticTerms = [
    'computer', 'internet', 'phone', 'television', 'radio', 'electricity',
    'democracy', 'republic', 'capitalism', 'psychology', 'biology',
    'university', 'hospital', 'library', 'bank', 'insurance',
    'plastic', 'rubber', 'aluminum', 'steel', 'concrete',
    'chocolate', 'coffee', 'tea', 'sugar', 'tobacco'
  ];
  
  entries.forEach((entry, index) => {
    const english = entry.english.toLowerCase();
    
    anachronisticTerms.forEach(term => {
      if (english.includes(term)) {
        issues.push({
          type: 'cultural_anachronism',
          severity: 'high',
          entry,
          index,
          reason: `"${entry.english}" may be culturally anachronistic`,
          recommendation: 'Verify cultural appropriateness'
        });
      }
    });
  });
  
  return {
    category: 'Cultural Anachronisms',
    issues,
    summary: `${issues.length} cultural anachronisms found`
  };
}

/**
 * Check for missing notes on important entries
 */
async function checkMissingNotes(entries) {
  console.log('  📝 Checking missing notes...');
  
  const issues = [];
  const importantTerms = [
    'king', 'queen', 'prince', 'princess', 'duke', 'lord', 'lady',
    'knight', 'warrior', 'soldier', 'priest', 'monk', 'nun',
    'magic', 'spell', 'potion', 'dragon', 'unicorn', 'phoenix',
    'sword', 'shield', 'bow', 'arrow', 'armor', 'helmet',
    'castle', 'palace', 'tower', 'temple', 'church', 'throne'
  ];
  
  entries.forEach((entry, index) => {
    const english = entry.english.toLowerCase();
    
    const isImportant = importantTerms.some(term => 
      english.includes(term) || term.includes(english)
    );
    
    if (isImportant && (!entry.notes || entry.notes.length < 10)) {
      issues.push({
        type: 'important_missing_notes',
        severity: 'medium',
        entry,
        index,
        reason: `Important term "${entry.english}" lacks sufficient notes`,
        recommendation: 'Add cultural or historical context'
      });
    }
  });
  
  return {
    category: 'Missing Notes',
    issues,
    summary: `${issues.length} entries missing important notes`
  };
}

/**
 * Generate audit reports
 */
function generateAuditReports(results, totalEntries, auditScore) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // JSON Report
  const jsonReport = {
    timestamp,
    totalEntries,
    auditScore,
    categories: Object.values(results).map(r => ({
      category: r.category,
      issues: r.issues.length,
      summary: r.summary
    })),
    detailedIssues: Object.values(results).flatMap(r => r.issues || [])
  };
  
  fs.writeFileSync(`./audit-report-${timestamp}.json`, JSON.stringify(jsonReport, null, 2));
  
  // CSV Report
  const csvLines = ['Category,Issues,Summary'];
  Object.values(results).forEach(r => {
    csvLines.push(`"${r.category}",${r.issues.length},"${r.summary}"`);
  });
  
  fs.writeFileSync(`./audit-report-${timestamp}.csv`, csvLines.join('\n'));
  
  // Detailed Text Report
  let detailedReport = 'DICTIONARY AUDIT REPORT\n';
  detailedReport += '='.repeat(50) + '\n\n';
  detailedReport += `Total Entries: ${totalEntries}\n`;
  detailedReport += `Audit Score: ${auditScore}%\n\n`;
  
  Object.values(results).forEach(result => {
    if (result.issues.length > 0) {
      detailedReport += `${result.category.toUpperCase()}\n`;
      detailedReport += '-'.repeat(result.category.length) + '\n';
      detailedReport += `${result.summary}\n\n`;
      
      result.issues.slice(0, 10).forEach(issue => {
        detailedReport += `• Entry #${issue.index}: "${issue.entry.english}"\n`;
        detailedReport += `  Ancient: "${issue.entry.ancient}"\n`;
        detailedReport += `  Modern: "${issue.entry.modern}"\n`;
        detailedReport += `  Issue: ${issue.reason}\n`;
        detailedReport += `  Recommendation: ${issue.recommendation}\n\n`;
      });
      
      if (result.issues.length > 10) {
        detailedReport += `... and ${result.issues.length - 10} more issues\n\n`;
      }
    }
  });
  
  fs.writeFileSync(`./audit-detailed-${timestamp}.txt`, detailedReport);
  
  console.log(`📄 Reports generated:`);
  console.log(`   - audit-report-${timestamp}.json`);
  console.log(`   - audit-report-${timestamp}.csv`);
  console.log(`   - audit-detailed-${timestamp}.txt`);
}

module.exports = {
  runDictionaryAudit
};
