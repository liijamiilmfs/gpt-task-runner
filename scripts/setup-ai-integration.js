#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Setup script for AI integration with Librán Dictionary
 * 
 * This script helps you set up the AI integration by:
 * - Installing required dependencies
 * - Setting up local models (Ollama)
 * - Creating configuration files
 * - Testing the AI system
 */

const SETUP_CONFIG = {
  // Dependencies to install
  dependencies: [
    'node-fetch@^3.3.2',  // For API calls
    'ollama@^0.2.0'       // For local model management
  ],
  
  // Ollama models to pull
  ollama_models: [
    'llama2:7b-chat',      // Good balance of quality and speed
    'mistral:7b-instruct', // Alternative high-quality model
    'codellama:7b-instruct' // Specialized for structured output
  ],
  
  // Configuration files to create
  config_files: {
    '.env.example': `# AI Integration Environment Variables

# OpenAI (if using OpenAI models)
OPENAI_API_KEY=your-openai-api-key-here

# Anthropic (if using Anthropic models)
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# Ollama (for local models)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama2:7b-chat

# AI Processing Configuration
AI_MAX_ENTRIES=50
AI_BATCH_SIZE=5
AI_ANALYZE_THRESHOLD=7
AI_IMPROVE_THRESHOLD=5
`,

    'ai-config.json': {
      "models": {
        "llama": {
          "name": "llama2:7b-chat",
          "type": "local",
          "provider": "ollama",
          "endpoint": "http://localhost:11434",
          "context_window": 4096,
          "cost": "free"
        },
        "mistral": {
          "name": "mistral:7b-instruct",
          "type": "local",
          "provider": "ollama",
          "endpoint": "http://localhost:11434",
          "context_window": 8192,
          "cost": "free"
        },
        "openai": {
          "name": "gpt-3.5-turbo",
          "type": "cloud",
          "provider": "openai",
          "endpoint": "https://api.openai.com/v1",
          "context_window": 4096,
          "cost": "paid"
        }
      },
      "default_model": "llama",
      "processing": {
        "max_entries": 50,
        "batch_size": 5,
        "analyze_threshold": 7,
        "improve_threshold": 5
      }
    }
  }
};

