#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { AIModelInterface, AIEnhancedQAPipeline, AI_CONFIG } = require('./lib/ai-integration/linguistic-ai-system');

/**
 * AI-Enhanced QA Pipeline for Librán Dictionary
 * 
 * This script integrates open source language models to:
 * - Analyze and improve existing word formations
 * - Generate new words following linguistic rules
 * - Learn from patterns and provide intelligent suggestions
 * - Automate quality improvements over time
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Model selection (change this to switch models)
  model: 'llama', // Options: 'llama', 'mistral', 'codellama', 'openai', 'anthropic'
  
  // Input/Output files
  input_dictionary: './data/UnifiedLibranDictionaryv1.7.0.json',
  output_dictionary: './UnifiedLibranDictionaryv1.7.1-ai-enhanced.json',
  ai_results_file: './ai_qa_results_v1.7.1.json',
  proposed_words_folder: './data/proposed',
  
  // Processing options
  processing: {
    max_entries_to_analyze: 50,    // Limit for API costs/performance
    batch_size: 5,                 // Process in small batches
    analyze_threshold: 7,          // Only analyze entries scoring below this
    improve_threshold: 5,          // Only improve entries scoring below this
    generate_new_words: true,      // Generate new words from concepts
    save_improvements: true        // Save AI suggestions to file
  },
  
  // New word generation
  new_words: {
    concepts: [
      'wisdom', 'knowledge', 'learning', 'teaching',
      'magic', 'spell', 'enchantment', 'mystery',
      'journey', 'travel', 'exploration', 'discovery',
      'friendship', 'companionship', 'alliance', 'bond',
      'victory', 'triumph', 'success', 'achievement',
      'defeat', 'loss', 'failure', 'downfall',
      'celebration', 'festival', 'ceremony', 'ritual',
      'mourning', 'grief', 'sorrow', 'lament'
    ],
    semantic_groups: {
      'wisdom': 'core_concepts',
      'knowledge': 'core_concepts',
      'learning': 'core_concepts',
      'teaching': 'core_concepts',
      'magic': 'ritual_sacred',
      'spell': 'ritual_sacred',
      'enchantment': 'ritual_sacred',
      'mystery': 'ritual_sacred',
      'journey': 'actions_verbs',
      'travel': 'actions_verbs',
      'exploration': 'actions_verbs',
      'discovery': 'actions_verbs',
      'friendship': 'emotions_states',
      'companionship': 'emotions_states',
      'alliance': 'emotions_states',
      'bond': 'emotions_states',
      'victory': 'emotions_states',
      'triumph': 'emotions_states',
      'success': 'emotions_states',
      'achievement': 'emotions_states',
      'defeat': 'emotions_states',
      'loss': 'emotions_states',
      'failure': 'emotions_states',
      'downfall': 'emotions_states',
      'celebration': 'actions_verbs',
      'festival': 'actions_verbs',
      'ceremony': 'ritual_sacred',
      'ritual': 'ritual_sacred',
      'mourning': 'emotions_states',
      'grief': 'emotions_states',
      'sorrow': 'emotions_states',
      'lament': 'emotions_states'
    }
  }
};

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runAIEnhancedQA() {
  console.log('🚀 Starting AI-Enhanced QA Pipeline');
  console.log('=' .repeat(60));
  
  try {
    // 1. Initialize AI system
    console.log('\n🤖 Initializing AI system...');
    const ai = new AIModelInterface(CONFIG.model);
    
    // Check if model is available
    if (CONFIG.model === 'llama' || CONFIG.model === 'mistral' || CONFIG.model === 'codellama') {
      console.log('   📋 Local model selected - ensure Ollama is running:');
      console.log(`      ollama serve`);
      console.log(`      ollama pull ${ai.model.name}`);
    } else if (CONFIG.model === 'openai') {
      console.log('   📋 OpenAI model selected - ensure OPENAI_API_KEY is set');
    } else if (CONFIG.model === 'anthropic') {
      console.log('   📋 Anthropic model selected - ensure ANTHROPIC_API_KEY is set');
    }
    
    // 2. Load and initialize knowledge base
    console.log('\n📚 Loading dictionary and initializing knowledge base...');
    await ai.initialize(CONFIG.input_dictionary);
    
    // 3. Load dictionary for processing
    console.log('\n📖 Loading dictionary for AI analysis...');
    const dictionary = JSON.parse(fs.readFileSync(CONFIG.input_dictionary, 'utf8'));
    const entries = dictionary.sections.Unified.data;
    console.log(`   Loaded ${entries.length} entries`);
    
    // 4. Run AI-enhanced QA
    console.log('\n🔍 Running AI-enhanced QA analysis...');
    const qaPipeline = new AIEnhancedQAPipeline(CONFIG.model);
    
    const aiResults = await qaPipeline.runAIQA(entries, {
      analyze_threshold: CONFIG.processing.analyze_threshold,
      improve_threshold: CONFIG.processing.improve_threshold,
      max_entries: CONFIG.processing.max_entries_to_analyze,
      batch_size: CONFIG.processing.batch_size
    });
    
    // 5. Generate new words if enabled
    let newWords = [];
    if (CONFIG.processing.generate_new_words) {
      console.log('\n🎨 Generating new words with AI...');
      newWords = await qaPipeline.generateNewWords(
        CONFIG.new_words.concepts,
        CONFIG.new_words.semantic_groups
      );
    }
    
    // 6. Create enhanced dictionary
    console.log('\n📝 Creating AI-enhanced dictionary...');
    const enhancedEntries = [...entries];
    
    // Apply AI improvements
    if (CONFIG.processing.save_improvements && aiResults.improved.length > 0) {
      console.log(`   Applying ${aiResults.improved.length} AI improvements...`);
      
      aiResults.improved.forEach(({ original, improved }) => {
        const index = enhancedEntries.findIndex(e => 
          e.english === original.english && 
          e.ancient === original.ancient && 
          e.modern === original.modern
        );
        
        if (index !== -1) {
          enhancedEntries[index] = {
            ...enhancedEntries[index],
            ancient: improved.ancient || enhancedEntries[index].ancient,
            modern: improved.modern || enhancedEntries[index].modern,
            notes: improved.notes || enhancedEntries[index].notes,
            ai_improved: true,
            ai_reasoning: improved.reasoning || 'AI enhancement applied'
          };
        }
      });
    }
    
    // Save AI-generated words to proposed folder for review
    if (newWords.length > 0) {
      console.log(`   Saving ${newWords.length} new AI-generated words to proposed folder...`);
      
      // Create proposed folder if it doesn't exist
      if (!fs.existsSync(CONFIG.proposed_words_folder)) {
        fs.mkdirSync(CONFIG.proposed_words_folder, { recursive: true });
        console.log(`   📁 Created proposed folder: ${CONFIG.proposed_words_folder}`);
      }
      
      // Save proposed words with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const proposedWordsFile = `${CONFIG.proposed_words_folder}/ai-proposed-words-${timestamp}.json`;
      
      const proposedWordsData = {
        metadata: {
          generated_on: new Date().toISOString(),
          ai_model: ai.model.name,
          total_proposed: newWords.length,
          status: 'pending_review',
          source: 'ai_enhanced_qa_pipeline'
        },
        proposed_words: newWords.map(word => ({
          english: word.english,
          ancient: word.generated.ancient,
          modern: word.generated.modern,
          notes: word.generated.notes,
          semantic_group: word.semantic_group,
          ai_reasoning: word.generated.reasoning,
          timestamp: word.timestamp,
          status: 'pending_review',
          review_notes: '',
          approved: false,
          reviewer: '',
          review_date: null
        }))
      };
      
      fs.writeFileSync(proposedWordsFile, JSON.stringify(proposedWordsData, null, 2));
      console.log(`   ✅ Saved proposed words to: ${proposedWordsFile}`);
      
      // Create a summary file for easy review
      const summaryFile = `${CONFIG.proposed_words_folder}/ai-proposed-summary-${timestamp}.md`;
      const summaryContent = generateProposedWordsSummary(proposedWordsData);
      fs.writeFileSync(summaryFile, summaryContent);
      console.log(`   ✅ Saved review summary to: ${summaryFile}`);
    }
    
    // 7. Create enhanced dictionary metadata
    const enhancedDictionary = {
      ...dictionary,
      metadata: {
        ...dictionary.metadata,
        version: "1.7.1",
        created_on: new Date().toISOString(),
        ai_enhanced: true,
        ai_model: ai.model.name,
        ai_analyzed: aiResults.analyzed.length,
        ai_improved: aiResults.improved.length,
        ai_generated: newWords.length,
        original_entries: entries.length,
        final_entries: enhancedEntries.length,
        ai_processing_notes: [
          `Enhanced with ${ai.model.name} AI model`,
          `${aiResults.analyzed.length} entries analyzed`,
          `${aiResults.improved.length} entries improved`,
          `${newWords.length} new words generated`
        ]
      },
      sections: {
        Unified: {
          data: enhancedEntries
        }
      }
    };
    
    // 8. Save outputs
    console.log('\n💾 Saving AI-enhanced outputs...');
    
    // Save enhanced dictionary
    fs.writeFileSync(CONFIG.output_dictionary, JSON.stringify(enhancedDictionary, null, 2));
    console.log(`   ✅ Saved: ${CONFIG.output_dictionary}`);
    
    // Save AI results
    const aiReport = {
      timestamp: new Date().toISOString(),
      model_used: ai.model.name,
      model_config: ai.model,
      processing_config: CONFIG.processing,
      results: {
        analyzed: aiResults.analyzed,
        improved: aiResults.improved,
        generated: newWords,
        errors: aiResults.errors
      },
      statistics: {
        total_analyzed: aiResults.analyzed.length,
        total_improved: aiResults.improved.length,
        total_generated: newWords.length,
        total_errors: aiResults.errors.length,
        improvement_rate: aiResults.analyzed.length > 0 ? 
          (aiResults.improved.length / aiResults.analyzed.length * 100).toFixed(1) : 0
      }
    };
    
    fs.writeFileSync(CONFIG.ai_results_file, JSON.stringify(aiReport, null, 2));
    console.log(`   ✅ Saved: ${CONFIG.ai_results_file}`);
    
    // 9. Generate summary report
    const summaryReport = generateSummaryReport(aiReport, enhancedDictionary);
    const summaryFile = './ai_enhancement_summary_v1.7.1.md';
    fs.writeFileSync(summaryFile, summaryReport);
    console.log(`   ✅ Saved: ${summaryFile}`);
    
    // 10. Final summary
    console.log('\n🎉 AI-Enhanced QA Pipeline Complete!');
    console.log('=' .repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   Model used: ${ai.model.name}`);
    console.log(`   Entries analyzed: ${aiResults.analyzed.length}`);
    console.log(`   Entries improved: ${aiResults.improved.length}`);
    console.log(`   New words generated: ${newWords.length}`);
    console.log(`   Total entries: ${enhancedEntries.length}`);
    console.log(`   Quality improvement: ${aiReport.statistics.improvement_rate}%`);
    
    console.log('\n📁 Output files:');
    console.log(`   Dictionary: ${CONFIG.output_dictionary}`);
    console.log(`   AI Results: ${CONFIG.ai_results_file}`);
    console.log(`   Summary: ${summaryFile}`);
    
  } catch (error) {
    console.error('❌ AI-Enhanced QA Pipeline failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateSummaryReport(aiReport, dictionary) {
  const timestamp = new Date().toISOString();
  
  return `# AI-Enhanced Librán Dictionary v1.7.1 Summary

**Generated:** ${timestamp}
**AI Model:** ${aiReport.model_used}
**From:** v1.7.0 (${dictionary.metadata.original_entries} entries)
**To:** v1.7.1 (${dictionary.metadata.final_entries} entries)

## AI Enhancement Results

### Analysis Statistics
- **Entries Analyzed:** ${aiReport.statistics.total_analyzed}
- **Entries Improved:** ${aiReport.statistics.total_improved}
- **New Words Generated:** ${aiReport.statistics.total_generated}
- **Improvement Rate:** ${aiReport.statistics.improvement_rate}%
- **Processing Errors:** ${aiReport.statistics.total_errors}

### Model Configuration
- **Model:** ${aiReport.model_config.name}
- **Type:** ${aiReport.model_config.type}
- **Provider:** ${aiReport.model_config.provider}
- **Context Window:** ${aiReport.model_config.context_window}

## Detailed Results

### AI Analysis
${aiReport.results.analyzed.slice(0, 10).map(({ entry, analysis }) => 
  `- **${entry.english}**: Score ${analysis.score}/10 - ${analysis.issues.length} issues`
).join('\n')}

### AI Improvements
${aiReport.results.improved.slice(0, 10).map(({ original, improved }) => 
  `- **${original.english}**: ${improved.reasoning || 'AI enhancement applied'}`
).join('\n')}

### AI-Generated Words
${aiReport.results.generated.slice(0, 10).map(word => 
  `- **${word.english}**: Ancient="${word.generated.ancient}", Modern="${word.generated.modern}"`
).join('\n')}

## Quality Metrics

### Before AI Enhancement
- Total entries: ${dictionary.metadata.original_entries}
- Version: 1.7.0

### After AI Enhancement
- Total entries: ${dictionary.metadata.final_entries}
- Version: 1.7.1
- AI-analyzed: ${dictionary.metadata.ai_analyzed}
- AI-improved: ${dictionary.metadata.ai_improved}
- AI-generated: ${dictionary.metadata.ai_generated}

## Technical Details

This enhancement was generated using:
- **AI Model:** ${aiReport.model_used}
- **Processing Config:** ${JSON.stringify(aiReport.processing_config, null, 2)}
- **Knowledge Base:** Librán linguistic rules and patterns
- **Quality Thresholds:** Analysis=${aiReport.processing_config.analyze_threshold}, Improvement=${aiReport.processing_config.improve_threshold}

## Next Steps

1. **Review AI Improvements** - Validate AI-suggested changes
2. **Test New Words** - Ensure generated words fit naturally
3. **Update Translator** - Integrate v1.7.1 into translation system
4. **Monitor Performance** - Track translation quality with new words
5. **Iterate** - Use feedback to improve AI prompts and rules

---

*Generated by AI-Enhanced QA Pipeline*  
*Model: ${aiReport.model_used}*  
*Processing Time: ${new Date().toISOString()}*
`;
}

function generateProposedWordsSummary(proposedWordsData) {
  const timestamp = new Date().toISOString();
  
  return `# AI-Proposed Words for Review

**Generated:** ${proposedWordsData.metadata.generated_on}
**AI Model:** ${proposedWordsData.metadata.ai_model}
**Total Proposed:** ${proposedWordsData.metadata.total_proposed}
**Status:** ${proposedWordsData.metadata.status}

## Proposed Words

${proposedWordsData.proposed_words.map((word, index) => `
### ${index + 1}. ${word.english}

- **Ancient:** ${word.ancient}
- **Modern:** ${word.modern}
- **Semantic Group:** ${word.semantic_group}
- **AI Reasoning:** ${word.ai_reasoning}
- **Notes:** ${word.notes}

**Review Status:** ${word.status}
**Review Notes:** ${word.review_notes || 'Not yet reviewed'}

---
`).join('\n')}

## Review Instructions

For each proposed word, please:

1. **Check Linguistic Accuracy**
   - Verify Ancient form follows Latin patterns
   - Verify Modern form follows Hungarian/Romanian patterns
   - Check etymology documentation

2. **Assess Cultural Fit**
   - Does the word fit Librán worldbuilding?
   - Is the semantic group appropriate?
   - Does it maintain cultural authenticity?

3. **Validate Phonetics**
   - Check pronunciation feasibility
   - Ensure phonetic consistency
   - Verify sound shifts are correct

4. **Review Documentation**
   - Is the etymology complete?
   - Are donor language citations accurate?
   - Is the reasoning sound?

## Approval Process

To approve a word:
1. Change `"approved": false` to `"approved": true`
2. Add your name to `"reviewer"`
3. Set `"review_date"` to current date
4. Add any notes to `"review_notes"`

To reject a word:
1. Add rejection reason to `"review_notes"`
2. Set `"status"` to `"rejected"`
3. Add your name to `"reviewer"`
4. Set `"review_date"` to current date

## Integration

Once reviewed and approved, these words can be integrated into the main dictionary using the review workflow tools.

---

*Generated by AI-Enhanced QA Pipeline*  
*Model: ${proposedWordsData.metadata.ai_model}*  
*Review Status: Pending*
`;
}

// ============================================================================
// COMMAND LINE INTERFACE
// ============================================================================

if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🤖 AI-Enhanced QA Pipeline for Librán Dictionary

USAGE:
  node ai-enhanced-qa-pipeline.js [options]

OPTIONS:
  --model <name>     AI model to use (llama, mistral, openai, anthropic)
  --input <file>     Input dictionary file (default: ./data/UnifiedLibranDictionaryv1.7.0.json)
  --output <file>    Output dictionary file (default: ./UnifiedLibranDictionaryv1.7.1-ai-enhanced.json)
  --max-entries <n>  Maximum entries to analyze (default: 50)
  --no-generate      Disable new word generation
  --help, -h         Show this help message

EXAMPLES:
  # Use local Llama model
  node ai-enhanced-qa-pipeline.js --model llama

  # Use OpenAI with custom input
  node ai-enhanced-qa-pipeline.js --model openai --input my-dictionary.json

  # Analyze more entries
  node ai-enhanced-qa-pipeline.js --max-entries 100

PREREQUISITES:
  # For local models (Ollama)
  ollama serve
  ollama pull llama2:7b-chat

  # For OpenAI
  export OPENAI_API_KEY="your-key-here"

  # For Anthropic
  export ANTHROPIC_API_KEY="your-key-here"
`);
    process.exit(0);
  }
  
  // Parse arguments
  const modelIndex = args.indexOf('--model');
  if (modelIndex !== -1 && args[modelIndex + 1]) {
    CONFIG.model = args[modelIndex + 1];
  }
  
  const inputIndex = args.indexOf('--input');
  if (inputIndex !== -1 && args[inputIndex + 1]) {
    CONFIG.input_dictionary = args[inputIndex + 1];
  }
  
  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && args[outputIndex + 1]) {
    CONFIG.output_dictionary = args[outputIndex + 1];
  }
  
  const maxIndex = args.indexOf('--max-entries');
  if (maxIndex !== -1 && args[maxIndex + 1]) {
    CONFIG.processing.max_entries_to_analyze = parseInt(args[maxIndex + 1]);
  }
  
  if (args.includes('--no-generate')) {
    CONFIG.processing.generate_new_words = false;
  }
  
  // Validate input file
  if (!fs.existsSync(CONFIG.input_dictionary)) {
    console.error(`❌ Input file not found: ${CONFIG.input_dictionary}`);
    process.exit(1);
  }
  
  // Run the pipeline
  runAIEnhancedQA();
}

module.exports = { runAIEnhancedQA, CONFIG };
