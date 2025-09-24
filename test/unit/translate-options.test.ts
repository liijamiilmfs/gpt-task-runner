import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { translate } from '../../lib/translator'

describe('translate with custom dictionary', () => {
  it('uses the provided dictionary when supplied', async () => {
    const result = await translate('Hello friend', 'ancient', {
      dictionary: {
        version: '1.0.0',
        language: 'ancient-libran',
        metadata: {
          description: 'Test dictionary',
          lastUpdated: new Date().toISOString(),
          wordCount: 2
        },
        entries: {
          hello: 'salaam',
          friend: 'sadiq'
        },
        rules: {}
      }
    })

    assert.equal(result.libran, 'Salaam sadiq')
    assert.equal(result.confidence, 1)
    assert.equal(result.wordCount, 2)
  })

  it('falls back to stemmed forms for simple suffixes', async () => {
    const result = await translate('Walks', 'ancient', {
      dictionary: {
        version: '1.0.0',
        language: 'ancient-libran',
        metadata: {
          description: 'Test dictionary',
          lastUpdated: new Date().toISOString(),
          wordCount: 1
        },
        entries: {
          walk: 'tor'
        },
        rules: {}
      }
    })

    assert.equal(result.libran, 'Tor')
    assert.equal(result.confidence, 1)
  })

  it('applies modern sound shifts to -or endings', async () => {
    const result = await translate('Valor', 'modern', {
      dictionary: {
        version: '1.0.0',
        language: 'modern-libran',
        metadata: {
          description: 'Test dictionary',
          lastUpdated: new Date().toISOString(),
          wordCount: 1
        },
        entries: {
          valor: 'valor'
        },
        rules: {}
      }
    })

    assert.equal(result.libran, 'Vala')
  })
})
