export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
  timestamp: number;
}

export class MemoryMonitor {
  private snapshots: MemoryStats[] = [];
  private maxSnapshots = 100;

  /**
   * Take a memory snapshot
   */
  snapshot(): MemoryStats {
    const usage = process.memoryUsage();
    const stats: MemoryStats = {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      arrayBuffers: usage.arrayBuffers,
      timestamp: Date.now(),
    };

    this.snapshots.push(stats);

    // Keep only the most recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots = this.snapshots.slice(-this.maxSnapshots);
    }

    return stats;
  }

  /**
   * Get memory usage in MB
   */
  getMemoryUsageMB(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    arrayBuffers: number;
  } {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed / 1024 / 1024,
      heapTotal: usage.heapTotal / 1024 / 1024,
      external: usage.external / 1024 / 1024,
      rss: usage.rss / 1024 / 1024,
      arrayBuffers: usage.arrayBuffers / 1024 / 1024,
    };
  }

  /**
   * Get memory growth rate (MB per second)
   */
  getMemoryGrowthRate(): number {
    if (this.snapshots.length < 2) {
      return 0;
    }

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];

    const timeDiff = (last.timestamp - first.timestamp) / 1000; // seconds
    const memoryDiff = (last.heapUsed - first.heapUsed) / 1024 / 1024; // MB

    return timeDiff > 0 ? memoryDiff / timeDiff : 0;
  }

  /**
   * Get peak memory usage
   */
  getPeakMemoryUsage(): MemoryStats | null {
    if (this.snapshots.length === 0) {
      return null;
    }

    return this.snapshots.reduce((peak, current) =>
      current.heapUsed > peak.heapUsed ? current : peak
    );
  }

  /**
   * Check if memory usage is within limits
   */
  isWithinMemoryLimit(maxHeapMB: number): boolean {
    const current = this.getMemoryUsageMB();
    return current.heapUsed <= maxHeapMB;
  }

  /**
   * Get memory statistics summary
   */
  getSummary(): {
    current: MemoryStats;
    peak: MemoryStats | null;
    growthRate: number;
    snapshots: number;
  } {
    return {
      current: this.snapshot(),
      peak: this.getPeakMemoryUsage(),
      growthRate: this.getMemoryGrowthRate(),
      snapshots: this.snapshots.length,
    };
  }

  /**
   * Clear all snapshots
   */
  clear(): void {
    this.snapshots = [];
  }
}
