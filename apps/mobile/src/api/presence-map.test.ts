import { describe, expect, it } from 'vitest'

import { readPresenceMap } from './presence-map'

describe('readPresenceMap', () => {
  it('unwraps the mx-core { data } envelope without camelizing identity keys', () => {
    expect(
      readPresenceMap({
        data: {
          presence: {
            AbCdef12: { identity: 'AbCdef12', position: 41 },
            owner_User_1: { identity: 'owner_user_1', position: 8 },
          },
          readers: { User_1: { id: 'User_1' } },
        },
      }),
    ).toEqual({
      AbCdef12: { identity: 'AbCdef12', position: 41 },
      owner_User_1: { identity: 'owner_user_1', position: 8 },
    })
  })

  it('accepts an already-unwrapped payload', () => {
    expect(
      readPresenceMap({
        presence: { a1: { identity: 'a1', position: 0 } },
      }),
    ).toEqual({ a1: { identity: 'a1', position: 0 } })
  })

  it('returns an empty map when presence is missing', () => {
    expect(readPresenceMap(null)).toEqual({})
    expect(readPresenceMap({ data: {} })).toEqual({})
    expect(readPresenceMap({ data: { readers: {} } })).toEqual({})
  })
})
