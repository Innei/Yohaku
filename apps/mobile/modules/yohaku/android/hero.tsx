import { Image } from 'expo-image'
import type { ColorValue, StyleProp, ViewProps, ViewStyle } from 'react-native'
import { StyleSheet, View } from 'react-native'

import { VariableBlurEdge } from './ui'

interface NoteHeroHostProps extends ViewProps {
  nativeTopBlurForegroundColor?: ColorValue
  nativeTopBlurHeight?: number
  nativeTopBlurReadabilityColor?: ColorValue
  noteHeroContentInsetTop?: number
  noteHeroCoverPlaceholderUri?: string | null
  noteHeroCoverUri?: string | null
  noteHeroHeight?: number
  noteHeroId?: string
  noteHeroMeta?: string
  noteHeroMetaColor?: ColorValue
  noteHeroRole?: 'detail' | 'list'
  noteHeroTitle?: string
  noteHeroTitleColor?: ColorValue
  style?: StyleProp<ViewStyle>
}

/**
 * UIScrollView-attached hero host. The iOS version owns a parallax/stretch
 * image layer and a shared-element handoff. On Android the image sits in a
 * fixed layer under the transparent list, which keeps the same "photo behind
 * the first screen, content scrolling over it" reading and costs no scroll
 * synchronisation.
 */
export function YohakuNoteHeroHost({
  children,
  nativeTopBlurHeight,
  nativeTopBlurReadabilityColor = '#faf9f6',
  noteHeroCoverPlaceholderUri,
  noteHeroCoverUri,
  noteHeroHeight = 0,
  noteHeroRole = 'list',
  style,
}: NoteHeroHostProps) {
  return (
    <View style={[styles.fill, style]}>
      {noteHeroCoverUri ? (
        <Image
          contentFit="cover"
          placeholder={noteHeroCoverPlaceholderUri ?? undefined}
          source={{ uri: noteHeroCoverUri }}
          style={[
            styles.cover,
            {
              height:
                noteHeroRole === 'detail'
                  ? Math.max(noteHeroHeight, 220)
                  : noteHeroHeight,
            },
          ]}
          transition={180}
        />
      ) : null}
      <View style={styles.fill}>{children}</View>
      {nativeTopBlurHeight ? (
        <VariableBlurEdge
          pointerEvents="none"
          progress={1}
          readabilityColor={String(nativeTopBlurReadabilityColor)}
          style={[styles.topScrim, { height: nativeTopBlurHeight }]}
        />
      ) : null}
    </View>
  )
}

interface StretchCoverHostProps extends ViewProps {
  stretchCoverAnchorY?: number
  stretchCoverHeight?: number
  stretchCoverPlaceholderUri?: string | null
  stretchCoverUri?: string | null
  style?: StyleProp<ViewStyle>
}

/**
 * Stretchy cover behind a detail scroll view. Implemented as an absolutely
 * positioned expo-image layer at the scroll view's resting anchor.
 */
export function YohakuStretchCoverHost({
  children,
  stretchCoverAnchorY = 0,
  stretchCoverHeight = 0,
  stretchCoverPlaceholderUri,
  stretchCoverUri,
  style,
  ...rest
}: StretchCoverHostProps) {
  return (
    <View {...rest} style={[styles.fill, style]}>
      {stretchCoverUri ? (
        <Image
          contentFit="cover"
          placeholder={stretchCoverPlaceholderUri ?? undefined}
          source={{ uri: stretchCoverUri }}
          style={[
            styles.cover,
            { height: Math.max(stretchCoverHeight, 160), top: stretchCoverAnchorY },
          ]}
          transition={180}
        />
      ) : null}
      <View style={styles.fill}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  cover: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  fill: {
    flex: 1,
  },
  topScrim: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
})
