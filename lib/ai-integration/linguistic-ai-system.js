#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Librán Linguistic AI Integration System
 * 
 * Integrates open source language models to:
 * - Analyze and improve word formations
 * - Generate etymologically sound entries
 * - Learn from existing patterns and rules
 * - Provide intelligent suggestions for corrections
 * - Automate quality improvements over time
 */

// ============================================================================
// 1. AI MODEL CONFIGURATION
// ============================================================================

const AI_CONFIG = {
  // Supported models (choose based on your preferences)
  models: {
    // Local models (recommended for privacy/performance)
    llama: {
      name: 'llama-2-7b-chat',
      type: 'local',
      provider: 'ollama', // or 'llama.cpp'
      endpoint: 'http://localhost:11434',
      context_window: 4096,
      cost: 'free'
    },
    mistral: {
      name: 'mistral-7b-instruct',
      type: 'local',
      provider: 'ollama',
      endpoint: 'http://localhost:11434',
      context_window: 8192,
      cost: 'free'
    },
    codellama: {
      name: 'codellama-7b-instruct',
      type: 'local',
      provider: 'ollama',
      endpoint: 'http://localhost:11434',
      context_window: 4096,
      cost: 'free'
    },
    
    // Cloud models (for higher performance)
    openai: {
      name: 'gpt-3.5-turbo',
      type: 'cloud',
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1',
      context_window: 4096,
      cost: 'paid'
    },
    anthropic: {
      name: 'claude-3-haiku',
      type: 'cloud',
      provider: 'anthropic',
      endpoint: 'https://api.anthropic.com/v1',
      context_window: 200000,
      cost: 'paid'
    }
  },
  
  // Default model selection
  default_model: 'llama', // Change to 'mistral' or 'openai' as needed
  
  // Training data configuration
  training_data: {
    max_examples: 1000,
    include_etymology: true,
    include_phonetics: true,
    include_cultural_context: true
  }
};

// ============================================================================
// 2. LINGUISTIC KNOWLEDGE BASE
// ============================================================================

class LinguisticKnowledgeBase {
  constructor() {
    this.rules = new Map();
    this.patterns = new Map();
    this.etymology = new Map();
    this.cultural_context = new Map();
    this.examples = [];
  }

  /**
   * Load linguistic rules from structured data
   */
  loadRules(rulesData) {
    console.log('📚 Loading linguistic rules...');
    
    // Core morphological rules
    this.rules.set('ancient_suffixes', {
      '-or': 'mythic/abstract concepts (Animor, Memoror)',
      '-us': 'masculine nouns (Equus, Gladius)',
      '-a': 'feminine nouns (Luna, Terra)',
      '-um': 'neuter nouns (Aurum, Ferrum)',
      '-tor': 'agent nouns (Ductor, Bellator)'
    });

    this.rules.set('modern_suffixes', {
      'ë': 'Hungarian influence, soft ending',
      'é': 'Hungarian influence, long vowel',
      'ö': 'Hungarian influence, rounded vowel',
      'ü': 'Hungarian influence, rounded vowel',
      'ă': 'Romanian influence, schwa',
      'î': 'Romanian influence, central vowel'
    });

    this.rules.set('phonetic_shifts', {
      'Latin C': 'K sound (Cor → Kor)',
      'Latin V': 'W sound (Virtus → Wirtus)',
      'Latin QU': 'KW sound (Aqua → Akwa)',
      'Latin X': 'KS sound (Lux → Luks)'
    });

    this.rules.set('donor_languages', {
      'Latin': 'Ancient forms, classical concepts',
      'Hungarian': 'Modern forms, everyday vocabulary',
      'Romanian': 'Emotional/soft concepts',
      'Icelandic': 'Mythic/ritual vocabulary',
      'English': 'Only when no suitable alternative exists'
    });

    console.log(`   Loaded ${this.rules.size} rule categories`);
  }

