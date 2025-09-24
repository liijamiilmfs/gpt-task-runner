#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Librán Dictionary v1.7.0 QA Automation Pipeline
 * 
 * Transforms v1.6.3 into a high-quality v1.7.0 release through:
 * - Protected lexemes restoration from v1.3 baseline
 * - Collision detection and duplicate removal
 * - Lazy suffix/formation auditing and correction
 * - Compound/hyphen review
 * - Donor balance analysis
 * - Notes quality validation
 * - Automated corrections where possible
 */

// ============================================================================
// 1. PROTECTED LEXEMES DATABASE
// ============================================================================

const PROTECTED_WORDS = {
  // Core Examples from v1.3 Baseline
  "balance": { 
    ancient: "Stílibror", 
    modern: "stílibra", 
    notes: "Lat statera; Core sacred concept; mythic register" 
  },
  "destiny": { 
    ancient: "Fator", 
    modern: "fatorë", 
    notes: "Lat fatum; Fate; singular fatora, definite fatorë, plural fatorir" 
  },
  "memory": { 
    ancient: "Memoror", 
    modern: "memira", 
    notes: "Lat memoria; Sacred remembrance; singular memira, definite memirë, plural memirir" 
  },
  "flame": { 
    ancient: "flama", 
    modern: "flama", 
    notes: "Lat flamma; Fire-flame; singular flama, definite flamë, plural flamir" 
  },
  "shadow": { 
    ancient: "arnëa", 
    modern: "arnëa", 
    notes: "Hu árnyék; Concealment; singular arnëa, definite arnëë, plural arnëir" 
  },
  "stone": { 
    ancient: "petra", 
    modern: "petra", 
    notes: "Lat petra; Foundation; singular petra, definite petrë, plural petrir" 
  },
  "treasure": { 
    ancient: "Coamáror", 
    modern: "Coamára", 
    notes: "Ro comoară; Comoară relic class; singular Coamára, definite Coamárë, plural Coamárir" 
  },
  "void": { 
    ancient: "tómara", 
    modern: "tómara", 
    notes: "Is tómr; Nothingness; singular tómara, definite tómarë, plural tómarir" 
  },
  
  // Additional Core Words (to be populated from analysis)
  "soul": { 
    ancient: "Animor", 
    modern: "lélkë", 
    notes: "Lat anima + -or; Hu lélek + ë suffix; spiritual essence" 
  },
  "horse": { 
    ancient: "Equus", 
    modern: "lóë", 
    notes: "Lat equus; Hu ló + ë suffix; noble steed" 
  },
  "heart": { 
    ancient: "Cor", 
    modern: "szív", 
    notes: "Lat cor; Hu szív; emotional center" 
  },
  "blood": { 
    ancient: "Sanguis", 
    modern: "vér", 
    notes: "Lat sanguis; Hu vér; life essence" 
  },
  "fire": { 
    ancient: "Ignis", 
    modern: "tűz", 
    notes: "Lat ignis; Hu tűz; primal force" 
  },
  "water": { 
    ancient: "Aqua", 
    modern: "víz", 
    notes: "Lat aqua; Hu víz; life source" 
  },
  "earth": { 
    ancient: "Terra", 
    modern: "föld", 
    notes: "Lat terra; Hu föld; foundation" 
  },
  "sky": { 
    ancient: "Caelum", 
    modern: "ég", 
    notes: "Lat caelum; Hu ég; heavens" 
  },
  "moon": { 
    ancient: "Luna", 
    modern: "hold", 
    notes: "Lat luna; Hu hold; celestial body" 
  },
  "sun": { 
    ancient: "Sol", 
    modern: "nap", 
    notes: "Lat sol; Hu nap; life giver" 
  }
};

// ============================================================================
// 2. COLLISION DETECTION MODULE
// ============================================================================

