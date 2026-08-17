export const TAB_AVATAR_POINT_SIZE = 30

export type TabAvatarIconSource = {
  height: number
  scale: number
  uri: string
  width: number
}

// Native UITabBarItem cannot apply borderRadius. JS only declares the point
// size / decode scale; TabBarDomain circularizes whatever original-mode
// bitmap lands on the Me tab, including a late square load that would
// otherwise overwrite a circular PNG.
export function tabAvatarIconSource(
  source: string | TabAvatarIconSource,
  scale = 3,
): TabAvatarIconSource {
  if (typeof source === 'string') {
    return {
      height: TAB_AVATAR_POINT_SIZE,
      scale,
      uri: source,
      width: TAB_AVATAR_POINT_SIZE,
    }
  }
  return source
}
