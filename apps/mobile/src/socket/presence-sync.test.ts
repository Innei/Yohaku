import { describe, expect, it } from 'vitest'

import {
  applyPresenceLeave,
  applyPresenceUpdate,
  presenceRoomQueryKey,
} from './presence-sync'

describe('presenceRoomQueryKey', () => {
  it('matches the reading-presence query key', () => {
    expect(presenceRoomQueryKey('article-n1')).toEqual([
      'activity',
      'presence',
      'article-n1',
    ])
  })
})

describe('applyPresenceUpdate', () => {
  it('inserts and replaces by identity', () => {
    const next = applyPresenceUpdate(
      { a: { identity: 'a', position: 10 } },
      { identity: 'b', position: 40, roomName: 'article-n1' },
    )
    expect(next).toEqual({
      a: { identity: 'a', position: 10 },
      b: { identity: 'b', position: 40, roomName: 'article-n1' },
    })
    expect(
      applyPresenceUpdate(next, { identity: 'a', position: 90 }),
    ).toMatchObject({ a: { identity: 'a', position: 90 } })
  })

  it('ignores payloads without an identity', () => {
    const room = { a: { identity: 'a', position: 1 } }
    expect(applyPresenceUpdate(room, { position: 2 })).toBe(room)
  })
})

describe('applyPresenceLeave', () => {
  it('drops the identity and leaves the rest', () => {
    expect(
      applyPresenceLeave(
        {
          a: { identity: 'a', position: 1 },
          b: { identity: 'b', position: 2 },
        },
        'a',
      ),
    ).toEqual({ b: { identity: 'b', position: 2 } })
  })
})
