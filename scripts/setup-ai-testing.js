#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * AI Testing Setup Script
 * 
 * This script helps set up AI model testing for Librán comprehension.
 */

console.log('🤖 AI Testing Setup for Librán Comprehension\n');

async function checkOllamaInstallation() {
  console.log('🔍 Checking Ollama installation...');
  
  try {
    const version = execSync('ollama --version', { encoding: 'utf8' });
    console.log(`✅ Ollama installed: ${version.trim()}`);
    return true;
  } catch (error) {
    console.log('❌ Ollama not found');
    return false;
  }
}

async function checkOllamaService() {
  console.log('\n🔍 Checking Ollama service...');
  
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Ollama service is running');
      console.log(`📊 Available models: ${data.models?.length || 0}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Ollama service not running');
    return false;
  }
}

async function installOllama() {
  console.log('\n📥 Installing Ollama...');
  
  console.log(`
To install Ollama:

1. Visit: https://ollama.ai/
2. Download the installer for your system
3. Run the installer
4. Open a new terminal/command prompt
5. Run: ollama serve

Or use package managers:
- Windows: winget install Ollama.Ollama
- macOS: brew install ollama
- Linux: curl -fsSL https://ollama.ai/install.sh | sh
`);
}

async function pullModel() {
  console.log('\n📦 Pulling AI model...');
  
  try {
    console.log('Pulling llama2:7b model (this may take a while)...');
    execSync('ollama pull llama2:7b', { stdio: 'inherit' });
    console.log('✅ Model pulled successfully');
    return true;
  } catch (error) {
    console.log('❌ Failed to pull model:', error.message);
    return false;
  }
}

async function startOllamaService() {
  console.log('\n🚀 Starting Ollama service...');
  
  try {
    console.log('Starting Ollama service in background...');
    execSync('ollama serve', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.log('❌ Failed to start Ollama service:', error.message);
    return false;
  }
}

async function testConnection() {
  console.log('\n🧪 Testing AI connection...');
  
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Connection successful');
      console.log(`📊 Available models: ${data.models?.length || 0}`);
      
      if (data.models && data.models.length > 0) {
        console.log('📋 Installed models:');
        data.models.forEach(model => {
          console.log(`  - ${model.name} (${model.size ? (model.size / 1024 / 1024 / 1024).toFixed(1) + ' GB' : 'Unknown size'})`);
        });
      }
      
      return true;
    }
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    return false;
  }
}

async function runQuickTest() {
  console.log('\n🧪 Running quick Librán comprehension test...');
  
  try {
    console.log('Testing AI comprehension...');
    execSync('node examples/test-libran-comprehension.js quick', { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

async function showUsageInstructions() {
  console.log('\n📚 Usage Instructions:');
  console.log('=' .repeat(60));
  
  console.log(`
🎯 Testing Librán AI Comprehension:

1. Quick Test (recommended first):
   \`\`\`bash
   node examples/test-libran-comprehension.js quick
   \`\`\`

2. Full Test Suite:
   \`\`\`bash
   node examples/test-libran-comprehension.js full
   \`\`\`

3. Performance Test:
   \`\`\`bash
   node examples/test-libran-comprehension.js performance
   \`\`\`

4. Context Test (no AI model required):
   \`\`\`bash
   node examples/test-libran-context.js
   \`\`\`

5. Capabilities Demo:
   \`\`\`bash
   node examples/demo-libran-ai-capabilities.js
   \`\`\`

🔧 Troubleshooting:

- If Ollama service stops: \`ollama serve\`
- If model not found: \`ollama pull llama2:7b\`
- If connection fails: Check if Ollama is running on port 11434
- For cloud models: Set up API keys and update configuration

📊 What the AI can do:

✅ Analyze Librán word formations
✅ Generate new Librán words
✅ Translate English to Librán
✅ Understand etymological patterns
✅ Recognize morphological structures
✅ Assess linguistic quality
✅ Provide cultural context
✅ Classify semantic groups
`);
}

async function main() {
  console.log('🎯 Starting AI Testing Setup\n');
  
  try {
    // Check Ollama installation
    const ollamaInstalled = await checkOllamaInstallation();
    
    if (!ollamaInstalled) {
      await installOllama();
      console.log('\n⚠️ Please install Ollama and run this script again');
      return;
    }
    
    // Check Ollama service
    const serviceRunning = await checkOllamaService();
    
    if (!serviceRunning) {
      console.log('\n🚀 Starting Ollama service...');
      console.log('Please run: ollama serve');
      console.log('Then run this script again');
      return;
    }
    
    // Check for models
    const connectionOk = await testConnection();
    
    if (!connectionOk) {
      console.log('\n❌ Cannot connect to Ollama service');
      return;
    }
    
    // Try to pull a model if none available
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      const data = await response.json();
      
      if (!data.models || data.models.length === 0) {
        console.log('\n📦 No models found, pulling llama2:7b...');
        await pullModel();
      }
    } catch (error) {
      console.log('⚠️ Could not check for models');
    }
    
    // Test connection again
    const finalConnection = await testConnection();
    
    if (finalConnection) {
      console.log('\n🎉 AI testing setup complete!');
      console.log('You can now run Librán comprehension tests');
      
      // Ask if user wants to run a quick test
      console.log('\n🧪 Would you like to run a quick test? (y/n)');
      // Note: In a real implementation, you'd read user input here
      console.log('Run: node examples/test-libran-comprehension.js quick');
    } else {
      console.log('\n❌ Setup incomplete. Please check Ollama installation and service.');
    }
    
    // Show usage instructions
    await showUsageInstructions();
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkOllamaInstallation,
  checkOllamaService,
  testConnection,
  runQuickTest
};
