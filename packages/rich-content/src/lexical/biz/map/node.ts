import { createRendererDecoration } from '@haklex/rich-editor/static'
import type { SerializedMapNode as MxSerializedMapNode } from '@mx-space/editor'
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

import { MAP_NODE_KEY, type MapSlotProps } from './augment'
import { YohakuMapRenderer } from './renderer'

export type SerializedMapNode = Spread<
  Omit<MxSerializedMapNode, '$' | 'type' | 'version'>,
  SerializedLexicalNode
>

export class MapDisplayNode extends DecoratorNode<ReactElement> {
  __title: string
  __track: MxSerializedMapNode['track'] | undefined
  __pois: MxSerializedMapNode['pois'] | undefined
  __view: MxSerializedMapNode['view'] | undefined

  static getType(): string {
    return 'map'
  }

  static clone(node: MapDisplayNode): MapDisplayNode {
    return new MapDisplayNode(
      {
        title: node.__title,
        track: node.__track,
        pois: node.__pois,
        view: node.__view,
      },
      node.__key,
    )
  }

  constructor(
    payload: {
      pois?: MxSerializedMapNode['pois']
      title: string
      track?: MxSerializedMapNode['track']
      view?: MxSerializedMapNode['view']
    },
    key?: NodeKey,
  ) {
    super(key)
    this.__title = payload.title
    this.__track = payload.track
    this.__pois = payload.pois
    this.__view = payload.view
  }

  createDOM(): HTMLElement {
    const div = document.createElement('div')
    div.className = 'rich-map-wrapper'
    return div
  }

  updateDOM(): boolean {
    return false
  }

  isInline(): boolean {
    return false
  }

  static importJSON(serialized: SerializedMapNode): MapDisplayNode {
    return new MapDisplayNode({
      pois: serialized.pois,
      title: serialized.title ?? '',
      track: serialized.track,
      view: serialized.view,
    })
  }

  exportJSON(): SerializedMapNode {
    return {
      ...super.exportJSON(),
      pois: this.__pois,
      title: this.__title,
      track: this.__track,
      type: 'map',
      version: 1,
      view: this.__view,
    }
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): ReactElement {
    const slotProps: MapSlotProps = {
      pois: this.__pois,
      title: this.__title,
      track: this.__track,
      view: this.__view,
    }
    return createRendererDecoration(MAP_NODE_KEY, YohakuMapRenderer, slotProps)
  }
}

export function $createMapDisplayNode(payload: {
  pois?: MxSerializedMapNode['pois']
  title: string
  track?: MxSerializedMapNode['track']
  view?: MxSerializedMapNode['view']
}): MapDisplayNode {
  return new MapDisplayNode(payload)
}

export function $isMapDisplayNode(
  node: LexicalNode | null | undefined,
): node is MapDisplayNode {
  return node instanceof MapDisplayNode
}
