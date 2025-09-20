/**
 * Metrics collection and reporting system for Librán Voice Forge
 * Tracks requests, cache hits, characters processed, and other system metrics
 */

import { log } from './logger'

export interface MetricsData {
  // Request metrics
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  translationRequests: number
  ttsRequests: number
  
  // Cache metrics
  cacheHits: number
  cacheMisses: number
  cacheHitRate: number
  
  // Character processing metrics
  totalCharactersProcessed: number
  averageCharactersPerRequest: number
  maxCharactersInRequest: number
  
  // Performance metrics
  averageResponseTime: number
  maxResponseTime: number
  minResponseTime: number
  
  // Error metrics
  errorCounts: Record<string, number>
  lastError: string | null
  lastErrorTime: string | null
  
  // System metrics
  uptime: number
  lastRequestTime: string | null
  startTime: string
  
  // Translation-specific metrics
  ancientTranslations: number
  modernTranslations: number
  unknownTokens: number
  averageConfidence: number
  
  // TTS-specific metrics
  audioFilesGenerated: number
  totalAudioDuration: number
  averageAudioDuration: number
}

export class MetricsCollector {
  private metrics: MetricsData
  private startTime: number
  private responseTimes: number[] = []
  private maxResponseTimeHistory = 100 // Keep last 100 response times

  constructor() {
    this.startTime = Date.now()
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      translationRequests: 0,
      ttsRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      totalCharactersProcessed: 0,
      averageCharactersPerRequest: 0,
      maxCharactersInRequest: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      errorCounts: {},
      lastError: null,
      lastErrorTime: null,
      uptime: 0,
      lastRequestTime: null,
      startTime: new Date(this.startTime).toISOString(),
      ancientTranslations: 0,
      modernTranslations: 0,
      unknownTokens: 0,
      averageConfidence: 0,
      audioFilesGenerated: 0,
      totalAudioDuration: 0,
      averageAudioDuration: 0
    }
  }

  /**
   * Record a new request
   */
  recordRequest(type: 'translation' | 'tts', success: boolean, responseTime: number, characterCount: number = 0) {
    this.metrics.totalRequests++
    this.metrics.lastRequestTime = new Date().toISOString()
    
    if (success) {
      this.metrics.successfulRequests++
    } else {
      this.metrics.failedRequests++
    }

    if (type === 'translation') {
      this.metrics.translationRequests++
    } else if (type === 'tts') {
      this.metrics.ttsRequests++
    }

    // Update character metrics
    if (characterCount > 0) {
      this.metrics.totalCharactersProcessed += characterCount
      this.metrics.maxCharactersInRequest = Math.max(this.metrics.maxCharactersInRequest, characterCount)
      this.metrics.averageCharactersPerRequest = this.metrics.totalCharactersProcessed / this.metrics.totalRequests
    }

    // Update response time metrics
    this.responseTimes.push(responseTime)
    if (this.responseTimes.length > this.maxResponseTimeHistory) {
      this.responseTimes.shift()
    }
    
    this.metrics.averageResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
    this.metrics.maxResponseTime = Math.max(this.metrics.maxResponseTime, responseTime)
    this.metrics.minResponseTime = Math.min(this.metrics.minResponseTime, responseTime)

    // Update uptime
    this.metrics.uptime = Date.now() - this.startTime

    // Log request metrics
    log.debug('Request recorded', {
      type,
      success,
      responseTime,
      characterCount,
      totalRequests: this.metrics.totalRequests,
      successRate: this.metrics.successfulRequests / this.metrics.totalRequests
    })
  }

  /**
   * Record a cache hit or miss
   */
  recordCacheHit(hit: boolean) {
    if (hit) {
      this.metrics.cacheHits++
    } else {
      this.metrics.cacheMisses++
    }
    
    const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses
    this.metrics.cacheHitRate = totalCacheRequests > 0 ? this.metrics.cacheHits / totalCacheRequests : 0
  }

  /**
   * Record an error
   */
  recordError(errorType: string, errorMessage: string) {
    this.metrics.errorCounts[errorType] = (this.metrics.errorCounts[errorType] || 0) + 1
    this.metrics.lastError = errorMessage
    this.metrics.lastErrorTime = new Date().toISOString()
    
    log.warn('Error recorded', {
      errorType,
      errorMessage,
      totalErrors: Object.values(this.metrics.errorCounts).reduce((a, b) => a + b, 0)
    })
  }

  /**
   * Record translation-specific metrics
   */
  recordTranslation(variant: 'ancient' | 'modern', confidence: number, unknownTokens: number) {
    if (variant === 'ancient') {
      this.metrics.ancientTranslations++
    } else {
      this.metrics.modernTranslations++
    }
    
    this.metrics.unknownTokens += unknownTokens
    
    // Update average confidence
    const totalTranslations = this.metrics.ancientTranslations + this.metrics.modernTranslations
    this.metrics.averageConfidence = ((this.metrics.averageConfidence * (totalTranslations - 1)) + confidence) / totalTranslations
  }

  /**
   * Record TTS-specific metrics
   */
  recordTTSGeneration(duration: number) {
    this.metrics.audioFilesGenerated++
    this.metrics.totalAudioDuration += duration
    this.metrics.averageAudioDuration = this.metrics.totalAudioDuration / this.metrics.audioFilesGenerated
  }

  /**
   * Get current metrics
   */
  getMetrics(): MetricsData {
    return { ...this.metrics }
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset() {
    this.startTime = Date.now()
    this.responseTimes = []
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      translationRequests: 0,
      ttsRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      totalCharactersProcessed: 0,
      averageCharactersPerRequest: 0,
      maxCharactersInRequest: 0,
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      errorCounts: {},
      lastError: null,
      lastErrorTime: null,
      uptime: 0,
      lastRequestTime: null,
      startTime: new Date(this.startTime).toISOString(),
      ancientTranslations: 0,
      modernTranslations: 0,
      unknownTokens: 0,
      averageConfidence: 0,
      audioFilesGenerated: 0,
      totalAudioDuration: 0,
      averageAudioDuration: 0
    }
  }
}

