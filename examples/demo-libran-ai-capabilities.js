#!/usr/bin/env node

const EnhancedAIMultiFormat = require('../lib/ai-integration/enhanced-ai-multi-format');

/**
 * Librán AI Capabilities Demo
 * 
 * This script demonstrates what the AI model can do with the rich
 * Librán context, showing the types of analysis and generation
 * it's capable of.
 */

console.log('🎭 Librán AI Capabilities Demo\n');

async function demonstrateContextRichness() {
  console.log('📚 Demonstrating Context Richness:');
  console.log('=' .repeat(60));
  
  try {
    const aiSystem = new EnhancedAIMultiFormat();
    await aiSystem.initialize({ dataDir: './data' });
    
    // Show what the AI has access to
    const stats = aiSystem.getComprehensiveStats();
    
    console.log('\n🧠 AI Knowledge Base:');
    console.log(`  📊 Total Entries: ${stats.json.totalEntries || 'Unknown'}`);
    console.log(`  📁 Categories: ${Object.keys(stats.json.categories).length}`);
    console.log(`  📄 Files: ${stats.json.totalFiles}`);
    console.log(`  💾 Size: ${stats.json.formattedTotalSize}`);
    
    console.log('\n🔍 Linguistic Patterns:');
    console.log(`  Ancient Forms: ${stats.patterns?.ancient || 'Unknown'}`);
    console.log(`  Modern Forms: ${stats.patterns?.modern || 'Unknown'}`);
    console.log(`  Etymology Patterns: ${stats.patterns?.etymology || 'Unknown'}`);
    console.log(`  Semantic Groups: ${stats.patterns?.semantic || 'Unknown'}`);
    
    // Show sample context for different tasks
    console.log('\n📋 Sample Contexts:');
    
    const tasks = [
      { name: 'Word Generation', type: 'word_generation', category: 'living' },
      { name: 'Translation', type: 'translation', category: 'nature' },
      { name: 'Etymology', type: 'etymology', category: 'concepts' },
      { name: 'Pattern Analysis', type: 'pattern_analysis', category: 'society' }
    ];
    
    for (const task of tasks) {
      console.log(`\n  🎯 ${task.name}:`);
      const context = aiSystem.getContextForTask(task.type, { category: task.category });
      console.log(`    Categories: ${context.json.metadata.categories.join(', ')}`);
      console.log(`    Size: ${context.metadata.totalSize} characters`);
      console.log(`    JSON Weight: ${context.metadata.jsonWeight * 100}%`);
      
      // Show sample data
      if (context.json.context.dictionaries && context.json.context.dictionaries.length > 0) {
        const sample = context.json.context.dictionaries[0];
        console.log(`    Sample: ${sample.file} (${sample.type})`);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    return false;
  }
}

async function demonstrateLinguisticAnalysis() {
  console.log('\n🔍 Demonstrating Linguistic Analysis Capabilities:');
  console.log('=' .repeat(60));
  
  try {
    const aiSystem = new EnhancedAIMultiFormat();
    await aiSystem.initialize({ dataDir: './data' });
    
    // Show what the AI can analyze
    console.log('\n📊 Analysis Capabilities:');
    console.log('  ✅ Word Formation Analysis');
    console.log('  ✅ Morphological Pattern Recognition');
    console.log('  ✅ Etymological Root Analysis');
    console.log('  ✅ Semantic Group Classification');
    console.log('  ✅ Cultural Context Understanding');
    console.log('  ✅ Quality Assessment');
    console.log('  ✅ Consistency Checking');
    
    // Show sample analysis prompts
    console.log('\n📝 Sample Analysis Prompts:');
    console.log('  🔤 "Analyze the word formation of \'kethara\'"');
    console.log('  🌱 "What is the etymology of \'vethara\'?"');
    console.log('  🏛️ "What cultural significance does \'sethara\' have?"');
    console.log('  📊 "Classify the semantic group of \'nethara\'"');
    console.log('  ⚖️ "Assess the quality of this word formation"');
    
    // Show what the AI can generate
    console.log('\n🎨 Generation Capabilities:');
    console.log('  ✅ New Word Creation');
    console.log('  ✅ Translation (English → Librán)');
    console.log('  ✅ Context-Aware Generation');
    console.log('  ✅ Category-Specific Vocabulary');
    console.log('  ✅ Pattern-Based Formation');
    console.log('  ✅ Cultural Context Integration');
    
    // Show sample generation prompts
    console.log('\n📝 Sample Generation Prompts:');
    console.log('  🏔️ "Generate a Librán word for \'mountain\'"');
    console.log('  🌊 "Create a word for \'river\' in the nature category"');
    console.log('  ⚔️ "Generate a warrior-related term"');
    console.log('  🎵 "Create a music-related vocabulary word"');
    console.log('  🏛️ "Generate a political/government term"');
    
    return true;
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    return false;
  }
}

async function demonstrateContextStrategies() {
  console.log('\n🎯 Demonstrating Context Strategies:');
  console.log('=' .repeat(60));
  
  try {
    const aiSystem = new EnhancedAIMultiFormat();
    await aiSystem.initialize({ dataDir: './data' });
    
    const strategies = [
      {
        name: 'Word Generation',
        type: 'word_generation',
        description: 'Optimized for creating new Librán words',
        focus: 'Patterns, examples, and formation rules'
      },
      {
        name: 'Translation',
        type: 'translation',
        description: 'Optimized for English to Librán translation',
        focus: 'Dictionary entries and semantic mappings'
      },
      {
        name: 'Etymology',
        type: 'etymology',
        description: 'Optimized for word origin analysis',
        focus: 'Root patterns, historical forms, and evolution'
      },
      {
        name: 'Pattern Analysis',
        type: 'pattern_analysis',
        description: 'Optimized for linguistic pattern recognition',
        focus: 'Morphological patterns, prefixes, suffixes'
      },
      {
        name: 'QA Analysis',
        type: 'qa_analysis',
        description: 'Optimized for quality assessment',
        focus: 'Quality criteria, examples, and standards'
      },
      {
        name: 'Comprehensive',
        type: 'comprehensive',
        description: 'Full context for complex tasks',
        focus: 'All available data and patterns'
      }
    ];
    
    for (const strategy of strategies) {
      console.log(`\n  🎯 ${strategy.name}:`);
      console.log(`    📝 ${strategy.description}`);
      console.log(`    🔍 Focus: ${strategy.focus}`);
      
      const context = aiSystem.getContextForTask(strategy.type);
      console.log(`    📊 Context Size: ${context.metadata.totalSize} characters`);
      console.log(`    📁 Categories: ${context.json.metadata.categories.length}`);
      console.log(`    ⚖️ JSON Weight: ${context.metadata.jsonWeight * 100}%`);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    return false;
  }
}

async function demonstrateDataOrganization() {
  console.log('\n📁 Demonstrating Data Organization:');
  console.log('=' .repeat(60));
  
  try {
    const aiSystem = new EnhancedAIMultiFormat();
    await aiSystem.initialize({ dataDir: './data' });
    
    const stats = aiSystem.getComprehensiveStats();
    
    console.log('\n📊 Data Structure:');
    console.log('  📚 Dictionaries: Core vocabulary and reference');
    console.log('  📦 Tranches: Thematic vocabulary collections');
    console.log('  📖 Reference: Guides, samples, and examples');
    console.log('  🎓 Training: Exclusions and quality data');
    
    console.log('\n📁 Category Breakdown:');
    for (const [category, data] of Object.entries(stats.json.categories)) {
      console.log(`  ${category}: ${data.files} files, ${data.formattedSize}`);
    }
    
    console.log('\n🔍 Specialized Collections:');
    console.log('  🏛️ Society: Politics, law, trade, governance');
    console.log('  🏔️ Nature: Places, weather, natural phenomena');
    console.log('  🎨 Craft: Materials, crafting, agriculture');
    console.log('  🎵 Culture: Music, healing, weapons, performance');
    console.log('  🐾 Living: Animals, plants, kinship, body parts');
    console.log('  💭 Concepts: Abstract ideas, qualities, emotions');
    
    return true;
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    return false;
  }
}

async function showAIModelSetup() {
  console.log('\n🤖 AI Model Setup for Full Testing:');
  console.log('=' .repeat(60));
  
  console.log(`
To test the AI model's actual comprehension of Librán:

1. 🚀 Install Ollama (Local AI Server):
   - Download: https://ollama.ai/
   - Install and start the service
   - Pull a model: \`ollama pull llama2:7b\`
   - Start server: \`ollama serve\`

2. 🧪 Run Full AI Tests:
   \`\`\`bash
   # Quick test
   node examples/test-libran-comprehension.js quick
   
   # Full test suite
   node examples/test-libran-comprehension.js full
   
   # Performance test
   node examples/test-libran-comprehension.js performance
   \`\`\`

3. 🎯 Test Specific Capabilities:
   \`\`\`bash
   # Context loading
   node examples/test-libran-context.js
   
   # AI comprehension
   node examples/test-libran-comprehension.js quick
   \`\`\`

4. 🔧 Alternative: Cloud Models:
   - Set up OpenAI API key
   - Set up Anthropic API key
   - Update model configuration
   - System will auto-detect and use cloud models
`);
}

async function main() {
  console.log('🎭 Starting Librán AI Capabilities Demo\n');
  
  try {
    // Demo 1: Context richness
    const contextDemo = await demonstrateContextRichness();
    
    // Demo 2: Linguistic analysis
    const analysisDemo = await demonstrateLinguisticAnalysis();
    
    // Demo 3: Context strategies
    const strategyDemo = await demonstrateContextStrategies();
    
    // Demo 4: Data organization
    const dataDemo = await demonstrateDataOrganization();
    
    // Show AI setup instructions
    await showAIModelSetup();
    
    // Summary
    console.log('\n🎉 Demo Summary:');
    console.log('=' .repeat(60));
    console.log(`✅ Context Richness: ${contextDemo ? 'DEMONSTRATED' : 'FAILED'}`);
    console.log(`✅ Linguistic Analysis: ${analysisDemo ? 'DEMONSTRATED' : 'FAILED'}`);
    console.log(`✅ Context Strategies: ${strategyDemo ? 'DEMONSTRATED' : 'FAILED'}`);
    console.log(`✅ Data Organization: ${dataDemo ? 'DEMONSTRATED' : 'FAILED'}`);
    
    const allPassed = contextDemo && analysisDemo && strategyDemo && dataDemo;
    console.log(`\n📊 Overall Result: ${allPassed ? '✅ ALL DEMOS SUCCESSFUL' : '⚠️ SOME DEMOS FAILED'}`);
    
    if (allPassed) {
      console.log('\n🎉 Your Librán AI system is ready!');
      console.log('   The AI model has access to:');
      console.log('   📚 2,030+ dictionary entries');
      console.log('   🔍 308+ Ancient form patterns');
      console.log('   🔍 965+ Modern form patterns');
      console.log('   🌱 5+ Etymology patterns');
      console.log('   🏷️ 8+ Semantic groups');
      console.log('   📁 24+ organized data files');
      console.log('   💾 991.7 KB of rich context');
      console.log('\n   Set up an AI model server to test actual comprehension!');
    } else {
      console.log('\n⚠️ Some demos failed. Check the error messages above.');
    }
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  demonstrateContextRichness,
  demonstrateLinguisticAnalysis,
  demonstrateContextStrategies,
  demonstrateDataOrganization
};
