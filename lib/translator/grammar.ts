import { Token } from './tokenizer'

export function applyGrammarRules(tokens: Token[], variant: 'ancient' | 'modern'): Token[] {
  // Apply word order rules
  const reorderedTokens = applyWordOrder(tokens, variant)
  
  // Apply agreement rules
  const agreementTokens = applyAgreementRules(reorderedTokens, variant)
  
  // Apply punctuation rules
  const punctuationTokens = applyPunctuationRules(agreementTokens, variant)
  
  return punctuationTokens
}

function applyWordOrder(tokens: Token[], variant: 'ancient' | 'modern'): Token[] {
  // Librán typically uses SOV (Subject-Object-Verb) word order
  // This is a simplified implementation
  
  const words = tokens.filter(token => token.type === 'word')
  const nonWords = tokens.filter(token => token.type !== 'word')
  
  if (words.length < 3) {
    return tokens // Not enough words to reorder
  }
  
  // Simple SOV reordering (this would be more complex in reality)
  const reorderedWords = reorderToSOV(words)
  
  // Merge back with non-word tokens
  return mergeTokens(reorderedWords, nonWords)
}

function reorderToSOV(words: Token[]): Token[] {
  // This is a simplified SOV reordering
  // In reality, this would be much more complex
  
  const subjects: Token[] = []
  const objects: Token[] = []
  const verbs: Token[] = []
  const others: Token[] = []
  
  // Simple classification (this would be more sophisticated)
  for (const word of words) {
    if (isSubject(word)) {
      subjects.push(word)
    } else if (isObject(word)) {
      objects.push(word)
    } else if (isVerb(word)) {
      verbs.push(word)
    } else {
      others.push(word)
    }
  }
  
  // SOV order: Subject, Object, Verb, Others
  return [...subjects, ...objects, ...verbs, ...others]
}

function isSubject(word: Token): boolean {
  // Simple heuristic - words that could be subjects
  const subjectWords = ['i', 'you', 'he', 'she', 'we', 'they', 'the', 'a', 'an']
  return subjectWords.includes(word.value.toLowerCase())
}

function isObject(word: Token): boolean {
  // Simple heuristic - words that could be objects
  const objectWords = ['it', 'them', 'this', 'that', 'these', 'those']
  return objectWords.includes(word.value.toLowerCase())
}

function isVerb(word: Token): boolean {
  // Simple heuristic - words that could be verbs
  const verbWords = ['is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'can', 'could', 'should', 'may', 'might']
  return verbWords.includes(word.value.toLowerCase())
}

function applyAgreementRules(tokens: Token[], variant: 'ancient' | 'modern'): Token[] {
  // Apply subject-verb agreement
  return tokens.map((token, index) => {
    if (token.type === 'word' && token.translatedValue) {
      const agreementForm = applyAgreement(token, tokens, index, variant)
      if (agreementForm) {
        return {
          ...token,
          translatedValue: agreementForm
        }
      }
    }
    return token
  })
}

function applyAgreement(token: Token, allTokens: Token[], index: number, variant: 'ancient' | 'modern'): string | null {
  // This is a simplified agreement system
  // In reality, this would be much more complex
  
  if (!token.translatedValue) return null
  
  // Look for subject in previous tokens
  const subject = findSubject(allTokens, index)
  if (!subject) return null
  
  // Apply agreement based on subject
  return applySubjectVerbAgreement(token.translatedValue, subject, variant)
}

function findSubject(tokens: Token[], currentIndex: number): Token | null {
  // Look backwards for a subject
  for (let i = currentIndex - 1; i >= 0; i--) {
    const token = tokens[i]
    if (token.type === 'word' && isSubject(token)) {
      return token
    }
  }
  return null
}

function applySubjectVerbAgreement(verb: string, subject: Token, variant: 'ancient' | 'modern'): string | null {
  // Simplified agreement rules
  const subjectValue = subject.translatedValue || subject.value
  
  if (variant === 'ancient') {
    // Ancient Librán agreement
    if (subjectValue.includes('I') || subjectValue.includes('i')) {
      return verb + 'tu' // First person
    } else if (subjectValue.includes('you') || subjectValue.includes('You')) {
      return verb + 'ta' // Second person
    } else if (subjectValue.includes('he') || subjectValue.includes('He')) {
      return verb + 'a' // Third person masculine
    } else if (subjectValue.includes('she') || subjectValue.includes('She')) {
      return verb + 'at' // Third person feminine
    } else if (subjectValue.includes('we') || subjectValue.includes('We')) {
      return verb + 'na' // First person plural
    } else if (subjectValue.includes('they') || subjectValue.includes('They')) {
      return verb + 'u' // Third person plural
    }
  } else {
    // Modern Librán agreement (simplified)
    return verb // No agreement in modern variant
  }
  
  return null
}

function applyPunctuationRules(tokens: Token[], variant: 'ancient' | 'modern'): Token[] {
  return tokens.map(token => {
    if (token.type === 'punctuation') {
      const adaptedPunctuation = adaptPunctuation(token.value, variant)
      return {
        ...token,
        translatedValue: adaptedPunctuation
      }
    }
    return token
  })
}

function adaptPunctuation(punctuation: string, variant: 'ancient' | 'modern'): string {
  if (variant === 'ancient') {
    // Ancient Librán punctuation adaptations
    switch (punctuation) {
      case '.':
        return '·' // Middle dot
      case '?':
        return '¿' // Inverted question mark
      case '!':
        return '¡' // Inverted exclamation mark
      case ',':
        return '،' // Arabic comma
      case ';':
        return '؛' // Arabic semicolon
      case ':':
        return ':' // Keep colon
      default:
        return punctuation
    }
  } else {
    // Modern Librán uses standard punctuation
    return punctuation
  }
}

function mergeTokens(words: Token[], nonWords: Token[]): Token[] {
  // This is a simplified merging function
  // In reality, this would preserve the original token order more carefully
  
  const result: Token[] = []
  let wordIndex = 0
  let nonWordIndex = 0
  
  // Simple merge - this would be more sophisticated in reality
  for (let i = 0; i < words.length + nonWords.length; i++) {
    if (i % 2 === 0 && wordIndex < words.length) {
      result.push(words[wordIndex++])
    } else if (nonWordIndex < nonWords.length) {
      result.push(nonWords[nonWordIndex++])
    } else if (wordIndex < words.length) {
      result.push(words[wordIndex++])
    }
  }
  
  return result
}










