import { afilmorySource } from './afilmory'
import { AfilmoryAlbum } from './afilmory-album'
import { AfilmoryPolaroid } from './afilmory-polaroid'
import { UnsupportedBlock } from './card-blocks'
import { type BlockProps, num, str } from './types'

export function AfilmoryBlock({ blockId, node }: BlockProps) {
  const baseUrl = str(node.baseUrl)
  const source = afilmorySource(node)
  const fallback = <UnsupportedBlock blockId={blockId} node={node} />
  if (!baseUrl || !source) return fallback

  const caption = str(node.caption) || undefined
  if (source.kind === 'list' && source.items.length === 1) {
    return (
      <AfilmoryPolaroid
        baseUrl={baseUrl}
        caption={caption}
        item={source.items[0]!}
      />
    )
  }
  return (
    <AfilmoryAlbum
      baseUrl={baseUrl}
      caption={caption}
      fallback={fallback}
      layout={str(node.layout)}
      limit={num(node.limit)}
      source={source}
      title={str(node.title) || undefined}
    />
  )
}
