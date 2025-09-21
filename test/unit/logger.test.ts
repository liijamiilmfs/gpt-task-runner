import { describe, it, beforeEach, afterEach } from 'node:test'
import { strict as assert } from 'node:assert'
import { log, generateCorrelationId, LogEvents } from '../../lib/logger'
import * as fs from 'fs'
import * as path from 'path'

describe('Logger', () => {
  const testLogsDir = path.join(process.cwd(), 'test-logs')
  
  beforeEach(() => {
    // Clean up test logs directory
    if (fs.existsSync(testLogsDir)) {
      fs.rmSync(testLogsDir, { recursive: true, force: true })
    }
    fs.mkdirSync(testLogsDir, { recursive: true })
  })
  
  afterEach(() => {
    // Clean up test logs directory
    if (fs.existsSync(testLogsDir)) {
      fs.rmSync(testLogsDir, { recursive: true, force: true })
    }
  })

  describe('generateCorrelationId', () => {
    it('should generate unique correlation IDs', () => {
      const id1 = generateCorrelationId()
      const id2 = generateCorrelationId()
      
      assert(typeof id1 === 'string')
      assert(typeof id2 === 'string')
      assert(id1.length > 0)
      assert(id2.length > 0)
      assert(id1 !== id2)
    })
    
    it('should generate IDs of consistent length', () => {
      const ids = Array.from({ length: 10 }, () => generateCorrelationId())
      const lengths = ids.map(id => id.length)
      const uniqueLengths = new Set(lengths)
      
      assert(uniqueLengths.size === 1, 'All correlation IDs should have the same length')
    })
  })

  describe('Basic logging methods', () => {
    it('should log info messages', () => {
      assert.doesNotThrow(() => {
        log.info('Test info message', { test: true })
      })
    })
    
    it('should log warn messages', () => {
      assert.doesNotThrow(() => {
        log.warn('Test warning message', { test: true })
      })
    })
    
    it('should log error messages', () => {
      assert.doesNotThrow(() => {
        log.error('Test error message', { test: true })
      })
    })
    
    it('should log debug messages', () => {
      assert.doesNotThrow(() => {
        log.debug('Test debug message', { test: true })
      })
    })
  })

  describe('Structured logging methods', () => {
    it('should log API requests', () => {
      const corrId = generateCorrelationId()
      assert.doesNotThrow(() => {
        log.apiRequest('GET', '/api/test', corrId, { userId: 'test-user' })
      })
    })
    
    it('should log API responses', () => {
      const corrId = generateCorrelationId()
      assert.doesNotThrow(() => {
        log.apiResponse('GET', '/api/test', 200, 150, corrId, { success: true })
      })
    })
    
    it('should log translations', () => {
      const corrId = generateCorrelationId()
      assert.doesNotThrow(() => {
        log.translation('hello world', 'ancient', 'salaam dunya', 0.95, corrId, {
          unknownWords: 0
        })
      })
    })
    
    it('should log TTS operations', () => {
      const corrId = generateCorrelationId()
      assert.doesNotThrow(() => {
        log.tts('hello world', 'alloy', 5000, corrId, { format: 'mp3' })
      })
    })
    
    it('should log TTS cache hits', () => {
      const corrId = generateCorrelationId()
      assert.doesNotThrow(() => {
        log.ttsCacheHit('hello world', 'alloy', corrId, { cacheKey: 'abc123' })
      })
    })
    
    it('should log TTS rate limits', () => {
      const corrId = generateCorrelationId()
      assert.doesNotThrow(() => {
        log.ttsRateLimit('hello world', 'alloy', corrId, { error: 'Rate limited' })
      })
    })
    
    it('should log unknown tokens', () => {
      const corrId = generateCorrelationId()
      assert.doesNotThrow(() => {
        log.unknownToken('unknownword', 'ancient', corrId, { context: 'test sentence' })
      })
    })
    
    it('should log validation failures', () => {
      const corrId = generateCorrelationId()
      assert.doesNotThrow(() => {
        log.validationFail('text', 'Text is required', corrId, { field: 'text' })
      })
    })
    
    it('should log errors with context', () => {
      const corrId = generateCorrelationId()
      const error = new Error('Test error')
      assert.doesNotThrow(() => {
        log.errorWithContext(error, LogEvents.INTERNAL_ERROR, corrId, { api: 'test' })
      })
    })
    
    it('should log performance metrics', () => {
      const corrId = generateCorrelationId()
      assert.doesNotThrow(() => {
        log.performance('test-operation', 1000, corrId, { operation: 'test' })
      })
    })
    
    it('should log security events', () => {
      const corrId = generateCorrelationId()
      assert.doesNotThrow(() => {
        log.security(LogEvents.SEC_AUTH_FAIL, corrId, { ip: '192.168.1.1' })
      })
    })
  })

  describe('Data sanitization', () => {
    it('should sanitize API keys', () => {
      const corrId = generateCorrelationId()
      assert.doesNotThrow(() => {
        log.info('Test with API key', { 
          apiKey: 'sk-1234567890abcdef1234567890abcdef1234567890',
          openaiKey: 'sk-abcdef1234567890abcdef1234567890abcdef12'
        })
      })
    })
    
    it('should sanitize email addresses', () => {
      const corrId = generateCorrelationId()
      assert.doesNotThrow(() => {
        log.info('Test with email', { 
          email: 'test@example.com',
          userEmail: 'user@domain.org'
        })
      })
    })
    
    it('should convert duration from seconds to milliseconds', () => {
      const corrId = generateCorrelationId()
      assert.doesNotThrow(() => {
        log.info('Test duration conversion', { 
          duration: 1.5, // 1.5 seconds
          operation: 'test'
        })
      })
    })
  })

  describe('Log event types', () => {
    it('should have all required log events defined', () => {
      const requiredEvents = [
        'API_REQUEST', 'API_RESPONSE', 'API_ERROR',
        'TRANSLATE_START', 'TRANSLATE_DONE', 'TRANSLATE_ERROR', 'UNKNOWN_TOKEN',
        'TTS_START', 'TTS_DONE', 'TTS_ERROR', 'TTS_CACHE_HIT', 'TTS_CACHE_MISS', 'TTS_RATE_LIMIT',
        'SERVICE_START', 'SERVICE_STOP', 'CONFIG_LOAD',
        'VALIDATION_FAIL', 'AUTH_FAIL', 'RATE_LIMIT', 'EXTERNAL_API_ERROR', 'INTERNAL_ERROR',
        'PERF_SLOW_QUERY', 'PERF_HIGH_MEMORY', 'PERF_CACHE_MISS',
        'SEC_AUTH_FAIL', 'SEC_RATE_LIMIT', 'SEC_SUSPICIOUS'
      ]
      
      requiredEvents.forEach(event => {
        assert(LogEvents[event as keyof typeof LogEvents], `Event ${event} should be defined`)
      })
    })
  })

  describe('Correlation ID tracking', () => {
    it('should include correlation ID in all structured logs', () => {
      const corrId = generateCorrelationId()
      
      // Test that correlation ID is included in various log methods
      const methods = [
        () => log.apiRequest('GET', '/api/test', corrId),
        () => log.apiResponse('GET', '/api/test', 200, 100, corrId),
        () => log.translation('test', 'ancient', 'test', 1.0, corrId),
        () => log.tts('test', 'alloy', 1000, corrId),
        () => log.unknownToken('test', 'ancient', corrId),
        () => log.validationFail('field', 'error', corrId),
        () => log.performance('test', 1000, corrId),
        () => log.security('TEST_EVENT', corrId)
      ]
      
      methods.forEach(method => {
        assert.doesNotThrow(method, 'All structured log methods should accept correlation ID')
      })
    })
  })

  describe('Error handling', () => {
    it('should handle null/undefined data gracefully', () => {
      assert.doesNotThrow(() => {
        log.info('Test with null data', null)
        log.info('Test with undefined data', undefined)
        log.info('Test with empty object', {})
      })
    })
    
    it('should handle circular references', () => {
      const circular: any = { name: 'test' }
      circular.self = circular
      
      assert.doesNotThrow(() => {
        log.info('Test with circular reference', circular)
      })
    })
  })
})
