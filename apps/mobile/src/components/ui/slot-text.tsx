import type { TextStyle } from 'react-native'
import { View } from 'react-native'
import type {
  EntryAnimationsValues,
  ExitAnimationsValues,
} from 'react-native-reanimated'
import Animated, { withTiming } from 'react-native-reanimated'

import { timings } from '@/theme/motion'

const SLOT_DISTANCE = 12

const enterFromBottom = (values: EntryAnimationsValues) => {
  'worklet'
  return {
    initialValues: {
      originY: values.targetOriginY + SLOT_DISTANCE,
      opacity: 0,
    },
    animations: {
      originY: withTiming(values.targetOriginY, timings.slot),
      opacity: withTiming(1, timings.fade),
    },
  }
}

const exitToTop = (values: ExitAnimationsValues) => {
  'worklet'
  return {
    initialValues: {
      originY: values.currentOriginY,
      opacity: 1,
    },
    animations: {
      originY: withTiming(values.currentOriginY - SLOT_DISTANCE, timings.slot),
      opacity: withTiming(0, timings.fade),
    },
  }
}

export interface SlotTextProps {
  textStyle: TextStyle
  value: string | number
}

export function SlotText({ value, textStyle }: SlotTextProps) {
  const chars = String(value).split('')

  return (
    <View style={{ flexDirection: 'row' }}>
      {chars.map((char, i) => (
        <View
          key={`slot-${i}`}
          style={{ height: textStyle.lineHeight, overflow: 'hidden' }}
        >
          <Animated.Text
            entering={enterFromBottom}
            exiting={exitToTop}
            key={`${i}-${char}`}
            style={[textStyle, { fontVariant: ['tabular-nums'] }]}
          >
            {char}
          </Animated.Text>
        </View>
      ))}
    </View>
  )
}