  /**
   * Load pattern examples from existing dictionary
   */
  loadPatterns(dictionary) {
    console.log('🔍 Analyzing linguistic patterns...');
    
    const entries = dictionary.sections.Unified.data;
    const patterns = {
      ancient_forms: new Map(),
      modern_forms: new Map(),
      etymology_patterns: new Map(),
      semantic_groups: new Map()
    };

    entries.forEach(entry => {
      if (!entry.ancient || !entry.modern || !entry.notes) return;

      // Analyze Ancient form patterns
      const ancient_suffix = this.extractSuffix(entry.ancient);
      if (!patterns.ancient_forms.has(ancient_suffix)) {
        patterns.ancient_forms.set(ancient_suffix, []);
      }
      patterns.ancient_forms.get(ancient_suffix).push(entry);

      // Analyze Modern form patterns
      const modern_suffix = this.extractSuffix(entry.modern);
      if (!patterns.modern_forms.has(modern_suffix)) {
        patterns.modern_forms.set(modern_suffix, []);
      }
      patterns.modern_forms.get(modern_suffix).push(entry);

      // Analyze etymology patterns
      const donor = this.extractDonorLanguage(entry.notes);
      if (!patterns.etymology_patterns.has(donor)) {
        patterns.etymology_patterns.set(donor, []);
      }
      patterns.etymology_patterns.get(donor).push(entry);

      // Semantic grouping
      const semantic_group = this.extractSemanticGroup(entry.english);
      if (!patterns.semantic_groups.has(semantic_group)) {
        patterns.semantic_groups.set(semantic_group, []);
      }
      patterns.semantic_groups.get(semantic_group).push(entry);
    });

    this.patterns = patterns;
    this.examples = entries.slice(0, AI_CONFIG.training_data.max_examples);
    
    console.log(`   Analyzed ${entries.length} entries`);
    console.log(`   Found ${patterns.ancient_forms.size} Ancient form patterns`);
    console.log(`   Found ${patterns.modern_forms.size} Modern form patterns`);
    console.log(`   Found ${patterns.etymology_patterns.size} etymology patterns`);
    console.log(`   Found ${patterns.semantic_groups.size} semantic groups`);
  }

  extractSuffix(word) {
    if (!word || word.length < 3) return '';
    return word.slice(-3);
  }

  extractDonorLanguage(notes) {
    if (!notes) return 'unknown';
    const lower = notes.toLowerCase();
    if (lower.includes('lat ')) return 'latin';
    if (lower.includes('hu ')) return 'hungarian';
    if (lower.includes('ro ')) return 'romanian';
    if (lower.includes('is ')) return 'icelandic';
    if (lower.includes('eng ')) return 'english';
    return 'unknown';
  }

  extractSemanticGroup(english) {
    if (!english || typeof english !== 'string') {
      return 'unknown';
    }
    const word = english.toLowerCase();
    
    // Core concepts
    if (['balance', 'destiny', 'memory', 'flame', 'shadow', 'stone'].includes(word)) {
      return 'core_concepts';
    }
    
    // Nature
    if (['tree', 'flower', 'bird', 'fish', 'mountain', 'river'].some(n => word.includes(n))) {
      return 'nature';
    }
    
    // Emotions
    if (['love', 'hate', 'fear', 'joy', 'sadness', 'anger'].some(e => word.includes(e))) {
      return 'emotions';
    }
    
    // Tools/weapons
    if (['sword', 'bow', 'shield', 'hammer', 'knife', 'axe'].some(t => word.includes(t))) {
      return 'tools_weapons';
    }
    
    // Body parts
    if (['hand', 'eye', 'heart', 'head', 'foot', 'arm'].some(b => word.includes(b))) {
      return 'body_parts';
    }
    
    // Kinship
    if (['father', 'mother', 'brother', 'sister', 'son', 'daughter'].some(k => word.includes(k))) {
      return 'kinship';
    }
    
    return 'other';
  }

