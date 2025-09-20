/**
 * Comprehensive Vitest tests for conflict resolution functionality
 * Tests conflict detection, resolution policies, and merge strategies
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DictionaryBuilder } from '../../tools/dict_importer/dict_importer/build_dicts'
import { Entry, DictionaryBuild } from '../../tools/dict_importer/dict_importer/schema'

describe('Conflict Resolution', () => {
  let builder: DictionaryBuilder

  beforeEach(() => {
    builder = new DictionaryBuilder()
  })

  describe('Conflict Detection', () => {
    it('should detect ancient vs modern conflicts', () => {
      const entry1 = new Entry({
        english: 'balance',
        ancient: 'stílibra',
        modern: 'stílibra'
      })
      
      const entry2 = new Entry({
        english: 'balance',
        ancient: 'stílibra_old',
        modern: 'stílibra_new'
      })

      builder.process_entry(entry1)
      builder.process_entry(entry2)

      const conflicts = builder.get_conflicts()
      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].english).toBe('balance')
    })

    it('should detect same-variant conflicts', () => {
      const entry1 = new Entry({
        english: 'balance',
        ancient: 'stílibra',
        modern: 'stílibra'
      })
      
      const entry2 = new Entry({
        english: 'balance',
        ancient: 'stílibra_alt',
        modern: 'stílibra'
      })

      builder.process_entry(entry1)
      builder.process_entry(entry2)

      const conflicts = builder.get_conflicts()
      expect(conflicts).toHaveLength(1)
    })

    it('should not detect conflicts for different words', () => {
      const entry1 = new Entry({
        english: 'balance',
        ancient: 'stílibra',
        modern: 'stílibra'
      })
      
      const entry2 = new Entry({
        english: 'flame',
        ancient: 'flamë',
        modern: 'flama'
      })

      builder.process_entry(entry1)
      builder.process_entry(entry2)

      const conflicts = builder.get_conflicts()
      expect(conflicts).toHaveLength(0)
    })
  })

  describe('Resolution Policies', () => {
    it('should resolve conflicts by confidence score', () => {
      const entry1 = new Entry({
        english: 'balance',
        ancient: 'stílibra',
        modern: 'stílibra',
        confidence: 0.8
      })
      
      const entry2 = new Entry({
        english: 'balance',
        ancient: 'stílibra_alt',
        modern: 'stílibra_alt',
        confidence: 0.9
      })

      builder.process_entry(entry1)
      builder.process_entry(entry2)

      const resolved = builder.resolve_conflicts()
      expect(resolved).toHaveLength(1)
      expect(resolved[0].ancient).toBe('stílibra_alt')
    })

    it('should resolve conflicts by source page priority', () => {
      const entry1 = new Entry({
        english: 'balance',
        ancient: 'stílibra',
        modern: 'stílibra',
        source_page: 1
      })
      
      const entry2 = new Entry({
        english: 'balance',
        ancient: 'stílibra_alt',
        modern: 'stílibra_alt',
        source_page: 2
      })

      builder.process_entry(entry1)
      builder.process_entry(entry2)

      const resolved = builder.resolve_conflicts()
      expect(resolved).toHaveLength(1)
      expect(resolved[0].source_page).toBe(2)
    })

    it('should handle ties in resolution criteria', () => {
      const entry1 = new Entry({
        english: 'balance',
        ancient: 'stílibra',
        modern: 'stílibra',
        confidence: 0.8,
        source_page: 1
      })
      
      const entry2 = new Entry({
        english: 'balance',
        ancient: 'stílibra_alt',
        modern: 'stílibra_alt',
        confidence: 0.8,
        source_page: 1
      })

      builder.process_entry(entry1)
      builder.process_entry(entry2)

      const resolved = builder.resolve_conflicts()
      expect(resolved).toHaveLength(1)
      // Should keep the first entry when tied
      expect(resolved[0].ancient).toBe('stílibra')
    })
  })

  describe('Merge Strategies', () => {
    it('should merge entries with complementary data', () => {
      const entry1 = new Entry({
        english: 'balance',
        ancient: 'stílibra',
        modern: undefined,
        pos: 'n'
      })
      
      const entry2 = new Entry({
        english: 'balance',
        ancient: undefined,
        modern: 'stílibra',
        notes: 'Core concept'
      })

      builder.process_entry(entry1)
      builder.process_entry(entry2)

      const merged = builder.merge_entries()
      expect(merged).toHaveLength(1)
      expect(merged[0].ancient).toBe('stílibra')
      expect(merged[0].modern).toBe('stílibra')
      expect(merged[0].pos).toBe('n')
      expect(merged[0].notes).toBe('Core concept')
    })

    it('should handle partial conflicts', () => {
      const entry1 = new Entry({
        english: 'balance',
        ancient: 'stílibra',
        modern: 'stílibra',
        confidence: 0.8
      })
      
      const entry2 = new Entry({
        english: 'balance',
        ancient: 'stílibra',
        modern: 'stílibra_alt',
        confidence: 0.9
      })

      builder.process_entry(entry1)
      builder.process_entry(entry2)

      const merged = builder.merge_entries()
      expect(merged).toHaveLength(1)
      expect(merged[0].ancient).toBe('stílibra')
      expect(merged[0].modern).toBe('stílibra_alt') // Higher confidence wins
    })

    it('should create variant entries for unresolved conflicts', () => {
      const entry1 = new Entry({
        english: 'balance',
        ancient: 'stílibra',
        modern: 'stílibra',
        confidence: 0.8
      })
      
      const entry2 = new Entry({
        english: 'balance',
        ancient: 'stílibra_alt',
        modern: 'stílibra_alt',
        confidence: 0.8
      })

      builder.process_entry(entry1)
      builder.process_entry(entry2)

      const variants = builder.create_variants()
      expect(variants).toHaveLength(1)
      expect(variants[0].english).toBe('balance')
    })
  })

  describe('Exclusion Handling', () => {
    it('should exclude entries based on exclude list', () => {
      const excludeTerms = new Set(['test', 'example'])
      const builder = new DictionaryBuilder(excludeTerms)

      const entry1 = new Entry({
        english: 'balance',
        ancient: 'stílibra',
        modern: 'stílibra'
      })
      
      const entry2 = new Entry({
        english: 'test',
        ancient: 'test_libran',
        modern: 'test_libran'
      })

      builder.process_entry(entry1)
      builder.process_entry(entry2)

      const excluded = builder.get_excluded_entries()
      expect(excluded).toHaveLength(1)
      expect(excluded[0].english).toBe('test')
    })

    it('should exclude entries with low confidence', () => {
      const entry = new Entry({
        english: 'balance',
        ancient: 'stílibra',
        modern: 'stílibra',
        confidence: 0.3
      })

      builder.process_entry(entry)
      builder.filter_low_confidence(0.5)

      const excluded = builder.get_excluded_entries()
      expect(excluded).toHaveLength(1)
      expect(excluded[0].english).toBe('balance')
    })

    it('should exclude entries with missing translations', () => {
      const entry = new Entry({
        english: 'balance',
        ancient: undefined,
        modern: undefined
      })

      builder.process_entry(entry)
      builder.filter_incomplete_entries()

      const excluded = builder.get_excluded_entries()
      expect(excluded).toHaveLength(1)
      expect(excluded[0].english).toBe('balance')
    })
  })

  describe('Dictionary Building', () => {
    it('should build complete dictionaries', () => {
      const entries = [
        new Entry({
          english: 'balance',
          ancient: 'stílibra',
          modern: 'stílibra'
        }),
        new Entry({
          english: 'flame',
          ancient: 'flamë',
          modern: 'flama'
        })
      ]

      entries.forEach(entry => builder.process_entry(entry))
      const build = builder.build_dictionaries()

      expect(build.ancient_entries).toHaveProperty('balance', 'stílibra')
      expect(build.ancient_entries).toHaveProperty('flame', 'flamë')
      expect(build.modern_entries).toHaveProperty('balance', 'stílibra')
      expect(build.modern_entries).toHaveProperty('flame', 'flama')
    })

    it('should handle mixed ancient/modern entries', () => {
      const entries = [
        new Entry({
          english: 'balance',
          ancient: 'stílibra',
          modern: undefined
        }),
        new Entry({
          english: 'flame',
          ancient: undefined,
          modern: 'flama'
        })
      ]

      entries.forEach(entry => builder.process_entry(entry))
      const build = builder.build_dictionaries()

      expect(build.ancient_entries).toHaveProperty('balance', 'stílibra')
      expect(build.ancient_entries).not.toHaveProperty('flame')
      expect(build.modern_entries).toHaveProperty('flame', 'flama')
      expect(build.modern_entries).not.toHaveProperty('balance')
    })

    it('should generate build statistics', () => {
      const entries = [
        new Entry({
          english: 'balance',
          ancient: 'stílibra',
          modern: 'stílibra'
        }),
        new Entry({
          english: 'flame',
          ancient: 'flamë',
          modern: 'flama'
        })
      ]

      entries.forEach(entry => builder.process_entry(entry))
      const build = builder.build_dictionaries()

      expect(build.build_stats.total_ancient).toBe(2)
      expect(build.build_stats.total_modern).toBe(2)
      expect(build.build_stats.conflicts_resolved).toBe(0)
      expect(build.build_stats.entries_excluded).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed entries gracefully', () => {
      const entry = new Entry({
        english: '',
        ancient: 'stílibra',
        modern: 'stílibra'
      })

      expect(() => builder.process_entry(entry)).not.toThrow()
      const excluded = builder.get_excluded_entries()
      expect(excluded).toHaveLength(1)
    })

    it('should handle duplicate processing', () => {
      const entry = new Entry({
        english: 'balance',
        ancient: 'stílibra',
        modern: 'stílibra'
      })

      builder.process_entry(entry)
      builder.process_entry(entry) // Duplicate

      const conflicts = builder.get_conflicts()
      expect(conflicts).toHaveLength(0) // Should not create self-conflict
    })
  })
})
