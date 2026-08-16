export function extractBlockOrder(content: string): string[] {
  try {
    const parsed = JSON.parse(content) as {
      root?: { children?: Array<{ $?: { blockId?: string } }> }
    }
    const children = parsed.root?.children
    if (!Array.isArray(children)) return []
    return children.map((child) => child.$?.blockId ?? '')
  } catch {
    return []
  }
}

export function indexForBlock(order: string[], blockId: string): number {
  return order.indexOf(blockId)
}
