#!/usr/bin/env node

const JSONPrimingSystem = require('./json-priming-system');
const PDFPrimingSystem = require('./pdf-priming-system');

/**
 * Multi-Format Priming System for Librán AI Integration
 * 
 * Combines JSON and PDF priming for comprehensive context
 * that includes both structured data and reference materials.
 */

class MultiFormatPrimingSystem {
  constructor() {
    this.jsonPrimer = new JSONPrimingSystem();
    this.pdfPrimer = new PDFPrimingSystem();
    this.isInitialized = false;
    this.pdfSupport = null;
  }

  /**
   * Initialize the multi-format priming system
   */
  async initialize(options = {}) {
    console.log('🚀 Initializing Multi-Format Priming System...');
    
    // Check PDF support
    this.pdfSupport = await this.pdfPrimer.checkPDFSupport();
    
    if (!this.pdfSupport.available) {
      console.log('⚠️ PDF support not available. Install dependencies with:');
      console.log('   npm install pdf-parse');
      console.log('   Continuing with JSON-only mode...');
    }
    
    // Initialize JSON priming
    await this.jsonPrimer.loadPrimers(options.dataDir || './data');
    
    // Initialize PDF priming if available
    if (this.pdfSupport.available) {
      try {
        await this.pdfPrimer.loadPDFs(options.dataDir || './data');
        console.log('✅ PDF priming initialized');
      } catch (error) {
        console.warn('⚠️ PDF loading failed:', error.message);
        console.log('   Continuing with JSON-only mode...');
      }
    }
    
    this.isInitialized = true;
    console.log('✅ Multi-Format Priming System initialized');
  }

  /**
   * Install PDF dependencies
   */
  async installPDFDependencies() {
    return await this.pdfPrimer.installPDFDependencies();
  }

  /**
   * Generate comprehensive context combining JSON and PDF data
   */
  generateComprehensiveContext(taskType, options = {}) {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call initialize() first.');
    }

    // Get JSON context
    const jsonContext = this.jsonPrimer.generateContext(taskType, options);
    
    // Get PDF context if available
    let pdfContext = null;
    if (this.pdfSupport && this.pdfSupport.available) {
      const pdfData = Array.from(this.pdfPrimer.pdfTextCache.values());
      if (pdfData.length > 0) {
        pdfContext = this.pdfPrimer.generatePDFContext(pdfData, taskType);
      }
    }

    // Combine contexts
    const combinedContext = {
      json: jsonContext,
      pdf: pdfContext,
      metadata: {
        taskType,
        hasJSON: true,
        hasPDF: pdfContext !== null,
        totalSize: jsonContext.metadata.totalSize + (pdfContext?.totalSize || 0),
        jsonCategories: jsonContext.metadata.categories,
        pdfFiles: pdfContext?.fileCount || 0
      }
    };

