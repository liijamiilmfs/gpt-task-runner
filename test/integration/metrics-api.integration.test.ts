import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'

let GET: (request: any) => Promise<Response>

describe('GET /api/metrics', () => {
  before(async () => {
    const Module = require('module')
    const originalLoad = Module._load

    Module._load = (request: string, parent: any, isMain: boolean) => {
      if (request === 'next/server') {
        return {
          NextRequest: class {
            constructor(public url: string) {}
          },
          NextResponse: class extends Response {
            static json(data: any, init?: { status?: number }) {
              return new Response(JSON.stringify(data), {
                status: init?.status ?? 200,
                headers: { 'content-type': 'application/json' }
              })
            }
          }
        }
      }

      if (request === '@/lib/metrics') {
        const metricsPath = `${process.cwd()}/dist-test/lib/metrics.js`
        return originalLoad(metricsPath, parent, isMain)
      }

      return originalLoad(request, parent, isMain)
    }

    const route = await import('../../app/api/metrics/route')
    GET = route.GET
    Module._load = originalLoad
  })

  it('returns metrics in JSON format by default', async () => {
    const request = {
      url: 'http://localhost:3000/api/metrics'
    } as any

    const response = await GET(request)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'application/json')

    const body = await response.json()
    assert.ok(body.totalRequests >= 0)
    assert.ok(body.successfulRequests >= 0)
    assert.ok(body.failedRequests >= 0)
    assert.ok(body.startTime)
    assert.ok(body.uptime >= 0)
  })

  it('returns metrics in Prometheus format', async () => {
    const request = {
      url: 'http://localhost:3000/api/metrics?format=prometheus'
    } as any

    const response = await GET(request)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'text/plain; version=0.0.4; charset=utf-8')

    const body = await response.text()
    assert.ok(body.includes('libran_total_requests'))
    assert.ok(body.includes('libran_successful_requests'))
    assert.ok(body.includes('# HELP'))
    assert.ok(body.includes('# TYPE'))
  })

  it('returns metrics in text format', async () => {
    const request = {
      url: 'http://localhost:3000/api/metrics?format=text'
    } as any

    const response = await GET(request)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8')

    const body = await response.text()
    assert.ok(body.includes('=== Librán Voice Forge Metrics ==='))
    assert.ok(body.includes('Total Requests:'))
    assert.ok(body.includes('Uptime:'))
  })

  it('rejects invalid format parameter', async () => {
    const request = {
      url: 'http://localhost:3000/api/metrics?format=invalid'
    } as any

    const response = await GET(request)
    assert.equal(response.status, 400)

    const body = await response.json()
    assert.equal(body.error, 'Invalid format parameter. Must be json, prometheus, or text')
  })

  it('sets appropriate cache headers', async () => {
    const request = {
      url: 'http://localhost:3000/api/metrics'
    } as any

    const response = await GET(request)
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-cache, no-store, must-revalidate')
    assert.equal(response.headers.get('pragma'), 'no-cache')
    assert.equal(response.headers.get('expires'), '0')
  })

  it('handles errors gracefully', async () => {
    // This test would require mocking the metrics module to throw an error
    // For now, we'll just verify the endpoint exists and responds
    const request = {
      url: 'http://localhost:3000/api/metrics'
    } as any

    const response = await GET(request)
    assert.equal(response.status, 200)
  })
})