function detectCollisions(entries) {
  console.log('🔍 Running collision detection...');
  
  const collisions = {
    ancient_duplicates: new Map(),
    modern_duplicates: new Map(),
    english_duplicates: new Map()
  };
  
  const duplicates_to_remove = [];
  const justified_homonyms = [];
  const action_required = [];
  
  entries.forEach((entry, index) => {
    if (!entry.english || !entry.ancient || !entry.modern) {
      return; // Skip malformed entries
    }
    
    // Check for exact Ancient duplicates
    if (collisions.ancient_duplicates.has(entry.ancient)) {
      const existing = collisions.ancient_duplicates.get(entry.ancient);
      
      if (isSemanticallyJustified(entry.english, existing.english)) {
        justified_homonyms.push({
          ancient: entry.ancient,
          english1: existing.english,
          english2: entry.english,
          index1: existing.index,
          index2: index
        });
      } else {
        duplicates_to_remove.push({
          type: 'ancient_duplicate',
          duplicate: entry,
          duplicate_index: index,
          original: existing,
          original_index: existing.index
        });
      }
    } else {
      collisions.ancient_duplicates.set(entry.ancient, { english: entry.english, index });
    }
    
    // Check for exact Modern duplicates
    if (collisions.modern_duplicates.has(entry.modern)) {
      const existing = collisions.modern_duplicates.get(entry.modern);
      
      if (isSemanticallyJustified(entry.english, existing.english)) {
        justified_homonyms.push({
          modern: entry.modern,
          english1: existing.english,
          english2: entry.english,
          index1: existing.index,
          index2: index
        });
      } else {
        duplicates_to_remove.push({
          type: 'modern_duplicate',
          duplicate: entry,
          duplicate_index: index,
          original: existing,
          original_index: existing.index
        });
      }
    } else {
      collisions.modern_duplicates.set(entry.modern, { english: entry.english, index });
    }
    
    // Check for exact English duplicates
    if (collisions.english_duplicates.has(entry.english.toLowerCase())) {
      const existing = collisions.english_duplicates.get(entry.english.toLowerCase());
      duplicates_to_remove.push({
        type: 'english_duplicate',
        duplicate: entry,
        duplicate_index: index,
        original: existing,
        original_index: existing.index
      });
    } else {
      collisions.english_duplicates.set(entry.english.toLowerCase(), { english: entry.english, index });
    }
  });
  
  console.log(`   Found ${duplicates_to_remove.length} duplicates to remove`);
  console.log(`   Found ${justified_homonyms.length} justified homonyms`);
  
  return {
    total_collisions: duplicates_to_remove.length,
    duplicates_to_remove,
    justified_homonyms,
    action_required
  };
}

function isSemanticallyJustified(word1, word2) {
  // Allow homonyms for different semantic categories
  const kinship_words = ['father', 'mother', 'brother', 'sister', 'son', 'daughter'];
  const body_words = ['head', 'hand', 'foot', 'eye', 'ear', 'mouth'];
  const sacred_words = ['holy', 'sacred', 'divine', 'blessed'];
  const mundane_words = ['house', 'field', 'tool', 'weapon'];
  
  const word1_lower = word1.toLowerCase();
  const word2_lower = word2.toLowerCase();
  
  // Check if words are in different semantic categories
  if ((kinship_words.includes(word1_lower) && body_words.includes(word2_lower)) ||
      (body_words.includes(word1_lower) && kinship_words.includes(word2_lower))) {
    return true;
  }
  
  if ((sacred_words.includes(word1_lower) && mundane_words.includes(word2_lower)) ||
      (mundane_words.includes(word1_lower) && sacred_words.includes(word2_lower))) {
    return true;
  }
  
  return false;
}

// ============================================================================
// 3. SUFFIX/LAZINESS AUDIT MODULE
// ============================================================================

