'use client'

import type { RichRendererModule } from '@haklex/rich-compose'
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

import { BlockBoundary } from '../../block-boundary'
import { StaticExcalidraw } from './StaticExcalidraw'

export type SerializedExcalidrawNode = Spread<
  { snapshot: string },
  SerializedLexicalNode
>

export class ExcalidrawNode extends DecoratorNode<ReactElement> {
  __snapshot: string

  static getType(): string {
    return 'excalidraw'
  }

  static clone(node: ExcalidrawNode): ExcalidrawNode {
    return new ExcalidrawNode(node.__snapshot, node.__key)
  }

  constructor(snapshot: string, key?: NodeKey) {
    super(key)
    this.__snapshot = snapshot
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement('div')
    div.className = 'rich-excalidraw-wrapper'
    return div
  }

  updateDOM(): boolean {
    return false
  }

  isInline(): boolean {
    return false
  }

  static importJSON(serializedNode: SerializedExcalidrawNode): ExcalidrawNode {
    return $createExcalidrawNode(serializedNode.snapshot)
  }

  exportJSON(): SerializedExcalidrawNode {
    return {
      ...super.exportJSON(),
      type: 'excalidraw',
      snapshot: this.__snapshot,
      version: 1,
    }
  }

  getSnapshot(): string {
    return this.__snapshot
  }

  setSnapshot(snapshot: string): void {
    const writable = this.getWritable()
    writable.__snapshot = snapshot
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): ReactElement {
    return (
      <BlockBoundary label="画板">
        <div className="my-4 aspect-[16/9] w-full">
          <StaticExcalidraw data={this.__snapshot} />
        </div>
      </BlockBoundary>
    )
  }
}

export function $createExcalidrawNode(snapshot: string): ExcalidrawNode {
  return new ExcalidrawNode(snapshot)
}

export function $isExcalidrawNode(
  node: LexicalNode | null | undefined,
): node is ExcalidrawNode {
  return node instanceof ExcalidrawNode
}

export const staticExcalidrawModule: RichRendererModule = {
  name: 'excalidraw',
  nodes: [ExcalidrawNode],
}
