#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Review Workflow Tool for AI-Proposed Words
 * 
 * This tool helps manage the review and approval process for AI-generated words
 * stored in the data/proposed folder.
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  proposed_folder: './data/proposed',
  approved_folder: './data/approved',
  rejected_folder: './data/rejected',
  
  // Review criteria
  review_criteria: {
    linguistic_accuracy: [
      'Ancient form follows Latin patterns',
      'Modern form follows Hungarian/Romanian patterns',
      'Etymology is complete and accurate',
      'Donor language citations are correct'
    ],
    cultural_fit: [
      'Word fits Librán worldbuilding',
      'Semantic group is appropriate',
      'Maintains cultural authenticity',
      'Consistent with established patterns'
    ],
    phonetic_validation: [
      'Pronunciation is feasible',
      'Phonetic consistency maintained',
      'Sound shifts are correct',
      'No problematic combinations'
    ],
    documentation_quality: [
      'Etymology is complete',
      'Reasoning is sound',
      'Notes are comprehensive',
      'AI reasoning is valid'
    ]
  }
};

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * List all proposed word files
 */
function listProposedFiles() {
  console.log('📋 AI-Proposed Words Files');
  console.log('=' .repeat(40));
  
  if (!fs.existsSync(CONFIG.proposed_folder)) {
    console.log('❌ No proposed folder found');
    return [];
  }
  
  const files = fs.readdirSync(CONFIG.proposed_folder)
    .filter(file => file.startsWith('ai-proposed-words-') && file.endsWith('.json'))
    .sort()
    .reverse(); // Most recent first
  
  if (files.length === 0) {
    console.log('📭 No proposed word files found');
    return [];
  }
  
  files.forEach((file, index) => {
    const filePath = path.join(CONFIG.proposed_folder, file);
    const stats = fs.statSync(filePath);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    console.log(`${index + 1}. ${file}`);
    console.log(`   Generated: ${data.metadata.generated_on}`);
    console.log(`   Model: ${data.metadata.ai_model}`);
    console.log(`   Words: ${data.metadata.total_proposed}`);
    console.log(`   Status: ${data.metadata.status}`);
    console.log('');
  });
  
  return files;
}

/**
 * Review a specific proposed words file
 */
function reviewProposedWords(filename) {
  const filePath = path.join(CONFIG.proposed_folder, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filename}`);
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  console.log(`📖 Reviewing: ${filename}`);
  console.log('=' .repeat(50));
  console.log(`Generated: ${data.metadata.generated_on}`);
  console.log(`AI Model: ${data.metadata.ai_model}`);
  console.log(`Total Words: ${data.metadata.total_proposed}`);
  console.log(`Status: ${data.metadata.status}`);
  console.log('');
  
  // Group words by semantic group
  const grouped = data.proposed_words.reduce((acc, word) => {
    if (!acc[word.semantic_group]) {
      acc[word.semantic_group] = [];
    }
    acc[word.semantic_group].push(word);
    return acc;
  }, {});
  
  // Display words by group
  Object.entries(grouped).forEach(([group, words]) => {
    console.log(`🏷️  ${group.toUpperCase()} (${words.length} words)`);
    console.log('-'.repeat(30));
    
    words.forEach((word, index) => {
      console.log(`${index + 1}. ${word.english}`);
      console.log(`   Ancient: ${word.ancient}`);
      console.log(`   Modern: ${word.modern}`);
      console.log(`   Notes: ${word.notes}`);
      console.log(`   AI Reasoning: ${word.ai_reasoning}`);
      console.log(`   Status: ${word.status}`);
      if (word.review_notes) {
        console.log(`   Review Notes: ${word.review_notes}`);
      }
      console.log('');
    });
  });
  
  return data;
}

/**
 * Approve specific words from a file
 */
function approveWords(filename, wordIndices, reviewer, notes = '') {
  const filePath = path.join(CONFIG.proposed_folder, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filename}`);
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const approvedWords = [];
  
  wordIndices.forEach(index => {
    if (index >= 0 && index < data.proposed_words.length) {
      const word = data.proposed_words[index];
      word.approved = true;
      word.reviewer = reviewer;
      word.review_date = new Date().toISOString();
      word.status = 'approved';
      word.review_notes = notes;
      approvedWords.push(word);
      console.log(`✅ Approved: ${word.english} (${word.ancient} / ${word.modern})`);
    } else {
      console.log(`❌ Invalid index: ${index}`);
    }
  });
  
  // Save updated file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  // Move approved words to approved folder
  if (approvedWords.length > 0) {
    moveApprovedWords(filename, approvedWords);
  }
  
  console.log(`\n📝 Updated ${filename} with approvals`);
  console.log(`✅ Approved ${approvedWords.length} words`);
}

/**
 * Reject specific words from a file
 */