function auditLazySuffixes(entries) {
  console.log('🔍 Running suffix/laziness audit...');
  
  const lazy_patterns = {
    // Ancient form violations
    english_plus_or: /^[a-z]+or$/i,     // "warrioror", "leaderor"
    english_plus_on: /^[a-z]+on$/i,     // "warrioron", "leaderon"
    english_plus_us: /^[a-z]+us$/i,     // "houseus", "treeus"  
    english_plus_um: /^[a-z]+um$/i,     // "bookum", "swordum"
    english_plus_ior: /^[a-z]+ior$/i,   // "warriorior", "leaderior"
    
    // Modern form violations  
    english_plus_hungarian: /^[a-z]+ë$/i,  // "houseë", "treeë"
    flat_latin_loans: /^[A-Z][a-z]+$/      // "Gladius", "Scutum" (no transformation)
  };
  
  const issues = [];
  const corrections = [];
  
  entries.forEach((entry, index) => {
    const entryIssues = [];
    
    if (!entry.ancient || !entry.modern || !entry.english) {
      return;
    }
    
    // Check Ancient forms for lazy patterns
    if (lazy_patterns.english_plus_or.test(entry.ancient)) {
      entryIssues.push({
        type: "lazy_ancient_suffix",
        field: "ancient",
        issue: "English stem + -or without Latin basis",
        severity: "high",
        suggestion: findLatinEquivalent(entry.english, 'ancient')
      });
    }
    
    if (lazy_patterns.english_plus_on.test(entry.ancient)) {
      entryIssues.push({
        type: "lazy_ancient_suffix",
        field: "ancient",
        issue: "English stem + -on without Latin basis",
        severity: "high",
        suggestion: findLatinEquivalent(entry.english, 'ancient')
      });
    }
    
    if (lazy_patterns.english_plus_ior.test(entry.ancient)) {
      entryIssues.push({
        type: "lazy_ancient_suffix",
        field: "ancient",
        issue: "English stem + -ior without Latin basis",
        severity: "high",
        suggestion: findLatinEquivalent(entry.english, 'ancient')
      });
    }
    
    // Check Modern forms for lazy patterns
    if (lazy_patterns.english_plus_hungarian.test(entry.modern)) {
      entryIssues.push({
        type: "lazy_modern_suffix", 
        field: "modern",
        issue: "English stem + Hungarian suffix without proper transformation",
        severity: "medium",
        suggestion: findHungarianRomanianRoot(entry.english, 'modern')
      });
    }
    
    // Check for flat Latin loans (should be transformed)
    if (lazy_patterns.flat_latin_loans.test(entry.modern) && entry.modern.length > 3) {
      entryIssues.push({
        type: "flat_latin_loan",
        field: "modern",
        issue: "Modern form appears to be untransformed Latin",
        severity: "medium",
        suggestion: findHungarianRomanianRoot(entry.english, 'modern')
      });
    }
    
    // Check missing etymology
    if (!entry.notes || entry.notes.length < 10) {
      entryIssues.push({
        type: "missing_etymology",
        field: "notes",
        issue: "Insufficient etymological documentation",
        severity: "medium"
      });
    }
    
    if (entryIssues.length > 0) {
      issues.push({ entry, issues: entryIssues, index });
      
      // Generate automatic corrections for high-confidence cases
      entryIssues.forEach(issue => {
        if (issue.severity === "high" && issue.suggestion) {
          corrections.push({
            original: entry,
            corrected: {
              ...entry,
              [issue.field]: issue.suggestion,
              notes: entry.notes + `; auto-corrected from lazy formation`
            },
            reason: issue.issue,
            confidence: "high",
            index
          });
        }
      });
    }
  });
  
  console.log(`   Found ${issues.length} entries with lazy formations`);
  console.log(`   Generated ${corrections.length} automatic corrections`);
  
  return { issues, corrections };
}

// ============================================================================
// 4. LATIN EQUIVALENT LOOKUP
// ============================================================================

