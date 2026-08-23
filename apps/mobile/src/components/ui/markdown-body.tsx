import { type as typeScale } from '@yohaku/design-system/tokens'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useMemo } from 'react'
import type { MarkdownStyle } from 'react-native-enriched-markdown'
import { EnrichedMarkdownText } from 'react-native-enriched-markdown'

import { hrefForExternalUrl } from '@/lib/link-router'
import { usePalette } from '@/theme/palette'

export interface MarkdownBodyProps {
  fontSize?: number
  lineHeight?: number
  markdown: string
}

export function MarkdownBody({
  markdown,
  fontSize = typeScale.copy15.size,
  lineHeight = typeScale.copy15.lineHeight,
}: MarkdownBodyProps) {
  const palette = usePalette()
  const router = useRouter()

  const markdownStyle = useMemo<MarkdownStyle>(() => {
    const body = {
      fontSize,
      lineHeight,
      color: palette.neutral[9],
      marginTop: 0,
      marginBottom: 8,
    }
    const heading = { ...body, fontWeight: '600' }
    return {
      paragraph: body,
      h1: { ...heading, fontSize: fontSize + 2 },
      h2: { ...heading, fontSize: fontSize + 1 },
      h3: heading,
      h4: heading,
      h5: heading,
      h6: heading,
      blockquote: {
        ...body,
        color: palette.neutral[7],
        borderColor: palette.neutral[4],
        borderWidth: 2,
        gapWidth: 14,
        backgroundColor: 'transparent',
        borderRadius: 0,
        padding: 1,
      },
      list: {
        ...body,
        bulletColor: palette.neutral[6],
        markerColor: palette.neutral[7],
        gapWidth: 8,
        itemSpacing: 4,
      },
      codeBlock: {
        fontSize: typeScale.copy13.size,
        color: palette.neutral[9],
        backgroundColor: 'transparent',
        borderColor: palette.neutral[3],
        borderWidth: 1,
        borderRadius: 8,
        padding: 13,
        marginTop: 0,
        marginBottom: 8,
      },
      table: {
        fontSize: typeScale.copy13.size,
        color: palette.neutral[9],
        borderColor: palette.neutral[3],
        borderWidth: 1,
        borderRadius: 0,
        headerBackgroundColor: 'transparent',
        headerTextColor: palette.neutral[8],
        rowEvenBackgroundColor: 'transparent',
        rowOddBackgroundColor: 'transparent',
        cellPaddingHorizontal: 10,
        cellPaddingVertical: 6,
      },
      code: {
        fontSize: typeScale.copy13.size,
        color: palette.neutral[8],
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
      link: { color: palette.accent, underline: false },
      image: { maxHeight: 240, borderRadius: 10, marginTop: 0, marginBottom: 8 },
      thematicBreak: { color: palette.neutral[3], height: 1 },
    }
  }, [palette, fontSize, lineHeight])

  const openLink = async (url: string) => {
    const internal = hrefForExternalUrl(url)
    if (internal) {
      router.push(internal)
    } else {
      await WebBrowser.openBrowserAsync(url)
    }
  }

  return (
    <EnrichedMarkdownText
      enableTaskListItemToggle={false}
      flavor="github"
      markdown={markdown}
      markdownStyle={markdownStyle}
      onLinkPress={({ url }) => void openLink(url)}
    />
  )
}
