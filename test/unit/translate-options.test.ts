import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { translate } from '../../lib/translator'

describe('translate with custom dictionary', () => {
  it('uses the provided dictionary when supplied', () => {
    const result = translate('Hello friend', 'ancient', {
      dictionary: {
        hello: 'salaam',
        friend: 'sadiq'
      }
    })

    assert.equal(result.libran, 'Salaam sadiq')
    assert.equal(result.confidence, 1)
    assert.equal(result.wordCount, 2)
  })

  it('falls back to stemmed forms for simple suffixes', () => {
    const result = translate('Walks', 'ancient', {
      dictionary: {
        walk: 'tor'
      }
    })

    assert.equal(result.libran, 'Tor')
    assert.equal(result.confidence, 1)
  })

  it('applies modern sound shifts to -or endings', () => {
    const result = translate('Valor', 'modern', {
      dictionary: {
        valor: 'valor'
      }
    })

    assert.equal(result.libran, 'Vala')
  })
})
