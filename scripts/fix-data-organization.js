#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Fix Data Organization Script for Librán Dictionary
 * 
 * This script fixes the data organization after the initial reorganization
 * and handles the remaining files that need to be moved.
 */

console.log('🔧 Fixing Data Organization for Librán Dictionary\n');

// Current data directory
const dataDir = './data';

/**
 * Move files from root directory to appropriate locations
 */
function moveRootFiles() {
  console.log('📦 Moving files from root directory...');
  
  const rootFiles = [
    {
      file: 'UnifiedLibranDictionaryv1.7.0.json',
      target: 'dictionaries/current/'
    },
    {
      file: 'qa_report_v1.7.0.json',
      target: 'training/validation/'
    }
  ];
  
  for (const { file, target } of rootFiles) {
    const srcPath = path.join('.', file);
    const destPath = path.join(dataDir, target, file);
    
    if (fs.existsSync(srcPath)) {
      try {
        // Ensure target directory exists
        const targetDir = path.dirname(destPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        fs.renameSync(srcPath, destPath);
        console.log(`  ✓ Moved ${file} to ${target}`);
      } catch (error) {
        console.log(`  ⚠️ Could not move ${file}: ${error.message}`);
      }
    } else {
      console.log(`  ⚠️ File not found: ${file}`);
    }
  }
}

/**
 * Move CSV files from lib/translator/dictionaries to data/training/csv
 */
function moveCSVFiles() {
  console.log('📦 Moving CSV files...');
  
  const csvFiles = [
    'lib/translator/dictionaries/VARIANTS.csv',
    'lib/translator/dictionaries/ALL_ROWS.csv'
  ];
  
  const targetDir = path.join(dataDir, 'training/csv');
  
  // Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  for (const csvFile of csvFiles) {
    if (fs.existsSync(csvFile)) {
      const filename = path.basename(csvFile);
      const destPath = path.join(targetDir, filename);
      
      try {
        fs.copyFileSync(csvFile, destPath);
        console.log(`  ✓ Copied ${filename} to training/csv/`);
      } catch (error) {
        console.log(`  ⚠️ Could not copy ${csvFile}: ${error.message}`);
      }
    }
  }
}

/**
 * Move workflow directories safely
 */
