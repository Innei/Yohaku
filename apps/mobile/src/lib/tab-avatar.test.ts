import { describe, expect, it } from 'vitest'

import { TAB_AVATAR_POINT_SIZE, tabAvatarIconSource } from './tab-avatar'

describe('tabAvatarIconSource', () => {
  it('declares tab-bar point size and decode scale so a 3x PNG is not shown as 90pt', () => {
    expect(tabAvatarIconSource('file:///tmp/yohaku-tab-avatar.png', 3)).toEqual(
      {
        height: TAB_AVATAR_POINT_SIZE,
        scale: 3,
        uri: 'file:///tmp/yohaku-tab-avatar.png',
        width: TAB_AVATAR_POINT_SIZE,
      },
    )
    expect(TAB_AVATAR_POINT_SIZE).toBe(30)
  })

  it('keeps the native width/height/scale when the module already sized the file', () => {
    expect(
      tabAvatarIconSource({
        height: 30,
        scale: 2,
        uri: 'file:///tmp/avatar@2x.png',
        width: 30,
      }),
    ).toEqual({
      height: 30,
      scale: 2,
      uri: 'file:///tmp/avatar@2x.png',
      width: 30,
    })
  })
})
