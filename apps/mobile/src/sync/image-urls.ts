import type { ApiEnrichment } from '@/api/types'

const BARE_IMAGE =
  /https:\/\/[^\s"'<>]+?\.(?:gif|heic|jpe?g|png|svg|webp)(?:\?[^\s"'<>]*)?/gi

export function extractImageUrls(input: {
  content?: string | null
  enrichments?: Record<string, ApiEnrichment> | null
  text?: string | null
}): string[] {
  const urls = new Set<string>()
  collectFromText(input.content, urls)
  collectFromText(input.text, urls)
  if (input.enrichments) {
    for (const entry of Object.values(input.enrichments)) {
      if (entry.image?.url) urls.add(entry.image.url)
      if (entry.thumbnailImage?.url) urls.add(entry.thumbnailImage.url)
    }
  }
  return [...urls]
}

function collectFromText(raw: string | null | undefined, urls: Set<string>) {
  if (!raw) return
  try {
    walk(JSON.parse(raw), urls)
    return
  } catch {
    // markdown / plaintext
  }
  collectMarkdownImages(raw, urls)
  for (const match of raw.matchAll(BARE_IMAGE)) {
    urls.add(match[0])
  }
}

function collectMarkdownImages(raw: string, urls: Set<string>) {
  let from = 0
  while (from < raw.length) {
    const start = raw.indexOf('![', from)
    if (start === -1) return
    const mid = raw.indexOf('](', start)
    if (mid === -1) return
    const end = raw.indexOf(')', mid + 2)
    if (end === -1) return
    const url = raw.slice(mid + 2, end)
    if (url.startsWith('https://')) urls.add(url)
    from = end + 1
  }
}

function walk(value: unknown, urls: Set<string>, key?: string) {
  if (typeof value === 'string') {
    if (key === 'src' && value.startsWith('https://')) {
      urls.add(value)
    }
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) walk(item, urls, key)
    return
  }
  if (value && typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value)) {
      walk(child, urls, childKey)
    }
  }
}
