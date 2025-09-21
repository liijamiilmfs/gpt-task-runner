import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { metrics, MetricsCollector, formatMetrics } from '../../lib/metrics'

describe('MetricsCollector', () => {
  let collector: MetricsCollector

  beforeEach(() => {
    collector = new MetricsCollector()
  })

  describe('recordRequest', () => {
    it('records successful translation request', () => {
      collector.recordRequest('translation', true, 100, 50)
      const data = collector.getMetrics()
      
      assert.equal(data.totalRequests, 1)
      assert.equal(data.successfulRequests, 1)
      assert.equal(data.failedRequests, 0)
      assert.equal(data.translationRequests, 1)
      assert.equal(data.ttsRequests, 0)
      assert.equal(data.totalCharactersProcessed, 50)
      assert.equal(data.averageCharactersPerRequest, 50)
      assert.equal(data.maxCharactersInRequest, 50)
    })

    it('records failed TTS request', () => {
      collector.recordRequest('tts', false, 200, 30)
      const data = collector.getMetrics()
      
      assert.equal(data.totalRequests, 1)
      assert.equal(data.successfulRequests, 0)
      assert.equal(data.failedRequests, 1)
      assert.equal(data.translationRequests, 0)
      assert.equal(data.ttsRequests, 1)
      assert.equal(data.totalCharactersProcessed, 30)
    })

    it('calculates average response time correctly', () => {
      collector.recordRequest('translation', true, 100, 10)
      collector.recordRequest('translation', true, 200, 20)
      collector.recordRequest('translation', true, 300, 30)
      
      const data = collector.getMetrics()
      assert.equal(data.averageResponseTime, 200)
      assert.equal(data.maxResponseTime, 300)
      assert.equal(data.minResponseTime, 100)
    })

    it('tracks maximum characters in request', () => {
      collector.recordRequest('translation', true, 100, 50)
      collector.recordRequest('translation', true, 100, 30)
      collector.recordRequest('translation', true, 100, 80)
      
      const data = collector.getMetrics()
      assert.equal(data.maxCharactersInRequest, 80)
    })
  })

  describe('recordCacheHit', () => {
    it('records cache hits and misses', () => {
      collector.recordCacheHit(true)
      collector.recordCacheHit(true)
      collector.recordCacheHit(false)
      
      const data = collector.getMetrics()
      assert.equal(data.cacheHits, 2)
      assert.equal(data.cacheMisses, 1)
      assert.equal(data.cacheHitRate, 2/3)
    })

    it('handles zero cache requests', () => {
      const data = collector.getMetrics()
      assert.equal(data.cacheHitRate, 0)
    })
  })

  describe('recordError', () => {
    it('records different error types', () => {
      collector.recordError('validation_error', 'Invalid input')
      collector.recordError('validation_error', 'Missing field')
      collector.recordError('translation_error', 'Translation failed')
      
      const data = collector.getMetrics()
      assert.equal(data.errorCounts['validation_error'], 2)
      assert.equal(data.errorCounts['translation_error'], 1)
      assert.equal(data.lastError, 'Translation failed')
      assert.ok(data.lastErrorTime)
    })
  })

  describe('recordTranslation', () => {
    it('records ancient translation metrics', () => {
      collector.recordTranslation('ancient', 0.8, 2)
      collector.recordTranslation('ancient', 0.9, 1)
      
      const data = collector.getMetrics()
      assert.equal(data.ancientTranslations, 2)
      assert.equal(data.modernTranslations, 0)
      assert.equal(data.unknownTokens, 3)
      assert.ok(Math.abs(data.averageConfidence - 0.85) < 0.001)
    })

    it('records modern translation metrics', () => {
      collector.recordTranslation('modern', 0.7, 1)
      collector.recordTranslation('modern', 0.9, 0)
      
      const data = collector.getMetrics()
      assert.equal(data.ancientTranslations, 0)
      assert.equal(data.modernTranslations, 2)
      assert.equal(data.unknownTokens, 1)
      assert.equal(data.averageConfidence, 0.8)
    })

    it('calculates average confidence correctly', () => {
      collector.recordTranslation('ancient', 0.6, 1)
      collector.recordTranslation('modern', 0.8, 2)
      collector.recordTranslation('ancient', 1.0, 0)
      
      const data = collector.getMetrics()
      assert.ok(Math.abs(data.averageConfidence - 0.8) < 0.001) // (0.6 + 0.8 + 1.0) / 3
    })
  })

  describe('recordTTSGeneration', () => {
    it('records TTS generation metrics', () => {
      collector.recordTTSGeneration(5.5)
      collector.recordTTSGeneration(3.2)
      
      const data = collector.getMetrics()
      assert.equal(data.audioFilesGenerated, 2)
      assert.equal(data.totalAudioDuration, 8.7)
      assert.equal(data.averageAudioDuration, 4.35)
    })
  })

  describe('reset', () => {
    it('resets all metrics to initial state', () => {
      collector.recordRequest('translation', true, 100, 50)
      collector.recordError('test_error', 'Test message')
      collector.recordTranslation('ancient', 0.8, 1)
      
      collector.reset()
      
      const data = collector.getMetrics()
      assert.equal(data.totalRequests, 0)
      assert.equal(data.successfulRequests, 0)
      assert.equal(data.failedRequests, 0)
      assert.equal(data.errorCounts['test_error'], undefined)
      assert.equal(data.ancientTranslations, 0)
      assert.equal(data.unknownTokens, 0)
    })
  })
})

describe('formatMetrics', () => {
  beforeEach(() => {
    metrics.reset()
  })

  it('formats metrics as JSON', () => {
    metrics.recordRequest('translation', true, 100, 50)
    const result = formatMetrics('json')
    
    const parsed = JSON.parse(result)
    assert.equal(parsed.totalRequests, 1)
    assert.equal(parsed.successfulRequests, 1)
  })

  it('formats metrics as Prometheus format', () => {
    metrics.recordRequest('translation', true, 100, 50)
    metrics.recordCacheHit(true)
    
    const result = formatMetrics('prometheus')
    
    assert.ok(result.includes('libran_total_requests 1'))
    assert.ok(result.includes('libran_successful_requests 1'))
    assert.ok(result.includes('libran_cache_hits 1'))
    assert.ok(result.includes('# HELP'))
    assert.ok(result.includes('# TYPE'))
  })

  it('formats metrics as text', () => {
    metrics.recordRequest('translation', true, 100, 50)
    metrics.recordTranslation('ancient', 0.8, 1)
    
    const result = formatMetrics('text')
    
    assert.ok(result.includes('=== Librán Voice Forge Metrics ==='))
    assert.ok(result.includes('Total Requests: 1'))
    assert.ok(result.includes('Ancient Translations: 1'))
    assert.ok(result.includes('Average Confidence: 80.00%'))
  })

  it('defaults to JSON format', () => {
    metrics.recordRequest('translation', true, 100, 50)
    const result = formatMetrics()
    
    const parsed = JSON.parse(result)
    assert.equal(parsed.totalRequests, 1)
  })
})
