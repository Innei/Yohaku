import { YohakuVideo } from '@modules/yohaku'
import { neutral, radius } from '@yohaku/design-system/tokens'
import { useState } from 'react'
import { StyleSheet } from 'react-native'

import { UnsupportedBlock } from './card-blocks'
import { type BlockProps, str } from './types'

const RESERVED_RATIO = 16 / 9
const PORTRAIT_RATIO_CAP = 4 / 5
const BACKDROP = neutral.light[10]

export function VideoBlock({ blockId, node }: BlockProps) {
  const src = str(node.src)
  const [ratio, setRatio] = useState(RESERVED_RATIO)

  if (!src) return <UnsupportedBlock blockId={blockId} node={node} />

  return (
    <YohakuVideo
      backdropColor={BACKDROP}
      src={src}
      style={[styles.video, { aspectRatio: ratio, backgroundColor: BACKDROP }]}
      onNaturalSize={({ nativeEvent: { height, width } }) => {
        if (height > 0) setRatio(Math.max(width / height, PORTRAIT_RATIO_CAP))
      }}
    />
  )
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    marginVertical: 12,
    borderRadius: radius.control,
    overflow: 'hidden',
  },
})
