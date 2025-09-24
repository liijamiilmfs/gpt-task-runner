#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Setup script for JSON Priming System
 * 
 * This script helps you configure and test the JSON priming system
 * for your Librán Dictionary AI integration.
 */

console.log('🚀 Setting up JSON Priming System for Librán Dictionary\n');

// Check if required files exist
const requiredFiles = [
  './data/UnifiedLibranDictionaryv1.7.0.json',
  './data/UnifiedLibranDictionaryv1.6.3.json',
  './data/phrasebook-v1.2.json',
  './data/Tranches/Libran_Core_Grammar_Pack_v1.5.1.json'
];

console.log('📋 Checking required files...');
let allFilesExist = true;

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - NOT FOUND`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('\n⚠️  Some required files are missing. Please ensure your data directory is properly set up.');
  console.log('   The JSON priming system needs access to your dictionary files.');
  process.exit(1);
}

// Test the JSON priming system
async function testPrimingSystem() {
  console.log('\n🧪 Testing JSON Priming System...');
  
  try {
    const JSONPrimingSystem = require('./lib/ai-integration/json-priming-system');
    const primingSystem = new JSONPrimingSystem();
    
    // Load primers
    await primingSystem.loadPrimers('./data');
    
    // Get statistics
    const stats = primingSystem.getContextStats();
    console.log('\n📊 Context Statistics:');
    console.log(`  Total Categories: ${stats.totalCategories}`);
    console.log(`  Total Files: ${stats.totalFiles}`);
    console.log(`  Total Size: ${stats.formattedTotalSize}`);
    
    // Test different context types
    console.log('\n🔍 Testing Context Generation:');
    
    const contextTypes = ['word_generation', 'translation', 'etymology', 'qa_analysis'];
    
    for (const contextType of contextTypes) {
      const context = primingSystem.generateContext(contextType, { category: 'living' });
      console.log(`  ${contextType}: ${context.metadata.categories.length} categories, ${context.metadata.totalSize} chars`);
    }
    
    console.log('\n✅ JSON Priming System test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ JSON Priming System test failed:', error.message);
    return false;
  }
}

// Test the enhanced AI system
async function testEnhancedAISystem() {
  console.log('\n🤖 Testing Enhanced AI System...');
  
  try {
    const EnhancedAISystem = require('./lib/ai-integration/enhanced-ai-with-priming');
    const aiSystem = new EnhancedAISystem();
    
    // Initialize (this will load primers)
    await aiSystem.initialize({
      dataDir: './data',
      model: 'llama-2-7b-chat' // Default model
    });
    
    console.log('✅ Enhanced AI System initialized successfully!');
    console.log('   Note: Full AI functionality requires a running model server.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Enhanced AI System test failed:', error.message);
    console.error('   This is expected if no AI model server is running.');
    return false;
  }
}

// Create example usage file
function createExampleUsage() {
  console.log('\n📝 Creating example usage file...');
  
  const exampleContent = `#!/usr/bin/env node

// Example: Using JSON Priming with your AI model
const EnhancedAISystem = require('./lib/ai-integration/enhanced-ai-with-priming');

async function example() {
  const ai = new EnhancedAISystem();
  
  // Initialize with your data
  await ai.initialize({ dataDir: './data' });
  
  // Analyze a word with context
  const analysis = await ai.analyzeWordWithContext('kethara', 'etymology');
  console.log('Analysis:', analysis);
  
  // Generate a new word with context
  const generation = await ai.generateWordWithContext('mountain', 'nature');
  console.log('Generation:', generation);
  
  // Translate with context
  const translation = await ai.translateWithContext('Hello world', 'en-to-libran');
  console.log('Translation:', translation);
}

// Run the example
example().catch(console.error);
`;

  fs.writeFileSync('./example-priming-usage.js', exampleContent);
  console.log('  ✅ Created example-priming-usage.js');
}

// Main setup function
async function main() {
  console.log('🎯 JSON Priming System Setup\n');
  
  // Test priming system
  const primingTest = await testPrimingSystem();
  
  // Test enhanced AI system
  const aiTest = await testEnhancedAISystem();
  
  // Create example usage
  createExampleUsage();
  
  // Summary
  console.log('\n📋 Setup Summary:');
  console.log(`  JSON Priming System: ${primingTest ? '✅ Working' : '❌ Failed'}`);
  console.log(`  Enhanced AI System: ${aiTest ? '✅ Working' : '⚠️  Needs AI model'}`);
  console.log(`  Example Usage: ✅ Created`);
  
  if (primingTest) {
    console.log('\n🎉 JSON Priming System is ready to use!');
    console.log('\n📚 Next Steps:');
    console.log('  1. Run: node example-priming-usage.js');
    console.log('  2. Start your AI model server (e.g., Ollama)');
    console.log('  3. Use the EnhancedAISystem in your code');
    console.log('\n💡 Key Features:');
    console.log('  • Automatic context loading from JSON files');
    console.log('  • Intelligent compression for token limits');
    console.log('  • Task-specific context selection');
    console.log('  • Rich linguistic pattern recognition');
  } else {
    console.log('\n❌ Setup incomplete. Please check your data directory.');
  }
}

// Run setup
main().catch(console.error);