async function setupAIIntegration() {
  console.log('🤖 Setting up AI Integration for Librán Dictionary');
  console.log('=' .repeat(60));
  
  try {
    // 1. Check system requirements
    console.log('\n🔍 Checking system requirements...');
    checkSystemRequirements();
    
    // 2. Install dependencies
    console.log('\n📦 Installing dependencies...');
    installDependencies();
    
    // 3. Set up Ollama (if not already installed)
    console.log('\n🦙 Setting up Ollama...');
    await setupOllama();
    
    // 4. Create configuration files
    console.log('\n⚙️  Creating configuration files...');
    createConfigFiles();
    
    // 5. Test the AI system
    console.log('\n🧪 Testing AI system...');
    await testAISystem();
    
    // 6. Create sample training data
    console.log('\n📚 Creating sample training data...');
    createTrainingData();
    
    console.log('\n✅ AI Integration setup complete!');
    console.log('=' .repeat(60));
    console.log('🎉 You can now run AI-enhanced QA on your dictionary!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: node ai-enhanced-qa-pipeline.js --model llama');
    console.log('   2. Review AI results in generated files');
    console.log('   3. Customize prompts in lib/ai-integration/linguistic-ai-system.js');
    console.log('   4. Add your API keys to .env file for cloud models');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

function checkSystemRequirements() {
  console.log('   Checking Node.js version...');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 16) {
    throw new Error(`Node.js 16+ required, found ${nodeVersion}`);
  }
  console.log(`   ✅ Node.js ${nodeVersion}`);
  
  console.log('   Checking available memory...');
  const totalMemory = require('os').totalmem();
  const memoryGB = Math.round(totalMemory / (1024 * 1024 * 1024));
  
  if (memoryGB < 8) {
    console.warn(`   ⚠️  Low memory detected: ${memoryGB}GB (8GB+ recommended for local models)`);
  } else {
    console.log(`   ✅ Memory: ${memoryGB}GB`);
  }
  
  console.log('   Checking available disk space...');
  const freeSpace = require('os').freemem();
  const freeSpaceGB = Math.round(freeSpace / (1024 * 1024 * 1024));
  
  if (freeSpaceGB < 10) {
    console.warn(`   ⚠️  Low disk space: ${freeSpaceGB}GB (10GB+ recommended for models)`);
  } else {
    console.log(`   ✅ Free space: ${freeSpaceGB}GB`);
  }
}

function installDependencies() {
  try {
    console.log('   Installing npm packages...');
    execSync(`npm install ${SETUP_CONFIG.dependencies.join(' ')}`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('   ✅ Dependencies installed');
  } catch (error) {
    console.warn('   ⚠️  Failed to install some dependencies:', error.message);
    console.log('   💡 You can install them manually later with:');
    console.log(`      npm install ${SETUP_CONFIG.dependencies.join(' ')}`);
  }
}

async function setupOllama() {
  try {
    // Check if Ollama is already installed
    execSync('ollama --version', { stdio: 'pipe' });
    console.log('   ✅ Ollama already installed');
  } catch (error) {
    console.log('   📥 Ollama not found, installing...');
    
    // Provide installation instructions
    console.log('\n   🦙 To install Ollama:');
    console.log('   Windows: Download from https://ollama.ai/download');
    console.log('   macOS: brew install ollama');
    console.log('   Linux: curl -fsSL https://ollama.ai/install.sh | sh');
    console.log('\n   After installation, run:');
    console.log('   ollama serve');
    console.log('   ollama pull llama2:7b-chat');
    
    return; // Skip model pulling if Ollama not installed
  }
  
  // Check if Ollama is running
  try {
    execSync('ollama list', { stdio: 'pipe' });
    console.log('   ✅ Ollama is running');
  } catch (error) {
    console.log('   🚀 Starting Ollama service...');
    try {
      execSync('ollama serve', { stdio: 'pipe', detached: true });
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for service to start
    } catch (startError) {
      console.log('   ⚠️  Please start Ollama manually: ollama serve');
    }
  }
  
  // Pull recommended models
  console.log('   📥 Pulling recommended models...');
  for (const model of SETUP_CONFIG.ollama_models) {
    try {
      console.log(`   Pulling ${model}...`);
      execSync(`ollama pull ${model}`, { stdio: 'inherit' });
      console.log(`   ✅ ${model} ready`);
    } catch (error) {
      console.warn(`   ⚠️  Failed to pull ${model}: ${error.message}`);
    }
  }
}

function createConfigFiles() {
  // Create .env.example
  fs.writeFileSync('.env.example', SETUP_CONFIG.config_files['.env.example']);
  console.log('   ✅ Created .env.example');
  
  // Create ai-config.json
  fs.writeFileSync('ai-config.json', JSON.stringify(SETUP_CONFIG.config_files['ai-config.json'], null, 2));
  console.log('   ✅ Created ai-config.json');
  
  // Create .env if it doesn't exist
  if (!fs.existsSync('.env')) {
    fs.writeFileSync('.env', SETUP_CONFIG.config_files['.env.example']);
    console.log('   ✅ Created .env (please add your API keys)');
  }
  
  // Create ai-results directory
  if (!fs.existsSync('ai-results')) {
    fs.mkdirSync('ai-results');
    console.log('   ✅ Created ai-results directory');
  }
  
  // Create proposed words directory structure
  const proposedDir = './data/proposed';
  const approvedDir = './data/approved';
  const rejectedDir = './data/rejected';
  
  [proposedDir, approvedDir, rejectedDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   ✅ Created ${dir} directory`);
    }
  });
}

async function testAISystem() {
  console.log('   Testing AI model connectivity...');
  
  try {
    // Test Ollama connectivity
    execSync('ollama list', { stdio: 'pipe' });
    console.log('   ✅ Ollama connectivity test passed');
    
    // Test model availability
    const { AIModelInterface } = require('./lib/ai-integration/linguistic-ai-system');
    const ai = new AIModelInterface('llama');
    
    console.log('   ✅ AI system initialization test passed');
    
  } catch (error) {
    console.warn('   ⚠️  AI system test failed:', error.message);
    console.log('   💡 Make sure Ollama is running and models are pulled');
  }
}

function createTrainingData() {
  const trainingData = {
    "linguistic_rules": {
      "ancient_suffixes": {
        "-or": "mythic/abstract concepts (Animor, Memoror)",
        "-us": "masculine nouns (Equus, Gladius)",
        "-a": "feminine nouns (Luna, Terra)",
        "-um": "neuter nouns (Aurum, Ferrum)",
        "-tor": "agent nouns (Ductor, Bellator)"
      },
      "modern_suffixes": {
        "ë": "Hungarian influence, soft ending",
        "é": "Hungarian influence, long vowel",
        "ö": "Hungarian influence, rounded vowel",
        "ü": "Hungarian influence, rounded vowel",
        "ă": "Romanian influence, schwa",
        "î": "Romanian influence, central vowel"
      },
      "donor_languages": {
        "Latin": "Ancient forms, classical concepts",
        "Hungarian": "Modern forms, everyday vocabulary",
        "Romanian": "Emotional/soft concepts",
        "Icelandic": "Mythic/ritual vocabulary",
        "English": "Only when no suitable alternative exists"
      }
    },
    "example_entries": [
      {
        "english": "balance",
        "ancient": "Stílibror",
        "modern": "stílibra",
        "notes": "Lat statera; Core sacred concept; mythic register",
        "quality": "excellent"
      },
      {
        "english": "destiny",
        "ancient": "Fator",
        "modern": "fatorë",
        "notes": "Lat fatum; Fate; singular fatora, definite fatorë, plural fatorir",
        "quality": "excellent"
      },
      {
        "english": "memory",
        "ancient": "Memoror",
        "modern": "memira",
        "notes": "Lat memoria; Sacred remembrance; singular memira, definite memirë, plural memirir",
        "quality": "excellent"
      }
    ],
    "bad_examples": [
      {
        "english": "leader",
        "ancient": "leaderor",
        "modern": "leaderë",
        "notes": "English + suffixes without proper etymology",
        "issues": ["lazy_formation", "missing_etymology", "poor_donor_choice"]
      }
    ]
  };
  
  fs.writeFileSync('ai-training-data.json', JSON.stringify(trainingData, null, 2));
  console.log('   ✅ Created ai-training-data.json');
  
  // Create sample prompt templates
  const promptTemplates = {
    "analysis_prompt": `Analyze this Librán word formation for linguistic quality:

English: "{english}"
Ancient: "{ancient}"
Modern: "{modern}"
Notes: "{notes}"

Provide analysis as JSON with fields:
- score: 1-10 quality rating
- issues: array of problems found
- suggestions: array of improvements
- etymology: assessment of etymological accuracy
- cultural: assessment of cultural appropriateness`,

    "generation_prompt": `Generate a new Librán word for this English concept:

English: "{english}"
Semantic Group: "{semantic_group}"

Create formation as JSON with fields:
- ancient: Latin-based Ancient form
- modern: Hungarian/Romanian-influenced Modern form
- notes: complete etymological documentation
- reasoning: explanation of choices made

Follow Librán linguistic rules and cultural patterns.`,

    "improvement_prompt": `Improve this Librán word formation:

English: "{english}"
Current Ancient: "{ancient}"
Current Modern: "{modern}"
Current Notes: "{notes}"
Issues: {issues}

Generate improved formation as JSON with fields:
- ancient: improved Ancient form
- modern: improved Modern form
- notes: improved etymological documentation
- reasoning: explanation of improvements made

Address all identified issues while maintaining cultural authenticity.`
  };
  
  fs.writeFileSync('ai-prompt-templates.json', JSON.stringify(promptTemplates, null, 2));
  console.log('   ✅ Created ai-prompt-templates.json');
}

// ============================================================================
// COMMAND LINE INTERFACE
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🤖 AI Integration Setup for Librán Dictionary

USAGE:
  node setup-ai-integration.js [options]

OPTIONS:
  --skip-deps      Skip dependency installation
  --skip-ollama    Skip Ollama setup
  --skip-test      Skip AI system test
  --help, -h       Show this help message

WHAT THIS SETUP DOES:
  1. Checks system requirements (Node.js, memory, disk space)
  2. Installs required npm packages
  3. Sets up Ollama for local AI models
  4. Pulls recommended AI models (llama2, mistral, codellama)
  5. Creates configuration files (.env, ai-config.json)
  6. Tests AI system connectivity
  7. Creates sample training data and prompt templates

PREREQUISITES:
  - Node.js 16+ installed
  - 8GB+ RAM recommended for local models
  - 10GB+ free disk space for models
  - Internet connection for downloading models

AFTER SETUP:
  - Run: node ai-enhanced-qa-pipeline.js --model llama
  - Add API keys to .env for cloud models (OpenAI, Anthropic)
  - Customize prompts in ai-prompt-templates.json
`);
    process.exit(0);
  }
  
  // Parse options
  const skipDeps = args.includes('--skip-deps');
  const skipOllama = args.includes('--skip-ollama');
  const skipTest = args.includes('--skip-test');
  
  // Modify setup based on options
  if (skipDeps) {
    const originalInstall = installDependencies;
    installDependencies = () => console.log('   ⏭️  Skipped dependency installation');
  }
  
  if (skipOllama) {
    const originalSetup = setupOllama;
    setupOllama = () => console.log('   ⏭️  Skipped Ollama setup');
  }
  
  if (skipTest) {
    const originalTest = testAISystem;
    testAISystem = () => console.log('   ⏭️  Skipped AI system test');
  }
  
  setupAIIntegration();
}

module.exports = { setupAIIntegration, SETUP_CONFIG };
