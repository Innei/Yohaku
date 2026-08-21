import { YohakuNative } from '@modules/yohaku'
import { useEffect, useMemo, useSyncExternalStore } from 'react'

import { useLocale } from '@/i18n'

import {
  type FontStyle,
  nativeSerifFontFamily,
  webviewSerifFontFamily,
} from './font-faces'
import { createSerifFontLoader } from './serif-font-loader'

const koreanSerif = createSerifFontLoader(() =>
  YohakuNative.downloadSystemFont('AppleMyungjo'),
)

function useKoreanSerifReady(): boolean {
  const state = useSyncExternalStore(
    koreanSerif.subscribe,
    koreanSerif.getSnapshot,
  )
  const locale = useLocale()

  useEffect(() => {
    if (locale === 'ko') void koreanSerif.ensure()
  }, [locale])

  return state === 'ready'
}

export function useNativeSerifFontStyle(): FontStyle {
  const locale = useLocale()
  const koreanSerifReady = useKoreanSerifReady()
  const fontFamily = nativeSerifFontFamily(locale, koreanSerifReady)

  return useMemo(() => ({ fontFamily }), [fontFamily])
}

export function useWebviewSerifFontFamily(): string {
  const locale = useLocale()
  const koreanSerifReady = useKoreanSerifReady()
  return webviewSerifFontFamily(locale, koreanSerifReady)
}
