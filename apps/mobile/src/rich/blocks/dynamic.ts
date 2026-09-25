import { num, str } from './types'

const DEFAULT_HEIGHT = 320

export function catalogUrls(payload: unknown): Set<string> {
  const urls = new Set<string>()
  const components =
    payload && typeof payload === 'object'
      ? (payload as { components?: unknown }).components
      : undefined
  if (!Array.isArray(components)) return urls
  for (const entry of components) {
    const url =
      entry && typeof entry === 'object'
        ? (entry as { url?: unknown }).url
        : undefined
    if (typeof url === 'string' && url) urls.add(url)
  }
  return urls
}

export function dynamicInput(node: Record<string, unknown>) {
  return {
    initialHeight: num(node.initialHeight) ?? DEFAULT_HEIGHT,
    props:
      node.props && typeof node.props === 'object'
        ? (node.props as Record<string, unknown>)
        : {},
    url: str(node.url),
  }
}
