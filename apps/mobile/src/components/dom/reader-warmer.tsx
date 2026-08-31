import { useEffect, useState } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'

import { apiBaseUrl } from '@/api/base-url'
import { useLocale } from '@/i18n'
import { getSiteUrl } from '@/lib/site-url'
import { clampFontScale } from '@/theme/font-scale'
import { usePalette } from '@/theme/palette'
import { useWebviewSerifFontFamily } from '@/theme/serif-font'
import { useWebviewFontFaces } from '@/theme/webview-fonts'

import RichBody from './rich-body'
import { useRichBodyLabels } from './use-rich-body-labels'

const WARM_READER_ID = '__yohaku_warm__'

export function ReaderWarmer() {
  const [live, setLive] = useState(true)
  const { fontScale: systemFontScale, height, width } = useWindowDimensions()
  const fontScale = clampFontScale(systemFontScale)
  const locale = useLocale()
  const palette = usePalette()
  const labels = useRichBodyLabels()
  const fontFaces = useWebviewFontFaces()
  const serifFontFamily = useWebviewSerifFontFamily()

  useEffect(() => {
    const timer = setTimeout(() => setLive(false), 4_000)
    return () => clearTimeout(timer)
  }, [])

  if (!live) return null

  return (
    <View
      pointerEvents="none"
      style={[styles.host, { height, left: -width, width }]}
    >
      <RichBody
        apiBase={apiBaseUrl()}
        content=""
        fontFaces={fontFaces}
        fontScale={fontScale}
        labels={labels}
        locale={locale}
        readerId={WARM_READER_ID}
        serifFontFamily={serifFontFamily}
        theme={palette.theme}
        variant="article"
        viewportHeight={height}
        webUrl={getSiteUrl() || 'https://localhost'}
        dom={{
          containerStyle: { height, width },
          contentInsetAdjustmentBehavior: 'never',
          matchContents: false,
          scrollEnabled: false,
          shared: true,
          siteReferer: getSiteUrl(),
          style: { height, width },
          onMessage: (event) => {
            try {
              const payload = JSON.parse(event.nativeEvent.data) as {
                type?: string
              }
              if (payload.type === 'yohaku:reader-ready') setLive(false)
            } catch {}
          },
        }}
        onImagePress={async () => {}}
        onLinkPress={async () => {}}
        onScrollToAnchor={async () => {}}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  host: {
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
  },
})
