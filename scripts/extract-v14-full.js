const fs = require('fs');
const v14 = require('./data/Unified_Libran_Dictionary_v1_4.json');

console.log('=== EXTRACTING V1.4 FULL DICTIONARY ===');

let ancientEntries = {};
let modernEntries = {};

// Process all clusters
for (const clusterName in v14.clusters) {
  const cluster = v14.clusters[clusterName];
  console.log(`Processing cluster: ${clusterName}`);
  
  // Process ancient entries
  if (cluster.ancient) {
    for (const english in cluster.ancient) {
      const libran = cluster.ancient[english];
      if (libran && libran !== '—' && libran.trim() !== '') {
        ancientEntries[english.toLowerCase()] = libran;
      }
    }
  }
  
  // Process modern entries
  if (cluster.modern) {
    for (const english in cluster.modern) {
      const libran = cluster.modern[english];
      if (libran && libran !== '—' && libran.trim() !== '') {
        modernEntries[english.toLowerCase()] = libran;
      }
    }
  }
}

console.log('Extracted entries:');
console.log('- Ancient:', Object.keys(ancientEntries).length);
console.log('- Modern:', Object.keys(modernEntries).length);

// Write the new dictionaries
fs.writeFileSync('./lib/translator/dictionaries/ancient.json', JSON.stringify(ancientEntries, null, 2));
fs.writeFileSync('./lib/translator/dictionaries/modern.json', JSON.stringify(modernEntries, null, 2));

console.log('\n✅ Dictionaries updated with v1.4 full entries');
console.log('Files written:');
console.log('- lib/translator/dictionaries/ancient.json');
console.log('- lib/translator/dictionaries/modern.json');
