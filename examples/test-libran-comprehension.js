#!/usr/bin/env node

const EnhancedAIMultiFormat = require('../lib/ai-integration/enhanced-ai-multi-format');

/**
 * Librán Comprehension Test Suite
 * 
 * This script tests the AI model's understanding of Librán language
 * using the multi-format priming system with real dictionary data.
 */

console.log('🧪 Librán Comprehension Test Suite\n');

// Test cases for different aspects of Librán comprehension
const testCases = [
  {
    name: "Basic Word Analysis",
    description: "Test understanding of basic Librán words",
    tests: [
      { word: "kethara", expected: "animal/creature", category: "living" },
      { word: "vethara", expected: "mountain/peak", category: "nature" },
      { word: "sethara", expected: "water/river", category: "nature" },
      { word: "nethara", expected: "fire/flame", category: "elements" }
    ]
  },
  {
    name: "Morphological Analysis",
    description: "Test understanding of word structure and patterns",
    tests: [
      { word: "kethara", focus: "morphology" },
      { word: "vethara", focus: "morphology" },
      { word: "sethara", focus: "morphology" }
    ]
  },
  {
    name: "Etymological Analysis",
    description: "Test understanding of word origins and roots",
    tests: [
      { word: "kethara", focus: "etymology" },
      { word: "vethara", focus: "etymology" },
      { word: "sethara", focus: "etymology" }
    ]
  },
  {
    name: "Translation Tasks",
    description: "Test English to Librán translation",
    tests: [
      { english: "mountain", category: "nature" },
      { english: "river", category: "nature" },
      { english: "fire", category: "elements" },
      { english: "wisdom", category: "concepts" },
      { english: "warrior", category: "society" }
    ]
  },
  {
    name: "Cultural Context",
    description: "Test understanding of cultural significance",
    tests: [
      { word: "kethara", focus: "cultural_context" },
      { word: "vethara", focus: "cultural_context" },
      { word: "sethara", focus: "cultural_context" }
    ]
  },
  {
    name: "Pattern Recognition",
    description: "Test recognition of linguistic patterns",
    tests: [
      { word: "kethara", focus: "pattern_analysis" },
      { word: "vethara", focus: "pattern_analysis" },
      { word: "sethara", focus: "pattern_analysis" }
    ]
  }
];

// Initialize the AI system
let aiSystem = null;

async function initializeAISystem() {
  console.log('🚀 Initializing AI system for Librán comprehension testing...');
  
  try {
    aiSystem = new EnhancedAIMultiFormat();
    await aiSystem.initialize({ 
      dataDir: './data',
      model: 'llama-2-7b-chat' // or your preferred model
    });
    
    console.log('✅ AI system initialized successfully!\n');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize AI system:', error.message);
    return false;
  }
}

