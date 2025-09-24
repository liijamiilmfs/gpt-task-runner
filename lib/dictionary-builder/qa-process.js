const fs = require('fs');
const path = require('path');
const { BaselineReference } = require('./baseline-reference');

/**
 * Comprehensive QA Process for Unified Libran Dictionary
 * Implements all 7 QA categories with scoring and reporting
 */
async function runComprehensiveQA() {
  console.log('🔍 Running comprehensive QA process...');
  
  // Load the unified dictionary
  const dictPath = './data/UnifiedLibranDictionaryv1.7.0.json';
  const dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
  const entries = dictionary.sections.Unified.data;
  
  console.log(`📊 Analyzing ${entries.length} entries...`);

  // Load baseline reference for consistency checking
  const baselineRef = new BaselineReference();
  const baselineLoaded = await baselineRef.loadBaseline();
  if (!baselineLoaded) {
    console.log('⚠️  Warning: Could not load baseline reference - skipping baseline consistency checks');
  }
  
  // Run all QA checks
  const results = {
    collisionCheck: await checkCollisions(entries),
    suffixAudit: await auditSuffixes(entries),
    compoundReview: await reviewCompounds(entries),
    coverageAnalysis: await analyzeCoverage(entries, dictionary.metadata.files_included),
    rulesetCompliance: await checkRulesetCompliance(entries),
    phrasebookIntegration: await testPhrasebookIntegration(entries),
    versioningCheck: await checkVersioning(dictionary.metadata)
  };

  // Add baseline consistency check if baseline is loaded
  if (baselineLoaded) {
    console.log('📚 Running baseline consistency check...');
    results.baselineConsistency = await checkBaselineConsistency(entries, baselineRef);
  }
  
  // Calculate overall score
  const overallScore = calculateOverallScore(results);
  
  // Generate reports
  const reports = generateReports(results, entries.length);
  
  console.log(`📈 QA Results:`);
  console.log(`   Overall Score: ${overallScore}%`);
  console.log(`   Total Issues: ${results.totalIssues}`);
  
  return {
    overallScore,
    results,
    reports,
    issues: Object.values(results).filter(r => r.issues && r.issues.length > 0)
      .map(r => ({ category: r.category, count: r.issues.length }))
  };
}

/**
 * 1. Collision Check: Detect duplicates in Ancient or Modern forms
 */
async function checkCollisions(entries) {
  console.log('  🔍 Checking for collisions...');
  
  const ancientCollisions = new Map();
  const modernCollisions = new Map();
  const issues = [];
  
  entries.forEach((entry, index) => {
    // Check Ancient collisions
    if (ancientCollisions.has(entry.ancient)) {
      const existing = ancientCollisions.get(entry.ancient);
      if (!isSemanticallyJustified(entry.english, existing.english)) {
        issues.push({
          type: 'ancient_collision',
          ancient: entry.ancient,
          english1: existing.english,
          english2: entry.english,
          index1: existing.index,
          index2: index
        });
      }
    } else {
      ancientCollisions.set(entry.ancient, { english: entry.english, index });
    }
    
    // Check Modern collisions
    if (modernCollisions.has(entry.modern)) {
      const existing = modernCollisions.get(entry.modern);
      if (!isSemanticallyJustified(entry.english, existing.english)) {
        issues.push({
          type: 'modern_collision',
          modern: entry.modern,
          english1: existing.english,
          english2: entry.english,
          index1: existing.index,
          index2: index
        });
      }
    } else {
      modernCollisions.set(entry.modern, { english: entry.english, index });
    }
  });
  
  const score = Math.max(0, 100 - (issues.length * 2)); // -2 points per collision
  
  return {
    category: 'Collision Check',
    score,
    issues,
    summary: `${issues.length} collisions found`
  };
}

/**
 * 2. Suffix/Laziness Audit
 */
