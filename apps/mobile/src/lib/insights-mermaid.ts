import { renderMermaidSVG } from 'beautiful-mermaid'

export type InsightsMermaidColors = {
  bg: string
  fg: string
}

export type InsightsMermaidRender = {
  error: string
  height?: number
  src: string
  width?: number
}

function parseHex(color: string): { r: number; g: number; b: number } | null {
  const hex = color.trim()
  const short = /^#([\da-f]{3})$/i.exec(hex)
  if (short) {
    const [r, g, b] = short[1]
    return {
      r: Number.parseInt(r + r, 16),
      g: Number.parseInt(g + g, 16),
      b: Number.parseInt(b + b, 16),
    }
  }
  const full = /^#([\da-f]{6})$/i.exec(hex)
  if (!full) return null
  return {
    r: Number.parseInt(full[1].slice(0, 2), 16),
    g: Number.parseInt(full[1].slice(2, 4), 16),
    b: Number.parseInt(full[1].slice(4, 6), 16),
  }
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

function mixSrgb(fg: string, pct: number, bg: string): string {
  const a = parseHex(fg)
  const b = parseHex(bg)
  if (!a || !b) return bg
  const t = pct / 100
  return toHex(
    Math.round(a.r * t + b.r * (1 - t)),
    Math.round(a.g * t + b.g * (1 - t)),
    Math.round(a.b * t + b.b * (1 - t)),
  )
}

/** iOS SVG (expo-image) cannot resolve var() / color-mix(); unresolved fills paint black. */
export function flattenMermaidSvg(svg: string): string {
  const declared = new Map<string, string>()
  for (const match of svg.matchAll(/--([\w-]+)\s*:\s*(#[\da-f]{3,8})/gi)) {
    declared.set(match[1], match[2])
  }
  const bg = declared.get('bg') ?? '#ffffff'
  const fg = declared.get('fg') ?? '#27272a'
  const tokens: Record<string, string> = {
    bg,
    fg,
    _text: declared.get('_text') ?? fg,
    '_text-sec':
      declared.get('_text-sec') ?? declared.get('muted') ?? mixSrgb(fg, 60, bg),
    '_text-muted':
      declared.get('_text-muted') ??
      declared.get('muted') ??
      mixSrgb(fg, 40, bg),
    '_text-faint': declared.get('_text-faint') ?? mixSrgb(fg, 25, bg),
    _line: declared.get('_line') ?? declared.get('line') ?? mixSrgb(fg, 50, bg),
    _arrow:
      declared.get('_arrow') ?? declared.get('accent') ?? mixSrgb(fg, 85, bg),
    '_node-fill':
      declared.get('_node-fill') ??
      declared.get('surface') ??
      mixSrgb(fg, 3, bg),
    '_node-stroke':
      declared.get('_node-stroke') ??
      declared.get('border') ??
      mixSrgb(fg, 20, bg),
    '_group-fill': declared.get('_group-fill') ?? bg,
    '_group-hdr': declared.get('_group-hdr') ?? mixSrgb(fg, 5, bg),
    '_inner-stroke': declared.get('_inner-stroke') ?? mixSrgb(fg, 12, bg),
    '_key-badge': declared.get('_key-badge') ?? mixSrgb(fg, 10, bg),
  }
  for (const extra of ['muted', 'surface', 'border', 'line', 'accent'] as const) {
    const value = declared.get(extra)
    if (value) tokens[extra] = value
  }

  let out = svg.replace(/<style>[\s\S]*?<\/style>/, '')
  for (const name of Object.keys(tokens).sort((a, b) => b.length - a.length)) {
    out = out.replaceAll(`var(--${name})`, tokens[name])
  }
  return out
}

function svgToDataUrl(svg: string): string {
  const bytes = new TextEncoder().encode(svg)
  let binary = ''
  for (const byte of bytes) binary += String.fromCodePoint(byte)
  return `data:image/svg+xml;base64,${btoa(binary)}`
}

function readDimensions(svg: string): { height?: number; width?: number } {
  const match = svg.match(/viewBox="\s*(?:[\d.-]+\s+){2}([\d.]+)\s+([\d.]+)/)
  if (!match) return {}
  return {
    height: Number.parseFloat(match[2]),
    width: Number.parseFloat(match[1]),
  }
}

export function renderInsightsMermaid(
  content: string,
  colors: InsightsMermaidColors,
): InsightsMermaidRender {
  if (!content) return { error: 'Render failed', src: '' }
  try {
    const svg = flattenMermaidSvg(renderMermaidSVG(content, colors))
    const { height, width } = readDimensions(svg)
    return { error: '', height, src: svgToDataUrl(svg), width }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
      src: '',
    }
  }
}