  /**
   * Generate training prompt for AI model
   */
  generateTrainingPrompt() {
    const examples = this.examples.slice(0, 20); // Limit examples for context
    const rules = Array.from(this.rules.entries()).map(([key, value]) => 
      `${key}: ${JSON.stringify(value)}`
    ).join('\n');

    return `You are a linguistic AI assistant for the Librán language, a constructed language that combines:

DONOR LANGUAGES:
- Latin: Ancient forms, classical concepts (Cor, Virtus, Equus)
- Hungarian: Modern forms, everyday vocabulary (szív, ló, kard)
- Romanian: Emotional/soft concepts (dragoste, dor)
- Icelandic: Mythic/ritual vocabulary (ljós, myrkviðr)
- English: Only when no suitable alternative exists

LINGUISTIC RULES:
${rules}

EXAMPLES OF GOOD FORMATIONS:
${examples.map(e => `English: "${e.english}" → Ancient: "${e.ancient}", Modern: "${e.modern}" (${e.notes})`).join('\n')}

Your task is to:
1. Analyze word formations for linguistic accuracy
2. Suggest improvements based on established patterns
3. Generate new words following Librán rules
4. Provide etymological justifications
5. Maintain cultural authenticity

Always provide your reasoning and cite donor language sources.`;
  }
}

// ============================================================================
// 3. AI MODEL INTERFACE
// ============================================================================

class AIModelInterface {
  constructor(modelName = AI_CONFIG.default_model) {
    this.model = AI_CONFIG.models[modelName];
    this.knowledgeBase = new LinguisticKnowledgeBase();
    
    if (!this.model) {
      throw new Error(`Model ${modelName} not found in configuration`);
    }
    
    console.log(`🤖 Initialized AI model: ${this.model.name} (${this.model.type})`);
  }

  /**
   * Initialize the knowledge base with dictionary data
   */
  async initialize(dictionaryPath) {
    console.log('🧠 Initializing AI knowledge base...');
    
    // Load dictionary
    const dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
    
    // Load linguistic rules
    this.knowledgeBase.loadRules();
    
    // Load patterns from dictionary
    this.knowledgeBase.loadPatterns(dictionary);
    
    console.log('✅ AI knowledge base initialized');
  }

  /**
   * Analyze a word formation for linguistic quality
   */
  async analyzeWordFormation(entry) {
    const prompt = `${this.knowledgeBase.generateTrainingPrompt()}

ANALYZE THIS WORD FORMATION:
English: "${entry.english}"
Ancient: "${entry.ancient}"
Modern: "${entry.modern}"
Notes: "${entry.notes || 'None'}"

Please provide:
1. Quality score (1-10)
2. Issues found (if any)
3. Suggested improvements
4. Etymological assessment
5. Cultural appropriateness

Format your response as JSON.`;

    try {
      const response = await this.callModel(prompt);
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('AI analysis failed:', error.message);
      return {
        score: 5,
        issues: ['AI analysis unavailable'],
        suggestions: [],
        etymology: 'Unknown',
        cultural: 'Unknown'
      };
    }
  }

  /**
   * Generate improved word formation
   */
  async generateImprovedFormation(entry, issues) {
    const prompt = `${this.knowledgeBase.generateTrainingPrompt()}

IMPROVE THIS WORD FORMATION:
English: "${entry.english}"
Current Ancient: "${entry.ancient}"
Current Modern: "${entry.modern}"
Current Notes: "${entry.notes || 'None'}"

Issues to address: ${issues.join(', ')}

Please generate an improved formation that:
1. Follows Librán linguistic rules
2. Uses appropriate donor languages
3. Maintains cultural authenticity
4. Provides proper etymological justification

Format your response as JSON with fields: ancient, modern, notes, reasoning.`;

    try {
      const response = await this.callModel(prompt);
      return this.parseGenerationResponse(response);
    } catch (error) {
      console.error('AI generation failed:', error.message);
      return null;
    }
  }

