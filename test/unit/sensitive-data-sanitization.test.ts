import { describe, it } from 'node:test'
import assert from 'node:assert'
import { log } from '../../lib/logger'

describe('Sensitive Data Sanitization', () => {
  it('should redact all sensitive keys, not just the first one', () => {
    // This test specifically addresses the global regex flag bug
    // where subsequent sensitive keys after the first match would leak
    
    const testData = {
      Authorization: 'Bearer sk-12345',
      authHeader: 'still here', 
      openaiKey: 'sk-67890',
      password: 'secret123',
      apiKey: 'key-abc',
      token: 'xyz789',
      credential: 'sensitive-data',
      secret: 'another-secret'
    }

    // Test the sanitizeLogData function directly
    const { sanitizeLogData } = require('../../lib/logger')
    const sanitized = sanitizeLogData(testData)
    
    // Verify all sensitive keys are redacted
    assert.strictEqual(sanitized.Authorization, '[REDACTED]', 'Authorization should be redacted')
    assert.strictEqual(sanitized.authHeader, '[REDACTED]', 'authHeader should be redacted')
    assert.strictEqual(sanitized.openaiKey, '[REDACTED]', 'openaiKey should be redacted')
    assert.strictEqual(sanitized.password, '[REDACTED]', 'password should be redacted')
    assert.strictEqual(sanitized.apiKey, '[REDACTED]', 'apiKey should be redacted')
    assert.strictEqual(sanitized.token, '[REDACTED]', 'token should be redacted')
    assert.strictEqual(sanitized.credential, '[REDACTED]', 'credential should be redacted')
    assert.strictEqual(sanitized.secret, '[REDACTED]', 'secret should be redacted')
  })

  it('should redact sensitive data in values', () => {
    const testData = {
      message: 'API key sk-12345 found in request',
      details: 'User email test@example.com logged in',
      error: 'Bearer token xyz789 expired'
    }

    // Test the sanitizeLogData function directly
    const { sanitizeLogData } = require('../../lib/logger')
    const sanitized = sanitizeLogData(testData)
    
    // Verify sensitive data in values is redacted
    assert.strictEqual(sanitized.message, 'API key [REDACTED] found in request')
    assert.strictEqual(sanitized.details, 'User email [REDACTED] logged in')
    assert.strictEqual(sanitized.error, 'Bearer [REDACTED] xyz789 expired')
  })

  it('should handle mixed sensitive and non-sensitive keys', () => {
    const testData = {
      Authorization: 'Bearer sk-12345',
      normalField: 'this should remain',
      password: 'secret123',
      anotherNormalField: 'this should also remain',
      apiKey: 'key-abc'
    }

    // Test the sanitizeLogData function directly
    const { sanitizeLogData } = require('../../lib/logger')
    const sanitized = sanitizeLogData(testData)
    
    // Verify sensitive keys are redacted
    assert.strictEqual(sanitized.Authorization, '[REDACTED]')
    assert.strictEqual(sanitized.password, '[REDACTED]')
    assert.strictEqual(sanitized.apiKey, '[REDACTED]')
    
    // Verify non-sensitive keys are preserved
    assert.strictEqual(sanitized.normalField, 'this should remain')
    assert.strictEqual(sanitized.anotherNormalField, 'this should also remain')
  })
})
