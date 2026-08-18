import type { SerializedEditorState } from 'lexical'

interface SerializedNode {
  [key: string]: unknown
  children?: SerializedNode[]
  // alert-quote / banner / nested-doc store their body as a whole nested
  // editor state under this field instead of the standard `children` array —
  // sanitize has to descend into it too, or an unregistered node buried
  // inside one of those blocks survives untouched.
  content?: { root?: SerializedNode }
  type?: string
}

function placeholderParagraph(): SerializedNode {
  return {
    children: [
      {
        detail: 0,
        format: 2,
        mode: 'normal',
        style: '',
        text: '〔此内容 · 请在网页中查看〕',
        type: 'text',
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    textFormat: 0,
    textStyle: '',
    type: 'paragraph',
    version: 1,
  }
}

function sanitizeNode(
  node: SerializedNode,
  registered: Set<string>,
): SerializedNode {
  if (node.type && !registered.has(node.type)) return placeholderParagraph()
  let next = node
  if (Array.isArray(node.children)) {
    next = {
      ...next,
      children: node.children.map((child) => sanitizeNode(child, registered)),
    }
  }
  if (node.content?.root) {
    next = {
      ...next,
      content: {
        ...node.content,
        root: sanitizeNode(node.content.root, registered),
      },
    }
  }
  return next
}

export function sanitizeEditorState(
  state: SerializedEditorState,
  registered: Set<string>,
): SerializedEditorState {
  const root = (state as unknown as { root?: SerializedNode }).root
  if (!root) return state
  return {
    ...state,
    root: sanitizeNode(root, registered),
  } as unknown as SerializedEditorState
}
