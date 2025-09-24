import { describe, it, expect, beforeEach } from 'vitest'
import { PhraseService } from '../lib/phrase-service'

describe('PhraseService', () => {
  let phraseService: PhraseService

  beforeEach(() => {
    phraseService = new PhraseService()
  })

  it('should load phrase book successfully', async () => {
    const phraseBook = await phraseService['loadPhraseBook']()
    expect(phraseBook).toBeDefined()
    expect(phraseBook.metadata).toBeDefined()
    expect(phraseBook.phrases).toBeDefined()
    expect(phraseBook.phrases.length).toBeGreaterThan(0)
  })

  it('should get random phrase', async () => {
    const phrase = await phraseService.getRandomPhrase()
    expect(phrase).toBeDefined()
    expect(phrase?.english).toBeDefined()
    expect(phrase?.ancient).toBeDefined()
    expect(phrase?.modern).toBeDefined()
  })

  it('should filter phrases by category', async () => {
    const greetings = await phraseService.getPhrasesByCategory('greetings')
    expect(greetings).toBeDefined()
    expect(greetings.length).toBeGreaterThan(0)
    expect(greetings.every(phrase => phrase.category === 'greetings')).toBe(true)
  })

  it('should search phrases', async () => {
    const results = await phraseService.searchPhrases('hello')
    expect(results).toBeDefined()
    expect(Array.isArray(results)).toBe(true)
  })

  it('should get categories', async () => {
    const categories = await phraseService.getCategories()
    expect(categories).toBeDefined()
    expect(Array.isArray(categories)).toBe(true)
    expect(categories.length).toBeGreaterThan(0)
  })

  it('should get phrase stats', async () => {
    const stats = await phraseService.getPhraseStats()
    expect(stats).toBeDefined()
    expect(stats.totalPhrases).toBeGreaterThan(0)
    expect(stats.categories).toBeDefined()
    expect(stats.difficulties).toBeDefined()
  })
})
