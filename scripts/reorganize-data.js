#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Data Reorganization Script for Librán Dictionary
 * 
 * This script helps reorganize your data directory into the recommended
 * structure for optimal AI training and data management.
 */

console.log('🚀 Starting Data Reorganization for Librán Dictionary\n');

// Define the recommended directory structure
const recommendedStructure = {
  'dictionaries': {
    'current': [
      'UnifiedLibranDictionaryv1.7.0.json',
      'UnifiedLibranDictionaryv1.6.3.json'
    ],
    'baseline': [
      'UnifiedLibranDictionaryv1.3Baseline.json'
    ],
    'archive': [
      'Unified_Libran_Dictionary_Ancient_Modern_v1_2.json'
    ]
  },
  'tranches': {
    'core': [
      'Libran_Core_Grammar_Pack_v1.5.1.json',
      'Libran_Core_Nature_Places_Tranche_v1.5.1.json'
    ],
    'concepts': [
      'Libran_Abstract_Concepts_Qualities_Tranche_v1.5.1.json',
      'Libran_MiniPack_EverydayAdditionsII_v1.5.1.json'
    ],
    'living': [
      'Libran_Animals_Plants_Tranche_v1.5.1.json',
      'Libran_Creatures_Mythic_Beings_Tranche_v1.5.1.json',
      'Libran_Creatures_Mythic_Beings_Tranche_v1.5.1 (1).json',
      'Libran_Kinship_Body_Tranche_v1.5.1.json'
    ],
    'society': [
      'Libran_Alesii_Politics_Tranche_v1.5.1.json',
      'libran_law_justice_v1.json',
      'libran_trade_commerce_v1.json'
    ],
    'craft': [
      'Libran_Materials_Crafting_Tranche_v1.5.1.json',
      'libran_craftwork_corrected_v1_6_1.json',
      'libran_agriculture_fixed_v1_6_1.json'
    ],
    'culture': [
      'libran_music_performance_v1.json',
      'libran_healing_medicine_v1.json',
      'libran_weapons_warfare_v1.json',
      'libran_weather_natural_phenomena_v1.json'
    ]
  },
  'reference': {
    'pdfs': [
      'LibránLexiconReferenceGuide.pdf',
      'Unified_Libran_Dictionary_Ancient_Modern_v1_2.pdf'
    ],
    'guides': [
      'phrasebook-v1.2.json'
    ],
    'samples': [
      'sample_ancient.json',
      'sample_modern.json'
    ]
  },
  'training': {
    'csv': [
      'VARIANTS.csv',
      'ALL_ROWS.csv'
    ],
    'exclusions': [
      'audit-exclusions.json',
      'exclude_terms.txt'
    ],
    'validation': [
      'qa_report_v1.7.0.json'
    ]
  },
  'workflow': {
    'approved': [],
    'proposed': [],
    'rejected': []
  }
};

// Current data directory
const dataDir = './data';
const backupDir = './data-backup';

/**
 * Create directory structure
 */
function createDirectoryStructure() {
  console.log('📁 Creating recommended directory structure...');
  
  for (const [mainDir, subdirs] of Object.entries(recommendedStructure)) {
    const mainPath = path.join(dataDir, mainDir);
    if (!fs.existsSync(mainPath)) {
      fs.mkdirSync(mainPath, { recursive: true });
      console.log(`  ✓ Created ${mainDir}/`);
    }
    
    for (const [subdir, files] of Object.entries(subdirs)) {
      const subPath = path.join(mainPath, subdir);
      if (!fs.existsSync(subPath)) {
        fs.mkdirSync(subPath, { recursive: true });
        console.log(`    ✓ Created ${mainDir}/${subdir}/`);
      }
    }
  }
}

/**
 * Backup existing data
 */
function backupExistingData() {
  console.log('💾 Creating backup of existing data...');
  
  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true });
  }
  
  fs.mkdirSync(backupDir, { recursive: true });
  
  // Copy all existing files to backup
  copyDirectory(dataDir, backupDir);
  console.log(`  ✓ Backup created at ${backupDir}`);
}

/**
 * Copy directory recursively
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Move files to new structure
 */
function moveFilesToNewStructure() {
  console.log('📦 Moving files to new structure...');
  
  for (const [mainDir, subdirs] of Object.entries(recommendedStructure)) {
    for (const [subdir, files] of Object.entries(subdirs)) {
      for (const filename of files) {
        const oldPath = path.join(dataDir, filename);
        const newPath = path.join(dataDir, mainDir, subdir, filename);
        
        if (fs.existsSync(oldPath)) {
          // Create directory if it doesn't exist
          const dirPath = path.dirname(newPath);
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          
          // Move file
          fs.renameSync(oldPath, newPath);
          console.log(`  ✓ Moved ${filename} to ${mainDir}/${subdir}/`);
        } else {
          console.log(`  ⚠️ File not found: ${filename}`);
        }
      }
    }
  }
}

/**
 * Move remaining files to appropriate locations
 */
function moveRemainingFiles() {
  console.log('📦 Moving remaining files...');
  
  const items = fs.readdirSync(dataDir);
  
  for (const item of items) {
    const itemPath = path.join(dataDir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      let targetDir = 'reference/samples'; // Default location
      
      // Determine target directory based on file type and name
      if (ext === '.pdf') {
        targetDir = 'reference/pdfs';
      } else if (ext === '.csv') {
        targetDir = 'training/csv';
      } else if (ext === '.txt') {
        targetDir = 'training/exclusions';
      } else if (ext === '.json') {
        if (item.includes('exclusion') || item.includes('audit')) {
          targetDir = 'training/exclusions';
        } else if (item.includes('qa') || item.includes('report')) {
          targetDir = 'training/validation';
        } else {
          targetDir = 'reference/samples';
        }
      }
      
      const newPath = path.join(dataDir, targetDir, item);
      const dirPath = path.dirname(newPath);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.renameSync(itemPath, newPath);
      console.log(`  ✓ Moved ${item} to ${targetDir}/`);
    }
  }
}

