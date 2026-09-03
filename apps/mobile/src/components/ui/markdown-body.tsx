import { type as typeScale } from '@yohaku/design-system/tokens'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import type { MarkdownStyle } from 'react-native-enriched-markdown'
import { EnrichedMarkdownText } from 'react-native-enriched-markdown'

import { hrefForExternalUrl } from '@/lib/link-router'
import { openExternalUrl } from '@/lib/open-external'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'

export interface MarkdownBodyProps {
  fontSize?: number
  headingColor?: string
  lineHeight?: number
  markdown: string
  onLinkPress?: (url: string) => boolean | void
}

export function MarkdownBody({
  headingColor,
  markdown,
  fontSize = typeScale.copy15.size,
  lineHeight = typeScale.copy15.lineHeight,
  onLinkPress,
}: MarkdownBodyProps) {
  const palette = usePalette()
  const router = useRouter()
  const serif = useNativeSerifFontStyle()

  const markdownStyle = useMemo<MarkdownStyle>(() => {
    const body = {
      fontSize,
      lineHeight,
      color: palette.neutral[9],
      marginTop: 0,
      marginBottom: 8,
    }
    const heading = {
      ...body,
      color: headingColor ?? body.color,
      fontWeight: '600',
    }
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
        fontFamily: fonts.mono.fontFamily,
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
      // Set as printed type, not as a grid: the patched native table draws only
      // horizontal rules, and the header renders as a tracked-out label.
      table: {
        fontFamily: serif.fontFamily,
        fontSize: typeScale.copy13.size,
        lineHeight: Math.round(typeScale.copy13.size * 1.7),
        color: palette.neutral[9],
        borderColor: palette.neutral[8],
        borderWidth: 1,
        borderRadius: 0,
        headerBackgroundColor: 'transparent',
        headerTextColor: palette.neutral[6],
        rowEvenBackgroundColor: 'transparent',
        rowOddBackgroundColor: 'transparent',
        cellPaddingHorizontal: 14,
        cellPaddingVertical: 9,
        horizontalOverflow: 20,
      },
      code: {
        fontFamily: fonts.mono.fontFamily,
        fontSize: typeScale.copy13.size,
        color: palette.neutral[8],
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
      link: { color: palette.accent, underline: false },
      image: { maxHeight: 240, borderRadius: 10, marginTop: 0, marginBottom: 8 },
      thematicBreak: { color: palette.neutral[3], height: 1 },
    }
  }, [headingColor, palette, fontSize, lineHeight, serif.fontFamily])

  const openLink = async (url: string) => {
    if (onLinkPress?.(url)) return
    const internal = hrefForExternalUrl(url)
    if (internal) {
      router.push(internal)
    } else {
      await openExternalUrl(url)
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
