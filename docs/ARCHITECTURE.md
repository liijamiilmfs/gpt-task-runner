# Librán Voice Forge Architecture

This document provides a detailed technical overview of the Librán Voice Forge system architecture and implementation.

## System Overview

Librán Voice Forge is built as a Next.js application with a modular architecture that separates concerns between translation, text-to-speech synthesis, and user interface components.

## Core Components

### 1. Translation Pipeline

The translation system follows a deterministic rule-based approach with the following stages:

#### Tokenization
```
Input: "Hello, beautiful world!"
Output: ["Hello", ",", "beautiful", "world", "!"]
```

#### Dictionary Mapping
- **Word Lookup**: Direct mapping from English to Librán using comprehensive dictionaries
- **Fallback Handling**: Unknown words are processed through morphological rules
- **Context Awareness**: Phrase-level translations take precedence over word-level

#### Sound Shifts
- **Phonetic Rules**: Apply Librán-specific sound changes
- **Accent Patterns**: Modify pronunciation based on word position
- **Diacritic Application**: Add appropriate accent marks for proper pronunciation

#### Stitching
- **Grammar Rules**: Apply Librán grammatical structures
- **Word Order**: Rearrange according to Librán syntax
- **Punctuation**: Adapt punctuation to Librán conventions

### 2. Text-to-Speech Integration

#### OpenAI TTS Service
- **Model Selection**: Configurable TTS model (default: gpt-4o-mini-tts)
- **Voice Options**: Multiple voice styles (alloy, echo, fable, onyx, nova, shimmer)
- **Format Support**: MP3, WAV, FLAC output formats
- **Streaming**: Real-time audio generation and streaming

#### Librán Accent Styling
- **Voice Characteristics**: Low, hushed, suspenseful tone
- **Pacing**: Slow, deliberate with strategic pauses
- **Pronunciation**: Elongated vowels, softened consonants
- **Emotional Tone**: Mysterious with undercurrent of unease

### 3. API Architecture

#### `/api/translate` Endpoint
```typescript
POST /api/translate
{
  "text": "Hello world",
  "variant": "ancient" | "modern",
  "options": {
    "preservePunctuation": true,
    "includeDiacritics": true
  }
}

Response:
{
  "translatedText": "Salaam dunya",
  "originalText": "Hello world",
  "variant": "ancient",
  "confidence": 0.95
}
```

#### `/api/speak` Endpoint
```typescript
POST /api/speak
{
  "text": "Salaam dunya",
  "voice": "alloy",
  "model": "gpt-4o-mini-tts",
  "format": "mp3"
}

Response: Audio stream (binary)
```

## Data Flow

### Translation Flow
```
User Input → Tokenizer → Dictionary Lookup → Rule Engine → Sound Shifts → Grammar Rules → Output
```

### TTS Flow
```
Librán Text → OpenAI API → Audio Buffer → Stream Response → Client
```

### Complete Pipeline
```
English Text → Translation API → Librán Text → TTS API → Audio File → User
```

## File Structure

```
lib/
├── dictionaries/
│   ├── ancient-libran.json
│   ├── modern-libran.json
│   └── rules.json
├── translator/
│   ├── tokenizer.ts
│   ├── mapper.ts
│   ├── sound-shifts.ts
│   └── grammar.ts
└── tts/
    ├── openai-client.ts
    ├── voice-styles.ts
    └── audio-processor.ts

app/
├── api/
│   ├── translate/
│   │   └── route.ts
│   └── speak/
│       └── route.ts
├── components/
│   ├── TranslationForm.tsx
│   ├── AudioPlayer.tsx
│   └── VoiceSettings.tsx
└── page.tsx
```

## Dictionary System

### Dictionary Format
```json
{
  "version": "1.0.0",
  "language": "ancient-libran",
  "metadata": {
    "description": "Ancient Librán dictionary",
    "lastUpdated": "2024-01-01",
    "wordCount": 1500
  },
  "entries": {
    "hello": "salaam",
    "world": "dunya",
    "peace": "aman"
  },
  "phrases": {
    "good morning": "sabah al-khayr",
    "good night": "layla sa'ida"
  },
  "rules": {
    "plural_suffix": "an",
    "verb_ending": "ar",
    "adjective_agreement": true
  }
}
```

### Rule Engine
- **Morphological Rules**: Handle word inflections
- **Syntactic Rules**: Manage sentence structure
- **Phonetic Rules**: Apply sound changes
- **Context Rules**: Handle special cases

## Performance Considerations

### Caching Strategy
- **Dictionary Caching**: Load dictionaries at startup
- **Translation Caching**: Cache frequent translations
- **Audio Caching**: Cache generated audio files (temporary)

### Optimization Techniques
- **Lazy Loading**: Load components on demand
- **Streaming**: Stream audio as it's generated
- **Compression**: Compress audio files for faster transfer
- **CDN**: Use CDN for static assets

### Memory Management
- **Audio Cleanup**: Automatic cleanup of temporary audio files
- **Buffer Management**: Efficient audio buffer handling
- **Garbage Collection**: Proper cleanup of unused objects

## Security Architecture

### API Security
- **Input Validation**: Sanitize all user inputs
- **Rate Limiting**: Prevent API abuse
- **Authentication**: Secure API key handling
- **CORS**: Proper cross-origin resource sharing

### Data Protection
- **No Storage**: No persistent storage of user data
- **Environment Variables**: Secure configuration management
- **HTTPS**: Encrypted communication
- **Input Sanitization**: Prevent injection attacks

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: No server-side state
- **Load Balancing**: Distribute requests across instances
- **Database**: No database dependencies
- **CDN**: Global content delivery

### Vertical Scaling
- **Memory Optimization**: Efficient memory usage
- **CPU Optimization**: Optimized processing algorithms
- **I/O Optimization**: Efficient file handling
- **Caching**: Reduce redundant processing

## Monitoring and Logging

### Metrics
- **Translation Accuracy**: Track translation quality
- **Response Times**: Monitor API performance
- **Error Rates**: Track system reliability
- **Usage Patterns**: Understand user behavior

### Logging
- **Structured Logging**: JSON-formatted logs
- **Log Levels**: Debug, Info, Warn, Error
- **Log Rotation**: Automatic log file management
- **Error Tracking**: Comprehensive error reporting

## Future Enhancements

### Planned Features
- **LLM Integration**: Enhanced translation with AI
- **Real-time Streaming**: Live audio generation
- **Batch Processing**: Bulk translation support
- **Voice Customization**: Advanced voice parameters

### Technical Improvements
- **WebAssembly**: Performance optimization
- **Service Workers**: Offline functionality
- **Progressive Web App**: Enhanced mobile experience
- **Microservices**: Modular service architecture

## Development Guidelines

### Code Organization
- **Modular Design**: Separate concerns
- **Type Safety**: Full TypeScript coverage
- **Testing**: Comprehensive test coverage
- **Documentation**: Inline code documentation

### Performance Guidelines
- **Lazy Loading**: Load resources on demand
- **Memoization**: Cache expensive computations
- **Debouncing**: Optimize user input handling
- **Compression**: Minimize payload sizes

---

*This architecture document is maintained alongside the codebase and updated with each major release.*