async function runWordAnalysisTest(testCase) {
  console.log(`\n🔍 ${testCase.name}`);
  console.log(`📝 ${testCase.description}`);
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const test of testCase.tests) {
    try {
      console.log(`\n🔬 Testing: ${test.word || test.english}`);
      
      let result;
      if (test.word) {
        // Word analysis test
        result = await aiSystem.analyzeWordWithContext(
          test.word, 
          test.focus || 'comprehensive',
          { category: test.category }
        );
      } else if (test.english) {
        // Translation test
        result = await aiSystem.generateWordWithContext(
          test.english,
          test.category || 'general',
          { context: test.context }
        );
      }
      
      results.push({
        test: test,
        result: result,
        success: true
      });
      
      // Display key results
      if (result.morphology) {
        console.log(`  📊 Morphology: ${JSON.stringify(result.morphology)}`);
      }
      if (result.etymology) {
        console.log(`  🌱 Etymology: ${JSON.stringify(result.etymology)}`);
      }
      if (result.cultural_context) {
        console.log(`  🏛️ Cultural: ${JSON.stringify(result.cultural_context)}`);
      }
      if (result.libran_word) {
        console.log(`  🔤 Generated: ${result.libran_word}`);
      }
      if (result.confidence) {
        console.log(`  🎯 Confidence: ${result.confidence}%`);
      }
      
    } catch (error) {
      console.error(`  ❌ Test failed: ${error.message}`);
      results.push({
        test: test,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
}

async function runComprehensiveTest() {
  console.log('🧪 Running Comprehensive Librán Comprehension Test\n');
  
  const allResults = [];
  
  for (const testCase of testCases) {
    const results = await runWordAnalysisTest(testCase);
    allResults.push({
      testCase: testCase.name,
      results: results
    });
  }
  
  return allResults;
}

async function runQuickTest() {
  console.log('⚡ Running Quick Librán Test\n');
  
  const quickTests = [
    { word: "kethara", description: "Basic animal word" },
    { english: "mountain", description: "Nature translation" },
    { word: "vethara", description: "Mountain word analysis" }
  ];
  
  const results = [];
  
  for (const test of quickTests) {
    try {
      console.log(`\n🔬 ${test.description}: ${test.word || test.english}`);
      
      let result;
      if (test.word) {
        result = await aiSystem.analyzeWordWithContext(test.word, 'comprehensive');
      } else {
        result = await aiSystem.generateWordWithContext(test.english, 'nature');
      }
      
      results.push({ test, result, success: true });
      
      // Show key info
      if (result.morphology) {
        console.log(`  📊 Morphology: ${JSON.stringify(result.morphology)}`);
      }
      if (result.libran_word) {
        console.log(`  🔤 Generated: ${result.libran_word}`);
      }
      if (result.confidence) {
        console.log(`  🎯 Confidence: ${result.confidence}%`);
      }
      
    } catch (error) {
      console.error(`  ❌ Test failed: ${error.message}`);
      results.push({ test, error: error.message, success: false });
    }
  }
  
  return results;
}

async function runContextTest() {
  console.log('📚 Testing Context Understanding\n');
  
  try {
    // Test different context strategies
    const strategies = ['word_generation', 'translation', 'etymology', 'comprehensive'];
    
    for (const strategy of strategies) {
      console.log(`\n🔍 Testing ${strategy} context strategy:`);
      
      const context = aiSystem.getContextForTask(strategy, { category: 'living' });
      console.log(`  📊 Context size: ${context.metadata.totalSize} characters`);
      console.log(`  📁 JSON categories: ${context.json.metadata.categories.join(', ')}`);
      console.log(`  📄 PDF files: ${context.pdf?.fileCount || 0}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Context test failed: ${error.message}`);
    return false;
  }
}

async function runPerformanceTest() {
  console.log('⚡ Testing Performance\n');
  
  try {
    const startTime = Date.now();
    
    // Test multiple operations
    const operations = [
      () => aiSystem.analyzeWordWithContext('kethara', 'comprehensive'),
      () => aiSystem.generateWordWithContext('mountain', 'nature'),
      () => aiSystem.translateWithContext('Hello world', 'en-to-libran'),
      () => aiSystem.getContextForTask('word_generation'),
      () => aiSystem.getComprehensiveStats()
    ];
    
    for (let i = 0; i < operations.length; i++) {
      const opStart = Date.now();
      await operations[i]();
      const opTime = Date.now() - opStart;
      console.log(`  ⚡ Operation ${i + 1}: ${opTime}ms`);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`\n📊 Total test time: ${totalTime}ms`);
    
    return true;
  } catch (error) {
    console.error(`❌ Performance test failed: ${error.message}`);
    return false;
  }
}

async function generateTestReport(results) {
  console.log('\n📊 Generating Test Report\n');
  
  let totalTests = 0;
  let successfulTests = 0;
  let failedTests = 0;
  
  for (const testCase of results) {
    totalTests += testCase.results.length;
    successfulTests += testCase.results.filter(r => r.success).length;
    failedTests += testCase.results.filter(r => !r.success).length;
  }
  
  console.log('📈 Test Summary:');
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  Successful: ${successfulTests} (${((successfulTests/totalTests)*100).toFixed(1)}%)`);
  console.log(`  Failed: ${failedTests} (${((failedTests/totalTests)*100).toFixed(1)}%)`);
  
  console.log('\n📋 Test Case Results:');
  for (const testCase of results) {
    const successCount = testCase.results.filter(r => r.success).length;
    const totalCount = testCase.results.length;
    const successRate = ((successCount/totalCount)*100).toFixed(1);
    
    console.log(`  ${testCase.testCase}: ${successCount}/${totalCount} (${successRate}%)`);
  }
  
  return {
    totalTests,
    successfulTests,
    failedTests,
    successRate: ((successfulTests/totalTests)*100).toFixed(1)
  };
}

async function main() {
  console.log('🎯 Starting Librán Comprehension Testing\n');
  
  // Initialize AI system
  const initialized = await initializeAISystem();
  if (!initialized) {
    console.error('❌ Cannot proceed without AI system');
    process.exit(1);
  }
  
  // Get test mode from command line
  const testMode = process.argv[2] || 'quick';
  
  try {
    let results = [];
    
    switch (testMode) {
      case 'full':
        console.log('🔬 Running FULL test suite...\n');
        results = await runComprehensiveTest();
        break;
        
      case 'quick':
        console.log('⚡ Running QUICK test suite...\n');
        results = await runQuickTest();
        break;
        
      case 'context':
        console.log('📚 Running CONTEXT test...\n');
        await runContextTest();
        return;
        
      case 'performance':
        console.log('⚡ Running PERFORMANCE test...\n');
        await runPerformanceTest();
        return;
        
      default:
        console.log('❌ Unknown test mode. Use: quick, full, context, or performance');
        return;
    }
    
    // Generate report
    if (results.length > 0) {
      const report = await generateTestReport(results);
      
      console.log('\n🎉 Test completed!');
      console.log(`📊 Overall Success Rate: ${report.successRate}%`);
      
      if (report.successRate >= 80) {
        console.log('✅ Excellent! The model shows strong Librán comprehension.');
      } else if (report.successRate >= 60) {
        console.log('⚠️ Good, but there\'s room for improvement.');
      } else {
        console.log('❌ The model needs more training or context.');
      }
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
  runQuickTest,
  runComprehensiveTest,
  runContextTest,
  runPerformanceTest
};
