/**
 * Comprehensive Vitest tests for table parsing functionality
 * Tests column detection, table layout parsing, and data extraction
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TableParser } from '../../tools/dict_importer/dict_importer/parse_tables'
import { Entry, ParsedPage } from '../../tools/dict_importer/dict_importer/schema'

describe('Table Parsing', () => {
  let parser: TableParser

  beforeEach(() => {
    parser = new TableParser()
  })

  describe('Column Detection', () => {
    it('should detect dual table columns', () => {
      const line = 'English | Ancient | Modern'
      const result = parser.detect_columns(line)
      expect(result).toEqual([7, 16])
    })

    it('should detect single table columns', () => {
      const line = 'English | Ancient'
      const result = parser.detect_columns(line)
      expect(result).toEqual([7])
    })

    it('should handle pipe-separated data', () => {
      const line = 'word | translation | notes'
      const result = parser.detect_columns(line)
      expect(result).toEqual([5, 17])
    })

    it('should handle space-separated data', () => {
      const line = 'word    translation    notes'
      const result = parser.detect_columns(line)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('Table Type Detection', () => {
    it('should identify dual table type', () => {
      const columns = ['English', 'Ancient', 'Modern']
      const result = parser.detect_table_type(columns)
      expect(result).toBe('dual')
    })

    it('should identify single table type (ancient)', () => {
      const columns = ['English', 'Ancient']
      const result = parser.detect_table_type(columns)
      expect(result).toBe('single')
    })

    it('should identify single table type (modern)', () => {
      const columns = ['English', 'Modern']
      const result = parser.detect_table_type(columns)
      expect(result).toBe('single')
    })

    it('should identify unknown table type', () => {
      const columns = ['Word', 'Meaning']
      const result = parser.detect_table_type(columns)
      expect(result).toBe('unknown')
    })
  })

  describe('Header Detection', () => {
    it('should identify table headers', () => {
      const header = 'English | Ancient | Modern'
      const result = parser.is_table_header(header)
      expect(result).toBe(true)
    })

    it('should identify single column headers', () => {
      const header = 'English | Ancient'
      const result = parser.is_table_header(header)
      expect(result).toBe(true)
    })

    it('should reject data rows as headers', () => {
      const dataRow = 'balance | stílibra | stílibra'
      const result = parser.is_table_header(dataRow)
      expect(result).toBe(false)
    })

    it('should handle various header formats', () => {
      const headers = [
        'English | Ancient | Modern',
        'english | ancient | modern',
        'Word | Translation',
        'Headword | Meaning'
      ]
      
      headers.forEach(header => {
        expect(parser.is_table_header(header)).toBe(true)
      })
    })
  })

  describe('Entry Line Detection', () => {
    it('should identify valid entry lines', () => {
      const entryLine = 'balance | stílibra | stílibra'
      const result = parser.is_entry_line(entryLine)
      expect(result).toBe(true)
    })

    it('should reject header lines', () => {
      const headerLine = 'English | Ancient | Modern'
      const result = parser.is_entry_line(headerLine)
      expect(result).toBe(false)
    })

    it('should reject empty lines', () => {
      const emptyLine = '   '
      const result = parser.is_entry_line(emptyLine)
      expect(result).toBe(false)
    })

    it('should reject page numbers', () => {
      const pageLine = 'Page 1'
      const result = parser.is_entry_line(pageLine)
      expect(result).toBe(false)
    })
  })

  describe('Column Splitting', () => {
    it('should split pipe-separated columns', () => {
      const line = 'balance | stílibra | stílibra'
      const boundaries = [8, 17]
      const result = parser.split_into_columns(line, boundaries)
      expect(result).toEqual(['balance', 'stílibra', 'stílibra'])
    })

    it('should split space-separated columns', () => {
      const line = 'balance    stílibra    stílibra'
      const boundaries = [8, 17]
      const result = parser.split_into_columns(line, boundaries)
      expect(result).toEqual(['balance', 'stílibra', 'stílibra'])
    })

    it('should handle empty columns', () => {
      const line = 'balance | | stílibra'
      const boundaries = [8, 9]
      const result = parser.split_into_columns(line, boundaries)
      expect(result).toEqual(['balance', '', 'stílibra'])
    })
  })

  describe('Entry Parsing', () => {
    it('should parse dual table entry', () => {
      const line = 'balance | stílibra | stílibra'
      const columnInfo = {
        table_type: 'dual' as const,
        columns: ['English', 'Ancient', 'Modern'],
        boundaries: [8, 17]
      }
      
      const result = parser.parse_entry_line(line, columnInfo)
      expect(result).toBeDefined()
      expect(result?.english).toBe('balance')
      expect(result?.ancient).toBe('stílibra')
      expect(result?.modern).toBe('stílibra')
    })

    it('should parse single table entry (ancient)', () => {
      const line = 'balance | stílibra'
      const columnInfo = {
        table_type: 'single' as const,
        columns: ['English', 'Ancient'],
        boundaries: [8]
      }
      
      const result = parser.parse_entry_line(line, columnInfo)
      expect(result).toBeDefined()
      expect(result?.english).toBe('balance')
      expect(result?.ancient).toBe('stílibra')
      expect(result?.modern).toBeUndefined()
    })

    it('should handle missing translations', () => {
      const line = 'balance | | stílibra'
      const columnInfo = {
        table_type: 'dual' as const,
        columns: ['English', 'Ancient', 'Modern'],
        boundaries: [8, 9]
      }
      
      const result = parser.parse_entry_line(line, columnInfo)
      expect(result).toBeDefined()
      expect(result?.english).toBe('balance')
      expect(result?.ancient).toBe('')
      expect(result?.modern).toBe('stílibra')
    })
  })

  describe('Dual Table Layout Parsing', () => {
    it('should parse complete dual table', () => {
      const lines = [
        'English | Ancient | Modern',
        'balance | stílibra | stílibra',
        'flame   | flamë    | flama'
      ]
      
      const result = parser.parse_dual_table_layout(lines)
      expect(result).toHaveLength(2)
      expect(result[0].english).toBe('balance')
      expect(result[0].ancient).toBe('stílibra')
      expect(result[0].modern).toBe('stílibra')
      expect(result[1].english).toBe('flame')
      expect(result[1].ancient).toBe('flamë')
      expect(result[1].modern).toBe('flama')
    })

    it('should handle empty dual table', () => {
      const lines = ['English | Ancient | Modern']
      const result = parser.parse_dual_table_layout(lines)
      expect(result).toHaveLength(0)
    })
  })

  describe('Single Table Layout Parsing', () => {
    it('should parse ancient-only table', () => {
      const lines = [
        'English | Ancient',
        'balance | stílibra',
        'flame   | flamë'
      ]
      
      const result = parser.parse_single_table_layout(lines)
      expect(result).toHaveLength(2)
      expect(result[0].english).toBe('balance')
      expect(result[0].ancient).toBe('stílibra')
      expect(result[0].modern).toBeUndefined()
    })

    it('should parse modern-only table', () => {
      const lines = [
        'English | Modern',
        'balance | stílibra',
        'flame   | flama'
      ]
      
      const result = parser.parse_single_table_layout(lines)
      expect(result).toHaveLength(2)
      expect(result[0].english).toBe('balance')
      expect(result[0].modern).toBe('stílibra')
      expect(result[0].ancient).toBeUndefined()
    })
  })

  describe('Table Cluster Detection', () => {
    it('should detect dual table clusters', () => {
      const lines = [
        'English | Ancient | Modern',
        'balance | stílibra | stílibra',
        'flame   | flamë    | flama',
        '',
        'English | Ancient | Modern',
        'memory  | memoror  | memoria'
      ]
      
      const result = parser.detect_dual_table_clusters(lines)
      expect(result).toHaveLength(2)
      expect(result[0].entries).toHaveLength(2)
      expect(result[1].entries).toHaveLength(1)
    })

    it('should handle single table clusters', () => {
      const lines = [
        'English | Ancient',
        'balance | stílibra',
        'flame   | flamë'
      ]
      
      const result = parser.detect_dual_table_clusters(lines)
      expect(result).toHaveLength(0) // Should not detect as dual table
    })
  })

  describe('Complete Page Parsing', () => {
    it('should parse page with dual tables', () => {
      const pageText = `English | Ancient | Modern
balance | stílibra | stílibra
flame   | flamë    | flama

English | Ancient | Modern
memory  | memoror  | memoria`

      const result = parser.parse_page(pageText, 1)
      expect(result.entries).toHaveLength(3)
      expect(result.entries[0].english).toBe('balance')
      expect(result.entries[1].english).toBe('flame')
      expect(result.entries[2].english).toBe('memory')
    })

    it('should handle page with no tables', () => {
      const pageText = `This is just some text
with no table structure
at all.`

      const result = parser.parse_page(pageText, 1)
      expect(result.entries).toHaveLength(0)
    })

    it('should handle malformed table data', () => {
      const pageText = `English | Ancient | Modern
| | 
balance | stílibra | stílibra
| | stílibra`

      const result = parser.parse_page(pageText, 1)
      expect(result.entries).toHaveLength(1)
      expect(result.entries[0].english).toBe('balance')
    })
  })
})
