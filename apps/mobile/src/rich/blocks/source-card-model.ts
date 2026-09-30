import { languageFromPath } from '@yohaku/rich-content/src/lexical/portable/github-file.ts'

const COLLAPSED_LINES = 12

export interface GistRef {
  id: string
  owner?: string
}

export interface SourceFile {
  content: string
  language: string
  name: string
}

export function parseGistUrl(href: string): GistRef | null {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return null
  }
  if (url.hostname !== 'gist.github.com') return null
  const parts = url.pathname.split('/').filter(Boolean)
  const id = parts.at(-1)
  if (!id || parts.length > 2) return null
  return parts.length === 2 ? { id, owner: parts[0] } : { id }
}

export function isMarkdownPath(path: string): boolean {
  return /\.(?:md|markdown)$/i.test(path)
}

export function foldSource(text: string, expanded: boolean) {
  const lines = text.replace(/\n$/, '').split('\n')
  const collapsible = lines.length > COLLAPSED_LINES
  return {
    code: expanded || !collapsible ? lines.join('\n') : lines.slice(0, COLLAPSED_LINES).join('\n'),
    collapsible,
    total: lines.length,
  }
}

interface GistApiFile {
  content?: string
  filename?: string
}

export function gistFiles(gist: { files?: Record<string, GistApiFile> }): SourceFile[] {
  return Object.entries(gist.files ?? {}).flatMap(([key, file]) => {
    if (typeof file.content !== 'string') return []
    const name = file.filename ?? key
    return [{ content: file.content, language: languageFromPath(name), name }]
  })
}

export function sourcePathLine({
  chip,
  markdown,
  subtitle,
}: {
  chip?: string
  markdown: boolean
  subtitle?: string
}): string | undefined {
  if (!markdown || !chip || !subtitle) return subtitle
  const [repo, ...rest] = subtitle.split(' · ')
  return [repo, chip, ...rest].join(' · ')
}
