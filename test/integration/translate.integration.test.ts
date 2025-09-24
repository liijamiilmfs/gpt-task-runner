import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { translate } from '../../lib/translator'

describe('translate (integration)', () => {
  it('translates text using bundled dictionaries', async () => {
    const result = await translate('Farmer, Field!', 'ancient')

    assert.equal(result.libran, 'Agricola, Ager!')
    assert.equal(result.confidence, 1)
    assert.equal(result.wordCount, 2)
  })

  it('retains unknown words and calculates confidence', async () => {
    const result = await translate('Farmer unknown magic', 'ancient')

    assert.equal(result.libran, 'Agricola unknown magic')
    assert.equal(result.wordCount, 3)
    assert.equal(result.confidence, 1 / 3)
  })

  it('preserves spacing and punctuation in longer phrases', async () => {
    const text = 'The Farmer, the Field, and the love.'
    const result = await translate(text, 'ancient')

    assert.equal(result.libran, 'The Agricola, the Ager, et the love.')
  })
})
