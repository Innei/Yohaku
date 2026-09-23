import type {
  Klass,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
} from 'lexical'
import { DecoratorNode } from 'lexical'

type Json = Record<string, unknown>

// Types Yohaku content uses that the haklex static node set does not
// register. The headless editor throws on unknown types, so each one gets a
// pass-through Klass that keeps its JSON and lets the type override render it.
const PASSTHROUGH_TYPES = [
  'chat',
  'embed',
  'nested-doc',
  'poll',
  'gallery',
  'code-snippet',
  'excalidraw',
  'dynamic',
  'stock',
  'map',
  'afilmory',
]

function passthroughNode(type: string): Klass<LexicalNode> {
  class PassthroughNode extends DecoratorNode<null> {
    __json: Json = {}

    static getType(): string {
      return type
    }

    static clone(node: PassthroughNode): PassthroughNode {
      const next = new PassthroughNode(node.__key)
      next.__json = node.__json
      return next
    }

    static importJSON(json: SerializedLexicalNode): PassthroughNode {
      const next = new PassthroughNode()
      next.__json = json as unknown as Json
      return next
    }

    constructor(key?: NodeKey) {
      super(key)
    }

    exportJSON(): SerializedLexicalNode {
      return { ...this.__json, type, version: 1 } as SerializedLexicalNode
    }

    createDOM(): HTMLElement {
      throw new Error(`${type} node is render-only`)
    }

    updateDOM(): boolean {
      return false
    }

    decorate(): null {
      return null
    }
  }
  return PassthroughNode as unknown as Klass<LexicalNode>
}

function typeOf(entry: unknown): string | null {
  if (typeof entry === 'function')
    return (entry as Klass<LexicalNode>).getType()
  const replace = (entry as { replace?: Klass<LexicalNode> }).replace
  return replace ? replace.getType() : null
}

export function passthroughNodes(registered: unknown[]): Klass<LexicalNode>[] {
  const known = new Set(registered.map(typeOf))
  return PASSTHROUGH_TYPES.filter((type) => !known.has(type)).map(
    passthroughNode,
  )
}
