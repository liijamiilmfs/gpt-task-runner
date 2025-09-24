#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * JSON Priming System for Librán AI Integration
 * 
 * Provides intelligent JSON file loading and context injection for AI models.
 * Supports various priming strategies and context management.
 */

class JSONPrimingSystem {
  constructor() {
    this.primers = new Map();
    this.contextCache = new Map();
    this.maxContextSize = 8000; // tokens (adjust based on model)
    this.compressionRatio = 0.7; // how much to compress large contexts
  }

  /**
   * Load and categorize JSON files for priming
   */
  async loadPrimers(dataDir = './data') {
    console.log('🔍 Scanning for JSON primer files...');
    
    const primerCategories = {
      // Core dictionaries
      dictionaries: [
        'dictionaries/current/UnifiedLibranDictionaryv1.7.0.json',
        'dictionaries/current/UnifiedLibranDictionaryv1.6.3.json',
        'dictionaries/baseline/UnifiedLibranDictionaryv1.3Baseline.json'
      ],
      
      // Tranches by category
      tranches: {
        core: [
          'tranches/core/Libran_Core_Grammar_Pack_v1.5.1.json',
          'tranches/core/Libran_Core_Nature_Places_Tranche_v1.5.1.json'
        ],
        concepts: [
          'tranches/concepts/Libran_Abstract_Concepts_Qualities_Tranche_v1.5.1.json',
          'tranches/culture/Libran_MiniPack_EverydayAdditionsII_v1.5.1.json'
        ],
        living: [
          'tranches/living/Libran_Animals_Plants_Tranche_v1.5.1.json',
          'tranches/living/Libran_Creatures_Mythic_Beings_Tranche_v1.5.1.json',
          'tranches/living/Libran_Kinship_Body_Tranche_v1.5.1.json'
        ],
        society: [
          'tranches/society/Libran_Alesii_Politics_Tranche_v1.5.1.json',
          'tranches/society/libran_law_justice_v1.json',
          'tranches/society/libran_trade_commerce_v1.json'
        ],
        craft: [
          'tranches/craft/Libran_Materials_Crafting_Tranche_v1.5.1.json',
          'tranches/craft/libran_craftwork_corrected_v1_6_1.json',
          'tranches/craft/libran_agriculture_fixed_v1_6_1.json'
        ],
        culture: [
          'tranches/culture/libran_music_performance_v1.json',
          'tranches/culture/libran_healing_medicine_v1.json',
          'tranches/culture/libran_weapons_warfare_v1.json',
          'tranches/culture/libran_weather_natural_phenomena_v1.json'
        ]
      },
      
      // Specialized files
      specialized: [
        'reference/guides/phrasebook-v1.2.json',
        'training/exclusions/audit-exclusions.json',
        'reference/samples/sample_ancient.json',
        'reference/samples/sample_modern.json'
      ]
    };

    // Load all primers
    for (const [category, files] of Object.entries(primerCategories)) {
      if (category === 'tranches') {
        for (const [subcategory, fileList] of Object.entries(files)) {
          await this.loadPrimerCategory(`${category}.${subcategory}`, fileList, dataDir);
        }
      } else {
        await this.loadPrimerCategory(category, files, dataDir);
      }
    }

    console.log(`✅ Loaded ${this.primers.size} primer categories`);
    return this.primers;
  }

  /**
   * Load a category of primer files
   */
  async loadPrimerCategory(category, files, dataDir) {
    const categoryData = [];
    
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const tranchePath = path.join(dataDir, 'Tranches', file);
      
      let actualPath = null;
      if (fs.existsSync(filePath)) {
        actualPath = filePath;
      } else if (fs.existsSync(tranchePath)) {
        actualPath = tranchePath;
      }

      if (actualPath) {
        try {
          const data = JSON.parse(fs.readFileSync(actualPath, 'utf8'));
          categoryData.push({
            file: file,
            data: data,
            size: JSON.stringify(data).length
          });
          console.log(`  ✓ Loaded ${file} (${this.formatSize(JSON.stringify(data).length)})`);
        } catch (error) {
          console.warn(`  ⚠ Failed to load ${file}: ${error.message}`);
        }
      } else {
        console.warn(`  ⚠ File not found: ${file}`);
      }
    }

