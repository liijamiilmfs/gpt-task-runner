const fs = require('fs');

console.log('=== AUDIT EXCLUSION LIST MANAGER V2 ===');
console.log('For managing primordial Libran variations and canonical terms');
console.log('Uses your existing exclusion list format with categories and aliases');
console.log('');

// Load current exclusions
let exclusions;
try {
  exclusions = JSON.parse(fs.readFileSync('./data/audit-exclusions.json', 'utf8'));
  console.log('✅ Loaded existing exclusion list');
} catch (error) {
  console.log('❌ No exclusion list found');
  process.exit(1);
}

// Load the dictionary to find entries
const dictPath = './data/UnifiedLibranDictionaryv1.6.3.json';
const dictionary = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
const entries = dictionary.sections.Unified.data;

console.log(`📊 Dictionary has ${entries.length} entries`);
console.log('');

// Show current exclusions summary
console.log('📋 CURRENT EXCLUSIONS:');
let totalExclusions = 0;
Object.entries(exclusions.categories).forEach(([category, items]) => {
  console.log(`   ${category}: ${items.length} items`);
  totalExclusions += items.length;
});
console.log(`   Total: ${totalExclusions} exclusions`);
console.log('');

// Show normalization settings
console.log('⚙️  NORMALIZATION SETTINGS:');
console.log(`   Ignore Case: ${exclusions.normalization?.ignore_case || false}`);
console.log(`   Normalize Diacritics: ${exclusions.normalization?.normalize_diacritics || false}`);
console.log(`   Treat Hyphen-Dash Equal: ${exclusions.normalization?.treat_hyphen_dash_equal || true}`);
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
function addExclusion(category, name, aliases = [], note = '') {
  if (!exclusions.categories[category]) {
    exclusions.categories[category] = [];
  }
  
  const newExclusion = { name };
  if (aliases.length > 0) {
    newExclusion.aliases = aliases;
  }
  if (note) {
    newExclusion.note = note;
  }
  
  exclusions.categories[category].push(newExclusion);
  exclusions.meta.last_updated = new Date().toISOString();
  
  // Save the updated exclusions
  fs.writeFileSync('./data/audit-exclusions.json', JSON.stringify(exclusions, null, 2));
  console.log(`✅ Added exclusion to ${category}: ${name}${aliases.length > 0 ? ` (aliases: ${aliases.join(', ')})` : ''}`);
}

// Function to list exclusions by category
function listExclusions(category) {
  if (category && exclusions.categories[category]) {
    const items = exclusions.categories[category];
    if (items.length === 0) {
      console.log(`No items in ${category}.`);
      return;
    }
    
    console.log(`\n📋 ${category.toUpperCase().replace('_', ' ')}:`);
    items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.name}`);
      if (item.aliases) {
        console.log(`      Aliases: ${item.aliases.join(', ')}`);
      }
      if (item.note) {
        console.log(`      Note: ${item.note}`);
      }
    });
  } else {
    // List all categories
    Object.entries(exclusions.categories).forEach(([catName, items]) => {
      console.log(`\n📋 ${catName.toUpperCase().replace('_', ' ')} (${items.length} items):`);
      items.slice(0, 5).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name}${item.aliases ? ` (${item.aliases.length} aliases)` : ''}`);
      });
      if (items.length > 5) {
        console.log(`   ... and ${items.length - 5} more items`);
      }
    });
  }
}

// Function to test exclusions against dictionary entries
function testExclusions() {
  console.log('🧪 Testing exclusions against dictionary entries...');
  
  let matches = 0;
  let exactMatches = 0;
  let aliasMatches = 0;
  
  entries.forEach(entry => {
    Object.entries(exclusions.categories).forEach(([category, items]) => {
      items.forEach(item => {
        // Exact match
        if (item.name === entry.english) {
          exactMatches++;
          console.log(`   ✓ Exact match: "${entry.english}" in ${category}`);
        }
        
        // Alias match
        if (item.aliases) {
          item.aliases.forEach(alias => {
            if (alias === entry.english) {
              aliasMatches++;
              console.log(`   ✓ Alias match: "${entry.english}" → "${item.name}" in ${category}`);
            }
          });
        }
      });
    });
  });
  
  matches = exactMatches + aliasMatches;
  console.log(`\n📊 Test Results:`);
  console.log(`   Total matches: ${matches}`);
  console.log(`   Exact matches: ${exactMatches}`);
  console.log(`   Alias matches: ${aliasMatches}`);
}

// Interactive commands
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'search':
    const query = args[1];
    if (!query) {
      console.log('Usage: node manage-exclusions-v2.js search <query>');
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
    const [category, name, ...aliasArgs] = args.slice(1);
    if (!category || !name) {
      console.log('Usage: node manage-exclusions-v2.js add <category> <name> [alias1] [alias2] ... [--note "note"]');
      console.log('Categories:', Object.keys(exclusions.categories).join(', '));
      process.exit(1);
    }
    
    // Parse aliases and note
    const aliases = [];
    let note = '';
    let inNote = false;
    
    aliasArgs.forEach(arg => {
      if (arg === '--note') {
        inNote = true;
      } else if (inNote) {
        note = arg;
        inNote = false;
      } else {
        aliases.push(arg);
      }
    });
    
    addExclusion(category, name, aliases, note);
    break;
    
  case 'list':
    const listCategory = args[1];
    listExclusions(listCategory);
    break;
    
  case 'test':
    testExclusions();
    break;
    
  case 'categories':
    console.log('📂 Available categories:');
    Object.keys(exclusions.categories).forEach(cat => {
      console.log(`   - ${cat} (${exclusions.categories[cat].length} items)`);
    });
    break;
    
  default:
    console.log('📖 USAGE:');
    console.log('');
    console.log('Search for entries:');
    console.log('  node manage-exclusions-v2.js search <query>');
    console.log('');
    console.log('Add exclusion:');
    console.log('  node manage-exclusions-v2.js add <category> <name> [alias1] [alias2] ... [--note "note"]');
    console.log('');
    console.log('List exclusions:');
    console.log('  node manage-exclusions-v2.js list [category]');
    console.log('');
    console.log('Test exclusions:');
    console.log('  node manage-exclusions-v2.js test');
    console.log('');
    console.log('Show categories:');
    console.log('  node manage-exclusions-v2.js categories');
    console.log('');
    console.log('📝 EXAMPLES:');
    console.log('  node manage-exclusions-v2.js search "Cordavora"');
    console.log('  node manage-exclusions-v2.js add world_core "New Place" "NP" "NewP" --note "Primordial variation"');
    console.log('  node manage-exclusions-v2.js list world_core');
    console.log('  node manage-exclusions-v2.js test');
}
