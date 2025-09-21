export interface Token {
  type: 'word' | 'punctuation' | 'whitespace' | 'number'
  value: string
  original: string
  translated?: boolean
  translatedValue?: string
}

export function tokenizeText(text: string): Token[] {
  const tokens: Token[] = []
  const words = text.split(/(\s+|[.,!?;:])/)
  
  for (const word of words) {
    if (!word) continue
    
    if (/\s+/.test(word)) {
      tokens.push({
        type: 'whitespace',
        value: word,
        original: word
      })
    } else if (/[.,!?;:]/.test(word)) {
      tokens.push({
        type: 'punctuation',
        value: word,
        original: word
      })
    } else if (/^\d+$/.test(word)) {
      tokens.push({
        type: 'number',
        value: word,
        original: word
      })
    } else {
      tokens.push({
        type: 'word',
        value: word.toLowerCase(),
        original: word
      })
    }
  }
  
  return tokens
}

export function joinTokens(tokens: Token[]): string {
  return tokens.map(token => token.translatedValue || token.value).join('')
}

export function preserveCase(original: string, translated: string): string {
  if (original === original.toUpperCase()) {
    return translated.toUpperCase()
  } else if (original === original.toLowerCase()) {
    return translated.toLowerCase()
  } else if (original[0] === original[0].toUpperCase()) {
    return translated.charAt(0).toUpperCase() + translated.slice(1).toLowerCase()
  }
  return translated
}









