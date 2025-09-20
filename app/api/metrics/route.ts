import { NextRequest, NextResponse } from 'next/server'
import { formatMetrics } from '@/lib/metrics'
import { log } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7)
  const startTime = Date.now()
  
  log.apiRequest('GET', '/api/metrics', { requestId })

  try {
    const url = new URL(request.url)
    const format = url.searchParams.get('format') as 'json' | 'prometheus' | 'text' || 'json'
    
    log.info('Metrics request', { requestId, format })
    
    // Validate format parameter
    if (!['json', 'prometheus', 'text'].includes(format)) {
      log.warn('Invalid metrics format requested', { requestId, format })
      return NextResponse.json(
        { error: 'Invalid format parameter. Must be json, prometheus, or text' },
        { status: 400 }
      )
    }
    
    const metricsData = formatMetrics(format)
    
    // Set appropriate content type based on format
    const contentType = format === 'prometheus' 
      ? 'text/plain; version=0.0.4; charset=utf-8'
      : format === 'text'
      ? 'text/plain; charset=utf-8'
      : 'application/json'
    
    const responseTime = Date.now() - startTime
    log.apiResponse('GET', '/api/metrics', 200, responseTime, { requestId, format })
    
    return new NextResponse(metricsData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    log.errorWithContext(error as Error, 'Metrics API', { requestId })
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    )
  }
}
