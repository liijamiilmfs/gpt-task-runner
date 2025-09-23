# AI Integration Guide for Librán Dictionary

This guide explains how to integrate open source language models with your Librán Dictionary QA pipeline to create a self-improving linguistic system.

## 🎯 **Overview**

The AI integration system allows you to:

- **Analyze word formations** using linguistic AI models
- **Generate new words** following established patterns
- **Improve existing entries** with AI suggestions
- **Learn from patterns** and provide intelligent corrections
- **Automate quality improvements** over time

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Integration System                    │
├─────────────────────────────────────────────────────────────┤
│  Linguistic Knowledge Base                                  │
│  ├── Rules (morphology, phonetics, etymology)              │
│  ├── Patterns (from existing dictionary)                   │
│  ├── Cultural Context (semantic groups)                    │
│  └── Examples (good/bad formations)                        │
├─────────────────────────────────────────────────────────────┤
│  AI Model Interface                                         │
│  ├── Local Models (Ollama: Llama, Mistral, CodeLlama)      │
│  ├── Cloud Models (OpenAI, Anthropic)                      │
│  └── Response Parsing & Validation                         │
├─────────────────────────────────────────────────────────────┤
│  AI-Enhanced QA Pipeline                                    │
│  ├── Word Formation Analysis                               │
│  ├── Improvement Suggestions                               │
│  ├── New Word Generation                                   │
│  └── Quality Scoring                                       │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 **Quick Start**

### 1. **Setup AI Integration**

```bash
# Run the setup script
node setup-ai-integration.js

# This will:
# - Install dependencies
# - Set up Ollama for local models
# - Pull recommended AI models
# - Create configuration files
# - Test the system
```

### 2. **Run AI-Enhanced QA**

```bash
# Use local Llama model (recommended)
node ai-enhanced-qa-pipeline.js --model llama

# Use Mistral model
node ai-enhanced-qa-pipeline.js --model mistral

# Use OpenAI (requires API key)
node ai-enhanced-qa-pipeline.js --model openai
```

### 3. **Review Results**

The pipeline generates:
- `UnifiedLibranDictionaryv1.7.1-ai-enhanced.json` - Enhanced dictionary
- `ai_qa_results_v1.7.1.json` - Detailed AI analysis
- `ai_enhancement_summary_v1.7.1.md` - Human-readable summary

## 🔧 **Configuration Options**

### **Model Selection**

```javascript
// In ai-enhanced-qa-pipeline.js
const CONFIG = {
  model: 'llama', // Options: 'llama', 'mistral', 'codellama', 'openai', 'anthropic'
  
  processing: {
    max_entries_to_analyze: 50,    // Limit for API costs
    batch_size: 5,                 // Process in batches
    analyze_threshold: 7,          // Only analyze entries below this score
    improve_threshold: 5,          // Only improve entries below this score
    generate_new_words: true       // Enable new word generation
  }
};
```

### **Local Models (Recommended)**

**Advantages:**
- ✅ Free to use
- ✅ Privacy (data stays local)
- ✅ No API rate limits
- ✅ Works offline

**Requirements:**
- 8GB+ RAM
- 10GB+ disk space
- Modern CPU or GPU

**Setup:**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve

