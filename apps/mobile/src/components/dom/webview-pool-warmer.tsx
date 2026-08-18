import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { apiBaseUrl } from '@/api/base-url'
import RichBody from '@/components/dom/rich-body'
import { useRichBodyLabels } from '@/components/dom/use-rich-body-labels'
import { useLocale } from '@/i18n'
import { getSiteUrl } from '@/lib/site-url'
import { usePalette } from '@/theme/palette'

const WARM_DELAY_MS = 2500
const RELEASE_DELAY_MS = 500

export function WebViewPoolWarmer() {
  const palette = usePalette()
  const locale = useLocale()
  const labels = useRichBodyLabels()
  const [active, setActive] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setActive(true), WARM_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    let payload: { type?: string }
    try {
      payload = JSON.parse(event.nativeEvent.data) as typeof payload
    } catch {
      return
    }
    if (payload.type !== 'yohaku:rendered') return
    setTimeout(() => setDone(true), RELEASE_DELAY_MS)
  }

  if (!active || done) return null

  return (
    <View pointerEvents="none" style={styles.hidden}>
      <RichBody
        apiBase={apiBaseUrl()}
        content=""
        labels={labels}
        locale={locale}
        theme={palette.theme}
        variant="article"
        webUrl=""
        dom={{
          contentInsetAdjustmentBehavior: 'never',
          matchContents: true,
          scrollEnabled: false,
          siteReferer: getSiteUrl(),
          onMessage: handleMessage,
        }}
        onImagePress={async () => {}}
        onLinkPress={async () => {}}
        onNestedDocExpand={async () => {}}
        onScrollToAnchor={async () => {}}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  hidden: {
    height: 0,
    // A pooled webview keeps the viewport width it was laid out at, and a
    // click-time prime measures the article against that width — so it has to
    // match the detail screens' body slot (their 20pt content padding) or the
    // height handed to the adopting screen is measured for the wrong column.
    left: 20,
    opacity: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 20,
  },
})
