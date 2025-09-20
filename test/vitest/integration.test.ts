/**
 * Comprehensive Vitest integration tests for the complete parsing pipeline
 * Tests end-to-end workflows from PDF text to final dictionaries
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TableParser } from '../../tools/dict_importer/dict_importer/parse_tables'
import { DictionaryBuilder } from '../../tools/dict_importer/dict_importer/build_dicts'
import { normalize_text } from '../../tools/dict_importer/dict_importer/normalize'
import { Entry, ParsedPage } from '../../tools/dict_importer/dict_importer/schema'

describe('Complete Parsing Pipeline Integration', () => {
  let parser: TableParser
  let builder: DictionaryBuilder

  beforeEach(() => {
    parser = new TableParser()
    builder = new DictionaryBuilder()
  })

  describe('End-to-End Dictionary Processing', () => {
    it('should process complete dual table page', () => {
      const pageText = `English | Ancient | Modern
balance | stílibra | stílibra
flame   | flamë    | flama
memory  | memoror  | memoria

English | Ancient | Modern
anger   | íra     | íra
fear    | felë    | felë`

      // Parse the page
      const parsedPage = parser.parse_page(pageText, 1)
      expect(parsedPage.entries).toHaveLength(5)

      // Process entries through builder
      parsedPage.entries.forEach(entry => builder.process_entry(entry))
      const build = builder.build_dictionaries()

      // Verify results
      expect(build.ancient_entries).toHaveProperty('balance', 'stílibra')
      expect(build.ancient_entries).toHaveProperty('flame', 'flamë')
      expect(build.ancient_entries).toHaveProperty('memory', 'memoror')
      expect(build.ancient_entries).toHaveProperty('anger', 'íra')
      expect(build.ancient_entries).toHaveProperty('fear', 'felë')

      expect(build.modern_entries).toHaveProperty('balance', 'stílibra')
      expect(build.modern_entries).toHaveProperty('flame', 'flama')
      expect(build.modern_entries).toHaveProperty('memory', 'memoria')
      expect(build.modern_entries).toHaveProperty('anger', 'íra')
      expect(build.modern_entries).toHaveProperty('fear', 'felë')
    })

    it('should handle mixed table layouts', () => {
      const pageText = `English | Ancient
balance | stílibra
flame   | flamë

English | Modern
balance | stílibra
flame   | flama`

      const parsedPage = parser.parse_page(pageText, 1)
      expect(parsedPage.entries).toHaveLength(4)

      parsedPage.entries.forEach(entry => builder.process_entry(entry))
      const build = builder.build_dictionaries()

      // Should merge entries with same English word
      expect(build.ancient_entries).toHaveProperty('balance', 'stílibra')
      expect(build.ancient_entries).toHaveProperty('flame', 'flamë')
      expect(build.modern_entries).toHaveProperty('balance', 'stílibra')
      expect(build.modern_entries).toHaveProperty('flame', 'flama')
    })

    it('should handle text normalization in pipeline', () => {
      const pageText = `English | Ancient | Modern
café    | stílibra | stílibra
naïve   | flamë    | flama
résumé  | memoror  | memoria`

      // Normalize text first
      const normalizedText = normalize_text(pageText)
      const parsedPage = parser.parse_page(normalizedText, 1)
      
      expect(parsedPage.entries).toHaveLength(3)
      expect(parsedPage.entries[0].english).toBe('cafe')
      expect(parsedPage.entries[1].english).toBe('naive')
      expect(parsedPage.entries[2].english).toBe('resume')
    })

    it('should handle hyphen restoration in pipeline', () => {
      const pageText = `English | Ancient | Modern
trans-  | stílibra | stílibra
lation  |         |
under-  | flamë    | flama
standing|         |`

      const parsedPage = parser.parse_page(pageText, 1)
      expect(parsedPage.entries).toHaveLength(2)
      expect(parsedPage.entries[0].english).toBe('translation')
      expect(parsedPage.entries[1].english).toBe('understanding')
    })
  })

  describe('Conflict Resolution Pipeline', () => {
    it('should resolve conflicts in complete pipeline', () => {
      const page1Text = `English | Ancient | Modern
balance | stílibra | stílibra
flame   | flamë    | flama`

      const page2Text = `English | Ancient | Modern
balance | stílibra_alt | stílibra_alt
flame   | flamë_alt    | flama_alt`

      // Parse both pages
      const page1 = parser.parse_page(page1Text, 1)
      const page2 = parser.parse_page(page2Text, 2)

      // Process all entries
      const allEntries = page1.entries.concat(page2.entries)
      allEntries.forEach(entry => {
        builder.process_entry(entry)
      })

      // Resolve conflicts
      builder.resolve_conflicts()
      const build = builder.build_dictionaries()

      // Should have resolved conflicts (higher page number wins)
      expect(build.ancient_entries).toHaveProperty('balance', 'stílibra_alt')
      expect(build.ancient_entries).toHaveProperty('flame', 'flamë_alt')
      expect(build.modern_entries).toHaveProperty('balance', 'stílibra_alt')
      expect(build.modern_entries).toHaveProperty('flame', 'flama_alt')
    })

    it('should create variants for unresolved conflicts', () => {
      const page1Text = `English | Ancient | Modern
balance | stílibra | stílibra`

      const page2Text = `English | Ancient | Modern
balance | stílibra_alt | stílibra_alt`

      const page1 = parser.parse_page(page1Text, 1)
      const page2 = parser.parse_page(page2Text, 2)

      const allEntries = page1.entries.concat(page2.entries)
      allEntries.forEach(entry => {
        builder.process_entry(entry)
      })

      const variants = builder.create_variants()
      const build = builder.build_dictionaries()

      expect(variants).toHaveLength(1)
      expect(variants[0].english).toBe('balance')
      expect(build.variant_entries).toHaveLength(1)
    })
  })

  describe('Exclusion Pipeline', () => {
    it('should exclude terms throughout pipeline', () => {
      const excludeTerms = new Set(['test', 'example'])
      const builder = new DictionaryBuilder(excludeTerms)

      const pageText = `English | Ancient | Modern
balance | stílibra | stílibra
test    | test_libran | test_libran
flame   | flamë    | flama
example | example_libran | example_libran`

      const parsedPage = parser.parse_page(pageText, 1)
      parsedPage.entries.forEach(entry => builder.process_entry(entry))

      const build = builder.build_dictionaries()
      const excluded = builder.get_excluded_entries()

      expect(build.ancient_entries).toHaveProperty('balance', 'stílibra')
      expect(build.ancient_entries).toHaveProperty('flame', 'flamë')
      expect(build.ancient_entries).not.toHaveProperty('test')
      expect(build.ancient_entries).not.toHaveProperty('example')

      expect(excluded).toHaveLength(2)
      expect(excluded.some(e => e.english === 'test')).toBe(true)
      expect(excluded.some(e => e.english === 'example')).toBe(true)
    })

    it('should filter low confidence entries', () => {
      const pageText = `English | Ancient | Modern
balance | stílibra | stílibra
flame   | flamë    | flama`

      const parsedPage = parser.parse_page(pageText, 1)
      
      // Manually set low confidence
      parsedPage.entries[0].confidence = 0.3
      parsedPage.entries[1].confidence = 0.8

      parsedPage.entries.forEach(entry => builder.process_entry(entry))
      builder.filter_low_confidence(0.5)

      const build = builder.build_dictionaries()
      const excluded = builder.get_excluded_entries()

      expect(build.ancient_entries).toHaveProperty('flame', 'flamë')
      expect(build.ancient_entries).not.toHaveProperty('balance')
      expect(excluded).toHaveLength(1)
      expect(excluded[0].english).toBe('balance')
    })
  })

  describe('Error Recovery', () => {
    it('should handle malformed table data gracefully', () => {
      const pageText = `English | Ancient | Modern
| | 
balance | stílibra | stílibra
| | stílibra
flame   | flamë    | flama
| | | | |`

      const parsedPage = parser.parse_page(pageText, 1)
      expect(parsedPage.entries).toHaveLength(2)
      expect(parsedPage.entries[0].english).toBe('balance')
      expect(parsedPage.entries[1].english).toBe('flame')
    })

    it('should handle empty pages', () => {
      const pageText = `This is just some text
with no table structure
at all.`

      const parsedPage = parser.parse_page(pageText, 1)
      expect(parsedPage.entries).toHaveLength(0)
    })

    it('should handle pages with only headers', () => {
      const pageText = `English | Ancient | Modern`

      const parsedPage = parser.parse_page(pageText, 1)
      expect(parsedPage.entries).toHaveLength(0)
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large page processing', () => {
      const entries = []
      for (let i = 0; i < 100; i++) {
        entries.push(`word${i.toString().padStart(3, '0')} | libran${i.toString().padStart(3, '0')} | libran${i.toString().padStart(3, '0')}`)
      }

      const pageText = `English | Ancient | Modern\n${entries.join('\n')}`
      const parsedPage = parser.parse_page(pageText, 1)

      expect(parsedPage.entries).toHaveLength(100)
      
      parsedPage.entries.forEach(entry => builder.process_entry(entry))
      const build = builder.build_dictionaries()

      expect(build.ancient_entries).toHaveProperty('word000', 'libran000')
      expect(build.ancient_entries).toHaveProperty('word099', 'libran099')
    })

    it('should handle multiple pages efficiently', () => {
      const pages = []
      for (let pageNum = 1; pageNum <= 10; pageNum++) {
        const entries = []
        for (let i = 0; i < 10; i++) {
          const wordNum = (pageNum - 1) * 10 + i
          entries.push(`word${wordNum.toString().padStart(3, '0')} | libran${wordNum.toString().padStart(3, '0')} | libran${wordNum.toString().padStart(3, '0')}`)
        }
        pages.push(`English | Ancient | Modern\n${entries.join('\n')}`)
      }

      const allEntries = []
      pages.forEach((pageText, index) => {
        const parsedPage = parser.parse_page(pageText, index + 1)
        allEntries.push(...parsedPage.entries)
      })

      expect(allEntries).toHaveLength(100)
      
      allEntries.forEach(entry => builder.process_entry(entry))
      const build = builder.build_dictionaries()

      expect(build.ancient_entries).toHaveProperty('word000', 'libran000')
      expect(build.ancient_entries).toHaveProperty('word099', 'libran099')
    })
  })
})
