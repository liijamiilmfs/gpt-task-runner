/**
 * Global cleanup handler for intervals and timers
 */

import { log } from './logger'

// Track all intervals and timers for cleanup
const intervals = new Set<NodeJS.Timeout>()
const timeouts = new Set<NodeJS.Timeout>()

/**
 * Track an interval for cleanup
 */
export function trackInterval(interval: NodeJS.Timeout): NodeJS.Timeout {
  intervals.add(interval)
  return interval
}

/**
 * Track a timeout for cleanup
 */
export function trackTimeout(timeout: NodeJS.Timeout): NodeJS.Timeout {
  timeouts.add(timeout)
  return timeout
}

/**
 * Clear an interval and remove from tracking
 */
export function clearTrackedInterval(interval: NodeJS.Timeout): void {
  if (interval) {
    clearInterval(interval)
    intervals.delete(interval)
  }
}

/**
 * Clear a timeout and remove from tracking
 */
export function clearTrackedTimeout(timeout: NodeJS.Timeout): void {
  if (timeout) {
    clearTimeout(timeout)
    timeouts.delete(timeout)
  }
}

/**
 * Clear all tracked intervals and timeouts
 */
export function cleanupAll(): void {
  // Don't use logger in cleanup - it can cause cascading errors
  console.log('Cleaning up all tracked intervals and timeouts', {
    intervalCount: intervals.size,
    timeoutCount: timeouts.size
  })
  
  intervals.forEach(interval => {
    try {
      clearInterval(interval)
    } catch (error) {
      console.error('Error clearing interval:', error)
    }
  })
  intervals.clear()
  
  timeouts.forEach(timeout => {
    try {
      clearTimeout(timeout)
    } catch (error) {
      console.error('Error clearing timeout:', error)
    }
  })
  timeouts.clear()
}

// Set up global cleanup handlers
if (typeof process !== 'undefined') {
  process.on('exit', cleanupAll)
  process.on('SIGINT', () => {
    cleanupAll()
    // Force exit immediately to avoid logger issues
    process.exit(0)
  })
  process.on('SIGTERM', () => {
    cleanupAll()
    // Force exit immediately to avoid logger issues
    process.exit(0)
  })
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception, cleaning up:', error)
    cleanupAll()
    // Force exit immediately to avoid logger issues
    process.exit(1)
  })
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection, cleaning up:', reason)
    cleanupAll()
    // Force exit immediately to avoid logger issues
    process.exit(1)
  })
}
