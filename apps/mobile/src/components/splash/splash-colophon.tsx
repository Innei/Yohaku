import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import { bundledOwnerAvatar } from 'yohaku-mobile-overlay/bundled-assets'

import { displaySite, type OwnerSnapshot } from '@/owner/snapshot'
import { splashTiming } from '@/theme/splash-timing'

export function SplashColophon({
  owner,
  nameColor,
  siteColor,
}: {
  nameColor: string
  owner: OwnerSnapshot | null
  siteColor: string
}) {
  if (!owner) return null
  const avatar = resolveAvatarSource(owner.avatarUrl)
  return (
    <View style={styles.root}>
      {avatar ? <Image source={avatar} style={styles.avatar} /> : null}
      <Text style={[styles.name, { color: nameColor }]}>{owner.name}</Text>
      <Text style={[styles.site, { color: siteColor }]}>
        {displaySite(owner.siteHost)}
      </Text>
    </View>
  )
}

function resolveAvatarSource(
  remoteUrl: string | null,
): ImageSourcePropType | null {
  if (bundledOwnerAvatar) return bundledOwnerAvatar
  if (!remoteUrl) return null
  return { uri: remoteUrl }
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: splashTiming.colophon.stackGap,
  },
  avatar: {
    width: splashTiming.markSize,
    height: splashTiming.markSize,
    borderRadius: splashTiming.markSize / 2,
  },
  name: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 18,
  },
  site: {
    fontSize: 10,
    letterSpacing: 1.2,
    lineHeight: 12,
  },
})
