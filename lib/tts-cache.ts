import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';
import { Buffer } from 'buffer';
import { log } from './logger';

export interface TTSCacheEntry {
  hash: string;
  libranText: string;
  voice: string;
  format: string;
  model: string;
  createdAt: string;
  fileSize: number;
  audioDuration: number;
  accessCount: number;
  lastAccessed: string;
}

export interface TTSCacheStats {
  totalEntries: number;
  totalSize: number;
  totalAccesses: number;
  hitRate: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}

class TTSCache {
  private static instance: TTSCache;
  private cacheDir: string;
  private indexFile: string;
  private isInitialized: boolean = false;
  private cache: Map<string, TTSCacheEntry> = new Map();
  private maxCacheSize: number;
  private maxCacheAge: number; // in milliseconds

  private constructor() {
    this.cacheDir = path.join(process.cwd(), 'build', 'tts-cache');
    this.indexFile = path.join(this.cacheDir, 'index.json');
    this.maxCacheSize = parseInt(process.env.TTS_CACHE_MAX_SIZE || '100') * 1024 * 1024; // 100MB default
    this.maxCacheAge = parseInt(process.env.TTS_CACHE_MAX_AGE || '7') * 24 * 60 * 60 * 1000; // 7 days default
  }

  public static getInstance(): TTSCache {
    if (!TTSCache.instance) {
      TTSCache.instance = new TTSCache();
    }
    return TTSCache.instance;
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create cache directory if it doesn't exist
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
        log.info('Created TTS cache directory', { cacheDir: this.cacheDir });
      }

      // Load existing cache index
      await this.loadCacheIndex();

      // Clean up expired entries
      await this.cleanupExpiredEntries();

