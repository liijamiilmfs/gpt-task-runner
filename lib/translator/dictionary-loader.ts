import fs from 'fs'
import path from 'path'

export interface DictionaryEntry {
  [key: string]: string | {
    base?: string
    plural?: string
    possessive?: string
    present?: string
    past?: string
    future?: string
  }
}

export interface Dictionary {
  version: string
  language: string
  metadata: {
    description: string
    lastUpdated: string
    wordCount: number
  }
  entries: DictionaryEntry
  phrases?: DictionaryEntry
  rules: {
    [key: string]: any
  }
}

const dictionaryCache = new Map<string, Dictionary>()

export async function loadDictionary(variant: 'ancient' | 'modern'): Promise<Dictionary> {
  // Check cache first
  if (dictionaryCache.has(variant)) {
    return dictionaryCache.get(variant)!
  }

  try {
    const dictionaryPath = path.join(process.cwd(), 'lib', 'dictionaries', `${variant}-libran.json`)
    const dictionaryData = fs.readFileSync(dictionaryPath, 'utf-8')
    const dictionary: Dictionary = JSON.parse(dictionaryData)
    
    // Cache the dictionary
    dictionaryCache.set(variant, dictionary)
    
    return dictionary
  } catch (error) {
    console.error(`Failed to load ${variant} dictionary:`, error)
    throw new Error(`Dictionary not found: ${variant}-libran.json`)
  }
}

export function getDictionaryEntry(
  dictionary: Dictionary, 
  word: string
): string | undefined {
  const lowerWord = word.toLowerCase()
  
  // Check phrases first (higher priority)
  if (dictionary.phrases && dictionary.phrases[lowerWord]) {
    const entry = dictionary.phrases[lowerWord]
    return typeof entry === 'string' ? entry : entry.base
  }
  
  // Check regular entries
  if (dictionary.entries[lowerWord]) {
    const entry = dictionary.entries[lowerWord]
    return typeof entry === 'string' ? entry : entry.base
  }
  
  return undefined
}

export function getDictionaryRules(dictionary: Dictionary): Record<string, any> {
  return dictionary.rules || {}
}









