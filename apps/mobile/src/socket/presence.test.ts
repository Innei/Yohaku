import { describe, expect, it } from 'vitest'

import {
  articleRoomName,
  buildUpdatePresenceBody,
  shouldJoinPresenceRoom,
} from './presence'

describe('articleRoomName', () => {
  it('matches the web room prefix', () => {
    expect(articleRoomName('note-1')).toBe('article-note-1')
  })
})

describe('shouldJoinPresenceRoom', () => {
  it('joins only when the article is readable in-app', () => {
    expect(shouldJoinPresenceRoom('n1', false)).toBe(true)
    expect(shouldJoinPresenceRoom(undefined, false)).toBe(false)
    expect(shouldJoinPresenceRoom('n1', true)).toBe(false)
  })
})

describe('buildUpdatePresenceBody', () => {
  it('sends the web presence contract', () => {
    expect(
      buildUpdatePresenceBody({
        displayName: 'iPhone 16 Pro',
        identity: 'anon0001',
        position: 42,
        readerId: undefined,
        roomName: 'article-n1',
        sid: 'sock20chars___________',
        ts: 1_700_000_000_000,
      }),
    ).toEqual({
      displayName: 'iPhone 16 Pro',
      identity: 'anon0001',
      position: 42,
      roomName: 'article-n1',
      sid: 'sock20chars___________',
      ts: 1_700_000_000_000,
    })
  })

  it('includes readerId when signed in', () => {
    expect(
      buildUpdatePresenceBody({
        displayName: 'Ada',
        identity: 'r1',
        position: 10,
        readerId: 'r1',
        roomName: 'article-n1',
        sid: 'sid',
        ts: 1,
      }),
    ).toMatchObject({ readerId: 'r1' })
  })
})