      this.isInitialized = true;
      log.info('TTS cache initialized', { 
        entries: this.cache.size,
        cacheDir: this.cacheDir,
        maxSize: this.maxCacheSize,
        maxAge: this.maxCacheAge
      });
    } catch (error) {
      log.error('Failed to initialize TTS cache', { 
        error: error instanceof Error ? error.message : String(error),
        cacheDir: this.cacheDir
      });
      throw error;
    }
  }

  private async loadCacheIndex(): Promise<void> {
    try {
      if (!fs.existsSync(this.indexFile)) {
        log.info('No existing TTS cache index found, starting fresh');
        return;
      }

      const indexContent = fs.readFileSync(this.indexFile, 'utf8');
      const entries: TTSCacheEntry[] = JSON.parse(indexContent);
      
      this.cache.clear();
      for (const entry of entries) {
        this.cache.set(entry.hash, entry);
      }

      log.info('Loaded TTS cache index', { entries: entries.length });
    } catch (error) {
      log.error('Failed to load TTS cache index', { 
        error: error instanceof Error ? error.message : String(error)
      });
      // Start with empty cache if index is corrupted
      this.cache.clear();
    }
  }

  private async saveCacheIndex(): Promise<void> {
    try {
      const entries = Array.from(this.cache.values());
      fs.writeFileSync(this.indexFile, JSON.stringify(entries, null, 2), 'utf8');
    } catch (error) {
      log.error('Failed to save TTS cache index', { 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  public generateHash(libranText: string, voice: string, format: string, model: string): string {
    const content = `${libranText}|${voice}|${format}|${model}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  public async getCachedAudio(hash: string): Promise<Buffer | null> {
    try {
      await this.initialize();

      const entry = this.cache.get(hash);
      if (!entry) {
        return null;
      }

      const filePath = path.join(this.cacheDir, `${hash}.${entry.format}`);
      
      // Check if file still exists
      if (!fs.existsSync(filePath)) {
        log.warn('TTS cache file missing, removing from index', { hash, filePath });
        this.cache.delete(hash);
        await this.saveCacheIndex();
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = new Date().toISOString();
      await this.saveCacheIndex();

      log.debug('TTS cache hit', { 
        hash, 
        voice: entry.voice, 
        format: entry.format,
        accessCount: entry.accessCount,
        fileSize: entry.fileSize
      });

      const buffer = fs.readFileSync(filePath, { encoding: null });
      return buffer;
    } catch (error) {
      log.error('Failed to get cached audio', { 
        error: error instanceof Error ? error.message : String(error),
        hash
      });
      return null;
    }
  }

  public async storeCachedAudio(
    hash: string,
    libranText: string,
    voice: string,
    format: string,
    model: string,
    audioBuffer: Buffer,
    audioDuration: number
  ): Promise<void> {
    try {
      await this.initialize();

      const filePath = path.join(this.cacheDir, `${hash}.${format}`);
      
      // Write audio file
      fs.writeFileSync(filePath, audioBuffer);

      // Create cache entry
      const entry: TTSCacheEntry = {
        hash,
        libranText,
        voice,
        format,
        model,
        createdAt: new Date().toISOString(),
        fileSize: audioBuffer.length,
        audioDuration,
        accessCount: 0,
        lastAccessed: new Date().toISOString()
      };

      // Store in memory cache
      this.cache.set(hash, entry);

      // Save index
      await this.saveCacheIndex();

      // Check if we need to clean up due to size limits
      await this.cleanupIfNeeded();

      log.info('TTS audio cached', { 
        hash, 
        voice, 
        format, 
        fileSize: audioBuffer.length,
        audioDuration,
        totalEntries: this.cache.size
      });
    } catch (error) {
      log.error('Failed to store cached audio', { 
        error: error instanceof Error ? error.message : String(error),
        hash,
        voice,
        format
      });
      // Don't throw - caching failure shouldn't break TTS generation
    }
  }

  private async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now();
    const expiredHashes: string[] = [];

    for (const [hash, entry] of Array.from(this.cache.entries())) {
      const createdAt = new Date(entry.createdAt).getTime();
      if (now - createdAt > this.maxCacheAge) {
        expiredHashes.push(hash);
      }
    }

    for (const hash of expiredHashes) {
      await this.removeCacheEntry(hash);
    }

    if (expiredHashes.length > 0) {
      log.info('Cleaned up expired TTS cache entries', { count: expiredHashes.length });
    }
  }

  private async cleanupIfNeeded(): Promise<void> {
    let totalSize = 0;
    for (const entry of Array.from(this.cache.values())) {
      totalSize += entry.fileSize;
    }

    if (totalSize <= this.maxCacheSize) {
      return;
    }

    log.info('TTS cache size limit exceeded, cleaning up', { 
      totalSize, 
      maxSize: this.maxCacheSize 
    });

    // Sort entries by last accessed (oldest first) and remove until under limit
    const sortedEntries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime());

    let currentSize = totalSize;
    for (const [hash] of Array.from(sortedEntries)) {
      if (currentSize <= this.maxCacheSize * 0.8) { // Clean to 80% of limit
        break;
      }
      
      // Get entry size before deletion
      const entry = this.cache.get(hash);
      if (entry) {
        currentSize -= entry.fileSize;
      }
      
      await this.removeCacheEntry(hash);
    }

    log.info('TTS cache cleanup completed', { 
      newSize: currentSize, 
      entriesRemoved: sortedEntries.length - this.cache.size 
    });
  }

  private async removeCacheEntry(hash: string): Promise<void> {
    const entry = this.cache.get(hash);
    if (!entry) {
      return;
    }

    try {
      const filePath = path.join(this.cacheDir, `${hash}.${entry.format}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      log.warn('Failed to remove TTS cache file', { 
        error: error instanceof Error ? error.message : String(error),
        hash,
        filePath: path.join(this.cacheDir, `${hash}.${entry.format}`)
      });
    }

    this.cache.delete(hash);
  }

  public async getCacheStats(): Promise<TTSCacheStats> {
    await this.initialize();

    let totalSize = 0;
    let totalAccesses = 0;
    let oldestDate: number | null = null;
    let newestDate: number | null = null;

    for (const entry of Array.from(this.cache.values())) {
      totalSize += entry.fileSize;
      totalAccesses += entry.accessCount;

      const createdAt = new Date(entry.createdAt).getTime();
      if (oldestDate === null || createdAt < oldestDate) {
        oldestDate = createdAt;
      }
      if (newestDate === null || createdAt > newestDate) {
        newestDate = createdAt;
      }
    }

    const totalRequests = totalAccesses + this.cache.size; // Cache hits + misses
    const hitRate = totalRequests > 0 ? (totalAccesses / totalRequests) * 100 : 0;

    return {
      totalEntries: this.cache.size,
      totalSize,
      totalAccesses,
      hitRate,
      oldestEntry: oldestDate ? new Date(oldestDate).toISOString() : null,
      newestEntry: newestDate ? new Date(newestDate).toISOString() : null
    };
  }

  public async clearCache(): Promise<void> {
    try {
      await this.initialize();

      // Remove all cache files
      for (const [hash, entry] of Array.from(this.cache.entries())) {
        const filePath = path.join(this.cacheDir, `${hash}.${entry.format}`);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Clear memory cache
      this.cache.clear();

      // Remove index file
      if (fs.existsSync(this.indexFile)) {
        fs.unlinkSync(this.indexFile);
      }

      log.info('TTS cache cleared', { cacheDir: this.cacheDir });
    } catch (error) {
      log.error('Failed to clear TTS cache', { 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  public async getCacheEntries(): Promise<TTSCacheEntry[]> {
    await this.initialize();
    return Array.from(this.cache.values());
  }
}

export const ttsCache = TTSCache.getInstance();
