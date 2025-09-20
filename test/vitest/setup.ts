/**
 * Vitest setup file for enhanced importer tests
 * Configures test environment and global utilities
 */

import { beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// Test data directory
const TEST_DATA_DIR = path.join(__dirname, '../data')
const TEST_OUTPUT_DIR = path.join(__dirname, '../output')

beforeAll(async () => {
  // Create test data directories
  if (!fs.existsSync(TEST_DATA_DIR)) {
    fs.mkdirSync(TEST_DATA_DIR, { recursive: true })
  }
  
  if (!fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true })
  }

  // Create sample test data
  const sampleData = {
    ancient: {
      balance: 'stílibra',
      flame: 'flamë',
      memory: 'memoror'
    },
    modern: {
      balance: 'stílibra',
      flame: 'flama',
      memory: 'memoria'
    }
  }

  fs.writeFileSync(
    path.join(TEST_DATA_DIR, 'sample.json'),
    JSON.stringify(sampleData, null, 2)
  )

  // Create sample exclude terms
  const excludeTerms = ['test', 'example', 'debug']
  fs.writeFileSync(
    path.join(TEST_DATA_DIR, 'exclude_terms.txt'),
    excludeTerms.join('\n')
  )
})

afterAll(async () => {
  // Clean up test data
  if (fs.existsSync(TEST_DATA_DIR)) {
    fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true })
  }
  
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true })
  }
})

// Global test utilities
declare global {
  namespace Vi {
    interface Assertion<T> {
      toBeValidEntry(): T
      toHaveValidTranslation(): T
    }
  }
}

// Custom matchers for dictionary entries
expect.extend({
  toBeValidEntry(received: any) {
    const pass = received && 
      typeof received.english === 'string' && 
      received.english.length > 0 &&
      (received.ancient || received.modern)

    return {
      pass,
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid entry`
          : `Expected ${received} to be a valid entry with English word and at least one translation`
    }
  },

  toHaveValidTranslation(received: any) {
    const pass = received && 
      typeof received === 'string' && 
      received.length > 0 &&
      !received.includes('—') &&
      !received.includes('N/A')

    return {
      pass,
      message: () => 
        pass 
          ? `Expected ${received} not to be a valid translation`
          : `Expected ${received} to be a valid translation (non-empty, not placeholder)`
    }
  }
})