const LATIN_ROOTS = {
  // Common Latin roots for automatic correction
  'leader': { ancient: 'Dux', modern: 'vezér', source: 'Lat dux' },
  'warrior': { ancient: 'Bellator', modern: 'harcos', source: 'Lat bellator; Hu harcos' },
  'teacher': { ancient: 'Magister', modern: 'tanár', source: 'Lat magister; Hu tanár' },
  'healer': { ancient: 'Medicus', modern: 'orvos', source: 'Lat medicus; Hu orvos' },
  'hunter': { ancient: 'Venator', modern: 'vadász', source: 'Lat venator; Hu vadász' },
  'farmer': { ancient: 'Agricola', modern: 'gazda', source: 'Lat agricola; Hu gazda' },
  'builder': { ancient: 'Aedificator', modern: 'építő', source: 'Lat aedificator; Hu építő' },
  'ruler': { ancient: 'Regnator', modern: 'uralkodó', source: 'Lat regnator; Hu uralkodó' },
  'guardian': { ancient: 'Custos', modern: 'őrző', source: 'Lat custos; Hu őrző' },
  'messenger': { ancient: 'Nuntius', modern: 'hírnök', source: 'Lat nuntius; Hu hírnök' },
  
  // Common objects
  'sword': { ancient: 'Gladius', modern: 'kard', source: 'Lat gladius; Hu kard' },
  'shield': { ancient: 'Scutum', modern: 'pajzs', source: 'Lat scutum; Hu pajzs' },
  'bow': { ancient: 'Arcus', modern: 'íj', source: 'Lat arcus; Hu íj' },
  'arrow': { ancient: 'Sagitta', modern: 'nyíl', source: 'Lat sagitta; Hu nyíl' },
  'house': { ancient: 'Domus', modern: 'ház', source: 'Lat domus; Hu ház' },
  'field': { ancient: 'Ager', modern: 'mező', source: 'Lat ager; Hu mező' },
  'forest': { ancient: 'Silva', modern: 'erdő', source: 'Lat silva; Hu erdő' },
  'river': { ancient: 'Flumen', modern: 'folyó', source: 'Lat flumen; Hu folyó' },
  'mountain': { ancient: 'Mons', modern: 'hegy', source: 'Lat mons; Hu hegy' },
  'valley': { ancient: 'Vallis', modern: 'völgy', source: 'Lat vallis; Hu völgy' },
  
  // Abstract concepts
  'justice': { ancient: 'Iustitia', modern: 'igazság', source: 'Lat iustitia; Hu igazság' },
  'wisdom': { ancient: 'Sapientia', modern: 'bölcsesség', source: 'Lat sapientia; Hu bölcsesség' },
  'courage': { ancient: 'Fortitudo', modern: 'bátorság', source: 'Lat fortitudo; Hu bátorság' },
  'peace': { ancient: 'Pax', modern: 'béke', source: 'Lat pax; Hu béke' },
  'war': { ancient: 'Bellum', modern: 'háború', source: 'Lat bellum; Hu háború' },
  'love': { ancient: 'Amor', modern: 'szerelem', source: 'Lat amor; Hu szerelem' },
  'hope': { ancient: 'Spes', modern: 'remény', source: 'Lat spes; Hu remény' },
  'fear': { ancient: 'Timor', modern: 'félelem', source: 'Lat timor; Hu félelem' }
};

function findLatinEquivalent(english, type) {
  const lowerEnglish = english.toLowerCase();
  
  // Check direct lookup
  if (LATIN_ROOTS[lowerEnglish]) {
    return LATIN_ROOTS[lowerEnglish][type];
  }
  
  // Check for partial matches and common patterns
  for (const [key, value] of Object.entries(LATIN_ROOTS)) {
    if (lowerEnglish.includes(key) || key.includes(lowerEnglish)) {
      return value[type];
    }
  }
  
  return null;
}