function rejectWords(filename, wordIndices, reviewer, reason) {
  const filePath = path.join(CONFIG.proposed_folder, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filename}`);
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const rejectedWords = [];
  
  wordIndices.forEach(index => {
    if (index >= 0 && index < data.proposed_words.length) {
      const word = data.proposed_words[index];
      word.approved = false;
      word.reviewer = reviewer;
      word.review_date = new Date().toISOString();
      word.status = 'rejected';
      word.review_notes = reason;
      rejectedWords.push(word);
      console.log(`❌ Rejected: ${word.english} - ${reason}`);
    } else {
      console.log(`❌ Invalid index: ${index}`);
    }
  });
  
  // Save updated file
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  // Move rejected words to rejected folder
  if (rejectedWords.length > 0) {
    moveRejectedWords(filename, rejectedWords);
  }
  
  console.log(`\n📝 Updated ${filename} with rejections`);
  console.log(`❌ Rejected ${rejectedWords.length} words`);
}

/**
 * Move approved words to approved folder
 */
function moveApprovedWords(sourceFilename, approvedWords) {
  if (!fs.existsSync(CONFIG.approved_folder)) {
    fs.mkdirSync(CONFIG.approved_folder, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const approvedFilename = `approved-words-${timestamp}.json`;
  const approvedFilePath = path.join(CONFIG.approved_folder, approvedFilename);
  
  const approvedData = {
    metadata: {
      source_file: sourceFilename,
      approved_on: new Date().toISOString(),
      total_approved: approvedWords.length,
      status: 'approved'
    },
    approved_words: approvedWords
  };
  
  fs.writeFileSync(approvedFilePath, JSON.stringify(approvedData, null, 2));
  console.log(`📁 Moved approved words to: ${approvedFilePath}`);
}

/**
 * Move rejected words to rejected folder
 */
function moveRejectedWords(sourceFilename, rejectedWords) {
  if (!fs.existsSync(CONFIG.rejected_folder)) {
    fs.mkdirSync(CONFIG.rejected_folder, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const rejectedFilename = `rejected-words-${timestamp}.json`;
  const rejectedFilePath = path.join(CONFIG.rejected_folder, rejectedFilename);
  
  const rejectedData = {
    metadata: {
      source_file: sourceFilename,
      rejected_on: new Date().toISOString(),
      total_rejected: rejectedWords.length,
      status: 'rejected'
    },
    rejected_words: rejectedWords
  };
  
  fs.writeFileSync(rejectedFilePath, JSON.stringify(rejectedData, null, 2));
  console.log(`📁 Moved rejected words to: ${rejectedFilePath}`);
}

/**
 * Generate review statistics
 */
function generateReviewStats() {
  console.log('📊 Review Statistics');
  console.log('=' .repeat(30));
  
  let totalProposed = 0;
  let totalApproved = 0;
  let totalRejected = 0;
  let pendingReview = 0;
  
  // Count proposed words
  if (fs.existsSync(CONFIG.proposed_folder)) {
    const proposedFiles = fs.readdirSync(CONFIG.proposed_folder)
      .filter(file => file.startsWith('ai-proposed-words-') && file.endsWith('.json'));
    
    proposedFiles.forEach(file => {
      const data = JSON.parse(fs.readFileSync(path.join(CONFIG.proposed_folder, file), 'utf8'));
      totalProposed += data.proposed_words.length;
      
      data.proposed_words.forEach(word => {
        if (word.status === 'approved') totalApproved++;
        else if (word.status === 'rejected') totalRejected++;
        else if (word.status === 'pending_review') pendingReview++;
      });
    });
  }
  
  // Count approved words
  if (fs.existsSync(CONFIG.approved_folder)) {
    const approvedFiles = fs.readdirSync(CONFIG.approved_folder)
      .filter(file => file.startsWith('approved-words-') && file.endsWith('.json'));
    
    approvedFiles.forEach(file => {
      const data = JSON.parse(fs.readFileSync(path.join(CONFIG.approved_folder, file), 'utf8'));
      totalApproved += data.approved_words.length;
    });
  }
  
  // Count rejected words
  if (fs.existsSync(CONFIG.rejected_folder)) {
    const rejectedFiles = fs.readdirSync(CONFIG.rejected_folder)
      .filter(file => file.startsWith('rejected-words-') && file.endsWith('.json'));
    
    rejectedFiles.forEach(file => {
      const data = JSON.parse(fs.readFileSync(path.join(CONFIG.rejected_folder, file), 'utf8'));
      totalRejected += data.rejected_words.length;
    });
  }
  
  console.log(`Total Proposed: ${totalProposed}`);
  console.log(`Pending Review: ${pendingReview}`);
  console.log(`Approved: ${totalApproved}`);
  console.log(`Rejected: ${totalRejected}`);
  console.log(`Approval Rate: ${totalProposed > 0 ? (totalApproved / totalProposed * 100).toFixed(1) : 0}%`);
}

/**
 * Create integration batch from approved words
 */
function createIntegrationBatch() {
  console.log('📦 Creating Integration Batch');
  console.log('=' .repeat(30));
  
  if (!fs.existsSync(CONFIG.approved_folder)) {
    console.log('❌ No approved words found');
    return;
  }
  
  const approvedFiles = fs.readdirSync(CONFIG.approved_folder)
    .filter(file => file.startsWith('approved-words-') && file.endsWith('.json'));
  
  if (approvedFiles.length === 0) {
    console.log('❌ No approved word files found');
    return;
  }
  
  const allApprovedWords = [];
  
  approvedFiles.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(CONFIG.approved_folder, file), 'utf8'));
    allApprovedWords.push(...data.approved_words);
  });
  
  const integrationBatch = {
    metadata: {
      created_on: new Date().toISOString(),
      total_words: allApprovedWords.length,
      source_files: approvedFiles,
      status: 'ready_for_integration'
    },
    words: allApprovedWords.map(word => ({
      english: word.english,
      ancient: word.ancient,
      modern: word.modern,
      notes: word.notes,
      ai_generated: true,
      semantic_group: word.semantic_group,
      approved_by: word.reviewer,
      approved_on: word.review_date
    }))
  };
  
  const batchFilename = `integration-batch-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const batchFilePath = path.join(CONFIG.approved_folder, batchFilename);
  
  fs.writeFileSync(batchFilePath, JSON.stringify(integrationBatch, null, 2));
  
  console.log(`✅ Created integration batch: ${batchFilename}`);
  console.log(`📝 Contains ${allApprovedWords.length} approved words`);
  console.log(`📁 Saved to: ${batchFilePath}`);
  
  return batchFilePath;
}

