#!/usr/bin/env node

const path = require('path');
const MultiFormatPrimingSystem = require('./multi-format-priming-system');
const { AIModelInterface, LinguisticKnowledgeBase } = require('./linguistic-ai-system');

/**
 * Enhanced AI System with Multi-Format Priming
 * 
 * Combines JSON and PDF priming for comprehensive context-aware
 * analysis and generation using both structured data and reference materials.
 */

class EnhancedAIMultiFormat {
  constructor() {
    this.primingSystem = new MultiFormatPrimingSystem();
    this.aiSystem = new AIModelInterface();
    this.isInitialized = false;
  }

  /**
   * Initialize the enhanced AI system with multi-format priming
   */
  async initialize(options = {}) {
    console.log('🚀 Initializing Enhanced AI with Multi-Format Priming...');
    
    // Initialize multi-format priming system
    await this.primingSystem.initialize(options);
    
    // Initialize base AI system
    const dictionaryPath = path.join(options.dataDir || './data', 'dictionaries/current/UnifiedLibranDictionaryv1.7.0.json');
    await this.aiSystem.initialize(dictionaryPath);
    
    this.isInitialized = true;
    console.log('✅ Enhanced AI with Multi-Format Priming initialized');
    
    // Display comprehensive statistics
    const stats = this.primingSystem.getComprehensiveStats();
    console.log('\n📊 Multi-Format Context Statistics:');
    console.log(`  JSON Files: ${stats.json.totalFiles}`);
    console.log(`  PDF Files: ${stats.pdf.totalFiles}`);
    console.log(`  Total Size: ${this.formatSize(stats.combined.totalSize)}`);
    console.log(`  PDF Support: ${stats.combined.hasPDF ? '✅ Available' : '❌ Not Available'}`);
  }

  /**
   * Install PDF dependencies
   */
  async installPDFDependencies() {
    return await this.primingSystem.installPDFDependencies();
  }

  /**
   * Analyze word with comprehensive multi-format context
   */
  async analyzeWordWithContext(word, taskType = 'comprehensive', options = {}) {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call initialize() first.');
    }

    console.log(`🔍 Analyzing "${word}" with ${taskType} context (JSON + PDF)...`);

    // Generate comprehensive context
    const context = this.primingSystem.generateContextForTask(taskType, {
      category: options.category,
      focus: options.focus
    });

    // Generate multi-format priming prompt
    const primingPrompt = this.primingSystem.generateMultiFormatPrimingPrompt(
      context,
      `Analyze the Librán word "${word}" for ${taskType}`
    );

    // Combine with word analysis
    const analysisPrompt = `${primingPrompt}

## Word to Analyze: "${word}"

Please provide a comprehensive analysis including:
- Morphological breakdown using dictionary patterns
- Etymology and root analysis from reference materials
- Cultural context and usage from PDF sources
- Phonetic patterns from structured data
- Quality assessment against established patterns
- Suggestions for improvement (if any)

Format the response as JSON with the following structure:
{
  "word": "${word}",
  "morphology": {...},
  "etymology": {...},
  "cultural_context": {...},
  "phonetics": {...},
  "quality_score": 0-100,
  "suggestions": [...],
  "confidence": 0-100,
  "sources_used": {
    "json": true,
    "pdf": ${context.pdf ? 'true' : 'false'}
  }
}`;

