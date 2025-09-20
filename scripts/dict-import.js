#!/usr/bin/env node
/**
 * Dictionary JSON import script
 * 
 * This script provides a Node.js interface to import JSON dictionaries
 * into the Librán translation system.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Default configuration
const DEFAULT_CONFIG = {
  ancient: 'data/ancient.json',
  modern: 'data/modern.json',
  output: 'lib/translator/dictionaries'
};

function showHelp() {
  console.log(`
Librán Dictionary JSON Importer

Usage: pnpm dict:import [options]

Options:
  --ancient <path>    Path to ancient JSON dictionary (default: ${DEFAULT_CONFIG.ancient})
  --modern <path>     Path to modern JSON dictionary (default: ${DEFAULT_CONFIG.modern})
  --output <path>     Output directory for dictionaries (default: ${DEFAULT_CONFIG.output})
  --help, -h          Show this help message

Examples:
  pnpm dict:import
  pnpm dict:import --ancient data/my-ancient.json --modern data/my-modern.json
  pnpm dict:import --output build/dicts

The script will:
1. Read JSON dictionary files
2. Validate the format and content
3. Generate ancient.json and modern.json dictionaries
4. Save them to the specified output directory

Supported JSON formats:
  - Simple: {"word": "translation"}
  - Detailed: {"word": {"ancient": "trans", "modern": "trans", "pos": "n"}}
  - Nested: {"ancient": {"word": "trans"}, "modern": {"word": "trans"}}
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    } else if (arg === '--ancient' && i + 1 < args.length) {
      config.ancient = args[++i];
    } else if (arg === '--modern' && i + 1 < args.length) {
      config.modern = args[++i];
    } else if (arg === '--output' && i + 1 < args.length) {
      config.output = args[++i];
    } else {
      console.error(`Unknown option: ${arg}`);
      console.error('Use --help for usage information');
      process.exit(1);
    }
  }
  
  return config;
}

function checkPythonEnvironment() {
  return new Promise((resolve, reject) => {
    const python = spawn('python', ['--version'], { stdio: 'pipe' });
    
    python.on('close', (code) => {
      if (code === 0) {
        resolve('python');
      } else {
        // Try python3
        const python3 = spawn('python3', ['--version'], { stdio: 'pipe' });
        python3.on('close', (code3) => {
          if (code3 === 0) {
            resolve('python3');
          } else {
            reject(new Error('Python not found. Please install Python 3.8+ and ensure it\'s in your PATH.'));
          }
        });
      }
    });
  });
}

function checkDictImporter() {
  return new Promise((resolve, reject) => {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const dictImporterPath = path.join(__dirname, '..', 'tools', 'dict_importer');
    
    // Check if the dict_importer package exists
    if (!fs.existsSync(path.join(dictImporterPath, 'dict_importer'))) {
      reject(new Error(`Dictionary importer not found at ${dictImporterPath}`));
      return;
    }
    
    // Try to import the package
    const testScript = `
import sys
sys.path.insert(0, '${dictImporterPath}')
try:
    from dict_importer.cli import main
    print("OK")
except ImportError as e:
    print(f"ERROR: {e}")
    sys.exit(1)
`;
    
    const python = spawn(pythonCmd, ['-c', testScript], { 
      stdio: 'pipe',
      cwd: dictImporterPath
    });
    
    let output = '';
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0 && output.trim() === 'OK') {
        resolve(pythonCmd);
      } else {
        reject(new Error(`Dictionary importer not properly installed: ${output}`));
      }
    });
  });
}

function runDictImporter(config, pythonCmd) {
  return new Promise((resolve, reject) => {
    const dictImporterPath = path.join(__dirname, '..', 'tools', 'dict_importer');
    const args = [
      '-m', 'dict_importer.cli',
      'import-json',
      '--ancient', config.ancient,
      '--modern', config.modern,
      '--out', config.output
    ];
    
    console.log(`Running: ${pythonCmd} ${args.join(' ')}`);
    console.log(`Working directory: ${dictImporterPath}`);
    
    const python = spawn(pythonCmd, args, {
      stdio: 'inherit',
      cwd: dictImporterPath
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Dictionary importer failed with exit code ${code}`));
      }
    });
    
    python.on('error', (err) => {
      reject(new Error(`Failed to start dictionary importer: ${err.message}`));
    });
  });
}

async function main() {
  try {
    console.log('🔍 Checking Python environment...');
    const pythonCmd = await checkPythonEnvironment();
    console.log(`✅ Found Python: ${pythonCmd}`);
    
    console.log('🔍 Checking dictionary importer...');
    await checkDictImporter();
    console.log('✅ Dictionary importer is available');
    
    console.log('📋 Parsing arguments...');
    const config = parseArgs();
    console.log('✅ Configuration:', config);
    
    // Check if JSON files exist
    if (!fs.existsSync(config.ancient)) {
      console.error(`❌ Ancient JSON file not found: ${config.ancient}`);
      console.error('Please ensure the JSON file exists or specify a different path with --ancient');
      process.exit(1);
    }
    
    if (!fs.existsSync(config.modern)) {
      console.error(`❌ Modern JSON file not found: ${config.modern}`);
      console.error('Please ensure the JSON file exists or specify a different path with --modern');
      process.exit(1);
    }
    
    console.log('🚀 Starting JSON dictionary import...');
    await runDictImporter(config, pythonCmd);
    
    console.log('✅ JSON dictionary import completed successfully!');
    console.log(`📁 Output directory: ${config.output}`);
    console.log('📄 Generated files:');
    console.log(`  - ancient.json`);
    console.log(`  - modern.json`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, parseArgs, checkPythonEnvironment, checkDictImporter, runDictImporter };
