import { NextRequest, NextResponse } from 'next/server'
import { formatMetrics } from '@/lib/metrics'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const format = url.searchParams.get('format') as 'json' | 'prometheus' | 'text' || 'json'
    
    // Validate format parameter
    if (!['json', 'prometheus', 'text'].includes(format)) {
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
    console.error('Metrics endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    )
  }
}