    try {
      const response = await this.aiSystem.callModel(analysisPrompt);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate new word with comprehensive context
   */
  async generateWordWithContext(englishWord, category = 'general', options = {}) {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call initialize() first.');
    }

    console.log(`✨ Generating Librán word for "${englishWord}" in ${category} category (JSON + PDF)...`);

    // Generate comprehensive context
    const context = this.primingSystem.generateContextForTask('word_generation', {
      category: category,
      focus: options.focus
    });

    // Generate multi-format priming prompt
    const primingPrompt = this.primingSystem.generateMultiFormatPrimingPrompt(
      context,
      `Generate a new Librán word for "${englishWord}" in the ${category} category`
    );

    // Combine with word generation
    const generationPrompt = `${primingPrompt}

## Word to Generate: "${englishWord}"
## Category: ${category}
## Additional Context: ${options.context || 'None'}

Please generate a Librán word following these guidelines:
- Follow established morphological patterns from dictionary data
- Ensure cultural authenticity using PDF reference materials
- Consider phonetic harmony with existing words
- Maintain etymological coherence across all sources
- Provide multiple options if appropriate
- Reference specific patterns from the context

Format the response as JSON with the following structure:
{
  "english_word": "${englishWord}",
  "libran_word": "...",
  "alternatives": [...],
  "morphology": {...},
  "etymology": {...},
  "cultural_context": {...},
  "phonetics": {...},
  "confidence": 0-100,
  "reasoning": "...",
  "sources_used": {
    "json": true,
    "pdf": ${context.pdf ? 'true' : 'false'}
  }
}`;

    try {
      const response = await this.aiSystem.callModel(generationPrompt);
      return this.parseGenerationResponse(response);
    } catch (error) {
      console.error('❌ Generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Translate text with comprehensive context
   */
  async translateWithContext(text, direction = 'en-to-libran', options = {}) {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call initialize() first.');
    }

    console.log(`🔄 Translating "${text}" (${direction}) with comprehensive context...`);

    // Generate comprehensive context
    const context = this.primingSystem.generateContextForTask('translation', {
      direction: direction,
      focus: options.focus
    });

    // Generate multi-format priming prompt
    const primingPrompt = this.primingSystem.generateMultiFormatPrimingPrompt(
      context,
      `Translate "${text}" from ${direction}`
    );

    // Combine with translation
    const translationPrompt = `${primingPrompt}

## Text to Translate: "${text}"
## Direction: ${direction}

Please provide an accurate translation using the comprehensive context provided:
- Use appropriate vocabulary from dictionary data
- Apply cultural nuances from PDF reference materials
- Ensure grammatical correctness using established patterns
- Consider idiomatic expressions from both sources
- Provide confidence level based on context availability

Format the response as JSON with the following structure:
{
  "original_text": "${text}",
  "translated_text": "...",
  "direction": "${direction}",
  "confidence": 0-100,
  "cultural_notes": [...],
  "alternative_translations": [...],
  "grammar_notes": "...",
  "sources_used": {
    "json": true,
    "pdf": ${context.pdf ? 'true' : 'false'}
  }
}`;

    try {
      const response = await this.aiSystem.callModel(translationPrompt);
      return this.parseTranslationResponse(response);
    } catch (error) {
      console.error('❌ Translation failed:', error.message);
      throw error;
    }
  }

  /**
   * Perform comprehensive QA analysis
   */
  async performComprehensiveQAAnalysis(dictionary, options = {}) {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call initialize() first.');
    }

    console.log('🔍 Performing comprehensive QA analysis with multi-format context...');

    // Generate comprehensive context
    const context = this.primingSystem.generateContextForTask('qa_analysis', {
      focus: options.focus
    });

    // Generate multi-format priming prompt
    const primingPrompt = this.primingSystem.generateMultiFormatPrimingPrompt(
      context,
      'Perform comprehensive quality assurance analysis on the dictionary'
    );

    // Combine with QA analysis
    const qaPrompt = `${primingPrompt}

## Dictionary to Analyze:
${JSON.stringify(dictionary, null, 2)}

Please perform a comprehensive QA analysis using both structured data and reference materials:
- Check for consistency with established patterns from dictionary data
- Validate cultural authenticity using PDF reference materials
- Identify potential issues or conflicts across all sources
- Validate morphological rules using comprehensive context
- Assess overall quality against reference standards
- Provide specific recommendations with source references

Format the response as JSON with the following structure:
{
  "overall_quality_score": 0-100,
  "issues_found": [...],
  "recommendations": [...],
  "consistency_check": {...},
  "cultural_authenticity": {...},
  "morphological_validation": {...},
  "summary": "...",
  "sources_used": {
    "json": true,
    "pdf": ${context.pdf ? 'true' : 'false'}
  }
}`;

    try {
      const response = await this.aiSystem.callModel(qaPrompt);
      return this.parseQAResponse(response);
    } catch (error) {
      console.error('❌ QA analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive context for specific task type
   */
  getContextForTask(taskType, options = {}) {
    return this.primingSystem.generateContextForTask(taskType, options);
  }

  /**
   * Get comprehensive statistics
   */
  getComprehensiveStats() {
    return this.primingSystem.getComprehensiveStats();
  }

  /**
   * Extract information from all sources
   */
  extractInformation(infoType = 'all') {
    return this.primingSystem.extractInformation(infoType);
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    this.primingSystem.clearAllCaches();
  }

  /**
   * Parse analysis response
   */
  parseAnalysisResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { raw_response: response };
    } catch (error) {
      return { raw_response: response, parse_error: error.message };
    }
  }

  /**
   * Parse generation response
   */
  parseGenerationResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { raw_response: response };
    } catch (error) {
      return { raw_response: response, parse_error: error.message };
    }
  }

  /**
   * Parse translation response
   */
  parseTranslationResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { raw_response: response };
    } catch (error) {
      return { raw_response: response, parse_error: error.message };
    }
  }

  /**
   * Parse QA response
   */
  parseQAResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { raw_response: response };
    } catch (error) {
      return { raw_response: response, parse_error: error.message };
    }
  }

  /**
   * Format file size for display
   */
  formatSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

module.exports = EnhancedAIMultiFormat;