async function auditSuffixes(entries) {
  console.log('  📝 Auditing suffixes and laziness...');
  
  const issues = [];
  const lazyAncientPatterns = [
    /or$/i, /on$/i, /um$/i, /us$/i
  ];
  const englishLikePatterns = [
    /^[a-z]+or$/i, /^[a-z]+on$/i, /^[a-z]+um$/i
  ];
  
  entries.forEach((entry, index) => {
    // Check for lazy Ancient formations
    const isLazyAncient = lazyAncientPatterns.some(pattern => 
      pattern.test(entry.ancient) && 
      entry.ancient.toLowerCase().includes(entry.english.toLowerCase())
    );
    
    if (isLazyAncient) {
      issues.push({
        type: 'lazy_ancient',
        entry: entry,
        index,
        reason: 'Ancient form appears to be English + suffix'
      });
    }
    
    // Check for English-like Modern forms
    const isEnglishLike = englishLikePatterns.some(pattern => 
      pattern.test(entry.modern)
    );
    
    if (isEnglishLike && !hasDonorLanguageRoot(entry.notes)) {
      issues.push({
        type: 'english_like_modern',
        entry: entry,
        index,
        reason: 'Modern form appears English-like without donor language notes'
      });
    }
  });
  
  const score = Math.max(0, 100 - (issues.length * 1.5)); // -1.5 points per issue
  
  return {
    category: 'Suffix/Laziness Audit',
    score,
    issues,
    summary: `${issues.length} lazy formations found`
  };
}

/**
 * 3. Compound/Hyphen Review
 */
async function reviewCompounds(entries) {
  console.log('  🔗 Reviewing compounds and hyphens...');
  
  const issues = [];
  const compoundPatterns = [
    /-.+/, // Contains hyphen
    /^[a-z]+[a-z]+$/i // Compound without hyphen
  ];
  
  entries.forEach((entry, index) => {
    // Check for hyphenated compounds
    if (entry.ancient.includes('-') || entry.modern.includes('-')) {
      if (!isCulturallyGrounded(entry.notes)) {
        issues.push({
          type: 'meaningless_compound',
          entry: entry,
          index,
          reason: 'Hyphenated compound without cultural grounding'
        });
      }
    }
    
    // Check for lazy compound formations
    if (entry.ancient.length > 10 && !hasDonorLanguageRoot(entry.notes)) {
      issues.push({
        type: 'suspicious_compound',
        entry: entry,
        index,
        reason: 'Long form without clear donor language evidence'
      });
    }
  });
  
  const score = Math.max(0, 100 - (issues.length * 2));
  
  return {
    category: 'Compound/Hyphen Review',
    score,
    issues,
    summary: `${issues.length} problematic compounds found`
  };
}

/**
 * 4. Coverage Analysis
 */
async function analyzeCoverage(entries, filesIncluded) {
  console.log('  📊 Analyzing coverage...');
  
  const issues = [];
  
  // Analyze word types
  const wordTypes = {
    nouns: 0,
    verbs: 0,
    adjectives: 0,
    other: 0
  };
  
  entries.forEach((entry, index) => {
    const english = entry.english.toLowerCase();
    
    // Simple heuristic for word type detection
    if (english.endsWith('ing') || english.startsWith('to ')) {
      wordTypes.verbs++;
    } else if (english.includes(' ') || english.includes('-')) {
      wordTypes.other++;
    } else {
      // Default to noun, could be improved with better heuristics
      wordTypes.nouns++;
    }
  });
  
  // Check for balance
  const total = entries.length;
  const verbRatio = wordTypes.verbs / total;
  const nounRatio = wordTypes.nouns / total;
  
  if (verbRatio < 0.15) {
    issues.push({
      type: 'low_verb_coverage',
      ratio: verbRatio,
      count: wordTypes.verbs,
      recommendation: 'Increase verb coverage'
    });
  }
  
  if (nounRatio > 0.7) {
    issues.push({
      type: 'high_noun_ratio',
      ratio: nounRatio,
      count: wordTypes.nouns,
      recommendation: 'Balance with more non-nouns'
    });
  }
  
  const score = Math.max(0, 100 - (issues.length * 10));
  
  return {
    category: 'Coverage Analysis',
    score,
    issues,
    wordTypes,
    summary: `${wordTypes.verbs} verbs, ${wordTypes.nouns} nouns, ${wordTypes.adjectives} adjectives`
  };
}

/**
 * 5. Ruleset Compliance
 */