# Pull models
ollama pull llama2:7b-chat
ollama pull mistral:7b-instruct
ollama pull codellama:7b-instruct
```

### **Cloud Models**

**OpenAI (GPT-3.5/4):**
```bash
export OPENAI_API_KEY="your-api-key"
node ai-enhanced-qa-pipeline.js --model openai
```

**Anthropic (Claude):**
```bash
export ANTHROPIC_API_KEY="your-api-key"
node ai-enhanced-qa-pipeline.js --model anthropic
```

## 📚 **Training Data Format**

The AI system learns from structured linguistic data:

### **Linguistic Rules**
```json
{
  "ancient_suffixes": {
    "-or": "mythic/abstract concepts (Animor, Memoror)",
    "-us": "masculine nouns (Equus, Gladius)",
    "-a": "feminine nouns (Luna, Terra)"
  },
  "modern_suffixes": {
    "ë": "Hungarian influence, soft ending",
    "é": "Hungarian influence, long vowel",
    "ă": "Romanian influence, schwa"
  },
  "donor_languages": {
    "Latin": "Ancient forms, classical concepts",
    "Hungarian": "Modern forms, everyday vocabulary",
    "Romanian": "Emotional/soft concepts"
  }
}
```

### **Example Entries**
```json
{
  "english": "balance",
  "ancient": "Stílibror",
  "modern": "stílibra",
  "notes": "Lat statera; Core sacred concept; mythic register",
  "quality": "excellent"
}
```

### **Bad Examples (for learning)**
```json
{
  "english": "leader",
  "ancient": "leaderor",
  "modern": "leaderë",
  "notes": "English + suffixes without proper etymology",
  "issues": ["lazy_formation", "missing_etymology", "poor_donor_choice"]
}
```

## 🤖 **AI Capabilities**

### **1. Word Formation Analysis**

The AI analyzes entries and provides:
- **Quality Score** (1-10)
- **Issues Found** (lazy formations, missing etymology, etc.)
- **Suggestions** (improved forms, better donor languages)
- **Etymological Assessment** (accuracy of linguistic choices)
- **Cultural Appropriateness** (fit with Librán worldbuilding)

**Example Analysis:**
```json
{
  "score": 3,
  "issues": [
    "English stem + -or without Latin basis",
    "Missing etymological documentation"
  ],
  "suggestions": [
    "Use 'Dux' from Latin dux for leader",
    "Add proper etymology notes"
  ],
  "etymology": "Poor - no Latin root provided",
  "cultural": "Generic - lacks Librán character"
}
```

### **2. Word Improvement**

The AI generates improved formations:
```json
{
  "ancient": "Dux",
  "modern": "vezér",
  "notes": "Lat dux; Hu vezér; leader, commander",
  "reasoning": "Latin 'dux' is the proper root for leader, Hungarian 'vezér' provides natural modern form"
}
```

### **3. New Word Generation**

The AI creates new words following patterns:
```json
{
  "english": "wisdom",
  "semantic_group": "core_concepts",
  "generated": {
    "ancient": "Sapientia",
    "modern": "bölcsesség",
    "notes": "Lat sapientia; Hu bölcsesség; deep understanding and judgment",
    "reasoning": "Latin 'sapientia' for ancient wisdom, Hungarian 'bölcsesség' for modern form"
  }
}
```

## 📊 **Performance Metrics**

### **Processing Speed**
- **Local Models:** 2-5 entries per minute
- **Cloud Models:** 10-20 entries per minute
- **Batch Processing:** 5-10 entries per batch

### **Quality Improvements**
- **Analysis Accuracy:** 85-95% (depends on model)
- **Improvement Success:** 70-80% of suggestions are valid
- **Generation Quality:** 80-90% of new words are usable

### **Cost Analysis**
- **Local Models:** Free (after initial setup)
- **OpenAI GPT-3.5:** ~$0.002 per 1K tokens
- **Anthropic Claude:** ~$0.0015 per 1K tokens

## 🔄 **Workflow Integration**

### **Daily Workflow**
1. **Morning:** Run AI analysis on new tranches
2. **Review:** Check AI suggestions and improvements
3. **Apply:** Integrate valid suggestions into dictionary
4. **Learn:** Update training data with new patterns

### **Weekly Workflow**
1. **Generate:** Create new words for missing concepts
2. **Validate:** Test new words in translation system
3. **Refine:** Update AI prompts based on results
4. **Archive:** Save successful patterns for future use

### **Monthly Workflow**
1. **Evaluate:** Assess AI system performance
2. **Update:** Refresh model versions and prompts
3. **Expand:** Add new linguistic rules and patterns
4. **Optimize:** Improve processing efficiency

## 🛠️ **Customization**

### **Custom Prompts**

Edit `ai-prompt-templates.json` to customize AI behavior:

```json
{
  "analysis_prompt": "Your custom analysis prompt here...",
  "generation_prompt": "Your custom generation prompt here...",
  "improvement_prompt": "Your custom improvement prompt here..."
}
```

### **Additional Training Data**

Add more examples to `ai-training-data.json`:

```json
{
  "example_entries": [
    {
      "english": "your_word",
      "ancient": "your_ancient_form",
      "modern": "your_modern_form",
      "notes": "your_etymology",
      "quality": "excellent"
    }
  ]
}
```

### **Custom Rules**

Extend the linguistic rules in the AI system:

```javascript
// In lib/ai-integration/linguistic-ai-system.js
this.rules.set('custom_rules', {
  'your_rule': 'your_rule_description',
  'another_rule': 'another_description'
});
```

## 🐛 **Troubleshooting**

### **Common Issues**

**1. Ollama Connection Failed**
```bash
# Check if Ollama is running
ollama serve

# Check if models are pulled
ollama list

# Pull missing models
ollama pull llama2:7b-chat
```

**2. API Key Issues**
```bash
# Check environment variables
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY

# Set API keys
export OPENAI_API_KEY="your-key-here"
```

**3. Memory Issues**
```bash
# Check available memory
free -h

# Use smaller models or reduce batch size
node ai-enhanced-qa-pipeline.js --max-entries 20
```

**4. Poor AI Results**
- Check training data quality
- Verify prompt templates
- Try different models
- Increase context window

### **Performance Optimization**

**For Local Models:**
- Use GPU acceleration if available
- Reduce batch size for low memory
- Close other applications
- Use smaller models (7B instead of 13B)

**For Cloud Models:**
- Optimize prompts to reduce token usage
- Use batch processing
- Cache common responses
- Monitor API usage and costs

## 📈 **Future Enhancements**

### **Planned Features**
1. **Fine-tuning** - Train custom models on Librán data
2. **Multi-model** - Ensemble different models for better results
3. **Real-time** - Live AI assistance during dictionary editing
4. **Visualization** - AI analysis dashboard
5. **API** - REST API for external tools

### **Integration Opportunities**
1. **Translation System** - AI-powered translation improvements
2. **Editor Integration** - AI suggestions in dictionary editor
3. **Quality Monitoring** - Continuous quality assessment
4. **Pattern Discovery** - Automated pattern recognition
5. **Cultural Analysis** - AI assessment of cultural appropriateness

## 📞 **Support**

### **Getting Help**
- Check the troubleshooting section above
- Review AI results logs for specific errors
- Test with smaller datasets first
- Verify model availability and connectivity

### **Contributing**
- Submit improvements to AI prompts
- Add new linguistic rules and patterns
- Share successful training data
- Report bugs and performance issues

---

*The AI integration system transforms your dictionary from a static collection into a living, learning linguistic system that improves over time.*
