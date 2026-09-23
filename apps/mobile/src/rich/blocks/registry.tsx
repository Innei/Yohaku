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
import { MermaidBlock } from './mermaid-block'
import { TableBlock } from './table-block'
import type { BlockProps } from './types'

export { UnsupportedBlock }

export const blockRegistry: Record<string, ComponentType<BlockProps>> = {
  'alert-quote': CalloutBlock,
  banner: CalloutBlock,
  chat: ChatBlock,
  'code-block': CodeBlock,
  details: DetailsBlock,
  embed: EmbedBlock,
  excalidraw: ExcalidrawBlock,
  file: FileBlock,
  image: ImageBlock,
  'link-card': LinkCardBlock,
  mermaid: MermaidBlock,
  'nested-doc': NestedDocBlock,
  table: TableBlock,
}
