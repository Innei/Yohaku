import type { ComponentType } from 'react'

import {
  FileBlock,
  LinkCardBlock,
  NestedDocBlock,
  UnsupportedBlock,
} from './card-blocks'
import { ChatBlock } from './chat-block'
import { CodeBlock } from './code-block'
import { CalloutBlock, DetailsBlock } from './container-blocks'
import { EmbedBlock } from './embed-block'
import { ExcalidrawBlock } from './excalidraw-block'
import { ImageBlock } from './image-block'
import { AfilmoryBlock, GalleryBlock } from './image-grid-block'
import { MapBlock } from './map-block'
import { MermaidBlock } from './mermaid-block'
import { PollBlock } from './poll-block'
import { StockBlock } from './stock-block'
import { TableBlock } from './table-block'
import type { BlockProps } from './types'
import { VideoBlock } from './video-block'

export { UnsupportedBlock }

export const blockRegistry: Record<string, ComponentType<BlockProps>> = {
  afilmory: AfilmoryBlock,
  'alert-quote': CalloutBlock,
  banner: CalloutBlock,
  chat: ChatBlock,
  'code-block': CodeBlock,
  details: DetailsBlock,
  embed: EmbedBlock,
  excalidraw: ExcalidrawBlock,
  file: FileBlock,
  gallery: GalleryBlock,
  image: ImageBlock,
  'link-card': LinkCardBlock,
  map: MapBlock,
  mermaid: MermaidBlock,
  'nested-doc': NestedDocBlock,
  poll: PollBlock,
  stock: StockBlock,
  table: TableBlock,
  video: VideoBlock,
}
