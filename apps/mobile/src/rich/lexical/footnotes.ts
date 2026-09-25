import type { SerializedEditorState } from 'lexical'

import type { RichTextBlock } from '../inline-runs'

export const FOOTNOTE_SCHEME = 'yohaku-footnote:'

interface JsonNode {
  cells?: Array<{ root?: JsonNode }>
  children?: JsonNode[]
  content?: { root?: JsonNode }
  identifier?: unknown
  type?: unknown
}

export function footnoteNumbers(
  value: SerializedEditorState,
): Map<string, number> {
  const numbers = new Map<string, number>()
  const visit = (node: JsonNode) => {
    if (node.type === 'footnote' && typeof node.identifier === 'string') {
      if (!numbers.has(node.identifier))
        numbers.set(node.identifier, numbers.size + 1)
      return
    }
    node.children?.forEach(visit)
    if (node.type === 'nested-doc') return
    if (node.content?.root) visit(node.content.root)
    node.cells?.forEach((cell) => cell.root && visit(cell.root))
  }
  visit(value.root as unknown as JsonNode)
  return numbers
}

export function numberFootnotes(
  blocks: RichTextBlock[],
  numbers: ReadonlyMap<string, number>,
): RichTextBlock[] {
  return blocks.map((block) =>
    block.runs.some((run) => run.footnote)
      ? {
          ...block,
          runs: block.runs.map((run) =>
            run.footnote
              ? {
                  ...run,
                  href: `${FOOTNOTE_SCHEME}${run.footnote}`,
                  text: String(numbers.get(run.footnote) ?? run.footnote),
                }
              : run,
          ),
        }
      : block,
  )
}

export function footnoteEntries(
  definitions: Record<string, string>,
  numbers: ReadonlyMap<string, number>,
): Array<{ id: string; label: string; text: string }> {
  return Object.keys(definitions)
    .sort((a, b) => {
      const na = numbers.get(a) ?? Infinity
      const nb = numbers.get(b) ?? Infinity
      return na === nb ? a.localeCompare(b) : na - nb
    })
    .map((id) => ({
      id,
      label: String(numbers.get(id) ?? id),
      text: definitions[id]!,
    }))
}
