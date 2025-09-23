#!/usr/bin/env node

const EnhancedAISystem = require('./lib/ai-integration/enhanced-ai-with-priming');

/**
 * Example usage of JSON Priming System for Librán Dictionary
 * 
 * This script demonstrates how to use JSON files as context/primers
 * for AI model analysis and generation.
 */

async function demonstrateJSONPriming() {
  console.log('🎯 JSON Priming System Demo for Librán Dictionary\n');

  // Initialize the enhanced AI system
  const aiSystem = new EnhancedAISystem();
  
  try {
    await aiSystem.initialize({
      dataDir: './data',
      model: 'llama-2-7b-chat' // or your preferred model
    });

    // Display context statistics
    console.log('\n📊 Loaded Context Statistics:');
    const stats = aiSystem.getContextStats();
    console.log(JSON.stringify(stats, null, 2));

    // Example 1: Analyze a word with context
    console.log('\n🔍 Example 1: Word Analysis with Context');
    console.log('=' .repeat(50));
    
    const wordAnalysis = await aiSystem.analyzeWordWithContext(
      'kethara', 
      'etymology',
      { category: 'living' }
    );
    console.log('Analysis Result:', JSON.stringify(wordAnalysis, null, 2));

    // Example 2: Generate a new word with context
    console.log('\n✨ Example 2: Word Generation with Context');
    console.log('=' .repeat(50));
    
    const wordGeneration = await aiSystem.generateWordWithContext(
      'mountain',
      'nature',
      { context: 'A tall, rocky peak in the northern ranges' }
    );
    console.log('Generation Result:', JSON.stringify(wordGeneration, null, 2));

    // Example 3: Translation with context
    console.log('\n🔄 Example 3: Translation with Context');
    console.log('=' .repeat(50));
    
    const translation = await aiSystem.translateWithContext(
      'The wise elder spoke of ancient traditions',
      'en-to-libran',
      { focus: 'cultural_context' }
    );
    console.log('Translation Result:', JSON.stringify(translation, null, 2));

    // Example 4: Get specific context for a task
    console.log('\n📚 Example 4: Getting Context for Specific Task');
    console.log('=' .repeat(50));
    
    const context = aiSystem.getContextForTask('pattern_analysis', {
      category: 'society',
      focus: 'political_terms'
    });
    console.log('Context Metadata:', JSON.stringify(context.metadata, null, 2));
    console.log('Available Categories:', Object.keys(context.context));

    // Example 5: QA Analysis with context
    console.log('\n🔍 Example 5: QA Analysis with Context');
    console.log('=' .repeat(50));
    
    // Load a sample dictionary for QA
    const fs = require('fs');
    const sampleDict = JSON.parse(fs.readFileSync('./data/UnifiedLibranDictionaryv1.7.0.json', 'utf8'));
    
    const qaResult = await aiSystem.performQAAnalysis(sampleDict, {
      focus: 'consistency_check'
    });
    console.log('QA Result:', JSON.stringify(qaResult, null, 2));

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

/**
 * Demonstrate different priming strategies
 */
async function demonstratePrimingStrategies() {
  console.log('\n🎯 Priming Strategy Demo\n');

  const aiSystem = new EnhancedAISystem();
  await aiSystem.initialize({ dataDir: './data' });

  const strategies = [
    'word_generation',
    'translation', 
    'etymology',
    'qa_analysis',
    'pattern_analysis',
    'comprehensive'
  ];

  for (const strategy of strategies) {
    console.log(`\n📋 Strategy: ${strategy}`);
    console.log('-'.repeat(30));
    
    const context = aiSystem.getContextForTask(strategy, {
      category: 'living',
      focus: 'animals'
    });
    
    console.log(`  Categories: ${context.metadata.categories.join(', ')}`);
    console.log(`  Total Size: ${context.metadata.totalSize} characters`);
    console.log(`  Compression: ${context.metadata.compressionRatio * 100}%`);
  }
}

/**
 * Demonstrate context compression
 */
async function demonstrateContextCompression() {
  console.log('\n🗜️ Context Compression Demo\n');

  const aiSystem = new EnhancedAISystem();
  await aiSystem.initialize({ dataDir: './data' });

  // Show how context gets compressed for different task types
  const taskTypes = ['word_generation', 'translation', 'comprehensive'];
  
  for (const taskType of taskTypes) {
    console.log(`\n📊 ${taskType.toUpperCase()} Context:`);
    
    const context = aiSystem.getContextForTask(taskType);
    const totalSize = JSON.stringify(context.context).length;
    
    console.log(`  Compressed Size: ${totalSize} characters`);
    console.log(`  Categories Used: ${context.metadata.categories.length}`);
    console.log(`  Compression Ratio: ${context.metadata.compressionRatio * 100}%`);
    
    // Show sample of compressed data
    const sampleCategory = context.metadata.categories[0];
    if (sampleCategory && context.context[sampleCategory]) {
      const sample = context.context[sampleCategory][0];
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
  console.log('🚀 Starting JSON Priming System Demonstrations\n');
  
  try {
    await demonstrateJSONPriming();
    await demonstratePrimingStrategies();
    await demonstrateContextCompression();
    
    console.log('\n✅ All demonstrations completed successfully!');
    console.log('\n💡 Key Benefits of JSON Priming:');
    console.log('  • Context-aware AI responses');
    console.log('  • Intelligent compression for token limits');
    console.log('  • Task-specific context selection');
    console.log('  • Rich linguistic pattern recognition');
    console.log('  • Cultural authenticity maintenance');
    
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
  demonstrateJSONPriming,
  demonstratePrimingStrategies,
  demonstrateContextCompression
};
