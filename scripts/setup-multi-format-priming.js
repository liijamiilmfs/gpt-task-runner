#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Setup script for Multi-Format Priming System
 * 
 * This script helps you configure and test the multi-format priming system
 * that supports both JSON and PDF files for AI model context.
 */

console.log('🚀 Setting up Multi-Format Priming System for Librán Dictionary\n');

// Check if required files exist
const requiredFiles = [
  './data/UnifiedLibranDictionaryv1.7.0.json',
  './data/UnifiedLibranDictionaryv1.6.3.json',
  './data/phrasebook-v1.2.json',
  './data/Tranches/Libran_Core_Grammar_Pack_v1.5.1.json'
];

const pdfFiles = [
  './data/LibránLexiconReferenceGuide.pdf',
  './data/Unified_Libran_Dictionary_Ancient_Modern_v1_2.pdf'
];

console.log('📋 Checking required JSON files...');
let allJsonFilesExist = true;

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - NOT FOUND`);
    allJsonFilesExist = false;
  }
}

console.log('\n📋 Checking PDF files...');
let pdfFilesExist = false;

for (const file of pdfFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
    pdfFilesExist = true;
  } else {
    console.log(`  ⚠️ ${file} - NOT FOUND (optional)`);
  }
}

if (!allJsonFilesExist) {
  console.log('\n⚠️  Some required JSON files are missing. Please ensure your data directory is properly set up.');
  process.exit(1);
}

// Test the multi-format priming system
async function testMultiFormatPrimingSystem() {
  console.log('\n🧪 Testing Multi-Format Priming System...');
  
  try {
    const EnhancedAIMultiFormat = require('./lib/ai-integration/enhanced-ai-multi-format');
    const aiSystem = new EnhancedAIMultiFormat();
    
    // Initialize the system
    await aiSystem.initialize({ dataDir: './data' });
    
    // Get comprehensive statistics
    const stats = aiSystem.getComprehensiveStats();
    console.log('\n📊 Multi-Format Context Statistics:');
    console.log(`  JSON Files: ${stats.json.totalFiles}`);
    console.log(`  PDF Files: ${stats.pdf.totalFiles}`);
    console.log(`  Total Size: ${formatSize(stats.combined.totalSize)}`);
    console.log(`  PDF Support: ${stats.combined.hasPDF ? '✅ Available' : '❌ Not Available'}`);
    
    // Test different context types
    console.log('\n🔍 Testing Context Generation:');
    
    const contextTypes = ['word_generation', 'translation', 'etymology', 'qa_analysis', 'reference_heavy'];
    
    for (const contextType of contextTypes) {
      const context = aiSystem.getContextForTask(contextType, { category: 'living' });
      console.log(`  ${contextType}: ${context.json.metadata.categories.length} JSON categories, ${context.pdf?.fileCount || 0} PDF files, ${context.metadata.totalSize} chars`);
    }
    
    console.log('\n✅ Multi-Format Priming System test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Multi-Format Priming System test failed:', error.message);
    return false;
  }
}

// Test PDF support specifically
async function testPDFSupport() {
  console.log('\n📄 Testing PDF Support...');
  
  try {
    const PDFPrimingSystem = require('./lib/ai-integration/pdf-priming-system');
    const pdfSystem = new PDFPrimingSystem();
    
    // Check PDF support
    const support = await pdfSystem.checkPDFSupport();
    
    if (support.available) {
      console.log(`✅ PDF support available with ${support.parser}`);
      
      // Test PDF loading if files exist
      if (pdfFilesExist) {
        await pdfSystem.loadPDFs('./data');
        const stats = pdfSystem.getPDFStats();
        console.log(`  Loaded ${stats.totalFiles} PDF files`);
        console.log(`  Total size: ${formatSize(stats.totalSize)}`);
      }
      
      return true;
    } else {
      console.log('❌ PDF support not available');
      console.log('  Error:', support.error);
      console.log('  Suggestions:');
      support.suggestions.forEach(suggestion => {
        console.log(`    - ${suggestion}`);
      });
      return false;
    }
    
  } catch (error) {
    console.error('❌ PDF support test failed:', error.message);
    return false;
  }
}

// Install PDF dependencies
async function installPDFDependencies() {
  console.log('\n📦 Installing PDF dependencies...');
  
  try {
    const { execSync } = require('child_process');
    execSync('npm install pdf-parse', { stdio: 'inherit' });
    console.log('✅ PDF dependencies installed successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to install PDF dependencies:', error.message);
    console.log('Please install manually: npm install pdf-parse');
    return false;
  }
}

// Create example usage file
function createExampleUsage() {
  console.log('\n📝 Creating example usage file...');
  
  const exampleContent = `#!/usr/bin/env node

