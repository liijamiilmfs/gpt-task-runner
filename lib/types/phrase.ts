// Client-safe phrase types
// This module contains only TypeScript types and interfaces
// No server-only dependencies should be imported here

export interface Phrase {
  id: string
  english: string
  ancient: string
  modern: string
  category: PhraseCategory
  difficulty: PhraseDifficulty
  context: string
}

export type PhraseCategory = 
  | 'greetings'
  | 'common_expressions'
  | 'questions'
  | 'emotions'
  | 'time'
  | 'weather'
  | 'family'
  | 'travel'
  | 'food'
  | 'miscellaneous'

export type PhraseDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface PhraseFilter {
  category?: PhraseCategory
  difficulty?: PhraseDifficulty
  search?: string
}

export interface PhraseBook {
  metadata: {
    version: string
    created_on: string
    description: string
    total_phrases: number
    categories: PhraseCategory[]
    difficulties: PhraseDifficulty[]
  }
  phrases: Phrase[]
}