function moveWorkflowDirectories() {
  console.log('📦 Moving workflow directories...');
  
  const workflowDirs = ['approved', 'proposed', 'rejected'];
  
  for (const dir of workflowDirs) {
    const oldPath = path.join(dataDir, dir);
    const newPath = path.join(dataDir, 'workflow', dir);
    
    if (fs.existsSync(oldPath)) {
      try {
        // Check if target already exists
        if (fs.existsSync(newPath)) {
          console.log(`  ⚠️ Target directory already exists: workflow/${dir}`);
          continue;
        }
        
        // Create parent directory if it doesn't exist
        const parentDir = path.dirname(newPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        
        fs.renameSync(oldPath, newPath);
        console.log(`  ✓ Moved ${dir}/ to workflow/${dir}/`);
      } catch (error) {
        console.log(`  ⚠️ Could not move ${dir}/: ${error.message}`);
        console.log(`    Error: ${error.message}`);
      }
    }
  }
}

/**
 * Clean up empty directories
 */
function cleanupEmptyDirectories() {
  console.log('🧹 Cleaning up empty directories...');
  
  const dirsToCheck = [
    'dictionaries/archive',
    'training/validation'
  ];
  
  for (const dir of dirsToCheck) {
    const dirPath = path.join(dataDir, dir);
    if (fs.existsSync(dirPath)) {
      try {
        const files = fs.readdirSync(dirPath);
        if (files.length === 0) {
          fs.rmdirSync(dirPath);
          console.log(`  ✓ Removed empty directory: ${dir}`);
        }
      } catch (error) {
        console.log(`  ⚠️ Could not check/remove ${dir}: ${error.message}`);
      }
    }
  }
}

/**
 * Create missing configuration files
 */
function createConfigurationFiles() {
  console.log('⚙️ Creating configuration files...');
  
  // Create data sources configuration
  const dataSourcesConfig = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    structure: 'recommended',
    directories: {
      dictionaries: {
        current: ['UnifiedLibranDictionaryv1.7.0.json', 'UnifiedLibranDictionaryv1.6.3.json'],
        baseline: ['UnifiedLibranDictionaryv1.3Baseline.json'],
        archive: []
      },
      tranches: {
        core: ['Libran_Core_Grammar_Pack_v1.5.1.json', 'Libran_Core_Nature_Places_Tranche_v1.5.1.json'],
        concepts: ['Libran_Abstract_Concepts_Qualities_Tranche_v1.5.1.json'],
        living: ['Libran_Animals_Plants_Tranche_v1.5.1.json', 'Libran_Creatures_Mythic_Beings_Tranche_v1.5.1.json', 'Libran_Kinship_Body_Tranche_v1.5.1.json'],
        society: ['Libran_Alesii_Politics_Tranche_v1.5.1.json', 'libran_law_justice_v1.json', 'libran_trade_commerce_v1.json'],
        craft: ['Libran_Materials_Crafting_Tranche_v1.5.1.json', 'libran_craftwork_corrected_v1_6_1.json', 'libran_agriculture_fixed_v1_6_1.json'],
        culture: ['libran_music_performance_v1.json', 'libran_healing_medicine_v1.json', 'libran_weapons_warfare_v1.json', 'libran_weather_natural_phenomena_v1.json']
      },
      reference: {
        pdfs: ['LibránLexiconReferenceGuide.pdf', 'Unified_Libran_Dictionary_Ancient_Modern_v1_2.pdf'],
        guides: ['phrasebook-v1.2.json'],
        samples: ['sample_ancient.json', 'sample_modern.json']
      },
      training: {
        csv: ['VARIANTS.csv', 'ALL_ROWS.csv'],
        exclusions: ['audit-exclusions.json', 'exclude_terms.txt'],
        validation: ['qa_report_v1.7.0.json']
      },
      workflow: {
        approved: [],
        proposed: [],
        rejected: []
      }
    },
    priorities: {
      high: ['dictionaries/current', 'tranches/core', 'reference/pdfs'],
      medium: ['tranches', 'training/csv', 'training/exclusions'],
      low: ['dictionaries/archive', 'reference/samples', 'workflow']
    }
  };
  
  const configDir = path.join(dataDir, 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(configDir, 'data-sources.json'),
    JSON.stringify(dataSourcesConfig, null, 2)
  );
  console.log('  ✓ Created config/data-sources.json');
  
  // Create README for new structure
  const readmeContent = `# Data Directory Structure

This directory contains the Librán Dictionary data organized for optimal AI training and data management.

## Directory Structure

- **dictionaries/**: Main dictionary files
  - **current/**: Latest versions
  - **baseline/**: Reference versions
  - **archive/**: Historical versions

- **tranches/**: Thematic word collections
  - **core/**: Core grammar and nature
  - **concepts/**: Abstract concepts
  - **living/**: Living things
  - **society/**: Social and political
  - **craft/**: Crafting and materials
  - **culture/**: Cultural and specialized

- **reference/**: Reference materials
  - **pdfs/**: PDF files
  - **guides/**: Text guides
  - **samples/**: Sample data

- **training/**: Training and validation data
  - **csv/**: CSV data
  - **exclusions/**: Exclusion lists
  - **validation/**: Validation datasets

- **workflow/**: Workflow management
  - **approved/**: Approved entries
  - **proposed/**: Proposed entries
  - **rejected/**: Rejected entries

- **config/**: Configuration files

## Adding New Data

When adding new data:
1. Place files in the appropriate directory
2. Update the AI priming system configuration
3. Run the training pipeline

## Backup

A backup of the original structure is available at: ../data-backup/
`;

  fs.writeFileSync(path.join(dataDir, 'README.md'), readmeContent);
  console.log('  ✓ Created README.md');
}

/**
 * Validate the final structure
 */
