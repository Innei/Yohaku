import { Image, StyleSheet, Text, View } from 'react-native'

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
  return (
    <View style={styles.root}>
      {owner.avatarUrl ? (
        <Image source={{ uri: owner.avatarUrl }} style={styles.avatar} />
      ) : null}
      <Text style={[styles.name, { color: nameColor }]}>— {owner.name}</Text>
      <Text style={[styles.site, { color: siteColor }]}>
        {displaySite(owner.siteHost)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'flex-end',
    gap: 8,
  },
  avatar: {
    width: splashTiming.colophon.avatar,
    height: splashTiming.colophon.avatar,
    borderRadius: splashTiming.colophon.avatar / 2,
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
