import { describe, expect, it } from 'vitest'

import type { SessionUser } from '@/auth/session-store'

import { showDeleteAccount, showMyComments } from './activity-visibility'

const reader: SessionUser = {
  id: '1',
  name: '阿崔',
  email: null,
  image: null,
  handle: 'cuix',
  role: 'reader',
  provider: 'github',
}

describe('activity visibility', () => {
  it('hides comments and delete when signed out', () => {
    expect(showMyComments(null)).toBe(false)
    expect(showDeleteAccount(null)).toBe(false)
  })
  it('shows comments for any session and hides delete for owner', () => {
    expect(showMyComments(reader)).toBe(true)
    expect(showDeleteAccount(reader)).toBe(true)
    expect(showDeleteAccount({ ...reader, role: 'owner' })).toBe(false)
  })
})