    return combinedContext;
  }

  /**
   * Generate context for specific task types
   */
  generateContextForTask(taskType, options = {}) {
    const strategies = {
      'word_generation': () => this.getWordGenerationContext(options),
      'translation': () => this.getTranslationContext(options),
      'etymology': () => this.getEtymologyContext(options),
      'qa_analysis': () => this.getQAAnalysisContext(options),
      'pattern_analysis': () => this.getPatternAnalysisContext(options),
      'comprehensive': () => this.getComprehensiveContext(options),
      'reference_heavy': () => this.getReferenceHeavyContext(options)
    };

    const strategy = strategies[taskType] || strategies['comprehensive'];
    return strategy();
  }

  /**
   * Word generation with both JSON and PDF context
   */
  getWordGenerationContext(options) {
    const jsonContext = this.jsonPrimer.generateContext('word_generation', options);
    
    let pdfContext = null;
    if (this.pdfSupport && this.pdfSupport.available) {
      const pdfData = Array.from(this.pdfPrimer.pdfTextCache.values());
      if (pdfData.length > 0) {
        pdfContext = this.pdfPrimer.generatePDFContext(pdfData, 'word_generation');
      }
    }

    return this.combineContexts(jsonContext, pdfContext, 'word_generation');
  }

  /**
   * Translation with comprehensive context
   */
  getTranslationContext(options) {
    const jsonContext = this.jsonPrimer.generateContext('translation', options);
    
    let pdfContext = null;
    if (this.pdfSupport && this.pdfSupport.available) {
      const pdfData = Array.from(this.pdfPrimer.pdfTextCache.values());
      if (pdfData.length > 0) {
        pdfContext = this.pdfPrimer.generatePDFContext(pdfData, 'translation');
      }
    }

    return this.combineContexts(jsonContext, pdfContext, 'translation');
  }

  /**
   * Etymology analysis with reference materials
   */
  getEtymologyContext(options) {
    const jsonContext = this.jsonPrimer.generateContext('etymology', options);
    
    let pdfContext = null;
    if (this.pdfSupport && this.pdfSupport.available) {
      const pdfData = Array.from(this.pdfPrimer.pdfTextCache.values());
      if (pdfData.length > 0) {
        pdfContext = this.pdfPrimer.generatePDFContext(pdfData, 'etymology');
      }
    }

    return this.combineContexts(jsonContext, pdfContext, 'etymology');
  }

  /**
   * QA analysis with reference materials
   */
  getQAAnalysisContext(options) {
    const jsonContext = this.jsonPrimer.generateContext('qa_analysis', options);
    
    let pdfContext = null;
    if (this.pdfSupport && this.pdfSupport.available) {
      const pdfData = Array.from(this.pdfPrimer.pdfTextCache.values());
      if (pdfData.length > 0) {
        pdfContext = this.pdfPrimer.generatePDFContext(pdfData, 'qa_analysis');
      }
    }

    return this.combineContexts(jsonContext, pdfContext, 'qa_analysis');
  }

  /**
   * Pattern analysis with comprehensive context
   */
  getPatternAnalysisContext(options) {
    const jsonContext = this.jsonPrimer.generateContext('pattern_analysis', options);
    
    let pdfContext = null;
    if (this.pdfSupport && this.pdfSupport.available) {
      const pdfData = Array.from(this.pdfPrimer.pdfTextCache.values());
      if (pdfData.length > 0) {
        pdfContext = this.pdfPrimer.generatePDFContext(pdfData, 'pattern_analysis');
      }
    }

    return this.combineContexts(jsonContext, pdfContext, 'pattern_analysis');
  }

  /**
   * Comprehensive context for complex tasks
   */
  getComprehensiveContext(options) {
    const jsonContext = this.jsonPrimer.generateContext('comprehensive', options);
    
    let pdfContext = null;
    if (this.pdfSupport && this.pdfSupport.available) {
      const pdfData = Array.from(this.pdfPrimer.pdfTextCache.values());
      if (pdfData.length > 0) {
        pdfContext = this.pdfPrimer.generatePDFContext(pdfData, 'comprehensive');
      }
    }

    return this.combineContexts(jsonContext, pdfContext, 'comprehensive');
  }

  /**
   * Reference-heavy context (emphasizes PDF content)
   */
  getReferenceHeavyContext(options) {
    const jsonContext = this.jsonPrimer.generateContext('comprehensive', options);
    
    let pdfContext = null;
    if (this.pdfSupport && this.pdfSupport.available) {
      const pdfData = Array.from(this.pdfPrimer.pdfTextCache.values());
      if (pdfData.length > 0) {
        pdfContext = this.pdfPrimer.generatePDFContext(pdfData, 'reference_heavy');
      }
    }

    // For reference-heavy tasks, give more weight to PDF content
    return this.combineContexts(jsonContext, pdfContext, 'reference_heavy', 0.3, 0.7);
  }

  /**
   * Combine JSON and PDF contexts
   */
  combineContexts(jsonContext, pdfContext, taskType, jsonWeight = 0.7, pdfWeight = 0.3) {
    const combined = {
      taskType,
      json: jsonContext,
      pdf: pdfContext,
      metadata: {
        taskType,
        hasJSON: true,
        hasPDF: pdfContext !== null,
        totalSize: jsonContext.metadata.totalSize + (pdfContext?.totalSize || 0),
        jsonSize: jsonContext.metadata.totalSize,
        pdfSize: pdfContext?.totalSize || 0,
        jsonWeight,
        pdfWeight,
        jsonCategories: jsonContext.metadata.categories,
        pdfFiles: pdfContext?.fileCount || 0
      }
    };

    return combined;
  }

  /**
   * Generate priming prompt for multi-format context
   */
  generateMultiFormatPrimingPrompt(context, taskDescription) {
    let prompt = `# Multi-Format Context for Librán Analysis

## Task: ${taskDescription}

## Available Context:
`;

    // Add JSON context
    prompt += `\n### Dictionary Data (JSON):
${JSON.stringify(context.json.context, null, 2)}`;

    // Add PDF context if available
    if (context.pdf) {
      prompt += `\n\n### Reference Materials (PDF):
${context.pdf.files.map(pdf => `
#### ${pdf.file} (${pdf.pageCount} pages)
${pdf.text.substring(0, 1500)}...
`).join('\n')}`;
    }

    prompt += `\n\n## Instructions:
Use the provided context to understand Librán linguistic patterns, morphology, and cultural context.
The JSON data provides structured dictionary entries, while the PDF content offers additional
reference materials, examples, and cultural context.

Apply this comprehensive knowledge to complete the requested task while maintaining consistency
with existing patterns and cultural authenticity.

## Key Guidelines:
- Follow established morphological rules from both sources
- Maintain cultural authenticity using PDF reference materials
- Ensure etymological consistency across all sources
- Consider phonetic patterns from dictionary data
- Respect existing word structures and cultural context

Please proceed with the analysis based on this comprehensive context.`;

    return prompt;
  }

  /**
   * Get comprehensive statistics
   */
  getComprehensiveStats() {
    const jsonStats = this.jsonPrimer.getContextStats();
    const pdfStats = this.pdfPrimer.getPDFStats();
    
    return {
      json: jsonStats,
      pdf: pdfStats,
      combined: {
        totalFiles: jsonStats.totalFiles + pdfStats.totalFiles,
        totalSize: jsonStats.totalSize + pdfStats.totalSize,
        hasPDF: this.pdfSupport && this.pdfSupport.available,
        pdfSupport: this.pdfSupport
      }
    };
  }

  /**
   * Extract specific information from all sources
   */
  extractInformation(infoType = 'all') {
    const jsonInfo = this.jsonPrimer.extractKeyEntries ? 
      this.jsonPrimer.extractKeyEntries({}, []) : {};
    
    let pdfInfo = {};
    if (this.pdfSupport && this.pdfSupport.available) {
      const pdfData = Array.from(this.pdfPrimer.pdfTextCache.values());
      pdfInfo = this.pdfPrimer.extractPDFInformation(pdfData, infoType);
    }

    return {
      json: jsonInfo,
      pdf: pdfInfo,
      combined: {
        ...jsonInfo,
        ...pdfInfo
      }
    };
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    this.jsonPrimer.contextCache?.clear();
    this.pdfPrimer.clearCache();
    console.log('🗑️ All caches cleared');
  }
}

module.exports = MultiFormatPrimingSystem;
