import { YohakuNative } from '@modules/yohaku'

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

export async function renderInsightsMermaid(
  content: string,
  colors: InsightsMermaidColors,
): Promise<InsightsMermaidRender> {
  if (!content) return { error: 'Render failed', src: '' }
  try {
    const result = await YohakuNative.renderMermaid({
      bg: colors.bg,
      fg: colors.fg,
      source: content,
    })
    return {
      error: '',
      height: result.height,
      src: result.uri,
      width: result.width,
    }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
      src: '',
    }
  }
}
