export interface GridImage {
  alt?: string
  full: string
  height?: number
  src: string
  thumbhash?: string
  width?: number
}

export interface GridRows {
  overflow: number
  rows: number[][]
}

export function galleryImages(node: Record<string, unknown>): GridImage[] {
  const images = Array.isArray(node.images) ? node.images : []
  const result: GridImage[] = []
  for (const entry of images) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    const src = typeof record.src === 'string' ? record.src : ''
    if (!src) continue
    result.push({
      alt: typeof record.alt === 'string' ? record.alt : undefined,
      full: src,
      height:
        typeof record.height === 'number' && Number.isFinite(record.height)
          ? record.height
          : undefined,
      src,
      width:
        typeof record.width === 'number' && Number.isFinite(record.width)
          ? record.width
          : undefined,
    })
  }
  return result
}

export function gridRows(count: number): GridRows {
  if (count <= 0) return { overflow: 0, rows: [] }
  if (count === 1) return { overflow: 0, rows: [[0]] }
  if (count === 2) return { overflow: 0, rows: [[0, 1]] }
  const capped = Math.min(count, 5)
  const rows: number[][] = [[0]]
  for (let i = 1; i < capped; i += 2) {
    const row = [i]
    if (i + 1 < capped) row.push(i + 1)
    rows.push(row)
  }
  return { overflow: count > 5 ? count - 5 : 0, rows }
}