// Example: Using Multi-Format Priming with your AI model
const EnhancedAIMultiFormat = require('./lib/ai-integration/enhanced-ai-multi-format');

async function example() {
  const ai = new EnhancedAIMultiFormat();
  
  // Initialize with your data
  await ai.initialize({ dataDir: './data' });
  
  // Analyze a word with comprehensive context (JSON + PDF)
  const analysis = await ai.analyzeWordWithContext('kethara', 'etymology');
  console.log('Analysis:', analysis);
  
  // Generate a new word with comprehensive context
  const generation = await ai.generateWordWithContext('mountain', 'nature');
  console.log('Generation:', generation);
  
  // Translate with comprehensive context
  const translation = await ai.translateWithContext('Hello world', 'en-to-libran');
  console.log('Translation:', translation);
  
  // Get context statistics
  const stats = ai.getComprehensiveStats();
  console.log('Stats:', stats);
}

// Run the example
example().catch(console.error);
`;

  fs.writeFileSync('./example-multi-format-usage.js', exampleContent);
  console.log('  ✅ Created example-multi-format-usage.js');
}

// Create comprehensive documentation
function createDocumentation() {
  console.log('\n📚 Creating documentation...');
  
  const docContent = `# Multi-Format Priming System for Librán Dictionary

## 🎯 Overview

The Multi-Format Priming System combines JSON and PDF files to provide comprehensive context for AI model analysis and generation. This ensures your AI responses are contextually aware and consistent with both structured dictionary data and reference materials.

## 🚀 Key Features

- **Multi-Format Support**: Handles both JSON and PDF files
- **Intelligent Context Loading**: Automatically categorizes and loads files
- **Task-Specific Priming**: Different strategies for different AI tasks
- **Smart Compression**: Fits large contexts within token limits
- **Weight Balancing**: Balances JSON vs PDF content based on task type
- **Pattern Recognition**: Extracts linguistic patterns from multiple sources

## 📁 Files Created

1. **\`lib/ai-integration/multi-format-priming-system.js\`** - Core multi-format system
2. **\`lib/ai-integration/pdf-priming-system.js\`** - PDF processing system
3. **\`lib/ai-integration/enhanced-ai-multi-format.js\`** - Enhanced AI with multi-format support
4. **\`example-multi-format-priming.js\`** - Usage examples
5. **\`setup-multi-format-priming.js\`** - Setup script

## 🛠️ Quick Start

### 1. Setup
\`\`\`bash
node setup-multi-format-priming.js
\`\`\`

### 2. Install PDF Dependencies (Optional)
\`\`\`bash
npm install pdf-parse
\`\`\`

### 3. Basic Usage
\`\`\`javascript
const EnhancedAIMultiFormat = require('./lib/ai-integration/enhanced-ai-multi-format');

const ai = new EnhancedAIMultiFormat();
await ai.initialize({ dataDir: './data' });

// Analyze with comprehensive context
const analysis = await ai.analyzeWordWithContext('kethara', 'etymology');
console.log(analysis);
\`\`\`

### 4. Run Examples
\`\`\`bash
node example-multi-format-priming.js
\`\`\`

## 📊 Context Strategies

### Word Generation
- Uses JSON dictionaries + relevant tranches
- Includes PDF reference materials for cultural context
- Balances structured data (70%) with reference materials (30%)

### Translation
- Focuses on translation pairs from JSON
- Includes cultural context from PDFs
- Emphasizes idiomatic expressions and cultural nuances

### Etymology Analysis
- Uses JSON etymology data
- Includes historical context from PDFs
- Balances structured patterns with reference materials

### Reference-Heavy Tasks
- Emphasizes PDF content (70%) over JSON (30%)
- Ideal for cultural analysis and reference-based tasks
- Uses comprehensive PDF context for detailed analysis

## 🔧 Configuration

The system automatically detects and loads:
- **JSON Files**: Dictionaries, tranches, specialized data
- **PDF Files**: Reference guides, cultural materials, documentation

## 📝 Usage Examples

### 1. Word Analysis with Multi-Format Context
\`\`\`javascript
const analysis = await ai.analyzeWordWithContext('kethara', 'etymology', {
  category: 'living',
  focus: 'animals'
});
\`\`\`

### 2. Word Generation with Comprehensive Context
\`\`\`javascript
const generation = await ai.generateWordWithContext('mountain', 'nature', {
  context: 'A tall, rocky peak in the northern ranges'
});
\`\`\`

### 3. Translation with Cultural Context
\`\`\`javascript
const translation = await ai.translateWithContext(
  'The wise elder spoke of ancient traditions',
  'en-to-libran',
  { focus: 'cultural_context' }
);
\`\`\`

### 4. Comprehensive QA Analysis
\`\`\`javascript
const qaResult = await ai.performComprehensiveQAAnalysis(dictionary, {
  focus: 'consistency_check'
});
\`\`\`

## 🗜️ Context Optimization

The system intelligently optimizes context:
- **Size Limits**: Configurable per task type
- **Weight Balancing**: Adjusts JSON vs PDF content ratios
- **Smart Selection**: Chooses most relevant content
- **Pattern Extraction**: Extracts key linguistic patterns
- **Compression**: Fits within token limits while preserving quality

## 📊 Statistics and Monitoring

Get insights into your loaded context:
\`\`\`javascript
const stats = ai.getComprehensiveStats();
console.log(stats);
\`\`\`

Output includes:
- JSON file count and size
- PDF file count and size
- Total context size
- PDF support status
- Context distribution

## 🚨 Troubleshooting

### Common Issues

1. **"PDF support not available"**
   - Install PDF dependencies: \`npm install pdf-parse\`
   - Check if PDF files exist in data directory

2. **"System not initialized"**
   - Call \`await ai.initialize()\` first

3. **"Context too large"**
   - Adjust compression settings in config
   - Use task-specific context strategies

4. **"No PDF files found"**
   - Check data directory for PDF files
   - Ensure PDF files are readable

### Debug Mode

Enable debug logging:
\`\`\`javascript
const ai = new EnhancedAIMultiFormat();
await ai.initialize({ 
  dataDir: './data',
  debug: true 
});
\`\`\`

## 🎯 Best Practices

1. **Organize Your Files**: Use consistent naming and structure
2. **Balance Content**: Ensure both JSON and PDF content are available
3. **Monitor Context Size**: Adjust limits based on your model
4. **Test Different Strategies**: Try various task types and weights
5. **Cache Results**: Reuse contexts when possible

## 🔮 Future Enhancements

- **Dynamic Weight Adjustment**: Automatic weight balancing based on task performance
- **Semantic Similarity**: Use embeddings for better content selection
- **Multi-Model Support**: Different strategies for different AI models
- **Context Validation**: Automatic quality checks for loaded content
- **Performance Metrics**: Track context effectiveness and optimization

---

**Happy Multi-Format Priming! 🎉**

The Multi-Format Priming System transforms your static files into dynamic, intelligent context that makes your AI responses more accurate, consistent, and culturally authentic.
`;

  fs.writeFileSync('./docs/MULTI_FORMAT_PRIMING_SYSTEM.md', docContent);
  console.log('  ✅ Created docs/MULTI_FORMAT_PRIMING_SYSTEM.md');
}

