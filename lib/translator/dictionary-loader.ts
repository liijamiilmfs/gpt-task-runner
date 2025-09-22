import * as fs from 'fs'
import path from 'path'
import { watch } from 'fs'

export interface DictionaryEntry {
  [key: string]: string | {
    base?: string
    plural?: string
    possessive?: string
    present?: string
    past?: string
    future?: string
  }
}

export interface Dictionary {
  version?: string
  language?: string
  metadata?: {
    description: string
    lastUpdated: string
    wordCount: number
  }
  entries: DictionaryEntry
  phrases?: DictionaryEntry
  rules?: {
    [key: string]: any
  }
}

const dictionaryCache = new Map<string, Dictionary>()
let fileWatchers: Map<string, any> = new Map()
let isWatching = false

export async function loadDictionary(variant: 'ancient' | 'modern'): Promise<Dictionary> {
  // Check cache first
  if (dictionaryCache.has(variant)) {
    return dictionaryCache.get(variant)!
  }

  try {
    const dictionaryPath = path.join(process.cwd(), 'lib', 'translator', 'dictionaries', `${variant}.json`)
    const dictionaryData = fs.readFileSync(dictionaryPath, 'utf-8')
    const rawDictionary = JSON.parse(dictionaryData)
    
    // Convert simple key-value format to Dictionary interface
    const dictionary: Dictionary = {
      version: '1.0.0',
      language: `${variant}-libran`,
      metadata: {
        description: `${variant} Librán dictionary`,
        lastUpdated: new Date().toISOString(),
        wordCount: Object.keys(rawDictionary).length
      },
      entries: rawDictionary,
      rules: {}
    }
    
    // Cache the dictionary
    dictionaryCache.set(variant, dictionary)
    
    // Start watching the file for changes (only in development)
    if (process.env.NODE_ENV === 'development' && !isWatching) {
      startFileWatching()
    }
    
    return dictionary
  } catch (error) {
    console.error(`Failed to load ${variant} dictionary:`, error)
    throw new Error(`Dictionary not found: ${variant}.json`)
  }
}

export function getDictionaryEntry(
  dictionary: Dictionary, 
  word: string
): string | undefined {
  const lowerWord = word.toLowerCase()
  
  // Check phrases first (higher priority)
  if (dictionary.phrases && dictionary.phrases[lowerWord]) {
    const entry = dictionary.phrases[lowerWord]
    return typeof entry === 'string' ? entry : entry.base
  }
  
  // Check regular entries
  if (dictionary.entries[lowerWord]) {
    const entry = dictionary.entries[lowerWord]
    return typeof entry === 'string' ? entry : entry.base
  }
  
  return undefined
}

export function getDictionaryRules(dictionary: Dictionary): Record<string, any> {
  return dictionary.rules || {}
}

// File watching and cache management functions
function startFileWatching() {
  if (isWatching) return
  
  isWatching = true
  const dictionariesDir = path.join(process.cwd(), 'lib', 'translator', 'dictionaries')
  
  console.log('[DictionaryLoader] Starting file watching for hot-reload in development mode')
  
  // Watch for changes to dictionary files
  const variants: ('ancient' | 'modern')[] = ['ancient', 'modern']
  
  variants.forEach(variant => {
    setupFileWatcher(variant, dictionariesDir)
  })
}

function setupFileWatcher(variant: 'ancient' | 'modern', dictionariesDir: string) {
  const filePath = path.join(dictionariesDir, `${variant}.json`)
  
  if (fs.existsSync(filePath)) {
    const watcher = watch(filePath, (eventType, filename) => {
      if (eventType === 'change') {
        console.log(`[DictionaryLoader] Dictionary file changed: ${variant}.json`)
        invalidateCache(variant)
      } else if (eventType === 'rename') {
        console.log(`[DictionaryLoader] Dictionary file renamed (atomic save): ${variant}.json`)
        invalidateCache(variant)
        
        // Re-attach watcher after rename (atomic save creates new file)
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            console.log(`[DictionaryLoader] Re-attaching watcher for ${variant}.json after rename`)
            // Close old watcher
            const oldWatcher = fileWatchers.get(variant)
            if (oldWatcher) {
              oldWatcher.close()
            }
            // Setup new watcher
            setupFileWatcher(variant, dictionariesDir)
          }
        }, 100) // Small delay to ensure file is fully written
      }
    })
    
    fileWatchers.set(variant, watcher)
    console.log(`[DictionaryLoader] Watching ${filePath}`)
  }
}

function invalidateCache(variant: 'ancient' | 'modern') {
  console.log(`[DictionaryLoader] Invalidating cache for ${variant} dictionary`)
  dictionaryCache.delete(variant)
  
  // Reload the dictionary immediately
  loadDictionary(variant).catch(error => {
    console.error(`[DictionaryLoader] Failed to reload ${variant} dictionary:`, error)
  })
}

export function clearCache() {
  console.log('[DictionaryLoader] Clearing all dictionary caches')
  dictionaryCache.clear()
}

export function reloadDictionary(variant: 'ancient' | 'modern'): Promise<Dictionary> {
  console.log(`[DictionaryLoader] Manually reloading ${variant} dictionary`)
  dictionaryCache.delete(variant)
  return loadDictionary(variant)
}

export function stopWatching() {
  if (!isWatching) return
  
  console.log('[DictionaryLoader] Stopping file watchers')
  fileWatchers.forEach((watcher, variant) => {
    watcher.close()
    console.log(`[DictionaryLoader] Stopped watching ${variant}.json`)
  })
  
  fileWatchers.clear()
  isWatching = false
}