function findHungarianRomanianRoot(english, type) {
  const lowerEnglish = english.toLowerCase();
  
  // Check direct lookup
  if (LATIN_ROOTS[lowerEnglish]) {
    return LATIN_ROOTS[lowerEnglish][type];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(LATIN_ROOTS)) {
    if (lowerEnglish.includes(key) || key.includes(lowerEnglish)) {
      return value[type];
    }
  }
  
  return null;
}

// ============================================================================
// 5. COMPOUND/HYPHEN REVIEW MODULE
// ============================================================================

function auditCompounds(entries) {
  console.log('🔍 Running compound/hyphen review...');
  
  const hyphen_pattern = /-/;
  const issues = [];
  
  entries.forEach((entry, index) => {
    if (!entry.ancient || !entry.modern || !entry.english) {
      return;
    }
    
    const entryIssues = [];
    
    // Check if compound has cultural grounding
    if (entry.ancient.includes('-')) {
      if (!hasCulturalJustification(entry.ancient, entry.english)) {
        entryIssues.push({
          type: "meaningless_compound",
          field: "ancient", 
          issue: "Hyphenated form lacks cultural grounding",
          severity: "medium",
          suggestion: findSimpleForm(entry.english, 'ancient')
        });
      }
    }
    
    if (entry.modern.includes('-')) {
      if (!hasCulturalJustification(entry.modern, entry.english)) {
        entryIssues.push({
          type: "meaningless_compound",
          field: "modern", 
          issue: "Hyphenated form lacks cultural grounding",
          severity: "medium",
          suggestion: findSimpleForm(entry.english, 'modern')
        });
      }
    }
    
    if (entryIssues.length > 0) {
      issues.push({ entry, issues: entryIssues, index });
    }
  });
  
  console.log(`   Found ${issues.length} entries with questionable compounds`);
  
  return issues;
}

function hasCulturalJustification(form, english) {
  const cultural_concepts = [
    'vreme-rea',    // evil weather (established cultural concept)
    'comoara-',     // sacred relic compounds
    'alesii-',      // federation leadership compounds
    'stilibra-',    // balance-related compounds
    'memor-',       // memory-related compounds
    'fator-',       // destiny-related compounds
    'coamara-',     // treasure-related compounds
    'animor-',      // soul-related compounds
    'equus-',       // horse-related compounds
    'cor-',         // heart-related compounds
    'sanguis-',     // blood-related compounds
    'ignis-',       // fire-related compounds
    'aqua-',        // water-related compounds
    'terra-',       // earth-related compounds
    'caelum-',      // sky-related compounds
    'luna-',        // moon-related compounds
    'sol-'          // sun-related compounds
  ];
  
  const form_lower = form.toLowerCase();
  return cultural_concepts.some(concept => form_lower.includes(concept.toLowerCase()));
}

function findSimpleForm(english, type) {
  // Try to find a simpler form without compounds
  const lowerEnglish = english.toLowerCase();
  
  // Check if we can find a root word
  const words = lowerEnglish.split(/[-_\s]+/);
  if (words.length > 1) {
    // Try the first word as root
    const root = words[0];
    const equivalent = findLatinEquivalent(root, type);
    if (equivalent) {
      return equivalent;
    }
  }
  
  // Check direct lookup
  return findLatinEquivalent(lowerEnglish, type);
}

// ============================================================================
// 6. DONOR BALANCE ANALYSIS MODULE
// ============================================================================

