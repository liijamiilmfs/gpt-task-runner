/**
 * Object URL Manager
 * Tracks blob URLs at the source instead of scanning the DOM
 */

class ObjectURLManager {
  private activeURLs = new Set<string>()
  private originalCreateObjectURL: typeof URL.createObjectURL
  private originalRevokeObjectURL: typeof URL.revokeObjectURL

  constructor() {
    // Store original methods
    this.originalCreateObjectURL = URL.createObjectURL
    this.originalRevokeObjectURL = URL.revokeObjectURL

    // Override URL methods to track blob URLs
    URL.createObjectURL = (blob: Blob) => {
      const url = this.originalCreateObjectURL(blob)
      this.activeURLs.add(url)
      console.log(`[ObjectURLManager] Created: ${url}, Active count: ${this.activeURLs.size}`)
      return url
    }

    URL.revokeObjectURL = (url: string) => {
      this.activeURLs.delete(url)
      console.log(`[ObjectURLManager] Revoked: ${url}, Active count: ${this.activeURLs.size}`)
      this.originalRevokeObjectURL(url)
    }
  }

  getActiveCount(): number {
    return this.activeURLs.size
  }

  getActiveURLs(): string[] {
    return Array.from(this.activeURLs)
  }

  hasURL(url: string): boolean {
    return this.activeURLs.has(url)
  }

  // Clean up all URLs (emergency cleanup)
  cleanupAll(): void {
    console.log(`[ObjectURLManager] Emergency cleanup: revoking ${this.activeURLs.size} URLs`)
    this.activeURLs.forEach(url => {
      this.originalRevokeObjectURL(url)
    })
    this.activeURLs.clear()
  }

  // Restore original methods (for cleanup)
  restore(): void {
    URL.createObjectURL = this.originalCreateObjectURL
    URL.revokeObjectURL = this.originalRevokeObjectURL
  }
}

// Create global instance
export const objectURLManager = new ObjectURLManager()

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).objectURLManager = objectURLManager
}
