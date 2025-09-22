import { Token } from './tokenizer'
import { Dictionary, getDictionaryEntry } from './dictionary-loader'

export async function applyTranslationRules(
  tokens: Token[], 
  dictionary: Dictionary
): Promise<Token[]> {
  const translatedTokens: Token[] = []
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    
    if (token.type === 'word') {
      // Try to find translation
      const translation = getDictionaryEntry(dictionary, token.value)
      
      if (translation) {
        // Apply case preservation
        const casePreservedTranslation = preserveCase(token.original, translation)
        
        translatedTokens.push({
          ...token,
          translated: true,
          translatedValue: casePreservedTranslation
        })
      } else {
        // Try to find partial matches or apply fallback rules
        const fallbackTranslation = await applyFallbackRules(token, dictionary, tokens, i)
        
        translatedTokens.push({
          ...token,
          translated: fallbackTranslation !== null,
          translatedValue: fallbackTranslation || token.value
        })
      }
    } else {
      // Keep non-word tokens as-is
      translatedTokens.push(token)
    }
  }
  
  return translatedTokens
}

async function applyFallbackRules(
  token: Token, 
  dictionary: Dictionary, 
  allTokens: Token[], 
  currentIndex: number
): Promise<string | null> {
  // Try common word endings
  const word = token.value
  
  // Try removing common English suffixes
  const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 's', 'es']
  for (const suffix of suffixes) {
    if (word.endsWith(suffix)) {
      const baseWord = word.slice(0, -suffix.length)
      const baseTranslation = getDictionaryEntry(dictionary, baseWord)
      if (baseTranslation) {
        // Apply Librán suffix rules
        return applyLibránSuffix(baseTranslation, suffix, dictionary)
      }
    }
  }
  
  // Try compound words
  if (word.includes('-')) {
    const parts = word.split('-')
    const translatedParts = parts.map(part => getDictionaryEntry(dictionary, part))
    
    if (translatedParts.every(part => part !== undefined)) {
      return translatedParts.join('-')
    }
  }
  
  // Try context-based translation
  const contextTranslation = await getContextTranslation(token, allTokens, currentIndex, dictionary)
  if (contextTranslation) {
    return contextTranslation
  }
  
  return null
}

function applyLibránSuffix(baseTranslation: string, suffix: string, dictionary: Dictionary): string {
  const rules = dictionary.rules || {}
  
  switch (suffix) {
    case 'ing':
      return baseTranslation + (rules.verb_ending || 'ar')
    case 'ed':
      return baseTranslation + (rules.past_ending || 'a')
    case 'er':
      return baseTranslation + (rules.comparative_ending || 'an')
    case 'est':
      return baseTranslation + (rules.superlative_ending || 'an')
    case 'ly':
      return baseTranslation + (rules.adverb_ending || 'an')
    case 's':
    case 'es':
      return baseTranslation + (rules.plural_suffix || 'an')
    default:
      return baseTranslation
  }
}

async function getContextTranslation(
  token: Token, 
  allTokens: Token[], 
  currentIndex: number, 
  dictionary: Dictionary
): Promise<string | null> {
  // Look for common phrases in context
  const contextWindow = 3
  const start = Math.max(0, currentIndex - contextWindow)
  const end = Math.min(allTokens.length, currentIndex + contextWindow + 1)
  
  const contextWords = allTokens
    .slice(start, end)
    .filter(t => t.type === 'word')
    .map(t => t.value)
    .join(' ')
  
  // Check if this context matches any phrases
  if (dictionary.phrases) {
    for (const [phrase, translation] of Object.entries(dictionary.phrases)) {
      if (contextWords.includes(phrase)) {
        return typeof translation === 'string' ? translation : translation.base || null
      }
    }
  }
  
  return null
}

function preserveCase(original: string, translated: string): string {
  if (original === original.toUpperCase()) {
    return translated.toUpperCase()
  } else if (original === original.toLowerCase()) {
    return translated.toLowerCase()
  } else if (original[0] === original[0].toUpperCase()) {
    return translated.charAt(0).toUpperCase() + translated.slice(1).toLowerCase()
  }
  return translated
}