// Global metrics instance
export const metrics = new MetricsCollector()

/**
 * Middleware to track request metrics
 */
export function trackRequestMetrics(type: 'translation' | 'tts') {
  return async (handler: Function) => {
    const startTime = Date.now()
    let success = false
    let characterCount = 0
    
    try {
      const result = await handler()
      success = true
      
      // Extract character count from result if available
      if (result && typeof result === 'object') {
        if (result.text && typeof result.text === 'string') {
          characterCount = result.text.length
        } else if (result.libran && typeof result.libran === 'string') {
          characterCount = result.libran.length
        }
      }
      
      return result
    } catch (error) {
      success = false
      metrics.recordError('request_error', error instanceof Error ? error.message : 'Unknown error')
      throw error
    } finally {
      const responseTime = Date.now() - startTime
      metrics.recordRequest(type, success, responseTime, characterCount)
    }
  }
}

/**
 * Format metrics for different output formats
 */
export function formatMetrics(format: 'json' | 'prometheus' | 'text' = 'json'): string {
  const data = metrics.getMetrics()
  
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2)
    
    case 'prometheus':
      return formatPrometheusMetrics(data)
    
    case 'text':
      return formatTextMetrics(data)
    
    default:
      return JSON.stringify(data, null, 2)
  }
}

