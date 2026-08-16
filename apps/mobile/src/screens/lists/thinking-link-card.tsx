import { radius } from '@yohaku/design-system/tokens'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { StyleSheet, View } from 'react-native'

import type { ApiEnrichment } from '@/api/types'
import { AppText, NativePressable, RemoteImage } from '@/components/ui'
import { hrefForExternalUrl } from '@/lib/link-router'
import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

export function ThinkingLinkCard({
  enrichment,
}: {
  enrichment: ApiEnrichment
}) {
  const palette = usePalette()
  const router = useRouter()
  const poster = isPosterEnrichment(enrichment)
  const image = enrichment.thumbnailImage ?? enrichment.image
  const rating = ratingLabel(enrichment)
  const host = hostOf(enrichment.url)

  const open = async () => {
    const internal = hrefForExternalUrl(enrichment.url)
    if (internal) {
      router.push(internal)
      return
    }
    await WebBrowser.openBrowserAsync(enrichment.url)
  }

  return (
    <NativePressable
      style={[
        styles.card,
        {
          backgroundColor: palette.surface.paper,
          boxShadow: shadow.paperSmall[palette.theme],
        },
      ]}
      onPress={() => void open()}
    >
      {image?.url ? (
        <RemoteImage
          accessibilityLabel={image.alt ?? enrichment.title}
          contentFit="cover"
          uri={image.url}
          style={[
            poster ? styles.poster : styles.thumb,
            { backgroundColor: palette.neutral[3] },
          ]}
        />
      ) : null}
      <View style={styles.copy}>
        <AppText numberOfLines={2} variant="letterTitle">
          {enrichment.title}
        </AppText>
        {enrichment.description ? (
          <AppText numberOfLines={2} variant="secondary">
            {enrichment.description}
          </AppText>
        ) : null}
        <AppText numberOfLines={1} variant="meta">
          {rating ? `${host} · ${rating}` : host}
        </AppText>
      </View>
    </NativePressable>
  )
}

function isPosterEnrichment(data: ApiEnrichment): boolean {
  const subtype = data.subtype ?? ''
  const category = data.category ?? ''
  if (category === 'media') {
    return (
      subtype === 'movie' ||
      subtype === 'tv' ||
      subtype === 'book' ||
      subtype === 'music' ||
      subtype === 'album' ||
      subtype === 'song'
    )
  }
  return category === 'book' || category === 'music'
}

function ratingLabel(data: ApiEnrichment): string | null {
  const attr = data.attributes?.find((item) => item.key === 'rating')
  if (attr === undefined || attr === null) return null
  const value = typeof attr.value === 'number' ? attr.value : Number(attr.value)
  if (!Number.isFinite(value)) return String(attr.value)
  return value.toFixed(1)
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    padding: 10,
    borderRadius: radius.control,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  poster: {
    width: 64,
    height: 96,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 2,
  },
})