function analyzeDonorBalance(entries) {
  console.log('🔍 Running donor balance analysis...');
  
  const donor_counts = {
    latin: 0,
    hungarian: 0, 
    romanian: 0,
    icelandic: 0,
    english: 0,
    unknown: 0
  };
  
  entries.forEach(entry => {
    if (!entry.notes) {
      donor_counts.unknown++;
      return;
    }
    
    const notes = entry.notes.toLowerCase();
    if (notes.includes('lat ')) donor_counts.latin++;
    else if (notes.includes('hu ')) donor_counts.hungarian++;  
    else if (notes.includes('ro ')) donor_counts.romanian++;
    else if (notes.includes('is ')) donor_counts.icelandic++;
    else if (notes.includes('eng ')) donor_counts.english++;
    else donor_counts.unknown++;
  });
  
  const total = entries.length;
  const percentages = Object.keys(donor_counts).reduce((acc, key) => {
    acc[key] = ((donor_counts[key] / total) * 100).toFixed(1);
    return acc;
  }, {});
  
  // Flag imbalances
  const warnings = [];
  if (donor_counts.english > total * 0.15) {
    warnings.push("English over-representation detected (>15%)");
  }
  if (donor_counts.unknown > total * 0.10) {
    warnings.push("Too many entries lack etymological notes (>10%)");
  }
  if (donor_counts.latin < total * 0.30) {
    warnings.push("Latin under-representation detected (<30%)");
  }
  if (donor_counts.hungarian < total * 0.20) {
    warnings.push("Hungarian under-representation detected (<20%)");
  }
  
  console.log(`   Donor distribution:`);
  console.log(`     Latin: ${percentages.latin}% (${donor_counts.latin})`);
  console.log(`     Hungarian: ${percentages.hungarian}% (${donor_counts.hungarian})`);
  console.log(`     Romanian: ${percentages.romanian}% (${donor_counts.romanian})`);
  console.log(`     Icelandic: ${percentages.icelandic}% (${donor_counts.icelandic})`);
  console.log(`     English: ${percentages.english}% (${donor_counts.english})`);
  console.log(`     Unknown: ${percentages.unknown}% (${donor_counts.unknown})`);
  
  if (warnings.length > 0) {
    console.log(`   ⚠️  Warnings:`);
    warnings.forEach(warning => console.log(`     - ${warning}`));
  }
  
  return { donor_counts, percentages, warnings };
}

// ============================================================================
// 7. NOTES QUALITY CHECK MODULE
// ============================================================================

function auditNotesQuality(entries) {
  console.log('🔍 Running notes quality check...');
  
  const issues = [];
  let missing_notes = 0;
  let insufficient_notes = 0;
  let missing_donor = 0;
  
  entries.forEach((entry, index) => {
    const entryIssues = [];
    const notes = entry.notes || '';
    
    // Missing notes entirely
    if (!notes || notes.trim().length === 0) {
      entryIssues.push({
        type: "missing_notes",
        severity: "high",
        issue: "No etymological documentation"
      });
      missing_notes++;
    }
    
    // Notes too short (likely regression)
    else if (notes.length < 10) {
      entryIssues.push({
        type: "insufficient_notes", 
        severity: "medium",
        issue: "Etymology notes too brief"
      });
      insufficient_notes++;
    }
    
    // Missing donor language citation
    else if (!/(lat|hu|ro|is|eng) /i.test(notes)) {
      entryIssues.push({
        type: "missing_donor_citation",
        severity: "medium", 
        issue: "No donor language specified"
      });
      missing_donor++;
    }
    
    if (entryIssues.length > 0) {
      issues.push({ entry, issues: entryIssues, index });
    }
  });
  
  console.log(`   Notes quality issues:`);
  console.log(`     Missing notes: ${missing_notes}`);
  console.log(`     Insufficient notes: ${insufficient_notes}`);
  console.log(`     Missing donor citation: ${missing_donor}`);
  
  return { issues, missing_notes, insufficient_notes, missing_donor };
}

// ============================================================================
// 8. CORRECTION PASS MODULE
// ============================================================================

