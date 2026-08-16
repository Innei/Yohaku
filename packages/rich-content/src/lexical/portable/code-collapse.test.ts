import { describe, expect, it } from 'vitest'

import { shouldCollapseCode } from './code-collapse'

describe('shouldCollapseCode', () => {
  it('keeps short snippets expanded', () => {
    expect(
      shouldCollapseCode(Array.from({ length: 20 }, () => 'x').join('\n')),
    ).toBe(false)
    expect(shouldCollapseCode('const a = 1')).toBe(false)
    expect(shouldCollapseCode('')).toBe(false)
  })

  it('collapses when the file is longer than 20 lines', () => {
    expect(
      shouldCollapseCode(Array.from({ length: 21 }, () => 'x').join('\n')),
    ).toBe(true)
  })
})
