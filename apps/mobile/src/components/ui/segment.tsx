import { radius, type as typeScale } from '@yohaku/design-system/tokens'
import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

import { fonts } from '@/theme/fonts'
import { springs } from '@/theme/motion'
import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

const TRACK_PADDING = 3

export interface SegmentProps {
  index: number
  onChange: (index: number) => void
  options: string[]
}

export function Segment({ options, index, onChange }: SegmentProps) {
  const palette = usePalette()
  const [trackWidth, setTrackWidth] = useState(0)
  const offset = useSharedValue(0)

  const itemWidth =
    trackWidth > 0 ? (trackWidth - TRACK_PADDING * 2) / options.length : 0

  useEffect(() => {
    offset.value = withSpring(index * itemWidth, springs.glide)
  }, [index, itemWidth, offset])

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }))

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: palette.surface.well,
        borderRadius: radius.pill,
        padding: TRACK_PADDING,
        boxShadow: shadow.wellInset[palette.theme],
      }}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
    >
      {itemWidth > 0 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: TRACK_PADDING,
              bottom: TRACK_PADDING,
              left: TRACK_PADDING,
              width: itemWidth,
              backgroundColor: palette.surface.paper,
              borderRadius: radius.pill,
              boxShadow: shadow.paperSmall[palette.theme],
            },
            thumbStyle,
          ]}
        />
      )}
      {options.map((option, i) => (
        <Pressable
          key={option}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 7 }}
          onPress={() => {
            if (i === index) return
            Haptics.selectionAsync()
            onChange(i)
          }}
        >
          <Animated.Text
            style={{
              ...(i === index ? fonts.sansMedium : fonts.sans),
              fontSize: typeScale.copy13.size,
              lineHeight: typeScale.copy13.lineHeight,
              color: i === index ? palette.neutral[9] : palette.neutral[6],
            }}
          >
            {option}
          </Animated.Text>
        </Pressable>
      ))}
    </View>
  )
}