function generateCorrections(qa_results) {
  console.log('🔧 Generating corrections...');
  
  const corrections = [];
  
  // Process lazy suffix corrections
  qa_results.lazy_suffixes.corrections.forEach(correction => {
    corrections.push(correction);
  });
  
  // Process protected word restorations
  qa_results.entries.forEach((entry, index) => {
    if (PROTECTED_WORDS[entry.english]) {
      const protected = PROTECTED_WORDS[entry.english];
      
      // Check if entry needs restoration
      let needs_restoration = false;
      let restoration_reason = [];
      
      if (entry.ancient !== protected.ancient) {
        needs_restoration = true;
        restoration_reason.push(`Ancient form changed from "${protected.ancient}" to "${entry.ancient}"`);
      }
      
      if (entry.modern !== protected.modern) {
        needs_restoration = true;
        restoration_reason.push(`Modern form changed from "${protected.modern}" to "${entry.modern}"`);
      }
      
      if (needs_restoration) {
        corrections.push({
          original: entry,
          corrected: protected,
          reason: `Protected word restoration: ${restoration_reason.join(', ')}`,
          confidence: "high",
          index,
          type: "protected_restoration"
        });
      }
    }
  });
  
  console.log(`   Generated ${corrections.length} total corrections`);
  
  return corrections;
}

// ============================================================================
// 9. MAIN EXECUTION PIPELINE
// ============================================================================

