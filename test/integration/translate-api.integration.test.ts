import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'

let POST: (request: any) => Promise<Response>

describe('POST /api/translate', () => {
  before(async () => {
    const Module = require('module')
    const originalLoad = Module._load

    Module._load = (request: string, parent: any, isMain: boolean) => {
      if (request === 'next/server') {
        return {
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

      if (request === '@/lib/translator') {
        const translatorPath = `${process.cwd()}/dist-test/lib/translator/index.js`
        return originalLoad(translatorPath, parent, isMain)
      }

      if (request === '@/lib/metrics') {
        const metricsPath = `${process.cwd()}/dist-test/lib/metrics.js`
        return originalLoad(metricsPath, parent, isMain)
      }

      return originalLoad(request, parent, isMain)
    }

    const route = await import('../../app/api/translate/route')
    POST = route.POST
    Module._load = originalLoad
  })

  it('returns a successful translation response', async () => {
    const request = {
      json: async () => ({ text: 'balance memory', variant: 'ancient' })
    } as any

    const response = await POST(request)
    assert.equal(response.status, 200)

    const body = await response.json()
    assert.equal(body.libran, 'stílibror memorior')
    assert.equal(body.confidence, 1)
    assert.equal(body.wordCount, 2)
    assert.equal(body.variant, 'ancient')
  })

  it('rejects invalid payloads', async () => {
    const request = {
      json: async () => ({ text: 123 })
    } as any

    const response = await POST(request)
    assert.equal(response.status, 400)

    const body = await response.json()
    assert.equal(body.error, 'Text is required and must be a string')
  })

  it('enforces allowed translation variants', async () => {
    const request = {
      json: async () => ({ text: 'Hello', variant: 'future' })
    } as any

    const response = await POST(request)
    assert.equal(response.status, 400)

    const body = await response.json()
    assert.equal(body.error, 'Variant must be either "ancient" or "modern"')
  })
})
