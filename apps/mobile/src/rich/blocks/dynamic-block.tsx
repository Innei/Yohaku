import { YohakuWebEmbed } from '@modules/yohaku'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { api } from '@/api/client'
import { getSiteUrl } from '@/lib/site-url'
import { usePalette } from '@/theme/palette'

import { useRichDocument } from '../lexical/context'
import { UnsupportedBlock } from './card-blocks'
import { catalogUrls, dynamicInput } from './dynamic'
import { useBoneColor } from './skeleton'
import type { BlockProps } from './types'

export function DynamicBlock(props: BlockProps) {
  const palette = usePalette()
  const doc = useRichDocument()
  const bone = useBoneColor()
  const input = dynamicInput(props.node)
  const [height, setHeight] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)
  const catalog = useQuery({
    queryKey: ['dynamic-catalog'],
    queryFn: async () => catalogUrls(await api.dynamicCatalog()),
    staleTime: 10 * 60_000,
  })

  if (catalog.isPending) {
    return (
      <View
        style={[
          styles.wrap,
          { backgroundColor: bone, height: input.initialHeight },
        ]}
      />
    )
  }
  if (failed || !input.url || !catalog.data?.has(input.url)) {
    return <UnsupportedBlock {...props} />
  }

  return (
    <View
      style={[
        styles.wrap,
        height === null && { backgroundColor: bone },
        { height: height ?? input.initialHeight },
      ]}
    >
      <YohakuWebEmbed
        baseUrl={getSiteUrl()}
        initialHeight={input.initialHeight}
        props={input.props}
        style={StyleSheet.absoluteFill}
        theme={palette.theme}
        url={input.url}
        onContentHeight={(event) => setHeight(event.nativeEvent.height)}
        onEmbedError={() => setFailed(true)}
        onEmbedLink={(event) => doc.onLinkPress?.(event.nativeEvent.url)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 10,
    marginVertical: 12,
    overflow: 'hidden',
  },
})
