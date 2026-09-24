import type { ComponentType } from 'react'

import { AfilmoryBlock } from './afilmory-block'
import {
  FileBlock,
  LinkCardBlock,
  NestedDocBlock,
  UnsupportedBlock,
} from './card-blocks'
import { ChatBlock } from './chat-block'
import { CodeBlock } from './code-block'
import { CodeSnippetBlock } from './code-snippet-block'
import { CalloutBlock, DetailsBlock } from './container-blocks'
import { DynamicBlock } from './dynamic-block'
import { EmbedBlock } from './embed-block'
import { ExcalidrawBlock } from './excalidraw-block'
import { FootnoteSectionBlock } from './footnote-section-block'
import { GridBlock } from './grid-block'
import { ImageBlock } from './image-block'
import { GalleryBlock } from './image-grid-block'
import { MapBlock } from './map-block'
import { MathBlock } from './math-block'
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
  'code-snippet': CodeSnippetBlock,
  details: DetailsBlock,
  dynamic: DynamicBlock,
  embed: EmbedBlock,
  excalidraw: ExcalidrawBlock,
  file: FileBlock,
  'footnote-section': FootnoteSectionBlock,
  gallery: GalleryBlock,
  'grid-container': GridBlock,
  image: ImageBlock,
  'katex-block': MathBlock,
  'link-card': LinkCardBlock,
  map: MapBlock,
  mermaid: MermaidBlock,
  'nested-doc': NestedDocBlock,
  poll: PollBlock,
  stock: StockBlock,
  table: TableBlock,
  video: VideoBlock,
}
