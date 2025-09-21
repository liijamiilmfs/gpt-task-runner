#!/usr/bin/env node
/**
 * Dictionary build script wrapper
 * 
 * This script provides a Node.js interface to the Python dictionary importer CLI.
 * It handles argument parsing and calls the Python CLI with appropriate options.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Default configuration
const DEFAULT_CONFIG = {
  pdf: 'data/Unified_Libran_Dictionary_Ancient_Modern_v1_2.pdf',
  support: 'data/LibránLexiconReferenceGuide.pdf',
  output: 'lib/translator/dictionaries',
  exclude: 'data/exclude_terms.txt'
};

function showHelp() {
  console.log(`
Librán Dictionary Builder

Usage: pnpm dict:build [options]

Options:
  --pdf <path>        Path to main PDF file (default: ${DEFAULT_CONFIG.pdf})
  --support <path>    Path to support PDF file (default: ${DEFAULT_CONFIG.support})
  --output <path>     Output directory for dictionaries (default: ${DEFAULT_CONFIG.output})
  --exclude <path>    Path to exclude terms file (default: ${DEFAULT_CONFIG.exclude})
  --help, -h          Show this help message

Examples:
  pnpm dict:build
  pnpm dict:build --pdf data/my-dictionary.pdf --output build/dicts
  pnpm dict:build --help

The script will:
1. Parse the PDF files using the Python dictionary importer
2. Generate ancient.json and modern.json dictionaries
3. Save them to the specified output directory
4. Create additional files like ALL_ROWS.csv, VARIANTS.csv, etc.
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
    } else if (arg === '--pdf' && i + 1 < args.length) {
      config.pdf = args[++i];
    } else if (arg === '--support' && i + 1 < args.length) {
      config.support = args[++i];
    } else if (arg === '--output' && i + 1 < args.length) {
      config.output = args[++i];
    } else if (arg === '--exclude' && i + 1 < args.length) {
      config.exclude = args[++i];
    } else {
      console.error(`Unknown option: ${arg}`);
      console.error('Use --help for usage information');
      process.exit(1);
    }
  }
  
  return config;
}

function resolveConfigPaths(config) {
  const projectRoot = path.resolve(__dirname, '..');
  const resolvePathIfNeeded = (targetPath) => {
    if (!targetPath) {
      return targetPath;
    }

    return path.isAbsolute(targetPath)
      ? targetPath
      : path.resolve(projectRoot, targetPath);
  };

  return {
    pdf: resolvePathIfNeeded(config.pdf),
    support: resolvePathIfNeeded(config.support),
    output: resolvePathIfNeeded(config.output),
    exclude: resolvePathIfNeeded(config.exclude)
  };
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
      'build',
      '--pdf', config.pdf,
      '--out', config.output
    ];
    
    if (config.support && fs.existsSync(config.support)) {
      args.push('--support', config.support);
    }
    
    if (config.exclude && fs.existsSync(config.exclude)) {
      args.push('--exclude-list', config.exclude);
    }
    
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
    const config = resolveConfigPaths(parseArgs());
    console.log('✅ Configuration:', config);

    // Check if PDF files exist
    if (!fs.existsSync(config.pdf)) {
      console.error(`❌ PDF file not found: ${config.pdf}`);
      console.error('Please ensure the PDF file exists or specify a different path with --pdf');
      process.exit(1);
    }
    
    if (config.support && !fs.existsSync(config.support)) {
      console.warn(`⚠️  Support PDF not found: ${config.support}`);
      console.warn('Continuing without support PDF...');
      config.support = null;
    }
    
    if (config.exclude && !fs.existsSync(config.exclude)) {
      console.warn(`⚠️  Exclude terms file not found: ${config.exclude}`);
      console.warn('Continuing without exclude terms...');
      config.exclude = null;
    }
    
    console.log('🚀 Starting dictionary build...');
    await runDictImporter(config, pythonCmd);
    
    console.log('✅ Dictionary build completed successfully!');
    console.log(`📁 Output directory: ${config.output}`);
    console.log('📄 Generated files:');
    console.log(`  - ancient.json`);
    console.log(`  - modern.json`);
    console.log(`  - ALL_ROWS.csv`);
    console.log(`  - VARIANTS.csv`);
    console.log(`  - EXCLUDED.txt`);
    console.log(`  - REPORT.md`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, parseArgs, checkPythonEnvironment, checkDictImporter, runDictImporter };
