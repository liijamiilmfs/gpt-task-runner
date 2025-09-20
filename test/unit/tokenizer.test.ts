import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { tokenizeText, joinTokens, preserveCase } from '../../lib/translator/tokenizer'

describe('tokenizeText', () => {
  it('splits words, punctuation, whitespace, and numbers', () => {
    const tokens = tokenizeText('Hello, world! 42 times')

    assert.equal(tokens.length, 9)
    assert.deepEqual(
      tokens.map(token => token.type),
      ['word', 'punctuation', 'whitespace', 'word', 'punctuation', 'whitespace', 'number', 'whitespace', 'word']
    )

    assert.equal(tokens[0].value, 'hello')
    assert.equal(tokens[0].original, 'Hello')
    assert.equal(tokens[3].value, 'world')
    assert.equal(tokens[6].value, '42')
    assert.equal(tokens[8].value, 'times')
  })
})

describe('joinTokens', () => {
  it('reconstructs text from translated values when available', () => {
    const tokens = tokenizeText('Hello world')
    tokens[0].translatedValue = 'salaam'
    tokens[2].translatedValue = 'dunya'

    const result = joinTokens(tokens)
    assert.equal(result, 'salaam dunya')
  })
})

describe('preserveCase', () => {
  it('maintains uppercase words', () => {
    assert.equal(preserveCase('HELLO', 'salaam'), 'SALAAM')
  })

  it('maintains lowercase words', () => {
    assert.equal(preserveCase('hello', 'salaam'), 'salaam')
  })

  it('maintains capitalized words', () => {
    assert.equal(preserveCase('Hello', 'salaam'), 'Salaam')
  })
})