  /**
   * Generate new word from English concept
   */
  async generateNewWord(english, semantic_group = 'other') {
    const prompt = `${this.knowledgeBase.generateTrainingPrompt()}

GENERATE NEW WORD:
English concept: "${english}"
Semantic group: "${semantic_group}"

Please create a Librán word formation that:
1. Uses appropriate donor languages for the concept
2. Follows established morphological patterns
3. Fits the semantic group naturally
4. Provides complete etymological documentation

Format your response as JSON with fields: ancient, modern, notes, reasoning.`;

    try {
      const response = await this.callModel(prompt);
      return this.parseGenerationResponse(response);
    } catch (error) {
      console.error('AI generation failed:', error.message);
      return null;
    }
  }

  /**
   * Call the AI model (abstracted for different providers)
   */
  async callModel(prompt) {
    switch (this.model.provider) {
      case 'ollama':
        return await this.callOllama(prompt);
      case 'openai':
        return await this.callOpenAI(prompt);
      case 'anthropic':
        return await this.callAnthropic(prompt);
      default:
        throw new Error(`Unsupported provider: ${this.model.provider}`);
    }
  }

  /**
   * Call Ollama (local model)
   */
  async callOllama(prompt) {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(`${this.model.endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model.name,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3, // Lower temperature for more consistent linguistic analysis
          top_p: 0.9,
          max_tokens: 1000
        }
      })
    });

    const data = await response.json();
    return data.response;
  }

  /**
   * Call OpenAI API
   */
  async callOpenAI(prompt) {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(`${this.model.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: this.model.name,
        messages: [
          {
            role: 'system',
            content: 'You are a linguistic AI assistant specializing in constructed languages. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Call Anthropic API
   */
  async callAnthropic(prompt) {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(`${this.model.endpoint}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model.name,
        max_tokens: 1000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    return data.content[0].text;
  }

  /**
   * Parse AI analysis response
   */
  parseAnalysisResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing for non-JSON responses
      return {
        score: this.extractScore(response),
        issues: this.extractIssues(response),
        suggestions: this.extractSuggestions(response),
        etymology: this.extractEtymology(response),
        cultural: this.extractCultural(response)
      };
    } catch (error) {
      console.warn('Failed to parse AI response:', error.message);
      return {
        score: 5,
        issues: ['Response parsing failed'],
        suggestions: [],
        etymology: 'Unknown',
        cultural: 'Unknown'
      };
    }
  }

  /**
   * Parse AI generation response
   */
  parseGenerationResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing
      return {
        ancient: this.extractAncient(response),
        modern: this.extractModern(response),
        notes: this.extractNotes(response),
        reasoning: this.extractReasoning(response)
      };
    } catch (error) {
      console.warn('Failed to parse AI generation response:', error.message);
      return null;
    }
  }

  // Helper methods for parsing non-JSON responses
  extractScore(text) {
    const scoreMatch = text.match(/score[:\s]*(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 5;
  }

  extractIssues(text) {
    const issues = [];
    const issueMatches = text.match(/issues?[:\s]*([^\n]+)/gi);
    if (issueMatches) {
      issueMatches.forEach(match => {
        const issue = match.replace(/issues?[:\s]*/gi, '').trim();
        if (issue) issues.push(issue);
      });
    }
    return issues;
  }

  extractSuggestions(text) {
    const suggestions = [];
    const suggestionMatches = text.match(/suggestions?[:\s]*([^\n]+)/gi);
    if (suggestionMatches) {
      suggestionMatches.forEach(match => {
        const suggestion = match.replace(/suggestions?[:\s]*/gi, '').trim();
        if (suggestion) suggestions.push(suggestion);
      });
    }
    return suggestions;
  }

  extractEtymology(text) {
    const etymMatch = text.match(/etymology[:\s]*([^\n]+)/i);
    return etymMatch ? etymMatch[1].trim() : 'Unknown';
  }

  extractCultural(text) {
    const cultMatch = text.match(/cultural[:\s]*([^\n]+)/i);
    return cultMatch ? cultMatch[1].trim() : 'Unknown';
  }

  extractAncient(text) {
    const ancientMatch = text.match(/ancient[:\s]*"([^"]+)"/i);
    return ancientMatch ? ancientMatch[1] : '';
  }

  extractModern(text) {
    const modernMatch = text.match(/modern[:\s]*"([^"]+)"/i);
    return modernMatch ? modernMatch[1] : '';
  }

  extractNotes(text) {
    const notesMatch = text.match(/notes[:\s]*"([^"]+)"/i);
    return notesMatch ? notesMatch[1] : '';
  }

  extractReasoning(text) {
    const reasonMatch = text.match(/reasoning[:\s]*([^\n]+)/i);
    return reasonMatch ? reasonMatch[1].trim() : '';
  }
}

// ============================================================================
// 4. AI-ENHANCED QA PIPELINE
// ============================================================================

class AIEnhancedQAPipeline {
  constructor(modelName = AI_CONFIG.default_model) {
    this.ai = new AIModelInterface(modelName);
    this.results = {
      ai_analyzed: 0,
      ai_improved: 0,
      ai_generated: 0,
      quality_improvements: []
    };
  }

  /**
   * Run AI-enhanced QA on dictionary entries
   */
  async runAIQA(entries, options = {}) {
    console.log('🤖 Running AI-enhanced QA...');
    
    const {
      analyze_threshold = 5, // Only analyze entries with quality score below this
      improve_threshold = 3, // Only improve entries with score below this
      max_entries = 100,     // Limit for API costs
      batch_size = 10        // Process in batches
    } = options;

    const results = {
      analyzed: [],
      improved: [],
      generated: [],
      errors: []
    };

    // Process entries in batches
    const batches = this.createBatches(entries, batch_size);
    
    for (let i = 0; i < Math.min(batches.length, max_entries / batch_size); i++) {
      const batch = batches[i];
      console.log(`   Processing batch ${i + 1}/${batches.length} (${batch.length} entries)`);
      
      for (const entry of batch) {
        try {
          // Analyze entry quality
          const analysis = await this.ai.analyzeWordFormation(entry);
          results.analyzed.push({ entry, analysis });
          this.results.ai_analyzed++;

          // Improve low-quality entries
          if (analysis.score < improve_threshold && analysis.issues.length > 0) {
            const improvement = await this.ai.generateImprovedFormation(entry, analysis.issues);
            if (improvement) {
              results.improved.push({ 
                original: entry, 
                improved: improvement,
                analysis 
              });
              this.results.ai_improved++;
            }
          }
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          results.errors.push({ entry, error: error.message });
          console.warn(`   Error processing ${entry.english}: ${error.message}`);
        }
      }
    }

    console.log(`   AI analysis complete:`);
    console.log(`     Analyzed: ${results.analyzed.length} entries`);
    console.log(`     Improved: ${results.improved.length} entries`);
    console.log(`     Errors: ${results.errors.length} entries`);

    return results;
  }

  /**
   * Generate new words using AI
   */
  async generateNewWords(concepts, semantic_groups = {}) {
    console.log('🎨 Generating new words with AI...');
    
    const results = [];
    
    for (const concept of concepts) {
      try {
        const semantic_group = semantic_groups[concept] || 'other';
        const generated = await this.ai.generateNewWord(concept, semantic_group);
        
        if (generated) {
          results.push({
            english: concept,
            semantic_group,
            generated,
            timestamp: new Date().toISOString()
          });
          this.results.ai_generated++;
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.warn(`   Error generating word for ${concept}: ${error.message}`);
      }
    }

    console.log(`   Generated ${results.length} new words`);
    return results;
  }

  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Save AI results to file
   */
  saveResults(outputPath) {
    const report = {
      timestamp: new Date().toISOString(),
      model_used: this.ai.model.name,
      results: this.results,
      summary: {
        total_analyzed: this.results.ai_analyzed,
        total_improved: this.results.ai_improved,
        total_generated: this.results.ai_generated
      }
    };

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`💾 AI results saved to: ${outputPath}`);
  }
}

// ============================================================================
// 5. EXPORTS
// ============================================================================

module.exports = {
  AIModelInterface,
  LinguisticKnowledgeBase,
  AIEnhancedQAPipeline,
  AI_CONFIG
};