function formatPrometheusMetrics(data: MetricsData): string {
  const lines: string[] = []
  
  // Add help comments
  lines.push('# HELP libran_total_requests Total number of requests')
  lines.push('# TYPE libran_total_requests counter')
  lines.push(`libran_total_requests ${data.totalRequests}`)
  
  lines.push('# HELP libran_successful_requests Total number of successful requests')
  lines.push('# TYPE libran_successful_requests counter')
  lines.push(`libran_successful_requests ${data.successfulRequests}`)
  
  lines.push('# HELP libran_failed_requests Total number of failed requests')
  lines.push('# TYPE libran_failed_requests counter')
  lines.push(`libran_failed_requests ${data.failedRequests}`)
  
  lines.push('# HELP libran_cache_hits Total number of cache hits')
  lines.push('# TYPE libran_cache_hits counter')
  lines.push(`libran_cache_hits ${data.cacheHits}`)
  
  lines.push('# HELP libran_cache_misses Total number of cache misses')
  lines.push('# TYPE libran_cache_misses counter')
  lines.push(`libran_cache_misses ${data.cacheMisses}`)
  
  lines.push('# HELP libran_cache_hit_rate Cache hit rate (0-1)')
  lines.push('# TYPE libran_cache_hit_rate gauge')
  lines.push(`libran_cache_hit_rate ${data.cacheHitRate}`)
  
  lines.push('# HELP libran_characters_processed Total characters processed')
  lines.push('# TYPE libran_characters_processed counter')
  lines.push(`libran_characters_processed ${data.totalCharactersProcessed}`)
  
  lines.push('# HELP libran_average_response_time_ms Average response time in milliseconds')
  lines.push('# TYPE libran_average_response_time_ms gauge')
  lines.push(`libran_average_response_time_ms ${data.averageResponseTime}`)
  
  lines.push('# HELP libran_uptime_seconds System uptime in seconds')
  lines.push('# TYPE libran_uptime_seconds gauge')
  lines.push(`libran_uptime_seconds ${data.uptime / 1000}`)
  
  return lines.join('\n')
}

function formatTextMetrics(data: MetricsData): string {
  const lines: string[] = []
  
  lines.push('=== Librán Voice Forge Metrics ===')
  lines.push(`Start Time: ${data.startTime}`)
  lines.push(`Uptime: ${Math.floor(data.uptime / 1000)}s`)
  lines.push('')
  
  lines.push('=== Request Metrics ===')
  lines.push(`Total Requests: ${data.totalRequests}`)
  lines.push(`Successful: ${data.successfulRequests}`)
  lines.push(`Failed: ${data.failedRequests}`)
  lines.push(`Translation Requests: ${data.translationRequests}`)
  lines.push(`TTS Requests: ${data.ttsRequests}`)
  lines.push('')
  
  lines.push('=== Cache Metrics ===')
  lines.push(`Cache Hits: ${data.cacheHits}`)
  lines.push(`Cache Misses: ${data.cacheMisses}`)
  lines.push(`Cache Hit Rate: ${(data.cacheHitRate * 100).toFixed(2)}%`)
  lines.push('')
  
  lines.push('=== Character Processing ===')
  lines.push(`Total Characters: ${data.totalCharactersProcessed}`)
  lines.push(`Average per Request: ${data.averageCharactersPerRequest.toFixed(2)}`)
  lines.push(`Max in Request: ${data.maxCharactersInRequest}`)
  lines.push('')
  
  lines.push('=== Performance ===')
  lines.push(`Average Response Time: ${data.averageResponseTime.toFixed(2)}ms`)
  lines.push(`Max Response Time: ${data.maxResponseTime}ms`)
  lines.push(`Min Response Time: ${data.minResponseTime === Infinity ? 'N/A' : data.minResponseTime + 'ms'}`)
  lines.push('')
  
  lines.push('=== Translation Metrics ===')
  lines.push(`Ancient Translations: ${data.ancientTranslations}`)
  lines.push(`Modern Translations: ${data.modernTranslations}`)
  lines.push(`Unknown Tokens: ${data.unknownTokens}`)
  lines.push(`Average Confidence: ${(data.averageConfidence * 100).toFixed(2)}%`)
  lines.push('')
  
  lines.push('=== TTS Metrics ===')
  lines.push(`Audio Files Generated: ${data.audioFilesGenerated}`)
  lines.push(`Total Audio Duration: ${data.totalAudioDuration.toFixed(2)}s`)
  lines.push(`Average Audio Duration: ${data.averageAudioDuration.toFixed(2)}s`)
  lines.push('')
  
  if (Object.keys(data.errorCounts).length > 0) {
    lines.push('=== Error Metrics ===')
    for (const [errorType, count] of Object.entries(data.errorCounts)) {
      lines.push(`${errorType}: ${count}`)
    }
    if (data.lastError) {
      lines.push(`Last Error: ${data.lastError}`)
      lines.push(`Last Error Time: ${data.lastErrorTime}`)
    }
  }
  
  return lines.join('\n')
}