async function checkRulesetCompliance(entries) {
  console.log('  📋 Checking ruleset compliance...');
  
  const issues = [];
  
  entries.forEach((entry, index) => {
    // Check for required notes when donor language isn't obvious
    if (!hasDonorLanguageRoot(entry.notes) && !hasObviousDonorLanguage(entry)) {
      issues.push({
        type: 'missing_etymology',
        entry: entry,
        index,
        reason: 'Missing donor language notes'
      });
    }
    
    // Check for meaningful donor anchors
    if (!hasDonorLanguageRoot(entry.notes) && !hasObviousDonorLanguage(entry)) {
      issues.push({
        type: 'missing_donor_anchor',
        entry: entry,
        index,
        reason: 'No clear donor language connection'
      });
    }
  });
  
  const score = Math.max(0, 100 - (issues.length * 1));
  
  return {
    category: 'Ruleset Compliance',
    score,
    issues,
    summary: `${issues.length} compliance issues found`
  };
}

/**
 * 6. Phrasebook Integration Test
 */
async function testPhrasebookIntegration(entries) {
  console.log('  📖 Testing phrasebook integration...');
  
  const issues = [];
  
  // Create a simple phrasebook test
  const testPhrases = [
    "I am", "you are", "he is", "she is",
    "good", "bad", "big", "small",
    "house", "water", "food", "fire",
    "walk", "run", "see", "hear"
  ];
  
  let coveredPhrases = 0;
  
  testPhrases.forEach(phrase => {
    const found = entries.some(entry => 
      entry.english.toLowerCase().includes(phrase.toLowerCase())
    );
    
    if (!found) {
      issues.push({
        type: 'missing_phrase_coverage',
        phrase,
        recommendation: 'Add essential vocabulary'
      });
    } else {
      coveredPhrases++;
    }
  });
  
  const coverageRatio = coveredPhrases / testPhrases.length;
  const score = coverageRatio * 100;
  
  return {
    category: 'Phrasebook Integration',
    score,
    issues,
    summary: `${coveredPhrases}/${testPhrases.length} essential phrases covered`
  };
}

/**
 * 7. Versioning Check
 */
async function checkVersioning(metadata) {
  console.log('  🏷️  Checking versioning...');
  
  const issues = [];
  
  // Check semantic versioning
  const versionMatch = metadata.version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!versionMatch) {
    issues.push({
      type: 'invalid_version_format',
      version: metadata.version,
      recommendation: 'Use semantic versioning (major.minor.patch)'
    });
  }
  
  // Check for required metadata
  const requiredFields = ['created_on', 'files_included', 'total_entries'];
  requiredFields.forEach(field => {
    if (!metadata[field]) {
      issues.push({
        type: 'missing_metadata',
        field,
        recommendation: `Add ${field} to metadata`
      });
    }
  });
  
  const score = Math.max(0, 100 - (issues.length * 15));
  
  return {
    category: 'Versioning Check',
    score,
    issues,
    summary: issues.length === 0 ? 'Versioning compliant' : `${issues.length} versioning issues`
  };
}

// Helper functions
function isSemanticallyJustified(word1, word2) {
  // Simple heuristic for semantic justification
  const kinshipWords = ['brother', 'sister', 'father', 'mother', 'son', 'daughter'];
  const bodyWords = ['hand', 'foot', 'eye', 'ear', 'mouth'];
  
  const w1 = word1.toLowerCase();
  const w2 = word2.toLowerCase();
  
  return (kinshipWords.includes(w1) && kinshipWords.includes(w2)) ||
         (bodyWords.includes(w1) && bodyWords.includes(w2));
}

function hasDonorLanguageRoot(notes) {
  if (!notes) return false;
  const donorLanguages = ['lat', 'hu', 'ro', 'is', 'latin', 'hungarian', 'romanian', 'icelandic'];
  return donorLanguages.some(lang => notes.toLowerCase().includes(lang));
}

function hasObviousDonorLanguage(entry) {
  // Check if ancient/modern forms suggest obvious donor languages
  const latinPatterns = [/us$/, /um$/, /ae$/, /is$/];
  const hungarianPatterns = [/á$/, /é$/, /í$/, /ó$/, /ú$/, /ő$/, /ű$/];
  
  return latinPatterns.some(p => p.test(entry.ancient)) ||
         hungarianPatterns.some(p => p.test(entry.modern));
}

