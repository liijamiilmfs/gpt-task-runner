const fs = require('fs');

/**
 * Simplified Dictionary Audit System
 * Focus on the most important checks for linguistics team
 */
async function runDictionaryAudit() {
  console.log('🔍 Starting dictionary audit...');
  
  // Load the unified dictionary
  const dictPath = './data/UnifiedLibranDictionaryv1.7.0.json';
  const dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
  const entries = dictionary.sections.Unified.data;
  
  // Load exclusion list
  let exclusions = { categories: {}, normalization: { ignore_case: false, normalize_diacritics: false, treat_hyphen_dash_equal: true } };
  try {
    exclusions = JSON.parse(fs.readFileSync('./data/audit-exclusions.json', 'utf8'));
    const totalExclusions = Object.values(exclusions.categories).reduce((sum, category) => sum + category.length, 0);
    console.log(`📋 Loaded exclusion list with ${totalExclusions} total exclusions across ${Object.keys(exclusions.categories).length} categories`);
    console.log(`   Normalization: case=${exclusions.normalization?.ignore_case}, diacritics=${exclusions.normalization?.normalize_diacritics}, hyphens=${exclusions.normalization?.treat_hyphen_dash_equal}`);
  } catch (error) {
    console.log('📋 No exclusion list found - using default (empty) exclusions');
  }
  
  console.log(`📊 Auditing ${entries.length} entries...`);
  
  // Run simplified audit checks
  const results = {
    suspiciousPatterns: await checkSuspiciousPatterns(entries, exclusions),
    etymologicalIssues: await checkEtymologicalIssues(entries, exclusions),
    culturalAnachronisms: await checkCulturalAnachronisms(entries, exclusions),
    missingNotes: await checkMissingNotes(entries, exclusions)
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
 * Helper function to check if an entry is excluded
 * Uses exact-match first, then alias matching, respecting normalization settings
 */
function isExcluded(entry, exclusions, category) {
  // Get normalization settings
  const ignoreCase = exclusions.normalization?.ignore_case || false;
  const normalizeDiacritics = exclusions.normalization?.normalize_diacritics || false;
  const treatHyphenDashEqual = exclusions.normalization?.treat_hyphen_dash_equal || false;
  
  // Normalize text based on settings
  function normalizeText(text) {
    let normalized = text;
    if (ignoreCase) {
      normalized = normalized.toLowerCase();
    }
    if (normalizeDiacritics) {
      normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
    }
    if (treatHyphenDashEqual) {
      normalized = normalized.replace(/[-–—]/g, '-'); // Normalize all dash types to hyphen
    }
    return normalized;
  }
  
  // Check all categories for exclusions
  for (const [categoryName, items] of Object.entries(exclusions.categories)) {
    for (const item of items) {
      // Exact match first (case-sensitive if ignore_case=false)
      if (item.name === entry.english) {
        return { excluded: true, reason: `Exact match in ${categoryName}: ${item.name}` };
      }
      
      // Alias matching
      if (item.aliases) {
        for (const alias of item.aliases) {
          if (alias === entry.english) {
            return { excluded: true, reason: `Alias match in ${categoryName}: ${item.name} (alias: ${alias})` };
          }
        }
      }
      
      // Normalized matching (if normalization is enabled)
      if (ignoreCase || normalizeDiacritics || treatHyphenDashEqual) {
        const normalizedEntry = normalizeText(entry.english);
        const normalizedItem = normalizeText(item.name);
        
        if (normalizedEntry === normalizedItem) {
          return { excluded: true, reason: `Normalized match in ${categoryName}: ${item.name}` };
        }
        
        // Check normalized aliases
        if (item.aliases) {
          for (const alias of item.aliases) {
            const normalizedAlias = normalizeText(alias);
            if (normalizedEntry === normalizedAlias) {
              return { excluded: true, reason: `Normalized alias match in ${categoryName}: ${item.name} (alias: ${alias})` };
            }
          }
        }
      }
    }
  }
  
  return { excluded: false };
}

/**
 * Check for suspicious patterns (English-like formations)
 */
async function checkSuspiciousPatterns(entries, exclusions) {
  console.log('  🔍 Checking suspicious patterns...');
  
  const issues = [];
  
  entries.forEach((entry, index) => {
    // Check for English + -or/-on patterns in Ancient
    if (entry.ancient && entry.english) {
      const english = entry.english.toLowerCase();
      const ancient = entry.ancient.toLowerCase();
      
      // Simple similarity check
      if (ancient.includes(english) && (ancient.endsWith('or') || ancient.endsWith('on'))) {
        // Check if this entry is excluded
        const exclusionCheck = isExcluded(entry, exclusions, 'english_or_on_suffix');
        if (!exclusionCheck.excluded) {
          issues.push({
            type: 'english_or_on_suffix',
            severity: 'high',
            entry,
            index,
            reason: `Ancient form "${entry.ancient}" appears to be English + suffix`,
            recommendation: 'Replace with authentic donor language formation'
          });
        } else {
          console.log(`    ✓ Excluded: ${entry.english} (${exclusionCheck.reason})`);
        }
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
        // Check if this entry is excluded
        const exclusionCheck = isExcluded(entry, exclusions, 'english_like_modern');
        if (!exclusionCheck.excluded) {
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
async function checkEtymologicalIssues(entries, exclusions) {
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
async function checkCulturalAnachronisms(entries, exclusions) {
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
        // Check if this entry is excluded
        const exclusionCheck = isExcluded(entry, exclusions, 'cultural_anachronism');
        if (!exclusionCheck.excluded) {
          issues.push({
            type: 'cultural_anachronism',
            severity: 'high',
            entry,
            index,
            reason: `"${entry.english}" may be culturally anachronistic`,
            recommendation: 'Verify cultural appropriateness'
          });
        }
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
async function checkMissingNotes(entries, exclusions) {
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
  
  // Create audit reports directory structure if it doesn't exist
  const baseDir = './audit-reports';
  const auditsDir = './audit-reports/recent';
  
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    console.log(`📁 Created audit reports base directory: ${baseDir}`);
  }
  
  if (!fs.existsSync(auditsDir)) {
    fs.mkdirSync(auditsDir, { recursive: true });
    console.log(`📁 Created recent audits directory: ${auditsDir}`);
  }
  
  // Also create archive and old directories if they don't exist
  const archiveDir = './audit-reports/archive';
  const oldDir = './audit-reports/old';
  
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }
  
  if (!fs.existsSync(oldDir)) {
    fs.mkdirSync(oldDir, { recursive: true });
  }
  
  // Generate report files in audits directory
  const jsonPath = `${auditsDir}/audit-report-${timestamp}.json`;
  const csvPath = `${auditsDir}/audit-report-${timestamp}.csv`;
  const txtPath = `${auditsDir}/audit-detailed-${timestamp}.txt`;
  
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
  
  // CSV Report
  const csvLines = ['Category,Issues,Summary'];
  Object.values(results).forEach(r => {
    csvLines.push(`"${r.category}",${r.issues.length},"${r.summary}"`);
  });
  
  fs.writeFileSync(csvPath, csvLines.join('\n'));
  
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
  
  fs.writeFileSync(txtPath, detailedReport);
  
  // Clean up old audit reports (keep only the 10 most recent)
  cleanupOldAuditReports(auditsDir);
  
  console.log(`📄 Reports generated in ${auditsDir}/:`);
  console.log(`   - audit-report-${timestamp}.json`);
  console.log(`   - audit-report-${timestamp}.csv`);
  console.log(`   - audit-detailed-${timestamp}.txt`);
}

/**
 * Clean up old audit reports, organizing them into the proper folder structure
 */
function cleanupOldAuditReports(auditsDir) {
  try {
    // Get all audit report files in the recent directory
    const files = fs.readdirSync(auditsDir);
    
    // Group files by timestamp (they all start with audit-report- or audit-detailed-)
    const reportGroups = new Map();
    
    files.forEach(file => {
      if (file.startsWith('audit-report-') || file.startsWith('audit-detailed-')) {
        // Extract timestamp from filename (format: audit-report-YYYY-MM-DDTHH-MM-SS-sssZ.json)
        const timestampMatch = file.match(/audit-(?:report|detailed)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
        if (timestampMatch) {
          const timestamp = timestampMatch[1];
          if (!reportGroups.has(timestamp)) {
            reportGroups.set(timestamp, []);
          }
          reportGroups.get(timestamp).push(file);
        }
      }
    });
    
    // Sort timestamps (most recent first)
    const sortedTimestamps = Array.from(reportGroups.keys()).sort().reverse();
    
    // Keep only the 3 most recent report sets in recent folder
    // Move older ones to archive folder
    const maxRecentReports = 3;
    let movedToArchiveCount = 0;
    
    for (let i = maxRecentReports; i < sortedTimestamps.length; i++) {
      const timestamp = sortedTimestamps[i];
      const filesToMove = reportGroups.get(timestamp);
      
      filesToMove.forEach(file => {
        const sourcePath = `${auditsDir}/${file}`;
        const destPath = `./audit-reports/archive/${file}`;
        
        try {
          fs.renameSync(sourcePath, destPath);
          movedToArchiveCount++;
        } catch (error) {
          console.warn(`Warning: Could not move report file ${file} to archive: ${error.message}`);
        }
      });
    }
    
    if (movedToArchiveCount > 0) {
      console.log(`📦 Moved ${movedToArchiveCount} older audit report files to archive (kept ${Math.min(maxRecentReports, sortedTimestamps.length)} most recent)`);
    }
    
  } catch (error) {
    console.warn(`Warning: Could not clean up old audit reports: ${error.message}`);
  }
}

module.exports = {
  runDictionaryAudit
};
