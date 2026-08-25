import { describe, expect, it } from 'vitest'

import { ApiError, extractServerMessage, formatApiErrorLine } from './errors'

describe('formatApiErrorLine', () => {
  it('prefers HTTP status and the server message', () => {
    expect(
      formatApiErrorLine(
        new ApiError(403, 'HTTP 403 /ai/insights/article/1 {}', 'Forbidden'),
      ),
    ).toBe('HTTP 403 Forbidden')
  })

  it('falls back to the thrown message when the server sent no copy', () => {
    expect(formatApiErrorLine(new ApiError(422, 'HTTP 422 /ai/x {}'))).toBe(
      'HTTP 422 /ai/x {}',
    )
  })

  it('keeps a generic Error message', () => {
    expect(formatApiErrorLine(new Error('Aborted'))).toBe('Aborted')
  })
})

describe('extractServerMessage', () => {
  it('reads mx-core { error: { message } } envelopes', () => {
    expect(
      extractServerMessage(
        '{"error":{"code":"HTTP_ERROR","message":"Forbidden resource"}}',
      ),
    ).toBe('Forbidden resource')
  })
})
