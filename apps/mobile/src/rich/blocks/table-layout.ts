export const MIN_COLUMN = 56
export const MAX_COLUMN = 240

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

export function tableColumnWidths(
  natural: number[],
  available: number,
): number[] {
  let widths = natural.map((width) =>
    Math.min(Math.max(width, MIN_COLUMN), MAX_COLUMN),
  )
  let extra = available - sum(widths)
  if (extra <= 0) return widths

  const deficits = natural.map((width, index) =>
    Math.max(0, width - widths[index]!),
  )
  const need = sum(deficits)
  if (need > 0) {
    const share = Math.min(1, extra / need)
    widths = widths.map((width, index) => width + deficits[index]! * share)
    extra -= Math.min(extra, need)
  }
  if (extra > 0) {
    const base = sum(widths)
    widths = widths.map((width) => width + (extra * width) / base)
  }

  const floored = widths.map(Math.floor)
  const rest = available - sum(floored)
  floored.push(floored.pop()! + rest)
  return floored
}

const NUMERIC = /^[+-]?[$£¥€]?\d[\d,]*(?:\.\d+)?%?$/

export function isNumericCell(text: string): boolean {
  return NUMERIC.test(text.trim())
}

export function tableOverflow(widths: number[], available: number): number {
  const overflow = sum(widths) - available
  return overflow > 0.5 ? overflow : 0
}

export function tableSignature(
  rows: { runs: { text: string }[] }[][],
): string {
  return rows
    .map((row) => row.map((cell) => cell.runs.map((run) => run.text).join('')).join('\u001F'))
    .join('\u001E')
}
