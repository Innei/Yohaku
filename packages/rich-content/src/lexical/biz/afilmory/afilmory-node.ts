import { createRendererDecoration } from '@haklex/rich-editor/static'
import type { SerializedAfilmoryNode as MxSerializedAfilmoryNode } from '@mx-space/editor'
import type {
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import { DecoratorNode } from 'lexical'
import type { ReactElement } from 'react'

import {
  AFILMORY_NODE_KEY,
  type AfilmoryLayout,
  type AfilmorySlotProps,
  type AfilmorySource,
} from './afilmory-augment'
import { AfilmoryRenderer } from './AfilmoryRenderer'

export type SerializedAfilmoryNode = Spread<
  Omit<MxSerializedAfilmoryNode, '$' | 'type' | 'version'> & {
    baseUrl: string
    source: AfilmorySource
  },
  SerializedLexicalNode
>

export interface AfilmoryNodePayload {
  accent?: string
  alt?: string
  baseUrl: string
  caption?: string
  layout?: AfilmoryLayout
  limit?: number
  source: AfilmorySource
  title?: string
}

export class AfilmoryNode extends DecoratorNode<ReactElement> {
  __baseUrl: string
  __source: AfilmorySource
  __layout: AfilmoryLayout | undefined
  __title: string | undefined
  __caption: string | undefined
  __alt: string | undefined
  __accent: string | undefined
  __limit: number | undefined

  static getType(): string {
    return 'afilmory'
  }

  static clone(node: AfilmoryNode): AfilmoryNode {
    return new AfilmoryNode(
      {
        baseUrl: node.__baseUrl,
        source: node.__source,
        layout: node.__layout,
        title: node.__title,
        caption: node.__caption,
        alt: node.__alt,
        accent: node.__accent,
        limit: node.__limit,
      },
      node.__key,
    )
  }

  constructor(payload: AfilmoryNodePayload, key?: NodeKey) {
    super(key)
    this.__baseUrl = payload.baseUrl
    this.__source = payload.source
    this.__layout = payload.layout
    this.__title = payload.title
    this.__caption = payload.caption
    this.__alt = payload.alt
    this.__accent = payload.accent
    this.__limit = payload.limit
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div')
    div.className = 'rich-afilmory-wrapper'
    return div
  }

  updateDOM(): boolean {
    return false
  }

  isInline(): boolean {
    return false
  }

  static importJSON(serialized: SerializedAfilmoryNode): AfilmoryNode {
    return new AfilmoryNode({
      baseUrl: serialized.baseUrl,
      source: serialized.source,
      layout: serialized.layout,
      title: serialized.title,
      caption: serialized.caption,
      alt: serialized.alt,
      accent: serialized.accent,
      limit: serialized.limit,
    })
  }

  exportJSON(): SerializedAfilmoryNode {
    return {
      ...super.exportJSON(),
      baseUrl: this.__baseUrl,
      source: this.__source,
      layout: this.__layout,
      title: this.__title,
      caption: this.__caption,
      alt: this.__alt,
      accent: this.__accent,
      limit: this.__limit,
      type: 'afilmory',
      version: 1,
    }
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): ReactElement {
    const slotProps: AfilmorySlotProps = {
      baseUrl: this.__baseUrl,
      source: this.__source,
      layout: this.__layout,
      title: this.__title,
      caption: this.__caption,
      alt: this.__alt,
      accent: this.__accent,
      limit: this.__limit,
    }
    return createRendererDecoration(
      AFILMORY_NODE_KEY,
      AfilmoryRenderer,
      slotProps,
    )
  }
}

export function $createAfilmoryNode(
  payload: AfilmoryNodePayload,
): AfilmoryNode {
  return new AfilmoryNode(payload)
}

export function $isAfilmoryNode(
  node: LexicalNode | null | undefined,
): node is AfilmoryNode {
  return node instanceof AfilmoryNode
}
