import { describe, expect, it } from 'vitest'

import { extractServerMessage } from './errors'

describe('extractServerMessage', () => {
  it('reads a string message', () => {
    expect(
      extractServerMessage('{"message":"You already supported this"}'),
    ).toBe('You already supported this')
  })

  it('reads the first entry of a message array', () => {
    expect(extractServerMessage('{"message":["text too long","other"]}')).toBe(
      'text too long',
    )
  })

  it('returns undefined for non-json or missing message', () => {
    expect(extractServerMessage('<html>bad gateway</html>')).toBeUndefined()
    expect(extractServerMessage('{"error":"x"}')).toBeUndefined()
    expect(extractServerMessage('')).toBeUndefined()
  })
})