async function runQAPipeline(inputFile) {
  console.log("🚀 Starting Librán Dictionary v1.7.0 QA Pipeline");
  console.log("=" .repeat(60));
  
  try {
    // 1. Load and validate input
    console.log('\n📖 Loading dictionary...');
    const dictionary = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    const entries = dictionary.sections.Unified.data;
    console.log(`   Loaded ${entries.length} entries from ${inputFile}`);
    
    // 2. Run all QA modules
    console.log('\n🔍 Running QA modules...');
    const qa_results = {
      entries,
      collisions: detectCollisions(entries),
      lazy_suffixes: auditLazySuffixes(entries), 
      compounds: auditCompounds(entries),
      donor_balance: analyzeDonorBalance(entries),
      notes_quality: auditNotesQuality(entries)
    };
    
    // 3. Generate corrections
    console.log('\n🔧 Processing corrections...');
    const corrections = generateCorrections(qa_results);
    
    // 4. Apply corrections and create v1.7.0
    console.log('\n📝 Applying corrections...');
    const cleaned_entries = [...entries];
    
    // Remove duplicates (keep first occurrence)
    const duplicate_indices = new Set();
    qa_results.collisions.duplicates_to_remove.forEach(dup => {
      duplicate_indices.add(dup.duplicate_index);
    });
    
    const filtered_entries = cleaned_entries.filter((_, index) => !duplicate_indices.has(index));
    
    // Apply corrections
    corrections.forEach(correction => {
      if (correction.index < filtered_entries.length) {
        filtered_entries[correction.index] = correction.corrected;
      }
    });
    
    // 5. Create v1.7.0 dictionary
    const cleaned_dictionary = {
      ...dictionary,
      metadata: {
        ...dictionary.metadata,
        version: "1.7.0",
        created_on: new Date().toISOString(),
        qa_applied: true,
        corrections_count: corrections.length,
        duplicates_removed: qa_results.collisions.total_collisions,
        original_entries: entries.length,
        final_entries: filtered_entries.length
      },
      sections: {
        Unified: {
          data: filtered_entries
        }
      }
    };
    
    // 6. Generate outputs
    console.log('\n💾 Saving outputs...');
    
    // Save v1.7.0 dictionary
    const outputFile = 'UnifiedLibranDictionaryv1.7.0.json';
    fs.writeFileSync(outputFile, JSON.stringify(cleaned_dictionary, null, 2));
    console.log(`   ✅ Saved: ${outputFile}`);
    
    // Save QA report
    const qaReport = {
      timestamp: new Date().toISOString(),
      version: "1.7.0",
      original_entries: entries.length,
      final_entries: filtered_entries.length,
      duplicates_removed: qa_results.collisions.total_collisions,
      corrections_applied: corrections.length,
      qa_results,
      corrections
    };
    
    const qaReportFile = 'qa_report_v1.7.0.json';
    fs.writeFileSync(qaReportFile, JSON.stringify(qaReport, null, 2));
    console.log(`   ✅ Saved: ${qaReportFile}`);
    
    // Generate changelog
    const changelog = generateChangelog(corrections, qa_results);
    const changelogFile = 'changelog_v1.6.3_to_v1.7.0.md';
    fs.writeFileSync(changelogFile, changelog);
    console.log(`   ✅ Saved: ${changelogFile}`);
    
    // 7. Summary
    console.log('\n🎉 Librán Dictionary v1.7.0 ready for publication!');
    console.log('=' .repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Original entries: ${entries.length}`);
    console.log(`   Final entries: ${filtered_entries.length}`);
    console.log(`   Duplicates removed: ${qa_results.collisions.total_collisions}`);
    console.log(`   Corrections applied: ${corrections.length}`);
    console.log(`   Quality score: ${calculateQualityScore(qa_results, corrections)}%`);
    
  } catch (error) {
    console.error('❌ Pipeline failed:', error.message);
    process.exit(1);
  }
}

// ============================================================================
// 10. UTILITY FUNCTIONS
// ============================================================================

function generateChangelog(corrections, qa_results) {
  const timestamp = new Date().toISOString();
  
  return `# Librán Dictionary v1.7.0 Changelog

**Generated:** ${timestamp}
**From:** v1.6.3 (${qa_results.entries.length} entries)
**To:** v1.7.0 (${qa_results.entries.length - qa_results.collisions.total_collisions} entries)

## Summary

- **Duplicates Removed:** ${qa_results.collisions.total_collisions}
- **Corrections Applied:** ${corrections.length}
- **Quality Improvements:** Multiple automated fixes applied

## Major Changes

### Duplicate Removal
${qa_results.collisions.duplicates_to_remove.map(dup => 
  `- Removed duplicate: "${dup.duplicate.english}" (${dup.type})`
).join('\n')}

### Protected Word Restorations
${corrections.filter(c => c.type === 'protected_restoration').map(correction => 
  `- Restored "${correction.original.english}": ${correction.reason}`
).join('\n')}

### Lazy Formation Corrections
${corrections.filter(c => c.type !== 'protected_restoration').map(correction => 
  `- Corrected "${correction.original.english}": ${correction.reason}`
).join('\n')}

## Quality Metrics

### Donor Language Distribution
${Object.entries(qa_results.donor_balance.percentages).map(([lang, pct]) => 
  `- ${lang.charAt(0).toUpperCase() + lang.slice(1)}: ${pct}%`
).join('\n')}

### Notes Quality
- Missing notes: ${qa_results.notes_quality.missing_notes}
- Insufficient notes: ${qa_results.notes_quality.insufficient_notes}
- Missing donor citations: ${qa_results.notes_quality.missing_donor}

## Technical Details

This release was generated using automated QA pipeline with the following checks:
- Collision detection and duplicate removal
- Lazy suffix/formation auditing
- Compound/hyphen review
- Donor balance analysis
- Notes quality validation
- Protected word restoration from v1.3 baseline

All corrections were automatically applied based on established linguistic rules and the v1.3 baseline reference.
`;
}

function calculateQualityScore(qa_results, corrections) {
  let score = 100;
  
  // Deduct points for issues
  score -= qa_results.collisions.total_collisions * 0.5;
  score -= qa_results.lazy_suffixes.issues.length * 0.3;
  score -= qa_results.compounds.length * 0.2;
  score -= qa_results.notes_quality.issues.length * 0.1;
  
  // Add points for corrections
  score += corrections.length * 0.2;
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================================
// 11. MAIN EXECUTION
// ============================================================================

if (require.main === module) {
  const inputFile = process.argv[2] || './data/UnifiedLibranDictionaryv1.6.3.json';
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }
  
  runQAPipeline(inputFile);
}

module.exports = {
  runQAPipeline,
  detectCollisions,
  auditLazySuffixes,
  auditCompounds,
  analyzeDonorBalance,
  auditNotesQuality,
  generateCorrections
};
