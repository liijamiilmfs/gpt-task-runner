import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { translate } from '../../lib/translator'

describe('translate (integration)', () => {
  it('translates text using bundled dictionaries', () => {
    const result = translate('balance, memory!', 'ancient')

    assert.equal(result.libran, 'stílibror, memorior!')
    assert.equal(result.confidence, 1)
    assert.equal(result.wordCount, 2)
  })

  it('retains unknown words and calculates confidence', () => {
    const result = translate('balance unknown magic', 'ancient')

    assert.equal(result.libran, 'stílibror unknown magic')
    assert.equal(result.wordCount, 3)
    assert.equal(result.confidence, 1 / 3)
  })

  it('preserves spacing and punctuation in longer phrases', () => {
    const text = 'The balance, the memory, and the love.'
    const result = translate(text, 'ancient')

    assert.equal(result.libran, 'The stílibror, the memorior, etron the dragostor.')
  })
})
