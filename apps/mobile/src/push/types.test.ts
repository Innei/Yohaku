import { describe, expect, it } from 'vitest'

import { DEFAULT_PUSH_PREFERENCES } from './types'

describe('DEFAULT_PUSH_PREFERENCES', () => {
  it('is frozen with every topic enabled', () => {
    expect(DEFAULT_PUSH_PREFERENCES).toEqual({
      contentPost: true,
      contentNote: true,
      contentRecently: true,
      commentReplied: true,
    })
    expect(Object.isFrozen(DEFAULT_PUSH_PREFERENCES)).toBe(true)
    expect(() => {
      // @ts-expect-error — freeze is the runtime contract
      DEFAULT_PUSH_PREFERENCES.contentPost = false
    }).toThrow()
  })
})