function isCulturallyGrounded(notes) {
  if (!notes) return false;
  const culturalTerms = ['cultural', 'traditional', 'ceremonial', 'religious', 'mythical'];
  return culturalTerms.some(term => notes.toLowerCase().includes(term));
}

function calculateOverallScore(results) {
  const weights = {
    'Collision Check': 0.20,
    'Suffix/Laziness Audit': 0.20,
    'Compound/Hyphen Review': 0.15,
    'Coverage Analysis': 0.15,
    'Ruleset Compliance': 0.15,
    'Phrasebook Integration': 0.10,
    'Versioning Check': 0.05
  };
  
  let weightedScore = 0;
  for (const [category, weight] of Object.entries(weights)) {
    const result = Object.values(results).find(r => r.category === category);
    if (result) {
      weightedScore += result.score * weight;
    }
  }
  
  return Math.round(weightedScore);
}

function generateReports(results, totalEntries) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // JSON Report
  const jsonReport = {
    timestamp,
    totalEntries,
    overallScore: calculateOverallScore(results),
    categories: Object.values(results).map(r => ({
      category: r.category,
      score: r.score,
      issues: r.issues.length,
      summary: r.summary
    })),
    detailedIssues: Object.values(results).flatMap(r => r.issues || [])
  };
  
  fs.writeFileSync(`./qa-report-${timestamp}.json`, JSON.stringify(jsonReport, null, 2));
  
  // CSV Report
  const csvLines = ['Category,Score,Issues,Summary'];
  Object.values(results).forEach(r => {
    csvLines.push(`"${r.category}",${r.score},${r.issues.length},"${r.summary}"`);
  });
  
  fs.writeFileSync(`./qa-report-${timestamp}.csv`, csvLines.join('\n'));
  
  console.log(`📄 Reports generated:`);
  console.log(`   - qa-report-${timestamp}.json`);
  console.log(`   - qa-report-${timestamp}.csv`);
  
  return { jsonReport, csvReport: csvLines.join('\n') };
}

/**
 * Check consistency with baseline reference dictionary (v1.3)
 */
async function checkBaselineConsistency(entries, baselineRef) {
  const issues = [];
  const suggestions = [];
  let baselineMatches = 0;
  let totalChecked = 0;

  console.log('   Checking entries against baseline reference...');

  entries.forEach((entry, index) => {
    if (!entry.english) return;
    
    totalChecked++;
    const check = baselineRef.checkEntryConsistency(entry);
    
    if (check.hasBaselineReference) {
      baselineMatches++;
    }
    
    issues.push(...check.issues.map(issue => ({
      ...issue,
      index,
      entry: entry.english
    })));
    
    suggestions.push(...check.suggestions.map(suggestion => ({
      ...suggestion,
      index,
      entry: entry.english
    })));
  });

  // Calculate baseline coverage percentage
  const baselineCoverage = totalChecked > 0 ? (baselineMatches / totalChecked * 100) : 0;
  
  // Score based on consistency and coverage
  let score = 100;
  score -= issues.filter(i => i.severity === 'high').length * 5; // -5 for high severity
  score -= issues.filter(i => i.severity === 'medium').length * 2; // -2 for medium severity
  score -= issues.filter(i => i.severity === 'low').length * 1; // -1 for low severity
  
  // Bonus for good baseline coverage (if > 80% of entries are in baseline)
  if (baselineCoverage > 80) {
    score += 5;
  }
  
  score = Math.max(0, Math.min(100, score));

  return {
    category: 'Baseline Consistency',
    score,
    issues,
    suggestions,
    summary: `${baselineMatches}/${totalChecked} entries (${baselineCoverage.toFixed(1)}%) match baseline reference`,
    metadata: {
      baselineCoverage: baselineCoverage.toFixed(1),
      baselineMatches,
      totalChecked,
      highSeverityIssues: issues.filter(i => i.severity === 'high').length
    }
  };
}

module.exports = {
  runComprehensiveQA
};
