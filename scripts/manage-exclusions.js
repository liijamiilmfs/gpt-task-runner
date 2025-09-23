const fs = require('fs');

console.log('=== AUDIT EXCLUSION LIST MANAGER ===');
console.log('For managing primordial Libran variations and canonical terms');
console.log('');

// Load current exclusions
let exclusions;
try {
  exclusions = JSON.parse(fs.readFileSync('./data/audit-exclusions.json', 'utf8'));
  console.log('✅ Loaded existing exclusion list');
} catch (error) {
  console.log('❌ No exclusion list found - creating new one');
  exclusions = {
    metadata: {
      version: "1.0",
      created_on: new Date().toISOString(),
      description: "Exclusion list for primordial Libran variations and canonical terms",
      last_updated: new Date().toISOString()
    },
    exclusions: {
      primordial_variations: [],
      canonical_terms: [],
      cultural_exceptions: []
    },
    exclusion_patterns: []
  };
}

// Load the dictionary to find entries
const dictPath = './data/UnifiedLibranDictionaryv1.6.3.json';
const dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
const entries = dictionary.sections.Unified.data;

console.log(`📊 Dictionary has ${entries.length} entries`);
console.log('');

// Show current exclusions
console.log('📋 CURRENT EXCLUSIONS:');
console.log(`   Primordial Variations: ${exclusions.exclusions.primordial_variations.length}`);
console.log(`   Canonical Terms: ${exclusions.exclusions.canonical_terms.length}`);
console.log(`   Cultural Exceptions: ${exclusions.exclusions.cultural_exceptions.length}`);
console.log(`   Exclusion Patterns: ${exclusions.exclusion_patterns.length}`);
console.log('');

// Function to search for entries
function searchEntries(query) {
  const results = entries.filter(entry => 
    entry.english.toLowerCase().includes(query.toLowerCase()) ||
    entry.ancient.toLowerCase().includes(query.toLowerCase()) ||
    entry.modern.toLowerCase().includes(query.toLowerCase())
  );
  return results.slice(0, 10); // Limit to first 10 results
}

// Function to add exclusion
function addExclusion(english, ancient, modern, category, reason) {
  const newExclusion = {
    english,
    ancient,
    modern,
    reason,
    category
  };
  
  exclusions.exclusions[category].push(newExclusion);
  exclusions.metadata.last_updated = new Date().toISOString();
  
  // Save the updated exclusions
  fs.writeFileSync('./data/audit-exclusions.json', JSON.stringify(exclusions, null, 2));
  console.log(`✅ Added exclusion: ${english} -> ${ancient} / ${modern}`);
}

// Function to list exclusions by category
function listExclusions(category) {
  const items = exclusions.exclusions[category];
  if (items.length === 0) {
    console.log(`No ${category} found.`);
    return;
  }
  
  console.log(`\n📋 ${category.toUpperCase().replace('_', ' ')}:`);
  items.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.english} -> ${item.ancient} / ${item.modern}`);
    console.log(`      Reason: ${item.reason}`);
  });
}

// Interactive commands
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'search':
    const query = args[1];
    if (!query) {
      console.log('Usage: node manage-exclusions.js search <query>');
      process.exit(1);
    }
    console.log(`🔍 Searching for "${query}":`);
    const results = searchEntries(query);
    results.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.english} -> ${entry.ancient} / ${entry.modern}`);
      if (entry.notes) {
        console.log(`      Notes: ${entry.notes}`);
      }
    });
    break;
    
  case 'add':
    const [category, english, ancient, modern, reason] = args.slice(1);
    if (!category || !english || !ancient || !modern || !reason) {
      console.log('Usage: node manage-exclusions.js add <category> <english> <ancient> <modern> <reason>');
      console.log('Categories: primordial_variations, canonical_terms, cultural_exceptions');
      process.exit(1);
    }
    addExclusion(english, ancient, modern, category, reason);
    break;
    
  case 'list':
    const listCategory = args[1] || 'all';
    if (listCategory === 'all') {
      listExclusions('primordial_variations');
      listExclusions('canonical_terms');
      listExclusions('cultural_exceptions');
    } else {
      listExclusions(listCategory);
    }
    break;
    
  case 'remove':
    const [removeCategory, removeIndex] = args.slice(1);
    if (!removeCategory || !removeIndex) {
      console.log('Usage: node manage-exclusions.js remove <category> <index>');
      console.log('Categories: primordial_variations, canonical_terms, cultural_exceptions');
      process.exit(1);
    }
    const index = parseInt(removeIndex) - 1;
    const items = exclusions.exclusions[removeCategory];
    if (index >= 0 && index < items.length) {
      const removed = items.splice(index, 1)[0];
      exclusions.metadata.last_updated = new Date().toISOString();
      fs.writeFileSync('./data/audit-exclusions.json', JSON.stringify(exclusions, null, 2));
      console.log(`✅ Removed: ${removed.english} -> ${removed.ancient} / ${removed.modern}`);
    } else {
      console.log('❌ Invalid index');
    }
    break;
    
  default:
    console.log('📖 USAGE:');
    console.log('');
    console.log('Search for entries:');
    console.log('  node manage-exclusions.js search <query>');
    console.log('');
    console.log('Add exclusion:');
    console.log('  node manage-exclusions.js add <category> <english> <ancient> <modern> <reason>');
    console.log('  Categories: primordial_variations, canonical_terms, cultural_exceptions');
    console.log('');
    console.log('List exclusions:');
    console.log('  node manage-exclusions.js list [category]');
    console.log('');
    console.log('Remove exclusion:');
    console.log('  node manage-exclusions.js remove <category> <index>');
    console.log('');
    console.log('📝 EXAMPLES:');
    console.log('  node manage-exclusions.js search "clan"');
    console.log('  node manage-exclusions.js add primordial_variations "clan" "Clanior" "Nemzë" "Primordial Libran variation"');
    console.log('  node manage-exclusions.js list primordial_variations');
    console.log('  node manage-exclusions.js remove primordial_variations 1');
}
