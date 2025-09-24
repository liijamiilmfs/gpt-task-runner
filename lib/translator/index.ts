import fs from 'fs';
import path from 'path';
import { log, generateCorrelationId } from '../logger';
import { unknownTokenLogger } from '../unknown-token-logger';
import { loadDictionary as loadDictionaryFromLoader, getDictionaryEntry } from './dictionary-loader';

export interface TranslationResult {
  libran: string;
  confidence: number;
  wordCount: number;
}

export type Variant = 'ancient' | 'modern';

// Use the Dictionary interface from dictionary-loader
import type { Dictionary } from './dictionary-loader'

export interface TranslateOptions {
  dictionary?: Dictionary;
}

// Load dictionary from file using the new dictionary loader
async function loadDictionary(variant: Variant): Promise<Dictionary> {
  log.debug('Loading dictionary', { variant });
  
  try {
    const dictionary = await loadDictionaryFromLoader(variant);
    log.info('Dictionary loaded successfully', { variant, entryCount: Object.keys(dictionary.entries).length });
    return dictionary;
  } catch (error) {
    log.errorWithContext(error as Error, 'DICTIONARY_LOAD_ERROR', generateCorrelationId(), { variant });
    throw error;
  }
}

// Tokenize text while preserving punctuation
function tokenize(text: string): Array<{ type: 'word' | 'punctuation' | 'whitespace', value: string, original: string }> {
  const tokens: Array<{ type: 'word' | 'punctuation' | 'whitespace', value: string, original: string }> = [];
  const words = text.split(/(\s+|[.,!?;:])/);
  
  for (const word of words) {
    if (!word) continue;
    
    if (/\s+/.test(word)) {
      tokens.push({ type: 'whitespace', value: word, original: word });
    } else if (/[.,!?;:]/.test(word)) {
      tokens.push({ type: 'punctuation', value: word, original: word });
    } else {
      tokens.push({ type: 'word', value: word.toLowerCase(), original: word });
    }
  }
  
  return tokens;
}

// Simple stem fallback for common English suffixes
function stemWord(word: string): string {
  // Remove common English suffixes
  const suffixes = [
    { pattern: /ing$/, replacement: '' },
    { pattern: /ed$/, replacement: '' },
    { pattern: /es$/, replacement: '' },
    { pattern: /s$/, replacement: '' }
  ];
  
  for (const { pattern, replacement } of suffixes) {
    if (pattern.test(word)) {
      return word.replace(pattern, replacement);
    }
  }
  
  return word;
}

// Apply sound shift rules
function applySoundShifts(word: string, variant: Variant): string {
  if (variant === 'ancient') {
    // Ancient: prefer -or/-on endings for bare roots
    if (word.length > 3 && !word.endsWith('or') && !word.endsWith('on')) {
      // Simple heuristic: if it looks like a bare root, add -or
      if (!word.includes('a') && !word.includes('e') && !word.includes('i') && !word.includes('o') && !word.includes('u')) {
        return word + 'or';
      }
    }
  } else {
    // Modern: convert trailing -or to -a
    if (word.endsWith('or')) {
      return word.slice(0, -2) + 'a';
    }
  }
  
  return word;
}

// Preserve source casing
function preserveCase(original: string, translated: string): string {
  if (original === original.toUpperCase()) {
    return translated.toUpperCase();
  } else if (original === original.toLowerCase()) {
    return translated.toLowerCase();
  } else if (original[0] === original[0].toUpperCase()) {
    return translated.charAt(0).toUpperCase() + translated.slice(1).toLowerCase();
  }
  return translated;
}

// Fix spacing around punctuation
function fixSpacing(tokens: Array<{ type: string, value: string, original: string }>): string {
  let result = '';
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];
    
    result += token.value;
    
    // Add space after words, but not before punctuation
    if (token.type === 'word' && nextToken && nextToken.type === 'word') {
      result += ' ';
    } else if (token.type === 'word' && nextToken && nextToken.type === 'punctuation') {
      // No space before punctuation
    } else if (token.type === 'punctuation' && nextToken && nextToken.type === 'word') {
      result += ' ';
    }
  }
  
  return result;
}

export async function translate(text: string, variant: Variant, options: TranslateOptions = {}): Promise<TranslationResult> {
  const startTime = Date.now();
  log.debug('Starting translation', { textLength: text.length, variant, hasCustomDictionary: !!options.dictionary });
  
  const dictionary = options.dictionary ?? await loadDictionaryFromLoader(variant);
  const tokens = tokenize(text);
  const translatedTokens = [];
  let translatedWordCount = 0;
  let totalWordCount = 0;
  const unknownWords: string[] = [];
  
  for (const token of tokens) {
    if (token.type === 'word') {
      totalWordCount++;
      let translated = getDictionaryEntry(dictionary, token.value);
      
      if (!translated) {
        // Try stemmed version
        const stemmed = stemWord(token.value);
        translated = getDictionaryEntry(dictionary, stemmed);
      }
      
      if (translated) {
        // Apply sound shifts and preserve case
        translated = applySoundShifts(translated, variant);
        translated = preserveCase(token.original, translated);
        translatedWordCount++;
        log.debug('Word translated', { original: token.value, translated, variant });
      } else {
        // Keep original if no translation found
        translated = token.original;
        unknownWords.push(token.value);
        log.debug('Word not found in dictionary', { word: token.value, variant });
      }
      
      translatedTokens.push({ ...token, value: translated });
    } else {
      translatedTokens.push(token);
    }
  }
  
  const libran = fixSpacing(translatedTokens);
  const confidence = totalWordCount > 0 ? translatedWordCount / totalWordCount : 0;
  const duration = Date.now() - startTime;
  
  // Log unknown tokens for analysis
  if (unknownWords.length > 0) {
    unknownTokenLogger.logUnknownTokens(unknownWords, variant, text.substring(0, 100))
      .catch(error => log.error('Failed to log unknown tokens', { error: error.message }));
  }
  
  log.info('Translation completed', {
    textLength: text.length,
    variant,
    totalWords: totalWordCount,
    translatedWords: translatedWordCount,
    unknownWords: unknownWords.length,
    confidence,
    duration
  });
  
  return {
    libran,
    confidence,
    wordCount: totalWordCount
  };
}