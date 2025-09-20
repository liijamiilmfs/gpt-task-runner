/**
 * Comprehensive Vitest tests for normalize functionality
 * Tests diacritics, hyphen repair, and text normalization
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  normalize_text, 
  restore_hyphenated_words, 
  is_hyphenated_word,
  clean_headword,
  clean_translation,
  normalize_ligatures,
  normalize_whitespace
} from '../../tools/dict_importer/dict_importer/normalize'

describe('Text Normalization', () => {
  describe('Diacritics and Special Characters', () => {
    it('should normalize common diacritics', () => {
      const input = 'café naïve résumé'
      const result = normalize_text(input)
      expect(result).toBe('cafe naive resume')
    })

    it('should preserve Librán special characters', () => {
      const input = 'stílibra flamë memoror'
      const result = normalize_text(input)
      expect(result).toBe('stílibra flamë memoror')
    })

    it('should handle mixed diacritics and special chars', () => {
      const input = 'café stílibra naïve'
      const result = normalize_text(input)
      expect(result).toBe('cafe stílibra naive')
    })
  })

  describe('Hyphen Repair', () => {
    it('should join soft hyphens across lines', () => {
      const lines = ['trans-', 'lation', 'under-', 'standing']
      const result = restore_hyphenated_words(lines)
      expect(result).toEqual(['translation', 'understanding'])
    })

    it('should preserve lexical hyphens', () => {
      const lines = ['self-', 'aware', 'non-', 'existent']
      const result = restore_hyphenated_words(lines)
      expect(result).toEqual(['self-', 'aware', 'non-', 'existent'])
    })

    it('should handle mixed hyphen types', () => {
      const lines = ['hello-', 'world', 'self-', 'aware']
      const result = restore_hyphenated_words(lines)
      expect(result).toEqual(['helloworld', 'self-', 'aware'])
    })

    it('should identify known hyphenated words', () => {
      expect(is_hyphenated_word('self-aware')).toBe(true)
      expect(is_hyphenated_word('non-existent')).toBe(true)
      expect(is_hyphenated_word('pre-war')).toBe(true)
      expect(is_hyphenated_word('hello-world')).toBe(false)
    })
  })

  describe('Ligature Normalization', () => {
    it('should normalize common ligatures', () => {
      const input = 'æsthetic œdipus ﬁre ﬂame'
      const result = normalize_ligatures(input)
      expect(result).toBe('aesthetic oedipus fire flame')
    })

    it('should handle multiple ligatures in text', () => {
      const input = 'ﬁreﬂy œdipus æsthetic'
      const result = normalize_ligatures(input)
      expect(result).toBe('firefly oedipus aesthetic')
    })
  })

  describe('Whitespace Normalization', () => {
    it('should normalize multiple spaces', () => {
      const input = 'hello    world   test'
      const result = normalize_whitespace(input)
      expect(result).toBe('hello world test')
    })

    it('should handle tabs and newlines', () => {
      const input = 'hello\t\tworld\n\n\ntest'
      const result = normalize_whitespace(input)
      expect(result).toBe('hello world test')
    })
  })

  describe('Headword Cleaning', () => {
    it('should clean English headwords', () => {
      const input = '  Hello, World!  '
      const result = clean_headword(input)
      expect(result).toBe('Hello, World!')
    })

    it('should handle empty headwords', () => {
      const input = '   '
      const result = clean_headword(input)
      expect(result).toBe('')
    })

    it('should preserve special characters in headwords', () => {
      const input = 'self-aware (adj.)'
      const result = clean_headword(input)
      expect(result).toBe('self-aware (adj.)')
    })
  })

  describe('Translation Cleaning', () => {
    it('should clean Librán translations', () => {
      const input = '  stílibra  '
      const result = clean_translation(input)
      expect(result).toBe('stílibra')
    })

    it('should handle empty translations', () => {
      const input = '   '
      const result = clean_translation(input)
      expect(result).toBe('')
    })

    it('should preserve Librán special characters', () => {
      const input = 'stílibra (n.)'
      const result = clean_translation(input)
      expect(result).toBe('stílibra (n.)')
    })
  })

  describe('Complete Normalization Pipeline', () => {
    it('should handle complex text normalization', () => {
      const input = `  café  stílibra  (n.)
      
      trans-
      lation
      
      self-aware  `
      
      const result = normalize_text(input)
      expect(result).toContain('cafe stílibra')
      expect(result).toContain('translation')
      expect(result).toContain('self-aware')
    })

    it('should preserve line structure for table parsing', () => {
      const input = `English | Ancient | Modern
      balance | stílibra | stílibra
      flame   | flamë    | flama`
      
      const result = normalize_text(input)
      expect(result).toContain('|')
      expect(result).toContain('stílibra')
      expect(result).toContain('flamë')
    })
  })
})
