import {
  fmtCount,
  fmtYear,
  hostOf,
} from '@yohaku/rich-content/src/lexical/portable/link-card/enrichment.ts'
import { LanguageToColorMap } from '@yohaku/rich-content/src/lexical/portable/link-card/language-colors.ts'

import type { ApiEnrichment } from '@/api/types'

export type MetaTone = 'error' | 'info' | 'success' | 'warning'

export interface LinkCardMeta {
  dot?: string | null
  symbol?: string
  text: string
  tone?: MetaTone
}

export type LinkCardImageShape = 'avatar' | 'poster' | 'square' | 'thumb'

export interface LinkCardModel {
  description?: string
  host: string
  image?: string
  imageShape: LinkCardImageShape
  label: string | null
  meta: LinkCardMeta[]
  symbol: string
  title: string
}

const KIND_LABELS: Record<string, string> = {
  repo: '仓库',
  issue: 'Issue',
  pr: 'PR',
  'pull-request': 'PR',
  commit: '提交',
  discussion: '讨论',
  user: '用户',
  movie: '电影',
  tv: '剧集',
  book: '书籍',
  album: '专辑',
  song: '单曲',
  music: '音乐',
  academic: '论文',
  code: '题目',
  post: '文章',
  note: '手记',
  page: '页面',
}

const KIND_SYMBOLS: Record<string, string> = {
  github: 'chevron.left.forwardslash.chevron.right',
  movie: 'film',
  tv: 'tv',
  book: 'book.closed',
  album: 'music.note',
  song: 'music.note',
  music: 'music.note',
  academic: 'doc.text',
  code: 'curlybraces',
  self: 'bookmark',
}

const POSTER_KINDS = new Set(['movie', 'tv', 'book'])
const SQUARE_KINDS = new Set(['album', 'song', 'music'])
const AVATAR_KINDS = new Set(['user', 'self'])

const STATE_TONES: Record<string, MetaTone> = {
  open: 'success',
  merged: 'info',
  closed: 'error',
}

const DIFFICULTY_TONES: Record<string, MetaTone> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
}

const count = (value: string) => {
  const n = Number(value)
  return Number.isFinite(n) ? fmtCount(n) : value
}

const META_RULES: Array<[string, (value: string) => LinkCardMeta]> = [
  ['state', (v) => ({ text: v, tone: STATE_TONES[v.toLowerCase()] })],
  [
    'difficulty',
    (v) => ({ text: v, tone: DIFFICULTY_TONES[v.toLowerCase()] }),
  ],
  ['rating', (v) => ({ symbol: 'star.fill', text: v })],
  ['stars', (v) => ({ symbol: 'star', text: count(v) })],
  ['forks', (v) => ({ symbol: 'arrow.triangle.branch', text: count(v) })],
  [
    'language',
    (v) => ({ dot: LanguageToColorMap[v.toLowerCase()] ?? null, text: v }),
  ],
  ['author', (v) => ({ text: v })],
  ['artist', (v) => ({ text: v })],
  ['followers', (v) => ({ symbol: 'person.2', text: count(v) })],
  ['comments', (v) => ({ symbol: 'bubble.left', text: count(v) })],
  ['replies', (v) => ({ symbol: 'bubble.left', text: count(v) })],
  ['genres', (v) => ({ text: v.split(/[,/、]/)[0]!.trim() })],
]

const MAX_META = 3

function metaOf(entry: ApiEnrichment): LinkCardMeta[] {
  const values = new Map<string, string>()
  for (const attr of entry.attributes ?? []) {
    const text = String(attr.value ?? '').trim()
    if (text) values.set(attr.key, text)
  }
  const out: LinkCardMeta[] = []
  for (const [key, build] of META_RULES) {
    const value = values.get(key)
    if (value) out.push(build(value))
    if (out.length === MAX_META) break
  }
  return out
}

export function linkCardModel(
  url: string,
  entry: ApiEnrichment | undefined,
  fallback: { description?: string; image?: string; title?: string },
): LinkCardModel {
  const host = hostOf(url).replace(/^www\./, '')
  if (!entry) {
    return {
      description: fallback.description || undefined,
      host,
      image: fallback.image || undefined,
      imageShape: 'thumb',
      label: null,
      meta: [],
      symbol: 'globe',
      title: fallback.title || url,
    }
  }

  const category = entry.category ?? ''
  const kind = entry.subtype || category
  const typeLabel = KIND_LABELS[kind] ?? KIND_LABELS[category]
  const year = category === 'github' ? null : fmtYear(entry.publishedAt)
  const label = [typeLabel, year].filter(Boolean).join(' · ') || null

  const imageShape: LinkCardImageShape = POSTER_KINDS.has(kind)
    ? 'poster'
    : SQUARE_KINDS.has(kind)
      ? 'square'
      : AVATAR_KINDS.has(kind) || AVATAR_KINDS.has(category)
        ? 'avatar'
        : 'thumb'

  return {
    description: entry.description || fallback.description || undefined,
    host,
    image:
      entry.thumbnailImage?.url ??
      entry.previewImage?.url ??
      (fallback.image || undefined),
    imageShape,
    label,
    meta: metaOf(entry),
    symbol: KIND_SYMBOLS[kind] ?? KIND_SYMBOLS[category] ?? 'globe',
    title: entry.title || fallback.title || url,
  }
}