/**
 * Move Tranches directory
 */
function moveTranchesDirectory() {
  console.log('📦 Moving Tranches directory...');
  
  const tranchesPath = path.join(dataDir, 'Tranches');
  if (fs.existsSync(tranchesPath)) {
    const items = fs.readdirSync(tranchesPath);
    
    for (const item of items) {
      const srcPath = path.join(tranchesPath, item);
      const stat = fs.statSync(srcPath);
      
      if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (ext === '.json') {
          // Determine category based on filename
          let category = 'culture'; // Default
          
          if (item.includes('Core') || item.includes('Grammar')) {
            category = 'core';
          } else if (item.includes('Abstract') || item.includes('Concepts')) {
            category = 'concepts';
          } else if (item.includes('Animals') || item.includes('Creatures') || item.includes('Kinship')) {
            category = 'living';
          } else if (item.includes('Politics') || item.includes('law') || item.includes('trade')) {
            category = 'society';
          } else if (item.includes('Materials') || item.includes('craft') || item.includes('agriculture')) {
            category = 'craft';
          }
          
          const destPath = path.join(dataDir, 'tranches', category, item);
          const dirPath = path.dirname(destPath);
          
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          
          fs.renameSync(srcPath, destPath);
          console.log(`  ✓ Moved ${item} to tranches/${category}/`);
        }
      }
    }
    
    // Remove empty Tranches directory
    try {
      fs.rmdirSync(tranchesPath);
      console.log('  ✓ Removed empty Tranches directory');
    } catch (error) {
      console.log('  ⚠️ Could not remove Tranches directory (may not be empty)');
    }
  }
}

/**
 * Move workflow directories
 */
function moveWorkflowDirectories() {
  console.log('📦 Moving workflow directories...');
  
  const workflowDirs = ['approved', 'proposed', 'rejected'];
  
  for (const dir of workflowDirs) {
    const oldPath = path.join(dataDir, dir);
    const newPath = path.join(dataDir, 'workflow', dir);
    
    if (fs.existsSync(oldPath)) {
      if (!fs.existsSync(path.dirname(newPath))) {
        fs.mkdirSync(path.dirname(newPath), { recursive: true });
      }
      
      fs.renameSync(oldPath, newPath);
      console.log(`  ✓ Moved ${dir}/ to workflow/${dir}/`);
    }
  }
}

/**
 * Create configuration files
 */
function createConfigurationFiles() {
  console.log('⚙️ Creating configuration files...');
  
  // Create data sources configuration
  const dataSourcesConfig = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    structure: 'recommended',
    directories: recommendedStructure,
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
 * Validate the new structure
 */
function validateNewStructure() {
  console.log('✅ Validating new structure...');
  
  let valid = true;
  
  for (const [mainDir, subdirs] of Object.entries(recommendedStructure)) {
    const mainPath = path.join(dataDir, mainDir);
    if (!fs.existsSync(mainPath)) {
      console.log(`  ❌ Missing directory: ${mainDir}`);
      valid = false;
    }
    
    for (const [subdir, files] of Object.entries(subdirs)) {
      const subPath = path.join(mainPath, subdir);
      if (!fs.existsSync(subPath)) {
        console.log(`  ❌ Missing directory: ${mainDir}/${subdir}`);
        valid = false;
      }
      
      for (const filename of files) {
        const filePath = path.join(subPath, filename);
        if (!fs.existsSync(filePath)) {
          console.log(`  ⚠️ Missing file: ${mainDir}/${subdir}/${filename}`);
        }
      }
    }
  }
  
  if (valid) {
    console.log('  ✅ Structure validation passed');
  } else {
    console.log('  ⚠️ Structure validation completed with warnings');
  }
  
  return valid;
}

/**
 * Main reorganization function
 */
async function reorganizeData() {
  try {
    console.log('🎯 Starting data reorganization...\n');
    
    // Step 1: Create backup
    backupExistingData();
    
    // Step 2: Create directory structure
    createDirectoryStructure();
    
    // Step 3: Move files to new structure
    moveFilesToNewStructure();
    
    // Step 4: Move Tranches directory
    moveTranchesDirectory();
    
    // Step 5: Move workflow directories
    moveWorkflowDirectories();
    
    // Step 6: Move remaining files
    moveRemainingFiles();
    
    // Step 7: Create configuration files
    createConfigurationFiles();
    
    // Step 8: Validate new structure
    const isValid = validateNewStructure();
    
    console.log('\n🎉 Data reorganization completed!');
    console.log('\n📋 Summary:');
    console.log(`  ✅ Backup created at: ${backupDir}`);
    console.log(`  ✅ New structure created`);
    console.log(`  ✅ Files moved to new locations`);
    console.log(`  ✅ Configuration files created`);
    console.log(`  ${isValid ? '✅' : '⚠️'} Structure validation: ${isValid ? 'PASSED' : 'COMPLETED WITH WARNINGS'}`);
    
    console.log('\n📚 Next Steps:');
    console.log('  1. Update your AI priming system configuration');
    console.log('  2. Test the new structure with: node example-multi-format-priming.js');
    console.log('  3. Update any scripts that reference the old structure');
    console.log('  4. Remove the backup directory when you\'re confident everything works');
    
  } catch (error) {
    console.error('❌ Reorganization failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  reorganizeData();
}

module.exports = {
  reorganizeData,
  createDirectoryStructure,
  moveFilesToNewStructure,
  validateNewStructure
};
