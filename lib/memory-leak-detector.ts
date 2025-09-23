/**
 * Memory Leak Detection Utility
 * 
 * This utility helps detect potential memory leaks by tracking:
 * - Event listener counts
 * - Object URL counts (using ObjectURLManager)
 * - DOM element counts
 * - Component mount/unmount cycles
 */

import { objectURLManager } from './object-url-manager'

interface MemoryStats {
  eventListeners: number
  objectUrls: number
  domElements: number
  timestamp: number
}

class MemoryLeakDetector {
  private static instance: MemoryLeakDetector
  private stats: MemoryStats[] = []
  private isMonitoring = false
  private intervalId: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): MemoryLeakDetector {
    if (!MemoryLeakDetector.instance) {
      MemoryLeakDetector.instance = new MemoryLeakDetector()
    }
    return MemoryLeakDetector.instance
  }

  /**
   * Start monitoring memory usage
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) {
      console.warn('[MemoryLeakDetector] Already monitoring')
      return
    }

    this.isMonitoring = true
    console.log('[MemoryLeakDetector] Starting memory monitoring...')

    this.intervalId = setInterval(() => {
      // Add a small delay to let Object URLs settle before counting
      // This helps avoid false positives from timing issues
      setTimeout(() => {
        this.captureStats()
      }, 200) // Increased delay to account for audio element cleanup timing
    }, intervalMs)

    // Capture initial stats
    this.captureStats()
  }

  /**
   * Stop monitoring memory usage
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.warn('[MemoryLeakDetector] Not currently monitoring')
      return
    }

    this.isMonitoring = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    console.log('[MemoryLeakDetector] Stopped monitoring')
    this.printReport()
  }

  /**
   * Capture current memory statistics
   */
  private captureStats(): void {
    const stats: MemoryStats = {
      eventListeners: this.countEventListeners(),
      objectUrls: this.countObjectUrls(),
      domElements: this.countDOMElements(),
      timestamp: Date.now()
    }

    this.stats.push(stats)
    console.log('[MemoryLeakDetector] Stats captured:', stats)
  }

  /**
   * Count active event listeners (approximation)
   */
  private countEventListeners(): number {
    // This is a rough approximation - browsers don't expose exact listener counts
    // We can count by looking at common elements that might have listeners
    const elementsWithListeners = document.querySelectorAll('audio, button, input, form')
    return elementsWithListeners.length
  }

  /**
   * Count active object URLs (approximation)
   */
  private countObjectUrls(): number {
    // Use the Object URL Manager to get accurate count
    const count = objectURLManager.getActiveCount()
    
    // Debug logging to help identify the source
    if (count > 0) {
      console.log('[MemoryLeakDetector] Found Object URLs:', count)
      const activeURLs = objectURLManager.getActiveURLs()
      activeURLs.forEach((url, index) => {
        console.log(`[MemoryLeakDetector] URL ${index + 1}:`, url)
      })
    }
    
    return count
  }

  /**
   * Count DOM elements
   */
  private countDOMElements(): number {
    return document.querySelectorAll('*').length
  }

  /**
   * Print a memory leak report
   */
  private printReport(): void {
    if (this.stats.length < 2) {
      console.log('[MemoryLeakDetector] Not enough data for report')
      return
    }

    const first = this.stats[0]
    const last = this.stats[this.stats.length - 1]
    const duration = (last.timestamp - first.timestamp) / 1000

    console.log('\n=== Memory Leak Detection Report ===')
    console.log(`Monitoring duration: ${duration.toFixed(1)}s`)
    console.log(`Data points: ${this.stats.length}`)
    console.log('\nChanges:')
    console.log(`Event Listeners: ${first.eventListeners} → ${last.eventListeners} (${last.eventListeners - first.eventListeners})`)
    console.log(`Object URLs: ${first.objectUrls} → ${last.objectUrls} (${last.objectUrls - first.objectUrls})`)
    console.log(`DOM Elements: ${first.domElements} → ${last.domElements} (${last.domElements - first.domElements})`)

    // Check for potential leaks
    const eventListenerGrowth = last.eventListeners - first.eventListeners
    const objectUrlGrowth = last.objectUrls - first.objectUrls
    const domElementGrowth = last.domElements - first.domElements

    console.log('\nPotential Issues:')
    if (eventListenerGrowth > 5) {
      console.warn(`⚠️  Event listener growth: +${eventListenerGrowth} (potential leak)`)
    }
    if (objectUrlGrowth > 0) {
      console.warn(`⚠️  Object URL growth: +${objectUrlGrowth} (potential leak)`)
    }
    if (domElementGrowth > 10) {
      console.warn(`⚠️  DOM element growth: +${domElementGrowth} (potential leak)`)
    }

    if (eventListenerGrowth <= 5 && objectUrlGrowth <= 0 && domElementGrowth <= 10) {
      console.log('✅ No significant memory leaks detected')
    }

    console.log('=====================================\n')
  }

  /**
   * Get current stats
   */
  getCurrentStats(): MemoryStats | null {
    if (this.stats.length === 0) return null
    return this.stats[this.stats.length - 1]
  }

  /**
   * Get all captured stats
   */
  getAllStats(): MemoryStats[] {
    return [...this.stats]
  }

  /**
   * Clear all captured stats
   */
  clearStats(): void {
    this.stats = []
    console.log('[MemoryLeakDetector] Stats cleared')
  }
}

// Export singleton instance
export const memoryLeakDetector = MemoryLeakDetector.getInstance()

// Export for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).memoryLeakDetector = memoryLeakDetector
  console.log('[MemoryLeakDetector] Available as window.memoryLeakDetector')
}
