#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const JSONPrimingSystem = require('./json-priming-system');
const { AIModelInterface, LinguisticKnowledgeBase } = require('./linguistic-ai-system');

/**
 * Enhanced AI Integration with JSON Priming
 * 
 * Combines the linguistic AI system with intelligent JSON priming
 * for better context-aware analysis and generation.
 */

class EnhancedAISystem {
  constructor() {
    this.primingSystem = new JSONPrimingSystem();
    this.aiSystem = new AIModelInterface();
    this.isInitialized = false;
  }

  /**
   * Initialize the enhanced AI system with priming
   */
  async initialize(options = {}) {
    console.log('🚀 Initializing Enhanced AI System with JSON Priming...');
    
    // Load JSON primers
    await this.primingSystem.loadPrimers(options.dataDir || './data');
    
    // Initialize base AI system
    const dictionaryPath = path.join(options.dataDir || './data', 'dictionaries/current/UnifiedLibranDictionaryv1.7.0.json');
    await this.aiSystem.initialize(dictionaryPath);
    
    this.isInitialized = true;
    console.log('✅ Enhanced AI System initialized with priming support');
    
    // Display context statistics
    const stats = this.primingSystem.getContextStats();
    console.log('\n📊 Context Statistics:');
    console.log(`  Total Categories: ${stats.totalCategories}`);
    console.log(`  Total Files: ${stats.totalFiles}`);
    console.log(`  Total Size: ${stats.formattedTotalSize}`);
  }

  /**
   * Analyze word with context-aware priming
   */
  async analyzeWordWithContext(word, taskType = 'comprehensive', options = {}) {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call initialize() first.');
    }

    console.log(`🔍 Analyzing "${word}" with ${taskType} context...`);

    // Generate context for the specific task
    const context = this.primingSystem.generateContext(taskType, {
      category: options.category,
      focus: options.focus
    });

    // Generate priming prompt
    const primingPrompt = this.primingSystem.generatePrimingPrompt(
      context.context,
      `Analyze the Librán word "${word}" for ${taskType}`
    );

    // Combine with word analysis
    const analysisPrompt = `${primingPrompt}

## Word to Analyze: "${word}"

Please provide a comprehensive analysis including:
- Morphological breakdown
- Etymology and root analysis
- Cultural context and usage
- Phonetic patterns
- Quality assessment
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
  "confidence": 0-100
}`;

    try {
      const response = await this.aiSystem.generateResponse(analysisPrompt);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate new word with context-aware priming
   */
  async generateWordWithContext(englishWord, category = 'general', options = {}) {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call initialize() first.');
    }

    console.log(`✨ Generating Librán word for "${englishWord}" in ${category} category...`);

    // Generate context for word generation
    const context = this.primingSystem.generateContext('word_generation', {
      category: category,
      focus: options.focus
    });

    // Generate priming prompt
    const primingPrompt = this.primingSystem.generatePrimingPrompt(
      context.context,
      `Generate a new Librán word for "${englishWord}" in the ${category} category`
    );

    // Combine with word generation
    const generationPrompt = `${primingPrompt}

## Word to Generate: "${englishWord}"
## Category: ${category}
## Additional Context: ${options.context || 'None'}

Please generate a Librán word following these guidelines:
- Follow established morphological patterns from the context
- Ensure cultural authenticity and consistency
- Consider phonetic harmony with existing words
- Maintain etymological coherence
- Provide multiple options if appropriate

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
  "reasoning": "..."
}`;

    try {
      const response = await this.aiSystem.generateResponse(generationPrompt);
      return this.parseGenerationResponse(response);
    } catch (error) {
      console.error('❌ Generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Translate text with context-aware priming
   */
  async translateWithContext(text, direction = 'en-to-libran', options = {}) {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call initialize() first.');
    }

    console.log(`🔄 Translating "${text}" (${direction}) with context...`);

    // Generate context for translation
    const context = this.primingSystem.generateContext('translation', {
      direction: direction,
      focus: options.focus
    });

    // Generate priming prompt
    const primingPrompt = this.primingSystem.generatePrimingPrompt(
      context.context,
      `Translate "${text}" from ${direction}`
    );

    // Combine with translation
    const translationPrompt = `${primingPrompt}

## Text to Translate: "${text}"
## Direction: ${direction}

Please provide an accurate translation using the context provided:
- Use appropriate vocabulary from the context
- Maintain cultural nuances and context
- Ensure grammatical correctness
- Consider idiomatic expressions
- Provide confidence level

Format the response as JSON with the following structure:
{
  "original_text": "${text}",
  "translated_text": "...",
  "direction": "${direction}",
  "confidence": 0-100,
  "cultural_notes": [...],
  "alternative_translations": [...],
  "grammar_notes": "..."
}`;

    try {
      const response = await this.aiSystem.generateResponse(translationPrompt);
      return this.parseTranslationResponse(response);
    } catch (error) {
      console.error('❌ Translation failed:', error.message);
      throw error;
    }
  }

  /**
   * Perform QA analysis with context-aware priming
   */
  async performQAAnalysis(dictionary, options = {}) {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call initialize() first.');
    }

    console.log('🔍 Performing QA analysis with context...');

    // Generate context for QA analysis
    const context = this.primingSystem.generateContext('qa_analysis', {
      focus: options.focus
    });

    // Generate priming prompt
    const primingPrompt = this.primingSystem.generatePrimingPrompt(
      context.context,
      'Perform quality assurance analysis on the dictionary'
    );

    // Combine with QA analysis
    const qaPrompt = `${primingPrompt}

## Dictionary to Analyze:
${JSON.stringify(dictionary, null, 2)}

Please perform a comprehensive QA analysis:
- Check for consistency with established patterns
- Identify potential issues or conflicts
- Validate morphological rules
- Check cultural authenticity
- Assess overall quality

Format the response as JSON with the following structure:
{
  "overall_quality_score": 0-100,
  "issues_found": [...],
  "recommendations": [...],
  "consistency_check": {...},
  "cultural_authenticity": {...},
  "morphological_validation": {...},
  "summary": "..."
}`;

    try {
      const response = await this.aiSystem.generateResponse(qaPrompt);
      return this.parseQAResponse(response);
    } catch (error) {
      console.error('❌ QA analysis failed:', error.message);
      throw error;
    }
  }

  /**
   * Get context for specific task type
   */
  getContextForTask(taskType, options = {}) {
    return this.primingSystem.generateContext(taskType, options);
  }

  /**
   * Get context statistics
   */
  getContextStats() {
    return this.primingSystem.getContextStats();
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
}

module.exports = EnhancedAISystem;
