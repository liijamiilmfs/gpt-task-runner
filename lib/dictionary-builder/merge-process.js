const fs = require('fs');
const path = require('path');

/**
 * Merges all tranche files into a unified dictionary
 * Handles different file formats and duplicate detection
 */
async function mergeTranchesToUnified() {
  console.log('📚 Merging tranche files...');
  
  const tranchesDir = './data/Tranches';
  const outputFile = './data/UnifiedLibranDictionaryv1.6.3.json';
  
  // Get all JSON files in tranches directory
  const files = fs.readdirSync(tranchesDir)
    .filter(file => file.endsWith('.json'))
    .filter(file => !file.includes('UnifiedLibranDictionary'))
    .filter(file => !file.includes(' (1)'))
    .filter(file => !file.startsWith('merged'))
    .filter(file => !file.startsWith('delete'))
    .sort();
  
  console.log(`Found ${files.length} tranche files to merge`);
  
  let allEntries = [];
  let processedFiles = [];
  let totalEntries = 0;
  let duplicateCount = 0;
  const seenEntries = new Set();
  
  // Process each tranche file
  for (const file of files) {
    console.log(`  Processing: ${file}`);
    const filePath = path.join(tranchesDir, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      let data = JSON.parse(content);
      
      // Handle different data structures
      let entries = extractEntries(data);
      
      console.log(`    Found ${entries.length} entries`);
      
      // Process entries and check for duplicates
      let fileDuplicates = 0;
      for (const entry of entries) {
        if (!isValidEntry(entry)) {
          console.warn(`    ⚠️  Skipping incomplete entry:`, entry);
          continue;
        }
        
        const entryKey = createEntryKey(entry);
        
        if (seenEntries.has(entryKey)) {
          fileDuplicates++;
          duplicateCount++;
        } else {
          seenEntries.add(entryKey);
          allEntries.push(entry);
          totalEntries++;
        }
      }
      
      if (fileDuplicates > 0) {
        console.log(`    ⚠️  Found ${fileDuplicates} duplicate entries`);
      }
      
      processedFiles.push({
        filename: file,
        entries: entries.length,
        duplicates: fileDuplicates
      });
      
    } catch (error) {
      console.error(`    ❌ Error processing ${file}:`, error.message);
    }
  }
  
  // Create the unified dictionary structure
  const unifiedDictionary = {
    metadata: {
      version: "1.6.3",
      created_on: new Date().toISOString(),
      files_included: processedFiles.map(f => f.filename),
      total_entries: totalEntries,
      duplicates_removed: duplicateCount,
      processing_notes: [
        "Merged from individual tranche files",
        "Removed duplicate entries based on english|ancient|modern combination",
        "Excluded existing unified dictionaries and duplicate files"
      ],
      project: "Librán Language Files",
      source_directory: tranchesDir
    },
    sections: {
      "Unified": {
        data: allEntries,
        files: processedFiles.map(f => ({
          filename: f.filename,
          entries: f.entries,
          duplicates_removed: f.duplicates
        }))
      }
    }
  };
  
  // Write the unified dictionary
  fs.writeFileSync(outputFile, JSON.stringify(unifiedDictionary, null, 2));
  
  console.log(`✅ Unified dictionary created: ${outputFile}`);
  console.log(`📊 Merge statistics:`);
  console.log(`   - ${totalEntries} unique entries`);
  console.log(`   - ${duplicateCount} duplicates removed`);
  console.log(`   - ${processedFiles.length} source files`);
  
  return {
    totalEntries,
    duplicateCount,
    filesProcessed: processedFiles.length,
    outputFile
  };
}

/**
 * Extract entries from different data structures
 */
function extractEntries(data) {
  let entries = [];
  
  if (Array.isArray(data)) {
    // Direct array of entries
    entries = data;
  } else if (data.sections) {
    // Unified dictionary format with sections
    for (const sectionName in data.sections) {
      const section = data.sections[sectionName];
      if (section.data && Array.isArray(section.data)) {
        entries = entries.concat(section.data);
      }
      if (section.files && Array.isArray(section.files)) {
        for (const fileData of section.files) {
          if (fileData.data && Array.isArray(fileData.data)) {
            entries = entries.concat(fileData.data);
          }
        }
      }
    }
  } else if (data.data && Array.isArray(data.data)) {
    // Object with data array
    entries = data.data;
  }
  
  return entries;
}

/**
 * Check if an entry has all required fields
 */
function isValidEntry(entry) {
  return entry.english && entry.ancient && entry.modern;
}

/**
 * Create a unique key for duplicate detection
 */
function createEntryKey(entry) {
  return `${entry.english.toLowerCase()}|${entry.ancient}|${entry.modern}`;
}

module.exports = {
  mergeTranchesToUnified
};
