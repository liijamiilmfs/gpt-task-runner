#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * PDF Priming System for Librán AI Integration
 * 
 * Extracts text content from PDF files and converts them into
 * context that can be used for AI model priming.
 */

class PDFPrimingSystem {
  constructor() {
    this.pdfTextCache = new Map();
    this.supportedFormats = ['.pdf'];
    this.maxTextLength = 50000; // Maximum text length per PDF
    this.compressionRatio = 0.7; // How much to compress extracted text
  }

  /**
   * Check if PDF processing is available
   */
  async checkPDFSupport() {
    try {
      // Try to require pdf-parse (most common PDF parser)
      const pdfParse = require('pdf-parse');
      return { available: true, parser: 'pdf-parse' };
    } catch (error) {
      try {
        // Try pdf2pic as alternative
        const pdf2pic = require('pdf2pic');
        return { available: true, parser: 'pdf2pic' };
      } catch (error2) {
        return { 
          available: false, 
          error: 'No PDF parsing library found. Install pdf-parse or pdf2pic.',
          suggestions: [
            'npm install pdf-parse',
            'npm install pdf2pic',
            'npm install pdf-poppler'
          ]
        };
      }
    }
  }

  /**
   * Install PDF parsing dependencies
   */
  async installPDFDependencies() {
    console.log('📦 Installing PDF parsing dependencies...');
    
    const { execSync } = require('child_process');
    
    try {
      // Try pdf-parse first (most reliable)
      execSync('npm install pdf-parse', { stdio: 'inherit' });
      console.log('✅ pdf-parse installed successfully');
      return true;
    } catch (error) {
      try {
        // Fallback to pdf2pic
        execSync('npm install pdf2pic', { stdio: 'inherit' });
        console.log('✅ pdf2pic installed successfully');
        return true;
      } catch (error2) {
        console.error('❌ Failed to install PDF dependencies');
        console.error('Please install manually: npm install pdf-parse');
        return false;
      }
    }
  }

  /**
   * Extract text from PDF file
   */
  async extractTextFromPDF(filePath) {
    const cacheKey = path.basename(filePath);
    
    // Check cache first
    if (this.pdfTextCache.has(cacheKey)) {
      return this.pdfTextCache.get(cacheKey);
    }

    try {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      
      const pdfData = await pdfParse(dataBuffer);
      const extractedText = pdfData.text;
      
      // Compress text if too long
      const compressedText = this.compressText(extractedText);
      
      const result = {
        file: path.basename(filePath),
        fullText: extractedText,
        compressedText: compressedText,
        pageCount: pdfData.numpages,
        info: pdfData.info,
        metadata: pdfData.metadata,
        size: extractedText.length,
        compressedSize: compressedText.length
      };
      
      // Cache the result
      this.pdfTextCache.set(cacheKey, result);
      
      console.log(`📄 Extracted text from ${path.basename(filePath)}: ${result.size} chars`);
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to extract text from ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Compress text while preserving important information
   */
  compressText(text) {
    if (text.length <= this.maxTextLength) {
      return text;
    }

    // Split into sentences
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Prioritize sentences with Librán-specific content
    const prioritizedSentences = sentences.sort((a, b) => {
      const aScore = this.scoreSentence(a);
      const bScore = this.scoreSentence(b);
      return bScore - aScore;
    });

    // Take top sentences up to max length
    let compressed = '';
    for (const sentence of prioritizedSentences) {
      if (compressed.length + sentence.length <= this.maxTextLength) {
        compressed += sentence.trim() + '. ';
      } else {
        break;
      }
    }

    return compressed.trim();
  }

  /**
   * Score sentence for importance (higher = more important)
   */
  scoreSentence(sentence) {
    let score = 0;
    const lowerSentence = sentence.toLowerCase();
    
    // Librán-specific terms
    if (lowerSentence.includes('librán') || lowerSentence.includes('libran')) score += 10;
    
    // Linguistic terms
    const linguisticTerms = ['morphology', 'etymology', 'phonetics', 'grammar', 'syntax', 'semantics'];
    linguisticTerms.forEach(term => {
      if (lowerSentence.includes(term)) score += 5;
    });
    
    // Dictionary-related terms
    const dictTerms = ['word', 'translation', 'definition', 'meaning', 'entry', 'lexicon'];
    dictTerms.forEach(term => {
      if (lowerSentence.includes(term)) score += 3;
    });
    
    // Cultural terms
    const culturalTerms = ['culture', 'tradition', 'custom', 'belief', 'practice', 'ritual'];
    culturalTerms.forEach(term => {
      if (lowerSentence.includes(term)) score += 2;
    });
    
    // Length bonus (longer sentences often more informative)
    if (sentence.length > 100) score += 1;
    
    return score;
  }

  /**
   * Load all PDF files from directory
   */
  async loadPDFs(dataDir = './data') {
    console.log('📚 Scanning for PDF files...');
    
    const pdfFiles = this.findPDFFiles(dataDir);
    const loadedPDFs = [];
    
    for (const pdfFile of pdfFiles) {
      const result = await this.extractTextFromPDF(pdfFile);
      if (result) {
        loadedPDFs.push(result);
      }
    }
    
    console.log(`✅ Loaded ${loadedPDFs.length} PDF files`);
    return loadedPDFs;
  }

  /**
   * Find all PDF files in directory
   */
  findPDFFiles(dataDir) {
    const pdfFiles = [];
    
    const scanDirectory = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanDirectory(fullPath);
          } else if (stat.isFile() && path.extname(item).toLowerCase() === '.pdf') {
            pdfFiles.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`⚠️ Could not scan directory ${dir}: ${error.message}`);
      }
    };
    