// ============================================================================
// COMMAND LINE INTERFACE
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === '--help' || command === '-h') {
    console.log(`
📋 AI-Proposed Words Review Tool

USAGE:
  node review-proposed-words.js <command> [options]

COMMANDS:
  list                    List all proposed word files
  review <filename>       Review a specific proposed words file
  approve <filename> <indices> <reviewer> [notes]
                         Approve specific words by index
  reject <filename> <indices> <reviewer> <reason>
                         Reject specific words by index
  stats                   Show review statistics
  batch                   Create integration batch from approved words

EXAMPLES:
  # List all proposed files
  node review-proposed-words.js list

  # Review a specific file
  node review-proposed-words.js review ai-proposed-words-2025-09-23T02-43-57-996Z.json

  # Approve words at indices 0, 2, 5
  node review-proposed-words.js approve ai-proposed-words-2025-09-23T02-43-57-996Z.json 0,2,5 "John Doe" "Good linguistic quality"

  # Reject word at index 1
  node review-proposed-words.js reject ai-proposed-words-2025-09-23T02-43-57-996Z.json 1 "John Doe" "Poor etymology"

  # Show statistics
  node review-proposed-words.js stats

  # Create integration batch
  node review-proposed-words.js batch

REVIEW CRITERIA:
  - Linguistic Accuracy (Latin/Hungarian patterns, etymology)
  - Cultural Fit (Librán worldbuilding, semantic groups)
  - Phonetic Validation (pronunciation, sound shifts)
  - Documentation Quality (completeness, reasoning)
`);
    process.exit(0);
  }
  
  switch (command) {
    case 'list':
      listProposedFiles();
      break;
      
    case 'review':
      if (args.length < 2) {
        console.log('❌ Please provide filename');
        process.exit(1);
      }
      reviewProposedWords(args[1]);
      break;
      
    case 'approve':
      if (args.length < 4) {
        console.log('❌ Usage: approve <filename> <indices> <reviewer> [notes]');
        process.exit(1);
      }
      const indices = args[2].split(',').map(i => parseInt(i.trim()));
      const reviewer = args[3];
      const notes = args[4] || '';
      approveWords(args[1], indices, reviewer, notes);
      break;
      
    case 'reject':
      if (args.length < 5) {
        console.log('❌ Usage: reject <filename> <indices> <reviewer> <reason>');
        process.exit(1);
      }
      const rejectIndices = args[2].split(',').map(i => parseInt(i.trim()));
      const rejectReviewer = args[3];
      const reason = args[4];
      rejectWords(args[1], rejectIndices, rejectReviewer, reason);
      break;
      
    case 'stats':
      generateReviewStats();
      break;
      
    case 'batch':
      createIntegrationBatch();
      break;
      
    default:
      console.log(`❌ Unknown command: ${command}`);
      console.log('Use --help for usage information');
      process.exit(1);
  }
}

module.exports = {
  listProposedFiles,
  reviewProposedWords,
  approveWords,
  rejectWords,
  generateReviewStats,
  createIntegrationBatch
};
