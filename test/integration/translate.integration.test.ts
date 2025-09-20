import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { translate } from '../../lib/translator'

describe('translate (integration)', () => {
  it('translates text using bundled dictionaries', () => {
    const result = translate('Hello, world!', 'ancient')

    assert.equal(result.libran, 'Salaam, dunya!')
    assert.equal(result.confidence, 1)
    assert.equal(result.wordCount, 2)
  })

  it('retains unknown words and calculates confidence', () => {
    const result = translate('Hello unknown magic', 'ancient')

    assert.equal(result.libran, 'Salaam unknown sihr')
    assert.equal(result.wordCount, 3)
    assert.equal(result.confidence, 2 / 3)
  })

  it('preserves spacing and punctuation in longer phrases', () => {
    const text = 'The sky, the earth, and the sea.'
    const result = translate(text, 'ancient')

    assert.equal(result.libran, 'Al samaa, al ard, wa al bahr.')
  })
})
