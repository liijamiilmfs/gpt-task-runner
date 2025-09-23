#!/usr/bin/env node

/**
 * Batch Renderer CLI - Issue #32
 * 
 * CLI to ingest a text file, split on headings, render batch audio, stitch, cue sheet.
 * 
 * Usage:
 *   node scripts/batch-render.js <input-file> [options]
 * 
 * Options:
 *   --output, -o     Output directory (default: ./output)
 *   --voice, -v      Voice to use (default: alloy)
 *   --format, -f     Audio format (default: mp3)
 *   --variant, -r    Translation variant: ancient|modern (default: modern)
 *   --stitch, -s     Stitch audio files together (default: true)
 *   --cue, -c        Generate cue sheet (default: true)
 *   --help, -h       Show help
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// CLI argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    inputFile: null,
    outputDir: './output',
    voice: 'alloy',
    format: 'mp3',
    variant: 'modern',
    stitch: true,
    cue: true,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--output':
      case '-o':
        options.outputDir = args[++i];
        break;
      case '--voice':
      case '-v':
        options.voice = args[++i];
        break;
      case '--format':
      case '-f':
        options.format = args[++i];
        break;
      case '--variant':
      case '-r':
        options.variant = args[++i];
        break;
      case '--no-stitch':
        options.stitch = false;
        break;
      case '--no-cue':
        options.cue = false;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (!arg.startsWith('-') && !options.inputFile) {
          options.inputFile = arg;
        }
        break;
    }
  }

  return options;
}

// Show help
function showHelp() {
  console.log(`
Batch Renderer CLI - Issue #32

Usage:
  node scripts/batch-render.js <input-file> [options]

Options:
  --output, -o     Output directory (default: ./output)
  --voice, -v      Voice to use (default: alloy)
  --format, -f     Audio format (default: mp3)
  --variant, -r    Translation variant: ancient|modern (default: modern)
  --stitch, -s     Stitch audio files together (default: true)
  --cue, -c        Generate cue sheet (default: true)
  --help, -h       Show help

Examples:
  node scripts/batch-render.js story.txt
  node scripts/batch-render.js story.txt --voice nova --variant ancient
  node scripts/batch-render.js story.txt --output ./audio --no-stitch
`);
}

// Text parsing - split on headings
function parseTextFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const segments = [];
  let currentSegment = {
    title: '',
    content: '',
    lineNumber: 1
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect headings (markdown-style or plain text)
    const isHeading = (
      line.startsWith('#') || // Markdown heading
      line.startsWith('===') || // Plain text heading
      line.startsWith('---') || // Alternative heading
      (line.length > 0 && line.length < 50 && line === line.toUpperCase() && !line.includes('.')) // ALL CAPS short lines
    );

    if (isHeading && currentSegment.content.trim()) {
      // Save previous segment
      segments.push({
        ...currentSegment,
        content: currentSegment.content.trim()
      });
      
      // Start new segment
      currentSegment = {
        title: line.replace(/^#+\s*/, '').replace(/^[=-]+\s*/, '').trim(),
        content: '',
        lineNumber: i + 1
      };
    } else if (line.length > 0) {
      // Add content to current segment
      if (currentSegment.content) {
        currentSegment.content += '\n';
      }
      currentSegment.content += line;
    }
  }

  // Add final segment
  if (currentSegment.content.trim()) {
    segments.push({
      ...currentSegment,
      content: currentSegment.content.trim()
    });
  }

  // If no headings found, treat entire file as one segment
  if (segments.length === 0) {
    segments.push({
      title: path.basename(filePath, path.extname(filePath)),
      content: content.trim(),
      lineNumber: 1
    });
  }

  return segments;
}

