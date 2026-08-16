import { describe, expect, it } from 'vitest'

import { ApiError } from '@/api/errors'

import type { SessionUser } from './session-store'
import { reduceSession } from './session-store'

const user: SessionUser = {
  id: '1',
  name: 'Innei',
  email: 'i@innei.dev',
  image: null,
  handle: 'innei',
  role: 'owner',
  provider: 'github',
}

describe('reduceSession', () => {
  it('replaces state with a fresh user payload', () => {
    expect(reduceSession(null, { user })).toEqual(user)
  })

  it('clears state when the server reports no session', () => {
    expect(reduceSession(user, { user: null })).toBeNull()
  })

  it('clears state on 401', () => {
    expect(
      reduceSession(user, { error: new ApiError(401, 'HTTP 401') }),
    ).toBeNull()
  })

  it('keeps state on transient failures', () => {
    expect(reduceSession(user, { error: new ApiError(500, 'HTTP 500') })).toBe(
      user,
    )
    expect(reduceSession(user, { error: new Error('network down') })).toBe(user)
  })
})
