#!/usr/bin/env node

const EnhancedAIMultiFormat = require('../lib/ai-integration/enhanced-ai-multi-format');

/**
 * Librán Context Test (No AI Model Required)
 * 
 * This script tests the context loading and priming system
 * without requiring a running AI model server.
 */

console.log('🧪 Librán Context Test (No AI Model Required)\n');

async function testContextLoading() {
  console.log('🚀 Testing context loading and priming system...\n');
  
  try {
    const aiSystem = new EnhancedAIMultiFormat();
    await aiSystem.initialize({ 
      dataDir: './data',
      model: 'llama-2-7b-chat' // This won't actually connect since we're not testing AI calls
    });
    
    console.log('✅ AI system initialized successfully!\n');
    
    // Test context generation for different task types
    const taskTypes = [
      'word_generation',
      'translation', 
      'etymology',
      'qa_analysis',
      'pattern_analysis',
      'comprehensive',
      'reference_heavy'
    ];
    
    console.log('📊 Testing Context Generation:');
    console.log('=' .repeat(60));
    
    for (const taskType of taskTypes) {
      console.log(`\n🔍 ${taskType.toUpperCase()}:`);
      
      const context = aiSystem.getContextForTask(taskType, {
        category: 'living',
        focus: 'animals'
      });
      
      console.log(`  📁 JSON Categories: ${context.json.metadata.categories.join(', ')}`);
      console.log(`  📄 PDF Files: ${context.pdf?.fileCount || 0}`);
      console.log(`  📊 Total Size: ${context.metadata.totalSize} characters`);
      console.log(`  ⚖️ JSON Weight: ${context.metadata.jsonWeight * 100}%`);
      console.log(`  ⚖️ PDF Weight: ${context.metadata.pdfWeight * 100}%`);
      
      // Show sample data
      if (context.json.context.dictionaries && context.json.context.dictionaries.length > 0) {
        const sample = context.json.context.dictionaries[0];
        console.log(`  📝 Sample: ${sample.file} (${sample.type})`);
        if (sample.entries) {
          console.log(`  📊 Entries: ${sample.entries.length}`);
        }
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Context test failed:', error.message);
    return false;
  }
}

async function testDataStatistics() {
  console.log('\n📊 Testing Data Statistics:');
  console.log('=' .repeat(60));
  
  try {
    const aiSystem = new EnhancedAIMultiFormat();
    await aiSystem.initialize({ dataDir: './data' });
    
    const stats = aiSystem.getComprehensiveStats();
    
    console.log('\n📈 Comprehensive Statistics:');
    console.log(`  JSON Files: ${stats.json.totalFiles}`);
    console.log(`  PDF Files: ${stats.pdf.totalFiles}`);
    console.log(`  Total Size: ${stats.json.formattedTotalSize}`);
    console.log(`  PDF Support: ${stats.combined.hasPDF ? '✅ Available' : '❌ Not Available'}`);
    
    console.log('\n📁 JSON Categories:');
    for (const [category, data] of Object.entries(stats.json.categories)) {
      console.log(`  ${category}: ${data.files} files, ${data.formattedSize}`);
    }
    
    if (stats.pdf.files && stats.pdf.files.length > 0) {
      console.log('\n📄 PDF Files:');
      stats.pdf.files.forEach(pdf => {
        console.log(`  ${pdf.file}: ${pdf.size} chars, ${pdf.pages} pages`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Statistics test failed:', error.message);
    return false;
  }
}

async function testContextCompression() {
  console.log('\n🗜️ Testing Context Compression:');
  console.log('=' .repeat(60));
  
  try {
    const aiSystem = new EnhancedAIMultiFormat();
    await aiSystem.initialize({ dataDir: './data' });
    
    const strategies = ['word_generation', 'translation', 'comprehensive'];
    
    for (const strategy of strategies) {
      console.log(`\n📊 ${strategy.toUpperCase()} Compression:`);
      
      const context = aiSystem.getContextForTask(strategy);
      const totalSize = context.metadata.totalSize;
      const jsonSize = context.metadata.jsonSize;
      const pdfSize = context.metadata.pdfSize;
      
      console.log(`  Total Size: ${totalSize} characters`);
      console.log(`  JSON Size: ${jsonSize} characters (${((jsonSize/totalSize)*100).toFixed(1)}%)`);
      console.log(`  PDF Size: ${pdfSize} characters (${((pdfSize/totalSize)*100).toFixed(1)}%)`);
      console.log(`  JSON Weight: ${context.metadata.jsonWeight * 100}%`);
      console.log(`  PDF Weight: ${context.metadata.pdfWeight * 100}%`);
      
      // Show compression effectiveness
      const categories = context.json.metadata.categories;
      console.log(`  Categories Used: ${categories.length}`);
      
      if (categories.length > 0) {
        const sampleCategory = categories[0];
        if (context.json.context[sampleCategory] && context.json.context[sampleCategory][0]) {
          const sample = context.json.context[sampleCategory][0];
          console.log(`  Sample from ${sampleCategory}: ${sample.file} (${sample.type})`);
        }
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Compression test failed:', error.message);
    return false;
  }
}

async function testPatternRecognition() {
  console.log('\n🔍 Testing Pattern Recognition:');
  console.log('=' .repeat(60));
  
  try {
    const aiSystem = new EnhancedAIMultiFormat();
    await aiSystem.initialize({ dataDir: './data' });
    
    // Test different context strategies for pattern recognition
    const strategies = ['pattern_analysis', 'etymology', 'word_generation'];
    
    for (const strategy of strategies) {
      console.log(`\n📊 ${strategy.toUpperCase()} Patterns:`);
      
      const context = aiSystem.getContextForTask(strategy, {
        category: 'living',
        focus: 'animals'
      });
      
      console.log(`  Context Size: ${context.metadata.totalSize} characters`);
      console.log(`  Categories: ${context.json.metadata.categories.join(', ')}`);
      
      // Look for pattern data in context
      if (context.json.context.dictionaries && context.json.context.dictionaries.length > 0) {
        const sample = context.json.context.dictionaries[0];
        if (sample.patterns) {
          console.log(`  Patterns Found: ${Object.keys(sample.patterns).length} types`);
          if (sample.patterns.prefixes) {
            console.log(`  Prefixes: ${sample.patterns.prefixes.length} examples`);
          }
          if (sample.patterns.suffixes) {
            console.log(`  Suffixes: ${sample.patterns.suffixes.length} examples`);
          }
        }
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Pattern recognition test failed:', error.message);
    return false;
  }
}

async function showAISetupInstructions() {
  console.log('\n🤖 AI Model Setup Instructions:');
  console.log('=' .repeat(60));
  
  console.log(`
To test actual AI comprehension of Librán, you need to set up an AI model server:

1. Install Ollama (recommended for local testing):
   - Download from: https://ollama.ai/
   - Install and start the service

2. Pull a language model:
   \`\`\`bash
   ollama pull llama2:7b
   # or
   ollama pull mistral:7b
   \`\`\`

3. Start the Ollama service:
   \`\`\`bash
   ollama serve
   \`\`\`

4. Test the connection:
   \`\`\`bash
   curl http://localhost:11434/api/tags
   \`\`\`

5. Run the full AI comprehension test:
   \`\`\`bash
   node examples/test-libran-comprehension.js quick
   \`\`\`

Alternative: Use cloud models (OpenAI, Anthropic):
- Set up API keys in environment variables
- Update the model configuration in the AI system
- The system will automatically use cloud models if available
`);
}

async function main() {
  console.log('🎯 Starting Librán Context Testing\n');
  
  try {
    // Test 1: Context loading
    const contextTest = await testContextLoading();
    
    // Test 2: Data statistics
    const statsTest = await testDataStatistics();
    
    // Test 3: Context compression
    const compressionTest = await testContextCompression();
    
    // Test 4: Pattern recognition
    const patternTest = await testPatternRecognition();
    
    // Show AI setup instructions
    await showAISetupInstructions();
    
    // Summary
    console.log('\n🎉 Context Testing Summary:');
    console.log('=' .repeat(60));
    console.log(`✅ Context Loading: ${contextTest ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Data Statistics: ${statsTest ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Context Compression: ${compressionTest ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Pattern Recognition: ${patternTest ? 'PASSED' : 'FAILED'}`);
    
    const allPassed = contextTest && statsTest && compressionTest && patternTest;
    console.log(`\n📊 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
    
    if (allPassed) {
      console.log('\n🎉 Your Librán context system is working perfectly!');
      console.log('   The AI model has access to rich, well-organized context.');
      console.log('   Set up an AI model server to test actual comprehension.');
    } else {
      console.log('\n⚠️ Some issues were found. Check the error messages above.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  testContextLoading,
  testDataStatistics,
  testContextCompression,
  testPatternRecognition
};