    if (categoryData.length > 0) {
      this.primers.set(category, categoryData);
    }
  }

  /**
   * Generate context for specific task types
   */
  generateContext(taskType, options = {}) {
    const strategies = {
      // For word generation
      'word_generation': () => this.getWordGenerationContext(options),
      
      // For translation
      'translation': () => this.getTranslationContext(options),
      
      // For etymology analysis
      'etymology': () => this.getEtymologyContext(options),
      
      // For quality assurance
      'qa_analysis': () => this.getQAAnalysisContext(options),
      
      // For pattern analysis
      'pattern_analysis': () => this.getPatternAnalysisContext(options),
      
      // For comprehensive analysis
      'comprehensive': () => this.getComprehensiveContext(options)
    };

    const strategy = strategies[taskType] || strategies['comprehensive'];
    return strategy();
  }

  /**
   * Context for word generation tasks
   */
  getWordGenerationContext(options) {
    const context = {
      dictionaries: this.getPrimerData('dictionaries', 1),
      core: this.getPrimerData('tranches.core', 2),
      concepts: this.getPrimerData('tranches.concepts', 1),
      examples: this.getPrimerData('specialized', 1)
    };

    // Add specific category if requested
    if (options.category) {
      context[options.category] = this.getPrimerData(`tranches.${options.category}`, 2);
    }

    return this.compressContext(context, 'word_generation');
  }

  /**
   * Context for translation tasks
   */
  getTranslationContext(options) {
    const context = {
      dictionaries: this.getPrimerData('dictionaries', 2),
      core: this.getPrimerData('tranches.core', 3),
      examples: this.getPrimerData('specialized', 2)
    };

    return this.compressContext(context, 'translation');
  }

  /**
   * Context for etymology analysis
   */
  getEtymologyContext(options) {
    const context = {
      dictionaries: this.getPrimerData('dictionaries', 1),
      core: this.getPrimerData('tranches.core', 2),
      concepts: this.getPrimerData('tranches.concepts', 1),
      living: this.getPrimerData('tranches.living', 1)
    };

    return this.compressContext(context, 'etymology');
  }

  /**
   * Context for QA analysis
   */
  getQAAnalysisContext(options) {
    const context = {
      dictionaries: this.getPrimerData('dictionaries', 1),
      exclusions: this.getPrimerData('specialized', 1).filter(p => p.file.includes('exclusions')),
      examples: this.getPrimerData('specialized', 1)
    };

    return this.compressContext(context, 'qa_analysis');
  }

  /**
   * Context for pattern analysis
   */
  getPatternAnalysisContext(options) {
    const context = {
      dictionaries: this.getPrimerData('dictionaries', 2),
      core: this.getPrimerData('tranches.core', 3),
      concepts: this.getPrimerData('tranches.concepts', 2),
      living: this.getPrimerData('tranches.living', 1),
      society: this.getPrimerData('tranches.society', 1)
    };

    return this.compressContext(context, 'pattern_analysis');
  }

  /**
   * Comprehensive context for complex tasks
   */
  getComprehensiveContext(options) {
    const context = {};
    
    // Load all categories with size limits
    for (const [category, data] of this.primers.entries()) {
      context[category] = this.getPrimerData(category, 1);
    }

    return this.compressContext(context, 'comprehensive');
  }

  /**
   * Get primer data with size limits
   */
  getPrimerData(category, maxFiles = 1) {
    const categoryData = this.primers.get(category) || [];
    return categoryData.slice(0, maxFiles);
  }

  /**
   * Compress context to fit within token limits
   */
  compressContext(context, taskType) {
    const compressed = {};
    let totalSize = 0;

    for (const [category, data] of Object.entries(context)) {
      if (Array.isArray(data) && data.length > 0) {
        const compressedData = this.compressPrimerData(data, taskType);
        const size = JSON.stringify(compressedData).length;
        
        if (totalSize + size < this.maxContextSize) {
          compressed[category] = compressedData;
          totalSize += size;
        } else {
          // Partial compression for remaining space
          const remainingSpace = this.maxContextSize - totalSize;
          if (remainingSpace > 1000) { // Only if we have meaningful space
            compressed[category] = this.compressPrimerData(data, taskType, remainingSpace);
          }
          break;
        }
      }
    }

    return {
      context: compressed,
      metadata: {
        taskType,
        totalSize,
        categories: Object.keys(compressed),
        compressionRatio: this.compressionRatio
      }
    };
  }

  /**
   * Compress individual primer data
   */
  compressPrimerData(data, taskType, maxSize = null) {
    const compressed = [];
    let currentSize = 0;
    const limit = maxSize || (this.maxContextSize * this.compressionRatio);

    for (const primer of data) {
      const compressedPrimer = this.compressPrimer(primer, taskType);
      const primerSize = JSON.stringify(compressedPrimer).length;

      if (currentSize + primerSize < limit) {
        compressed.push(compressedPrimer);
        currentSize += primerSize;
      } else {
        break;
      }
    }

    return compressed;
  }

  /**
   * Compress individual primer based on task type
   */
  compressPrimer(primer, taskType) {
    const { file, data } = primer;
    
    // Different compression strategies based on task type
    switch (taskType) {
      case 'word_generation':
        return this.compressForWordGeneration(file, data);
      case 'translation':
        return this.compressForTranslation(file, data);
      case 'etymology':
        return this.compressForEtymology(file, data);
      case 'qa_analysis':
        return this.compressForQA(file, data);
      case 'pattern_analysis':
        return this.compressForPatternAnalysis(file, data);
      default:
        return this.compressGeneric(file, data);
    }
  }

  /**
   * Compression strategies for different task types
   */
  compressForWordGeneration(file, data) {
    // Focus on word patterns, morphology, and examples
    return {
      file,
      type: 'word_generation',
      entries: this.extractKeyEntries(data, ['word', 'translation', 'morphology', 'examples']),
      patterns: this.extractPatterns(data),
      metadata: this.extractMetadata(data)
    };
  }

  compressForTranslation(file, data) {
    // Focus on translation pairs and context
    return {
      file,
      type: 'translation',
      entries: this.extractKeyEntries(data, ['word', 'translation', 'context', 'usage']),
      metadata: this.extractMetadata(data)
    };
  }

  compressForEtymology(file, data) {
    // Focus on etymology and word origins
    return {
      file,
      type: 'etymology',
      entries: this.extractKeyEntries(data, ['word', 'etymology', 'root', 'origin']),
      etymological_patterns: this.extractEtymologicalPatterns(data),
      metadata: this.extractMetadata(data)
    };
  }

  compressForQA(file, data) {
    // Focus on quality indicators and exclusions
    return {
      file,
      type: 'qa',
      entries: this.extractKeyEntries(data, ['word', 'quality_flags', 'exclusions', 'issues']),
      exclusions: this.extractExclusions(data),
      metadata: this.extractMetadata(data)
    };
  }

  compressForPatternAnalysis(file, data) {
    // Focus on linguistic patterns and structures
    return {
      file,
      type: 'pattern_analysis',
      entries: this.extractKeyEntries(data, ['word', 'morphology', 'grammar', 'structure']),
      patterns: this.extractPatterns(data),
      grammar_rules: this.extractGrammarRules(data),
      metadata: this.extractMetadata(data)
    };
  }

  compressGeneric(file, data) {
    // Generic compression for unknown task types
    return {
      file,
      type: 'generic',
      entries: this.extractKeyEntries(data, ['word', 'translation']),
      metadata: this.extractMetadata(data)
    };
  }

  /**
   * Extract key entries based on field importance
   */
  extractKeyEntries(data, importantFields) {
    if (!data.sections || !data.sections.Unified || !data.sections.Unified.data) {
      return [];
    }

    const entries = data.sections.Unified.data;
    const extracted = [];

    for (const entry of entries.slice(0, 50)) { // Limit to 50 entries
      const keyEntry = {};
      for (const field of importantFields) {
        if (entry[field]) {
          keyEntry[field] = entry[field];
        }
      }
      if (Object.keys(keyEntry).length > 0) {
        extracted.push(keyEntry);
      }
    }

    return extracted;
  }

  /**
   * Extract linguistic patterns
   */
  extractPatterns(data) {
    // Extract common morphological patterns
    const patterns = {
      prefixes: new Set(),
      suffixes: new Set(),
      roots: new Set()
    };

    if (data.sections && data.sections.Unified && data.sections.Unified.data) {
      const entries = data.sections.Unified.data;
      for (const entry of entries.slice(0, 100)) {
        if (entry.word) {
          // Simple pattern extraction (can be enhanced)
          const word = entry.word;
          if (word.length > 3) {
            patterns.prefixes.add(word.substring(0, 2));
            patterns.suffixes.add(word.substring(word.length - 2));
            patterns.roots.add(word.substring(1, word.length - 1));
          }
        }
      }
    }

    return {
      prefixes: Array.from(patterns.prefixes).slice(0, 10),
      suffixes: Array.from(patterns.suffixes).slice(0, 10),
      roots: Array.from(patterns.roots).slice(0, 20)
    };
  }

  /**
   * Extract etymological patterns
   */
  extractEtymologicalPatterns(data) {
    const patterns = [];
    
    if (data.sections && data.sections.Unified && data.sections.Unified.data) {
      const entries = data.sections.Unified.data;
      for (const entry of entries.slice(0, 30)) {
        if (entry.etymology || entry.root || entry.origin) {
          patterns.push({
            word: entry.word,
            etymology: entry.etymology,
            root: entry.root,
            origin: entry.origin
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Extract exclusions and quality flags
   */
  extractExclusions(data) {
    const exclusions = [];
    
    if (data.exclusions) {
      exclusions.push(...data.exclusions.slice(0, 20));
    }

    return exclusions;
  }

  /**
   * Extract grammar rules
   */
  extractGrammarRules(data) {
    const rules = [];
    
    if (data.grammar_rules) {
      rules.push(...data.grammar_rules.slice(0, 10));
    }

    return rules;
  }

  /**
   * Extract metadata
   */
  extractMetadata(data) {
    return {
      version: data.version || 'unknown',
      total_entries: data.sections?.Unified?.data?.length || 0,
      categories: Object.keys(data.sections || {}),
      last_updated: data.last_updated || 'unknown'
    };
  }

  /**
   * Generate priming prompt for AI model
   */
  generatePrimingPrompt(context, taskDescription) {
    const prompt = `# Librán Dictionary Context for AI Analysis

## Task: ${taskDescription}

## Available Context:
${JSON.stringify(context, null, 2)}

## Instructions:
Use the provided context to understand Librán linguistic patterns, morphology, and cultural context. 
Apply this knowledge to complete the requested task while maintaining consistency with existing patterns.

## Key Guidelines:
- Follow established morphological rules
- Maintain cultural authenticity
- Ensure etymological consistency
- Consider phonetic patterns
- Respect existing word structures

Please proceed with the analysis based on this context.`;

    return prompt;
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

  /**
   * Get context statistics
   */
  getContextStats() {
    const stats = {
      totalCategories: this.primers.size,
      totalFiles: 0,
      totalSize: 0,
      categories: {}
    };

    for (const [category, data] of this.primers.entries()) {
      const categorySize = data.reduce((sum, primer) => sum + primer.size, 0);
      stats.categories[category] = {
        files: data.length,
        size: categorySize,
        formattedSize: this.formatSize(categorySize)
      };
      stats.totalFiles += data.length;
      stats.totalSize += categorySize;
    }

    stats.formattedTotalSize = this.formatSize(stats.totalSize);
    return stats;
  }
}

module.exports = JSONPrimingSystem;
