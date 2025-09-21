#!/usr/bin/env node
/**
 * Librán Dictionary Import script
 * 
 * This script imports the specialized Librán dictionary JSON format
 * into the translation system.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Default configuration
const DEFAULT_CONFIG = {
  json: 'data/libran_dictionary.json',
  output: 'lib/translator/dictionaries'
};

function showHelp() {
  console.log(`
Librán Dictionary Importer

Usage: pnpm dict:import-libran [options]

Options:
  --json <path>      Path to Librán dictionary JSON file (default: ${DEFAULT_CONFIG.json})
  --output <path>    Output directory for dictionaries (default: ${DEFAULT_CONFIG.output})
  --help, -h         Show this help message

Examples:
  pnpm dict:import-libran
  pnpm dict:import-libran --json data/my-dictionary.json
  pnpm dict:import-libran --output build/dictionaries

The script will:
1. Read the Librán dictionary JSON file
2. Parse the cluster-based structure
3. Extract ancient and modern entries
4. Generate ancient.json and modern.json dictionaries
5. Save them to the specified output directory

This importer is specifically designed for the Librán dictionary format
with clusters containing ancient and modern sections.
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
    } else if (arg === '--json' && i + 1 < args.length) {
      config.json = args[++i];
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

function runLibranImporter(config, pythonCmd) {
  return new Promise((resolve, reject) => {
    const dictImporterPath = path.join(__dirname, '..', 'tools', 'dict_importer');
    const args = [
      '-m', 'dict_importer.cli',
      'import-libran',
      '--json', config.json,
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
        reject(new Error(`Librán dictionary importer failed with exit code ${code}`));
      }
    });
    
    python.on('error', (err) => {
      reject(new Error(`Failed to start Librán dictionary importer: ${err.message}`));
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
    
    // Check if JSON file exists
    if (!fs.existsSync(config.json)) {
      console.error(`❌ JSON file not found: ${config.json}`);
      console.error('Please ensure the JSON file exists or specify a different path with --json');
      process.exit(1);
    }
    
    console.log('🚀 Starting Librán dictionary import...');
    await runLibranImporter(config, pythonCmd);
    
    console.log('✅ Librán dictionary import completed successfully!');
    console.log(`📁 Output directory: ${config.output}`);
    console.log('📄 Generated files:');
    console.log(`  - ancient.json`);
    console.log(`  - modern.json`);
    console.log(`  - IMPORT_REPORT.md`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, parseArgs, checkPythonEnvironment, checkDictImporter, runLibranImporter };
