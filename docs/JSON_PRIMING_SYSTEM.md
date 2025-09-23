# JSON Priming System for Librán Dictionary

## 🎯 Overview

The JSON Priming System is an intelligent context management system that feeds your AI model with relevant JSON files as "primers" or context. This ensures your AI responses are contextually aware and consistent with your existing Librán dictionary data.

## 🚀 Key Features

- **Intelligent Context Loading**: Automatically loads and categorizes JSON files
- **Task-Specific Priming**: Different context strategies for different AI tasks
- **Smart Compression**: Fits large contexts within token limits
- **Pattern Recognition**: Extracts linguistic patterns from your data
- **Cultural Authenticity**: Maintains consistency with existing entries

## 📁 Files Created

1. **`lib/ai-integration/json-priming-system.js`** - Core priming system
2. **`lib/ai-integration/enhanced-ai-with-priming.js`** - Enhanced AI with priming
3. **`lib/ai-integration/priming-config.json`** - Configuration file
4. **`example-json-priming-usage.js`** - Usage examples
5. **`setup-json-priming.js`** - Setup script

## 🛠️ Quick Start

### 1. Setup
```bash
node setup-json-priming.js
```

### 2. Basic Usage
```javascript
const EnhancedAISystem = require('./lib/ai-integration/enhanced-ai-with-priming');

const ai = new EnhancedAISystem();
await ai.initialize({ dataDir: './data' });

// Analyze with context
const analysis = await ai.analyzeWordWithContext('kethara', 'etymology');
console.log(analysis);
```

### 3. Run Examples
```bash
node example-json-priming-usage.js
```

## 📊 How It Works

### Context Categories

The system automatically categorizes your JSON files:

- **Dictionaries**: Main dictionary files (v1.7.0, v1.6.3, etc.)
- **Tranches**: Thematic word collections
  - `core`: Grammar and nature terms
  - `concepts`: Abstract concepts and qualities
  - `living`: Animals, plants, beings
  - `society`: Politics, law, trade
  - `craft`: Materials, crafting, agriculture
  - `culture`: Music, healing, weapons, weather
- **Specialized**: Phrasebooks, exclusions, samples

### Task-Specific Priming

Different AI tasks get different context:

#### Word Generation
```javascript
const context = ai.getContextForTask('word_generation', {
  category: 'nature',
  focus: 'mountains'
});
```
- Uses core dictionaries + nature tranches
- Focuses on morphology and examples
- Compressed for token efficiency

#### Translation
```javascript
const context = ai.getContextForTask('translation', {
  direction: 'en-to-libran'
});
```
- Uses dictionaries + core tranches
- Focuses on translation pairs
- Includes cultural context

#### Etymology Analysis
```javascript
const context = ai.getContextForTask('etymology', {
  category: 'living'
});
```
- Uses dictionaries + living tranches
- Focuses on roots and origins
- Includes historical patterns

## 🔧 Configuration

### Priming Strategies

Edit `lib/ai-integration/priming-config.json` to customize:

```json
{
  "priming_strategies": {
    "word_generation": {
      "max_context_size": 6000,
      "preferred_categories": ["dictionaries", "tranches.core"],
      "compression_ratio": 0.8
    }
  }
}
```

### File Categories

Add new categories or modify existing ones:

```json
{
  "file_categories": {
    "custom_category": {
      "description": "Your custom category",
      "files": ["file1.json", "file2.json"],
      "priority": "medium",
      "max_files": 2
    }
  }
}
```

## 📝 Usage Examples

### 1. Word Analysis with Context
```javascript
const analysis = await ai.analyzeWordWithContext('kethara', 'etymology', {
  category: 'living',
  focus: 'animals'
});
```

### 2. Word Generation with Context
```javascript
const generation = await ai.generateWordWithContext('mountain', 'nature', {
  context: 'A tall, rocky peak in the northern ranges'
});
```

### 3. Translation with Context
```javascript
const translation = await ai.translateWithContext(
  'The wise elder spoke of ancient traditions',
  'en-to-libran',
  { focus: 'cultural_context' }
);
```

### 4. QA Analysis with Context
```javascript
const qaResult = await ai.performQAAnalysis(dictionary, {
  focus: 'consistency_check'
});
```

## 🗜️ Context Compression

The system intelligently compresses large contexts:

- **Size Limits**: Configurable per task type
- **Smart Selection**: Chooses most relevant entries
- **Pattern Extraction**: Extracts key linguistic patterns
- **Metadata Preservation**: Keeps important structural info

### Compression Strategies

1. **Field Filtering**: Only includes relevant fields per task
2. **Entry Limiting**: Limits number of entries per file
3. **Pattern Extraction**: Extracts common patterns
4. **Hierarchical Selection**: Prioritizes important categories

## 📊 Context Statistics

Get insights into your loaded context:

```javascript
const stats = ai.getContextStats();
console.log(stats);
```

Output:
```json
{
  "totalCategories": 8,
  "totalFiles": 25,
  "totalSize": "2.5 MB",
  "categories": {
    "dictionaries": {
      "files": 3,
      "size": 1048576,
      "formattedSize": "1.0 MB"
    }
  }
}
```

## 🔍 Advanced Features

### Custom Context Generation
```javascript
const context = ai.getContextForTask('custom_task', {
  category: 'specific_category',
  focus: 'particular_aspect',
  maxSize: 5000
});
```

### Context Caching
The system caches loaded contexts for performance:
- Automatic cache invalidation
- Memory-efficient storage
- Fast context switching

### Pattern Recognition
Automatically extracts:
- Morphological patterns
- Etymological patterns
- Cultural patterns
- Phonetic patterns

## 🚨 Troubleshooting

### Common Issues

1. **"System not initialized"**
   - Call `await ai.initialize()` first

2. **"File not found"**
   - Check your data directory path
   - Ensure JSON files exist

3. **"Context too large"**
   - Adjust `max_context_size` in config
   - Increase compression ratio

4. **"No relevant context"**
   - Check file categories in config
   - Verify file naming matches patterns

### Debug Mode

Enable debug logging:
```javascript
const ai = new EnhancedAISystem();
await ai.initialize({ 
  dataDir: './data',
  debug: true 
});
```

## 🎯 Best Practices

1. **Organize Your JSON Files**: Use consistent naming and structure
2. **Configure Categories**: Match your file organization
3. **Monitor Context Size**: Adjust limits based on your model
4. **Test Different Strategies**: Try various task types
5. **Cache Results**: Reuse contexts when possible

## 🔮 Future Enhancements

- **Dynamic Context Loading**: Load context based on real-time analysis
- **Semantic Similarity**: Use embeddings for better context selection
- **Multi-Model Support**: Different strategies for different models
- **Context Validation**: Automatic quality checks for loaded context
- **Performance Metrics**: Track context effectiveness

## 📚 Related Documentation

- [AI Integration Guide](./AI_INTEGRATION_GUIDE.md)
- [Dictionary Build System](./DICTIONARY_BUILD_SYSTEM.md)
- [Audit System](./AUDIT_SYSTEM.md)

## 🤝 Contributing

To add new priming strategies or improve existing ones:

1. Edit `priming-config.json`
2. Add new methods to `JSONPrimingSystem`
3. Update `EnhancedAISystem` to use new strategies
4. Add tests and examples
5. Update this documentation

---

**Happy Priming! 🎉**

The JSON Priming System transforms your static dictionary files into dynamic, intelligent context that makes your AI responses more accurate, consistent, and culturally authentic.
