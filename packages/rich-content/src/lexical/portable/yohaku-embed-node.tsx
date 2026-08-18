'use client'

import {
  EmbedNode,
  type SerializedEmbedNode,
} from '@haklex/rich-compose/modules/embed'
import type {
  EditorConfig,
  LexicalEditor,
  SerializedLexicalNode,
} from 'lexical'
import type { ReactElement } from 'react'

import { parseGithubFileUrl } from './github-file'
import { PortableGithubFileEmbed } from './github-file-embed'

export class YohakuEmbedNode extends EmbedNode {
  static getType(): string {
    return EmbedNode.getType()
  }

  static clone(node: YohakuEmbedNode): YohakuEmbedNode {
    return new YohakuEmbedNode(node.getUrl(), node.getSource(), node.getKey())
  }

  static importJSON(
    serializedNode: SerializedLexicalNode & Record<string, unknown>,
  ): YohakuEmbedNode {
    const serialized = serializedNode as SerializedEmbedNode
    return new YohakuEmbedNode(serialized.url, serialized.source)
  }

  decorate(editor: LexicalEditor, config: EditorConfig): ReactElement {
    const url = this.getUrl()
    if (this.getSource() === 'github-file' || parseGithubFileUrl(url)) {
      return <PortableGithubFileEmbed href={url} />
    }
    return super.decorate(editor, config)
  }
}
