import { describe, expect, it } from 'vitest'

import {
  createAnonymousId,
  readAnonymousId,
  resolvePresenceVisitor,
} from './identity'

describe('createAnonymousId', () => {
  it('returns 8 lowercase alphanumeric characters', () => {
    expect(createAnonymousId()).toMatch(/^[\da-z]{8}$/)
  })
})

describe('readAnonymousId', () => {
  it('reuses a stored id', () => {
    expect(readAnonymousId('abc12345')).toBe('abc12345')
  })

  it('mints a new id when storage is empty or malformed', () => {
    expect(readAnonymousId(null)).toMatch(/^[\da-z]{8}$/)
    expect(readAnonymousId('TOO-LONG-AND-WRONG')).toMatch(/^[\da-z]{8}$/)
  })
})

describe('resolvePresenceVisitor', () => {
  it('uses owner_{id} when the session is the owner', () => {
    expect(
      resolvePresenceVisitor({
        anonymousId: 'anon0001',
        deviceName: 'iPhone 16 Pro',
        session: { id: 'User_1', name: 'Innei', role: 'owner' },
      }),
    ).toEqual({
      displayName: 'Innei',
      identity: 'owner_user_1',
      readerId: 'User_1',
    })
  })

  it('uses the session id for a signed-in reader', () => {
    expect(
      resolvePresenceVisitor({
        anonymousId: 'anon0001',
        deviceName: 'iPhone 16 Pro',
        session: { id: 'Reader_9', name: 'Ada', role: 'reader' },
      }),
    ).toEqual({
      displayName: 'Ada',
      identity: 'reader_9',
      readerId: 'Reader_9',
    })
  })

  it('falls back to the device name for anonymous visitors', () => {
    expect(
      resolvePresenceVisitor({
        anonymousId: 'Anon0001',
        deviceName: 'iPhone 16 Pro',
        session: null,
      }),
    ).toEqual({
      displayName: 'iPhone 16 Pro',
      identity: 'anon0001',
    })
  })

  it('omits an empty display name', () => {
    expect(
      resolvePresenceVisitor({
        anonymousId: 'anon0001',
        deviceName: '  ',
        session: { id: 'r1', name: null, role: 'reader' },
      }),
    ).toEqual({
      identity: 'r1',
      readerId: 'r1',
    })
  })
})