// Format file size for display
function formatSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Main setup function
async function main() {
  console.log('🎯 Multi-Format Priming System Setup\n');
  
  // Test multi-format priming system
  const primingTest = await testMultiFormatPrimingSystem();
  
  // Test PDF support
  const pdfTest = await testPDFSupport();
  
  // Install PDF dependencies if needed
  let pdfDepsInstalled = false;
  if (!pdfTest && pdfFilesExist) {
    const installChoice = await askUser('Install PDF dependencies? (y/n): ');
    if (installChoice.toLowerCase() === 'y') {
      pdfDepsInstalled = await installPDFDependencies();
    }
  }
  
  // Create example usage
  createExampleUsage();
  
  // Create documentation
  createDocumentation();
  
  // Summary
  console.log('\n📋 Setup Summary:');
  console.log(`  Multi-Format Priming System: ${primingTest ? '✅ Working' : '❌ Failed'}`);
  console.log(`  PDF Support: ${pdfTest ? '✅ Working' : '❌ Not Available'}`);
  console.log(`  PDF Dependencies: ${pdfDepsInstalled ? '✅ Installed' : '⚠️ Not Installed'}`);
  console.log(`  Example Usage: ✅ Created`);
  console.log(`  Documentation: ✅ Created`);
  
  if (primingTest) {
    console.log('\n🎉 Multi-Format Priming System is ready to use!');
    console.log('\n📚 Next Steps:');
    console.log('  1. Run: node example-multi-format-priming.js');
    console.log('  2. Start your AI model server (e.g., Ollama)');
    console.log('  3. Use the EnhancedAIMultiFormat in your code');
    console.log('\n💡 Key Features:');
    console.log('  • Automatic context loading from JSON and PDF files');
    console.log('  • Intelligent compression and optimization');
    console.log('  • Task-specific context selection with weight balancing');
    console.log('  • Rich linguistic pattern recognition from multiple sources');
    console.log('  • Cultural authenticity maintenance using reference materials');
  } else {
    console.log('\n❌ Setup incomplete. Please check your data directory.');
  }
}

// Simple user input function
function askUser(question) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Run setup
main().catch(console.error);
