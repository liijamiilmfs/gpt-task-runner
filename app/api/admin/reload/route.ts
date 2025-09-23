import { NextRequest, NextResponse } from 'next/server'
import { clearCache, reloadDictionary } from '@/lib/translator/dictionary-loader'
import { log, generateCorrelationId } from '@/lib/logger'

// Force dynamic rendering since this is an admin endpoint
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const requestId = generateCorrelationId()
  
  log.apiRequest('POST', '/api/admin/reload', requestId)

  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    log.warn('Admin reload endpoint accessed in production', {
      event: 'ADMIN_ACCESS_DENIED',
      corr_id: requestId,
      ctx: { environment: process.env.NODE_ENV }
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Admin endpoints are only available in development mode',
        environment: process.env.NODE_ENV
      },
      { status: 403 }
    )
  }

  try {
    const { variant, action = 'reload' } = await request.json().catch(() => ({}))
    
    log.info('Admin reload request', {
      event: 'ADMIN_RELOAD_REQUEST',
      corr_id: requestId,
      ctx: { variant, action }
    })

    if (action === 'clear') {
      // Clear all caches
      clearCache()
      
      log.info('Dictionary caches cleared', {
        event: 'DICTIONARY_CACHE_CLEARED',
        corr_id: requestId
      })
      
      return NextResponse.json({
        success: true,
        message: 'All dictionary caches cleared',
        action: 'clear',
        timestamp: new Date().toISOString()
      })
    }
    
    if (action === 'reload') {
      if (variant && ['ancient', 'modern'].includes(variant)) {
        // Reload specific variant
        const dictionary = await reloadDictionary(variant as 'ancient' | 'modern')
        
        log.info('Dictionary reloaded', {
          event: 'DICTIONARY_RELOADED',
          corr_id: requestId,
          ctx: { 
            variant,
            wordCount: dictionary.metadata?.wordCount || 0,
            version: dictionary.version
          }
        })
        
        return NextResponse.json({
          success: true,
          message: `${variant} dictionary reloaded successfully`,
          action: 'reload',
          variant,
          dictionary: {
            version: dictionary.version,
            language: dictionary.language,
            wordCount: dictionary.metadata?.wordCount || 0,
            lastUpdated: dictionary.metadata?.lastUpdated
          },
          timestamp: new Date().toISOString()
        })
      } else {
        // Reload all dictionaries
        const ancientDict = await reloadDictionary('ancient')
        const modernDict = await reloadDictionary('modern')
        
        log.info('All dictionaries reloaded', {
          event: 'ALL_DICTIONARIES_RELOADED',
          corr_id: requestId,
          ctx: { 
            ancientWordCount: ancientDict.metadata?.wordCount || 0,
            modernWordCount: modernDict.metadata?.wordCount || 0
          }
        })
        
        return NextResponse.json({
          success: true,
          message: 'All dictionaries reloaded successfully',
          action: 'reload',
          dictionaries: {
            ancient: {
              version: ancientDict.version,
              language: ancientDict.language,
              wordCount: ancientDict.metadata?.wordCount || 0,
              lastUpdated: ancientDict.metadata?.lastUpdated
            },
            modern: {
              version: modernDict.version,
              language: modernDict.language,
              wordCount: modernDict.metadata?.wordCount || 0,
              lastUpdated: modernDict.metadata?.lastUpdated
            }
          },
          timestamp: new Date().toISOString()
        })
      }
    }

    // Invalid action
    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid action. Use "reload" or "clear"',
        validActions: ['reload', 'clear']
      },
      { status: 400 }
    )

  } catch (error) {
    log.errorWithContext(
      error instanceof Error ? error : new Error('Unknown error'),
      'ADMIN_RELOAD_ERROR',
      requestId
    )
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reload dictionaries',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const requestId = generateCorrelationId()
  
  log.apiRequest('GET', '/api/admin/reload', requestId)

  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Admin endpoints are only available in development mode',
        environment: process.env.NODE_ENV
      },
      { status: 403 }
    )
  }

  // Return endpoint information
  return NextResponse.json({
    success: true,
    message: 'Dictionary reload endpoint',
    environment: process.env.NODE_ENV,
    endpoints: {
      'POST /api/admin/reload': {
        description: 'Reload or clear dictionary caches',
        body: {
          action: 'reload | clear',
          variant: 'ancient | modern (optional, defaults to all)'
        },
        examples: [
          { action: 'reload' },
          { action: 'reload', variant: 'ancient' },
          { action: 'clear' }
        ]
      }
    },
    timestamp: new Date().toISOString()
  })
}