    scanDirectory(dataDir);
    return pdfFiles;
  }

  /**
   * Generate context from PDF content
   */
  generatePDFContext(pdfData, taskType = 'general') {
    const context = {
      type: 'pdf_content',
      taskType: taskType,
      files: pdfData.map(pdf => ({
        file: pdf.file,
        text: pdf.compressedText,
        pageCount: pdf.pageCount,
        size: pdf.compressedSize
      })),
      totalSize: pdfData.reduce((sum, pdf) => sum + pdf.compressedSize, 0),
      fileCount: pdfData.length
    };

    return context;
  }

  /**
   * Extract specific information from PDF content
   */
  extractPDFInformation(pdfData, infoType = 'all') {
    const information = {
      dictionaries: [],
      grammar_rules: [],
      cultural_context: [],
      examples: [],
      patterns: []
    };

    for (const pdf of pdfData) {
      const text = pdf.compressedText;
      
      // Extract dictionary-like entries
      if (infoType === 'all' || infoType === 'dictionaries') {
        const dictEntries = this.extractDictionaryEntries(text);
        information.dictionaries.push(...dictEntries);
      }
      
      // Extract grammar rules
      if (infoType === 'all' || infoType === 'grammar') {
        const grammarRules = this.extractGrammarRules(text);
        information.grammar_rules.push(...grammarRules);
      }
      
      // Extract cultural context
      if (infoType === 'all' || infoType === 'cultural') {
        const culturalInfo = this.extractCulturalContext(text);
        information.cultural_context.push(...culturalInfo);
      }
      
      // Extract examples
      if (infoType === 'all' || infoType === 'examples') {
        const examples = this.extractExamples(text);
        information.examples.push(...examples);
      }
      
      // Extract patterns
      if (infoType === 'all' || infoType === 'patterns') {
        const patterns = this.extractPatterns(text);
        information.patterns.push(...patterns);
      }
    }

    return information;
  }

  /**
   * Extract dictionary-like entries from text
   */
  extractDictionaryEntries(text) {
    const entries = [];
    
    // Look for patterns like "word: translation" or "word - translation"
    const dictPatterns = [
      /([a-zA-Zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)\s*[:=]\s*([^.\n]+)/g,
      /([a-zA-Zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)\s*[-–—]\s*([^.\n]+)/g,
      /([a-zA-Zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+)\s*\(([^)]+)\)/g
    ];
    
    for (const pattern of dictPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entries.push({
          word: match[1].trim(),
          translation: match[2].trim(),
          source: 'pdf_extraction'
        });
      }
    }
    
    return entries.slice(0, 100); // Limit to 100 entries
  }

  /**
   * Extract grammar rules from text
   */
  extractGrammarRules(text) {
    const rules = [];
    
    // Look for grammar-related patterns
    const grammarPatterns = [
      /(?:rule|pattern|grammar)[:\s]+([^.\n]+)/gi,
      /(?:verb|noun|adjective|adverb)[:\s]+([^.\n]+)/gi,
      /(?:morphology|syntax)[:\s]+([^.\n]+)/gi
    ];
    
    for (const pattern of grammarPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        rules.push({
          rule: match[1].trim(),
          source: 'pdf_extraction'
        });
      }
    }
    
    return rules.slice(0, 50); // Limit to 50 rules
  }

  /**
   * Extract cultural context from text
   */
  extractCulturalContext(text) {
    const culturalInfo = [];
    
    // Look for cultural references
    const culturalPatterns = [
      /(?:culture|cultural|tradition|custom|belief)[:\s]+([^.\n]+)/gi,
      /(?:people|tribe|nation|community)[:\s]+([^.\n]+)/gi,
      /(?:religion|spiritual|sacred)[:\s]+([^.\n]+)/gi
    ];
    
    for (const pattern of culturalPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        culturalInfo.push({
          context: match[1].trim(),
          source: 'pdf_extraction'
        });
      }
    }
    
    return culturalInfo.slice(0, 30); // Limit to 30 items
  }

  /**
   * Extract examples from text
   */
  extractExamples(text) {
    const examples = [];
    
    // Look for example patterns
    const examplePatterns = [
      /(?:example|for instance|e\.g\.)[:\s]+([^.\n]+)/gi,
      /(?:such as|like)[:\s]+([^.\n]+)/gi
    ];
    
    for (const pattern of examplePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        examples.push({
          example: match[1].trim(),
          source: 'pdf_extraction'
        });
      }
    }
    
    return examples.slice(0, 20); // Limit to 20 examples
  }

  /**
   * Extract patterns from text
   */
  extractPatterns(text) {
    const patterns = {
      prefixes: new Set(),
      suffixes: new Set(),
      roots: new Set()
    };
    
    // Extract word patterns
    const words = text.match(/[a-zA-Zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]{3,}/g) || [];
    
    for (const word of words.slice(0, 200)) { // Limit to 200 words
      if (word.length > 3) {
        patterns.prefixes.add(word.substring(0, 2));
        patterns.suffixes.add(word.substring(word.length - 2));
        patterns.roots.add(word.substring(1, word.length - 1));
      }
    }
    
    return {
      prefixes: Array.from(patterns.prefixes).slice(0, 20),
      suffixes: Array.from(patterns.suffixes).slice(0, 20),
      roots: Array.from(patterns.roots).slice(0, 30)
    };
  }

  /**
   * Generate priming prompt from PDF content
   */
  generatePDFPrimingPrompt(pdfContext, taskDescription) {
    const prompt = `# PDF Context for Librán Analysis

## Task: ${taskDescription}

## PDF Content Available:
${pdfContext.files.map(pdf => `
### ${pdf.file} (${pdf.pageCount} pages)
${pdf.text.substring(0, 1000)}...
`).join('\n')}

## Instructions:
Use the PDF content as additional context for your analysis. The PDFs contain:
- Reference materials and guides
- Additional examples and patterns
- Cultural context and background
- Grammar rules and explanations

Apply this knowledge to enhance your understanding of Librán language patterns and cultural context.

Please proceed with the analysis using both the JSON dictionary data and this PDF context.`;

    return prompt;
  }

  /**
   * Get PDF statistics
   */
  getPDFStats() {
    const stats = {
      totalFiles: this.pdfTextCache.size,
      totalSize: 0,
      files: []
    };

    for (const [filename, data] of this.pdfTextCache.entries()) {
      stats.totalSize += data.compressedSize;
      stats.files.push({
        file: filename,
        size: data.compressedSize,
        pages: data.pageCount
      });
    }

    return stats;
  }

  /**
   * Clear PDF cache
   */
  clearCache() {
    this.pdfTextCache.clear();
    console.log('🗑️ PDF cache cleared');
  }
}

module.exports = PDFPrimingSystem;