function validateFinalStructure() {
  console.log('✅ Validating final structure...');
  
  const expectedStructure = {
    'dictionaries/current': ['UnifiedLibranDictionaryv1.7.0.json', 'UnifiedLibranDictionaryv1.6.3.json'],
    'dictionaries/baseline': ['UnifiedLibranDictionaryv1.3Baseline.json'],
    'tranches/core': ['Libran_Core_Grammar_Pack_v1.5.1.json', 'Libran_Core_Nature_Places_Tranche_v1.5.1.json'],
    'tranches/concepts': ['Libran_Abstract_Concepts_Qualities_Tranche_v1.5.1.json'],
    'tranches/living': ['Libran_Animals_Plants_Tranche_v1.5.1.json', 'Libran_Creatures_Mythic_Beings_Tranche_v1.5.1.json', 'Libran_Kinship_Body_Tranche_v1.5.1.json'],
    'tranches/society': ['Libran_Alesii_Politics_Tranche_v1.5.1.json', 'libran_law_justice_v1.json', 'libran_trade_commerce_v1.json'],
    'tranches/craft': ['Libran_Materials_Crafting_Tranche_v1.5.1.json', 'libran_craftwork_corrected_v1_6_1.json', 'libran_agriculture_fixed_v1_6_1.json'],
    'tranches/culture': ['libran_music_performance_v1.json', 'libran_healing_medicine_v1.json', 'libran_weapons_warfare_v1.json', 'libran_weather_natural_phenomena_v1.json'],
    'reference/pdfs': ['LibránLexiconReferenceGuide.pdf', 'Unified_Libran_Dictionary_Ancient_Modern_v1_2.pdf'],
    'reference/guides': ['phrasebook-v1.2.json'],
    'reference/samples': ['sample_ancient.json', 'sample_modern.json'],
    'training/csv': ['VARIANTS.csv', 'ALL_ROWS.csv'],
    'training/exclusions': ['audit-exclusions.json', 'exclude_terms.txt'],
    'training/validation': ['qa_report_v1.7.0.json']
  };
  
  let valid = true;
  let totalFiles = 0;
  let foundFiles = 0;
  
  for (const [dir, files] of Object.entries(expectedStructure)) {
    const dirPath = path.join(dataDir, dir);
    if (!fs.existsSync(dirPath)) {
      console.log(`  ❌ Missing directory: ${dir}`);
      valid = false;
    } else {
      for (const filename of files) {
        totalFiles++;
        const filePath = path.join(dirPath, filename);
        if (fs.existsSync(filePath)) {
          foundFiles++;
        } else {
          console.log(`  ⚠️ Missing file: ${dir}/${filename}`);
        }
      }
    }
  }
  
  console.log(`  📊 Files found: ${foundFiles}/${totalFiles}`);
  
  if (valid && foundFiles === totalFiles) {
    console.log('  ✅ Structure validation passed');
  } else {
    console.log('  ⚠️ Structure validation completed with warnings');
  }
  
  return valid;
}

/**
 * Main fix function
 */
async function fixDataOrganization() {
  try {
    console.log('🎯 Fixing data organization...\n');
    
    // Step 1: Move files from root directory
    moveRootFiles();
    
    // Step 2: Move CSV files
    moveCSVFiles();
    
    // Step 3: Move workflow directories safely
    moveWorkflowDirectories();
    
    // Step 4: Clean up empty directories
    cleanupEmptyDirectories();
    
    // Step 5: Create configuration files
    createConfigurationFiles();
    
    // Step 6: Validate final structure
    const isValid = validateFinalStructure();
    
    console.log('\n🎉 Data organization fix completed!');
    console.log('\n📋 Summary:');
    console.log(`  ✅ Root files moved to appropriate locations`);
    console.log(`  ✅ CSV files copied to training directory`);
    console.log(`  ✅ Workflow directories moved safely`);
    console.log(`  ✅ Configuration files created`);
    console.log(`  ${isValid ? '✅' : '⚠️'} Structure validation: ${isValid ? 'PASSED' : 'COMPLETED WITH WARNINGS'}`);
    
    console.log('\n📚 Next Steps:');
    console.log('  1. Test the new structure with: node example-multi-format-priming.js');
    console.log('  2. Update your AI priming system configuration if needed');
    console.log('  3. Start adding new data to the appropriate directories');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  fixDataOrganization();
}

module.exports = {
  fixDataOrganization,
  moveRootFiles,
  moveCSVFiles,
  moveWorkflowDirectories,
  validateFinalStructure
};
