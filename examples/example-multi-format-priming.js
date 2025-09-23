#!/usr/bin/env node

const EnhancedAIMultiFormat = require('./lib/ai-integration/enhanced-ai-multi-format');

/**
 * Example usage of Multi-Format Priming System for Librán Dictionary
 * 
 * This script demonstrates how to use both JSON and PDF files as context
 * for AI model analysis and generation.
 */

async function demonstrateMultiFormatPriming() {
  console.log('🎯 Multi-Format Priming System Demo for Librán Dictionary\n');

  // Initialize the enhanced AI system
  const aiSystem = new EnhancedAIMultiFormat();
  
  try {
    await aiSystem.initialize({
      dataDir: './data',
      model: 'llama-2-7b-chat' // or your preferred model
    });

    // Display comprehensive statistics
    console.log('\n📊 Multi-Format Context Statistics:');
    const stats = aiSystem.getComprehensiveStats();
    console.log(JSON.stringify(stats, null, 2));

    // Example 1: Analyze a word with comprehensive context
    console.log('\n🔍 Example 1: Word Analysis with Multi-Format Context');
    console.log('=' .repeat(60));
    
    const wordAnalysis = await aiSystem.analyzeWordWithContext(
      'kethara', 
      'etymology',
      { category: 'living' }
    );
    console.log('Analysis Result:', JSON.stringify(wordAnalysis, null, 2));

    // Example 2: Generate a new word with comprehensive context
    console.log('\n✨ Example 2: Word Generation with Multi-Format Context');
    console.log('=' .repeat(60));
    
    const wordGeneration = await aiSystem.generateWordWithContext(
      'mountain',
      'nature',
      { context: 'A tall, rocky peak in the northern ranges' }
    );
    console.log('Generation Result:', JSON.stringify(wordGeneration, null, 2));

    // Example 3: Translation with comprehensive context
    console.log('\n🔄 Example 3: Translation with Multi-Format Context');
    console.log('=' .repeat(60));
    
    const translation = await aiSystem.translateWithContext(
      'The wise elder spoke of ancient traditions',
      'en-to-libran',
      { focus: 'cultural_context' }
    );
    console.log('Translation Result:', JSON.stringify(translation, null, 2));

    // Example 4: Get comprehensive context for a task
    console.log('\n📚 Example 4: Getting Multi-Format Context');
    console.log('=' .repeat(60));
    
    const context = aiSystem.getContextForTask('reference_heavy', {
      category: 'society',
      focus: 'political_terms'
    });
    console.log('Context Metadata:', JSON.stringify(context.metadata, null, 2));

    // Example 5: Comprehensive QA Analysis
    console.log('\n🔍 Example 5: Comprehensive QA Analysis');
    console.log('=' .repeat(60));
    
    // Load a sample dictionary for QA
    const fs = require('fs');
    const sampleDict = JSON.parse(fs.readFileSync('./data/UnifiedLibranDictionaryv1.7.0.json', 'utf8'));
    
    const qaResult = await aiSystem.performComprehensiveQAAnalysis(sampleDict, {
      focus: 'consistency_check'
    });
    console.log('QA Result:', JSON.stringify(qaResult, null, 2));

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Demonstrate different context strategies
 */
async function demonstrateContextStrategies() {
  console.log('\n🎯 Multi-Format Context Strategy Demo\n');

  const aiSystem = new EnhancedAIMultiFormat();
  await aiSystem.initialize({ dataDir: './data' });

  const strategies = [
    'word_generation',
    'translation', 
    'etymology',
    'qa_analysis',
    'pattern_analysis',
    'comprehensive',
    'reference_heavy'
  ];

  for (const strategy of strategies) {
    console.log(`\n📋 Strategy: ${strategy}`);
    console.log('-'.repeat(40));
    
    const context = aiSystem.getContextForTask(strategy, {
      category: 'living',
      focus: 'animals'
    });
    
    console.log(`  JSON Categories: ${context.json.metadata.categories.join(', ')}`);
    console.log(`  PDF Files: ${context.pdf?.fileCount || 0}`);
    console.log(`  Total Size: ${context.metadata.totalSize} characters`);
    console.log(`  JSON Weight: ${context.metadata.jsonWeight * 100}%`);
    console.log(`  PDF Weight: ${context.metadata.pdfWeight * 100}%`);
  }
}

/**
 * Demonstrate PDF-specific features
 */
async function demonstratePDFFeatures() {
  console.log('\n📄 PDF Features Demo\n');

  const aiSystem = new EnhancedAIMultiFormat();
  await aiSystem.initialize({ dataDir: './data' });

  // Check PDF support
  const stats = aiSystem.getComprehensiveStats();
  console.log('PDF Support Status:', stats.combined.pdfSupport);

  if (stats.combined.hasPDF) {
    console.log('\n📊 PDF Statistics:');
    console.log(`  Total PDF Files: ${stats.pdf.totalFiles}`);
    console.log(`  Total PDF Size: ${stats.pdf.totalSize} characters`);
    
    // Show PDF files
    if (stats.pdf.files && stats.pdf.files.length > 0) {
      console.log('\n📁 PDF Files Loaded:');
      stats.pdf.files.forEach(pdf => {
        console.log(`  - ${pdf.file}: ${pdf.size} chars, ${pdf.pages} pages`);
      });
    }

    // Extract information from PDFs
    console.log('\n🔍 Extracting Information from PDFs:');
    const info = aiSystem.extractInformation('dictionaries');
    if (info.pdf.dictionaries && info.pdf.dictionaries.length > 0) {
      console.log(`  Dictionary Entries Found: ${info.pdf.dictionaries.length}`);
      console.log('  Sample entries:', info.pdf.dictionaries.slice(0, 3));
    }
  } else {
    console.log('⚠️ PDF support not available. Install with: npm install pdf-parse');
  }
}

/**
 * Demonstrate context compression and optimization
 */
async function demonstrateContextOptimization() {
  console.log('\n🗜️ Context Optimization Demo\n');

  const aiSystem = new EnhancedAIMultiFormat();
  await aiSystem.initialize({ dataDir: './data' });

  const taskTypes = ['word_generation', 'translation', 'comprehensive', 'reference_heavy'];
  
  for (const taskType of taskTypes) {
    console.log(`\n📊 ${taskType.toUpperCase()} Context Optimization:`);
    
    const context = aiSystem.getContextForTask(taskType);
    const totalSize = context.metadata.totalSize;
    const jsonSize = context.metadata.jsonSize;
    const pdfSize = context.metadata.pdfSize;
    
    console.log(`  Total Size: ${totalSize} characters`);
    console.log(`  JSON Size: ${jsonSize} characters (${((jsonSize/totalSize)*100).toFixed(1)}%)`);
    console.log(`  PDF Size: ${pdfSize} characters (${((pdfSize/totalSize)*100).toFixed(1)}%)`);
    console.log(`  JSON Weight: ${context.metadata.jsonWeight * 100}%`);
    console.log(`  PDF Weight: ${context.metadata.pdfWeight * 100}%`);
    
    // Show sample of compressed data
    const sampleCategory = context.json.metadata.categories[0];
    if (sampleCategory && context.json.context[sampleCategory]) {
      const sample = context.json.context[sampleCategory][0];
      console.log(`  Sample from ${sampleCategory}:`, {
        file: sample.file,
        type: sample.type,
        entries_count: sample.entries?.length || 0
      });
    }
  }
}

// Run the demonstrations
async function main() {
  console.log('🚀 Starting Multi-Format Priming System Demonstrations\n');
  
  try {
    await demonstrateMultiFormatPriming();
    await demonstrateContextStrategies();
    await demonstratePDFFeatures();
    await demonstrateContextOptimization();
    
    console.log('\n✅ All demonstrations completed successfully!');
    console.log('\n💡 Key Benefits of Multi-Format Priming:');
    console.log('  • Context-aware AI responses from both JSON and PDF sources');
    console.log('  • Intelligent compression and optimization for token limits');
    console.log('  • Task-specific context selection with weight balancing');
    console.log('  • Rich linguistic pattern recognition from multiple sources');
    console.log('  • Cultural authenticity maintenance using reference materials');
    console.log('  • Comprehensive quality assurance with cross-source validation');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  demonstrateMultiFormatPriming,
  demonstrateContextStrategies,
  demonstratePDFFeatures,
  demonstrateContextOptimization
};
