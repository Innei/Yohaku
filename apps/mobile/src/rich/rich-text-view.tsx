import { useState } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

import { useLocale } from '@/i18n'
import { noteTypography } from '@/theme/note-typography'
import { usePalette } from '@/theme/palette'

import { RichTextNativeView } from '../../modules/yohaku'
import type {
  RichTextBlock,
  RichTextHighlight,
  RichTextMenuItem,
  RichTextPosition,
} from './inline-runs'
import { richTypography, type RichVariant } from './typography'

export interface RichTextMenuActionEvent {
  end: RichTextPosition
  id: string
  start: RichTextPosition
  text: string
}

export interface RichTextViewProps {
  blocks: RichTextBlock[]
  highlights?: RichTextHighlight[]
  menuItems?: RichTextMenuItem[]
  onBlockRects?: (rects: RichTextBlockRect[]) => void
  onHighlightPress?: (id: string) => void
  onLinkPress?: (href: string) => void
  onMenuAction?: (event: RichTextMenuActionEvent) => void
  onSelectionActive?: (active: boolean) => void
  style?: StyleProp<ViewStyle>
  variant?: RichVariant
}

export interface RichTextBlockRect {
  height: number
  id: string
  y: number
}

const LINE_ESTIMATE = 3

export function RichTextView({
  blocks,
  highlights,
  menuItems,
  onBlockRects,
  onHighlightPress,
  onLinkPress,
  onMenuAction,
  onSelectionActive,
  style,
  variant,
}: RichTextViewProps) {
  const palette = usePalette()
  const locale = useLocale()
  const [height, setHeight] = useState<number | null>(null)

  const typography = richTypography(variant ?? 'article', locale, palette)

  return (
    <RichTextNativeView
      blocks={blocks}
      highlights={highlights ?? []}
      menuItems={menuItems ?? []}
      typography={typography}
      style={[
        {
          height:
            height ?? blocks.length * LINE_ESTIMATE * noteTypography.lineHeight,
        },
        style,
      ]}
      onBlockRects={(event) => onBlockRects?.(event.nativeEvent.rects)}
      onContentHeight={(event) => setHeight(event.nativeEvent.height)}
      onHighlightPress={(event) => onHighlightPress?.(event.nativeEvent.id)}
      onLinkPress={(event) => onLinkPress?.(event.nativeEvent.href)}
      onMenuAction={(event) => onMenuAction?.(event.nativeEvent)}
      onSelectionActive={(event) =>
        onSelectionActive?.(event.nativeEvent.active)
      }
    />
  )
}
