# Multi-Format Priming System for Librán Dictionary

## 🎯 Overview

The Multi-Format Priming System combines JSON and PDF files to provide comprehensive context for AI model analysis and generation. This ensures your AI responses are contextually aware and consistent with both structured dictionary data and reference materials.

## 🚀 Key Features

- **Multi-Format Support**: Handles both JSON and PDF files
- **Intelligent Context Loading**: Automatically categorizes and loads files
- **Task-Specific Priming**: Different strategies for different AI tasks
- **Smart Compression**: Fits large contexts within token limits
- **Weight Balancing**: Balances JSON vs PDF content based on task type
- **Pattern Recognition**: Extracts linguistic patterns from multiple sources

## 📁 Files Created

1. **`lib/ai-integration/multi-format-priming-system.js`** - Core multi-format system
2. **`lib/ai-integration/pdf-priming-system.js`** - PDF processing system
3. **`lib/ai-integration/enhanced-ai-multi-format.js`** - Enhanced AI with multi-format support
4. **`example-multi-format-priming.js`** - Usage examples
5. **`setup-multi-format-priming.js`** - Setup script

## 🛠️ Quick Start

### 1. Setup
```bash
node setup-multi-format-priming.js
```

### 2. Install PDF Dependencies (Optional)
```bash
npm install pdf-parse
```

### 3. Basic Usage
```javascript
const EnhancedAIMultiFormat = require('./lib/ai-integration/enhanced-ai-multi-format');

const ai = new EnhancedAIMultiFormat();
await ai.initialize({ dataDir: './data' });

// Analyze with comprehensive context
const analysis = await ai.analyzeWordWithContext('kethara', 'etymology');
console.log(analysis);
```

### 4. Run Examples
```bash
node example-multi-format-priming.js
```

## 📊 Context Strategies

### Word Generation
- Uses JSON dictionaries + relevant tranches
- Includes PDF reference materials for cultural context
- Balances structured data (70%) with reference materials (30%)

### Translation
- Focuses on translation pairs from JSON
- Includes cultural context from PDFs
- Emphasizes idiomatic expressions and cultural nuances

### Etymology Analysis
- Uses JSON etymology data
- Includes historical context from PDFs
- Balances structured patterns with reference materials

### Reference-Heavy Tasks
- Emphasizes PDF content (70%) over JSON (30%)
- Ideal for cultural analysis and reference-based tasks
- Uses comprehensive PDF context for detailed analysis

## 🔧 Configuration

The system automatically detects and loads:
- **JSON Files**: Dictionaries, tranches, specialized data
- **PDF Files**: Reference guides, cultural materials, documentation

## 📝 Usage Examples

### 1. Word Analysis with Multi-Format Context
```javascript
const analysis = await ai.analyzeWordWithContext('kethara', 'etymology', {
  category: 'living',
  focus: 'animals'
});
```

### 2. Word Generation with Comprehensive Context
```javascript
const generation = await ai.generateWordWithContext('mountain', 'nature', {
  context: 'A tall, rocky peak in the northern ranges'
});
```

### 3. Translation with Cultural Context
```javascript
const translation = await ai.translateWithContext(
  'The wise elder spoke of ancient traditions',
  'en-to-libran',
  { focus: 'cultural_context' }
);
```

### 4. Comprehensive QA Analysis
```javascript
const qaResult = await ai.performComprehensiveQAAnalysis(dictionary, {
  focus: 'consistency_check'
});
```

## 🗜️ Context Optimization

The system intelligently optimizes context:
- **Size Limits**: Configurable per task type
- **Weight Balancing**: Adjusts JSON vs PDF content ratios
- **Smart Selection**: Chooses most relevant content
- **Pattern Extraction**: Extracts key linguistic patterns
- **Compression**: Fits within token limits while preserving quality

## 📊 Statistics and Monitoring

Get insights into your loaded context:
```javascript
const stats = ai.getComprehensiveStats();
console.log(stats);
```

Output includes:
- JSON file count and size
- PDF file count and size
- Total context size
- PDF support status
- Context distribution

## 🚨 Troubleshooting

### Common Issues

1. **"PDF support not available"**
   - Install PDF dependencies: `npm install pdf-parse`
   - Check if PDF files exist in data directory

2. **"System not initialized"**
   - Call `await ai.initialize()` first

3. **"Context too large"**
   - Adjust compression settings in config
   - Use task-specific context strategies

4. **"No PDF files found"**
   - Check data directory for PDF files
   - Ensure PDF files are readable

### Debug Mode

Enable debug logging:
```javascript
const ai = new EnhancedAIMultiFormat();
await ai.initialize({ 
  dataDir: './data',
  debug: true 
});
```

## 🎯 Best Practices

1. **Organize Your Files**: Use consistent naming and structure
2. **Balance Content**: Ensure both JSON and PDF content are available
3. **Monitor Context Size**: Adjust limits based on your model
4. **Test Different Strategies**: Try various task types and weights
5. **Cache Results**: Reuse contexts when possible

## 🔮 Future Enhancements

- **Dynamic Weight Adjustment**: Automatic weight balancing based on task performance
- **Semantic Similarity**: Use embeddings for better content selection
- **Multi-Model Support**: Different strategies for different AI models
- **Context Validation**: Automatic quality checks for loaded content
- **Performance Metrics**: Track context effectiveness and optimization

---

**Happy Multi-Format Priming! 🎉**

The Multi-Format Priming System transforms your static files into dynamic, intelligent context that makes your AI responses more accurate, consistent, and culturally authentic.
