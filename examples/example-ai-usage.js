#!/usr/bin/env node

/**
 * Example usage of AI integration for Librán Dictionary
 * 
 * This script demonstrates how to use the AI system for:
 * - Analyzing word formations
 * - Generating new words
 * - Improving existing entries
 */

const { AIModelInterface, AIEnhancedQAPipeline } = require('./lib/ai-integration/linguistic-ai-system');

async function demonstrateAIUsage() {
  console.log('🤖 AI Integration Example for Librán Dictionary');
  console.log('=' .repeat(50));
  
  try {
    // 1. Initialize AI system
    console.log('\n🚀 Initializing AI system...');
    const ai = new AIModelInterface('llama'); // Use local Llama model
    
    // Load knowledge base
    await ai.initialize('./data/UnifiedLibranDictionaryv1.7.0.json');
    console.log('✅ AI system ready');
    
    // 2. Example 1: Analyze a word formation
    console.log('\n📊 Example 1: Analyzing word formation');
    const testEntry = {
      english: "leader",
      ancient: "leaderor",  // This is a lazy formation
      modern: "leaderë",    // This is also lazy
      notes: "English + suffixes"
    };
    
    console.log(`Analyzing: "${testEntry.english}" → Ancient: "${testEntry.ancient}", Modern: "${testEntry.modern}"`);
    
    const analysis = await ai.analyzeWordFormation(testEntry);
    console.log('AI Analysis Results:');
    console.log(`  Quality Score: ${analysis.score}/10`);
    console.log(`  Issues: ${analysis.issues.join(', ')}`);
    console.log(`  Suggestions: ${analysis.suggestions.join(', ')}`);
    console.log(`  Etymology: ${analysis.etymology}`);
    console.log(`  Cultural: ${analysis.cultural}`);
    
    // 3. Example 2: Generate improvement
    console.log('\n🔧 Example 2: Generating improvement');
    const improvement = await ai.generateImprovedFormation(testEntry, analysis.issues);
    
    if (improvement) {
      console.log('AI Improvement:');
      console.log(`  Ancient: "${improvement.ancient}"`);
      console.log(`  Modern: "${improvement.modern}"`);
      console.log(`  Notes: "${improvement.notes}"`);
      console.log(`  Reasoning: "${improvement.reasoning}"`);
    }
    
    // 4. Example 3: Generate new word
    console.log('\n🎨 Example 3: Generating new word');
    const newWord = await ai.generateNewWord('wisdom', 'core_concepts');
    
    if (newWord) {
      console.log('AI-Generated Word:');
      console.log(`  English: wisdom`);
      console.log(`  Ancient: "${newWord.ancient}"`);
      console.log(`  Modern: "${newWord.modern}"`);
      console.log(`  Notes: "${newWord.notes}"`);
      console.log(`  Reasoning: "${newWord.reasoning}"`);
    }
    
    // 5. Example 4: Batch processing
    console.log('\n📦 Example 4: Batch processing');
    const testEntries = [
      {
        english: "warrior",
        ancient: "warrioron",  // Lazy formation
        modern: "warriorë",    // Lazy formation
        notes: "English + suffixes"
      },
      {
        english: "teacher",
        ancient: "teacheror",  // Lazy formation
        modern: "teacherë",    // Lazy formation
        notes: "English + suffixes"
      }
    ];
    
    console.log(`Processing ${testEntries.length} entries...`);
    
    const qaPipeline = new AIEnhancedQAPipeline('llama');
    const batchResults = await qaPipeline.runAIQA(testEntries, {
      max_entries: 2,
      batch_size: 2,
      analyze_threshold: 10, // Analyze all entries
      improve_threshold: 10  // Improve all entries
    });
    
    console.log('Batch Processing Results:');
    console.log(`  Analyzed: ${batchResults.analyzed.length} entries`);
    console.log(`  Improved: ${batchResults.improved.length} entries`);
    console.log(`  Errors: ${batchResults.errors.length} entries`);
    
    // Show detailed results
    batchResults.analyzed.forEach(({ entry, analysis }) => {
      console.log(`  "${entry.english}": Score ${analysis.score}/10`);
    });
    
    batchResults.improved.forEach(({ original, improved }) => {
      console.log(`  "${original.english}": Improved to "${improved.ancient}" / "${improved.modern}"`);
    });
    
    console.log('\n✅ AI integration demonstration complete!');
    
  } catch (error) {
    console.error('❌ Demonstration failed:', error.message);
    
    if (error.message.includes('Ollama')) {
      console.log('\n💡 Make sure Ollama is running:');
      console.log('   ollama serve');
      console.log('   ollama pull llama2:7b-chat');
    }
  }
}

// ============================================================================
// COMMAND LINE INTERFACE
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🤖 AI Integration Example for Librán Dictionary

USAGE:
  node example-ai-usage.js [options]

OPTIONS:
  --model <name>     AI model to use (llama, mistral, openai)
  --help, -h         Show this help message

EXAMPLES:
  # Use local Llama model
  node example-ai-usage.js --model llama

  # Use OpenAI
  node example-ai-usage.js --model openai

WHAT THIS DEMONSTRATES:
  1. AI word formation analysis
  2. AI improvement suggestions
  3. AI new word generation
  4. Batch processing capabilities

PREREQUISITES:
  - AI system set up (run setup-ai-integration.js first)
  - Ollama running for local models
  - API keys set for cloud models
`);
    process.exit(0);
  }
  
  // Parse model argument
  const modelIndex = args.indexOf('--model');
  if (modelIndex !== -1 && args[modelIndex + 1]) {
    // Override the model in the demonstration
    const originalAIModelInterface = AIModelInterface;
    AIModelInterface = class extends originalAIModelInterface {
      constructor(modelName = args[modelIndex + 1]) {
        super(modelName);
      }
    };
  }
  
  demonstrateAIUsage();
}

module.exports = { demonstrateAIUsage };