// Generate audio for a text segment
async function generateAudio(text, options, segmentIndex) {
  console.log(`🎵 Generating audio for segment ${segmentIndex + 1}...`);
  
  try {
    // Call the translation API
    const translateResponse = await fetch('http://localhost:3000/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        variant: options.variant
      })
    });

    if (!translateResponse.ok) {
      throw new Error(`Translation failed: ${translateResponse.statusText}`);
    }

    const translateData = await translateResponse.json();
    const libranText = translateData.libran;

    // Call the TTS API
    const ttsResponse = await fetch('http://localhost:3000/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        libranText: libranText,
        voice: options.voice,
        format: options.format
      })
    });

    if (!ttsResponse.ok) {
      throw new Error(`TTS failed: ${ttsResponse.statusText}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    return Buffer.from(audioBuffer);
  } catch (error) {
    console.error(`❌ Failed to generate audio for segment ${segmentIndex + 1}:`, error.message);
    throw error;
  }
}

// Stitch audio files together
function stitchAudioFiles(audioFiles, outputPath) {
  console.log(`🔗 Stitching ${audioFiles.length} audio files...`);
  
  // For now, we'll use a simple concatenation approach
  // In a production system, you'd want to use a proper audio library like ffmpeg
  
  const totalBuffer = Buffer.concat(audioFiles);
  fs.writeFileSync(outputPath, totalBuffer);
  
  console.log(`✅ Stitched audio saved to: ${outputPath}`);
  return outputPath;
}

// Generate cue sheet
function generateCueSheet(segments, audioFiles, outputPath) {
  console.log(`📝 Generating cue sheet...`);
  
  let cueContent = `REM Generated by Librán Voice Forge Batch Renderer
REM Date: ${new Date().toISOString()}
REM Total segments: ${segments.length}

FILE "${path.basename(outputPath.replace('.cue', '_stitched.mp3'))}" MP3

`;

  let currentTime = 0;
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const audioFile = audioFiles[i];
    
    // Estimate duration (rough calculation: ~150 words per minute)
    const wordCount = segment.content.split(/\s+/).length;
    const duration = (wordCount / 150) * 60; // seconds
    
    const startTime = formatCueTime(currentTime);
    const endTime = formatCueTime(currentTime + duration);
    
    cueContent += `TRACK ${String(i + 1).padStart(2, '0')} AUDIO
  TITLE "${segment.title.replace(/"/g, '\\"')}"
  INDEX 01 ${startTime}

`;
    
    currentTime += duration;
  }

  fs.writeFileSync(outputPath, cueContent);
  console.log(`✅ Cue sheet saved to: ${outputPath}`);
  return outputPath;
}

// Format time for cue sheet (MM:SS:FF where FF is frames)
function formatCueTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 75); // 75 frames per second for CD audio
  
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}

// Main function
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  if (!options.inputFile) {
    console.error('❌ Error: Input file is required');
    console.log('Use --help for usage information');
    process.exit(1);
  }

  if (!fs.existsSync(options.inputFile)) {
    console.error(`❌ Error: Input file not found: ${options.inputFile}`);
    process.exit(1);
  }

  console.log('🎬 Librán Voice Forge Batch Renderer');
  console.log(`📁 Input file: ${options.inputFile}`);
  console.log(`📂 Output directory: ${options.outputDir}`);
  console.log(`🎤 Voice: ${options.voice}`);
  console.log(`📄 Format: ${options.format}`);
  console.log(`🌍 Variant: ${options.variant}`);
  console.log(`🔗 Stitch audio: ${options.stitch}`);
  console.log(`📝 Generate cue sheet: ${options.cue}`);
  console.log('');

  // Create output directory
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }

  try {
    // Parse text file
    console.log('📖 Parsing text file...');
    const segments = parseTextFile(options.inputFile);
    console.log(`✅ Found ${segments.length} segments`);

    // Generate audio for each segment
    const audioFiles = [];
    const audioBuffers = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      console.log(`\n📝 Segment ${i + 1}: "${segment.title}"`);
      console.log(`   Content: ${segment.content.substring(0, 100)}${segment.content.length > 100 ? '...' : ''}`);
      
      const audioBuffer = await generateAudio(segment.content, options, i);
      audioBuffers.push(audioBuffer);
      
      // Save individual audio file
      const segmentFileName = `segment_${String(i + 1).padStart(3, '0')}_${segment.title.replace(/[^a-zA-Z0-9]/g, '_')}.${options.format}`;
      const segmentPath = path.join(options.outputDir, segmentFileName);
      fs.writeFileSync(segmentPath, audioBuffer);
      audioFiles.push(segmentPath);
      
      console.log(`✅ Audio saved: ${segmentFileName}`);
    }

    // Stitch audio files if requested
    if (options.stitch && audioBuffers.length > 1) {
      const stitchedFileName = `${path.basename(options.inputFile, path.extname(options.inputFile))}_stitched.${options.format}`;
      const stitchedPath = path.join(options.outputDir, stitchedFileName);
      stitchAudioFiles(audioBuffers, stitchedPath);
    }

    // Generate cue sheet if requested
    if (options.cue) {
      const cueFileName = `${path.basename(options.inputFile, path.extname(options.inputFile))}.cue`;
      const cuePath = path.join(options.outputDir, cueFileName);
      generateCueSheet(segments, audioFiles, cuePath);
    }

    console.log('\n🎉 Batch rendering completed successfully!');
    console.log(`📂 Output directory: ${options.outputDir}`);

  } catch (error) {
    console.error('\n❌ Batch rendering failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { parseArgs, parseTextFile, generateAudio, stitchAudioFiles, generateCueSheet };
