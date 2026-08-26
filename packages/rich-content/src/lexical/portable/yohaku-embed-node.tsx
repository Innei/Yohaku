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

import { PrintCaption } from '../../host'
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
    const body =
      this.getSource() === 'github-file' || parseGithubFileUrl(url) ? (
        <PortableGithubFileEmbed href={url} />
      ) : (
        super.decorate(editor, config)
      )
    return <PrintCaption kind="embed">{body}</PrintCaption>
  }
}
