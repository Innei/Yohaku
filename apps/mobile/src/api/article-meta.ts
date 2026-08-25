import { isRecord } from '@/lib/is-record'

export interface ArticleSummaryMeta {
  createdAt: string | null
  source: 'ai' | 'author'
  text: string
}

export interface ArticleRelatedRef {
  categorySlug: string | null
  id: string
  nid: number | null
  slug: string | null
  title: string
}

export interface ArticleTranslationMeta {
  availableTranslations: string[]
  sourceLang: string | null
  state: 'partial' | 'ready' | 'unknown'
  targetLang: string | null
}

export interface ArticleSkillRef {
  description: string
  id: string
  name: string
}

export type ArticleAiGenValue = number | string

export interface ArticleTtsMeta {
  available: boolean
  stale: boolean
}

export interface ArticlePaywallMeta {
  locked: boolean
}

export interface ArticleNoticeMeta {
  aiGen: ArticleAiGenValue[]
  hasInsights: boolean
  paywall: ArticlePaywallMeta | null
  related: ArticleRelatedRef[]
  skills: ArticleSkillRef[]
  summary: ArticleSummaryMeta | null
  translation: ArticleTranslationMeta | null
  tts: ArticleTtsMeta | null
}

export type AiNoticeChip = 'summary' | 'insights' | 'skills'

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  return value.flatMap((item) => {
    const parsed = asString(item)
    return parsed ? [parsed] : []
  })
}

function pickTranslation(raw: unknown): ArticleTranslationMeta | null {
  if (!isRecord(raw)) return null
  // mx-core keys this map by article id even for a single-entity response, so
  // the entry has to be reached through the values, not a known key.
  const entry = Object.values(raw).find(isRecord)
  const article = entry && isRecord(entry.article) ? entry.article : null
  if (!article || article.isTranslated !== true) return null
  const availableTranslations = asStringArray(article.availableTranslations)
  const targetLang = asString(article.targetLang)
  return {
    availableTranslations: availableTranslations ?? [],
    sourceLang: asString(article.sourceLang),
    state:
      availableTranslations === null || targetLang === null
        ? 'unknown'
        : availableTranslations.includes(targetLang)
          ? 'ready'
          : 'partial',
    targetLang,
  }
}

function pickRelated(raw: unknown): ArticleRelatedRef[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item): ArticleRelatedRef[] => {
    if (!isRecord(item)) return []
    const id = asString(item.id)
    const title = asString(item.title)
    if (!id || !title) return []
    const category = isRecord(item.category) ? item.category : null
    return [
      {
        categorySlug: category ? asString(category.slug) : null,
        id,
        nid: typeof item.nid === 'number' ? item.nid : null,
        slug: asString(item.slug),
        title,
      },
    ]
  })
}

function pickSkills(raw: unknown): ArticleSkillRef[] {
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item): ArticleSkillRef[] => {
    if (!isRecord(item)) return []
    const id = asString(item.id)
    const name = asString(item.name)
    if (!id || !name) return []
    return [{ description: asString(item.description) ?? '', id, name }]
  })
}

function pickInsights(raw: unknown): boolean {
  return isRecord(raw) && raw.hasInLocale === true
}

function pickAiGen(raw: unknown): ArticleAiGenValue[] {
  const values = Array.isArray(raw)
    ? raw
    : raw === undefined || raw === null
      ? []
      : [raw]
  return values.flatMap((value): ArticleAiGenValue[] => {
    if (typeof value === 'number' && Number.isInteger(value)) return [value]
    if (typeof value === 'string') {
      const trimmed = value.trim()
      return trimmed ? [trimmed] : []
    }
    return []
  })
}

function pickTts(raw: unknown): ArticleTtsMeta | null {
  if (!isRecord(raw) || raw.available !== true) return null
  return { available: true, stale: raw.stale === true }
}

function pickPaywall(raw: unknown): ArticlePaywallMeta | null {
  if (!isRecord(raw) || typeof raw.locked !== 'boolean') return null
  return { locked: raw.locked }
}

function pickSummary(
  raw: unknown,
  authorSummary: string | null | undefined,
): ArticleSummaryMeta | null {
  const authored = authorSummary?.trim()
  if (authored) return { createdAt: null, source: 'author', text: authored }
  if (!isRecord(raw)) return null
  const text = asString(raw.text)?.trim()
  if (!text) return null
  return { createdAt: asString(raw.createdAt), source: 'ai', text }
}

/**
 * Normalizes the `meta` envelope of a post/note detail response into the shape
 * the notice card renders. Never throws: meta is decoration, and a malformed
 * payload must not take the article down with it.
 *
 * Always returns an object, never null — a null `article_meta` column has to
 * keep meaning "never fetched" so `bodyIsStale` can schedule the one refetch
 * that backfills rows migrated in with an already-cached body.
 */
export function extractArticleMeta(
  meta: unknown,
  authorSummary?: string | null,
  aiGen?: unknown,
): ArticleNoticeMeta {
  const raw = isRecord(meta) ? meta : {}
  return {
    aiGen: pickAiGen(aiGen),
    hasInsights: pickInsights(raw.insights),
    related: pickRelated(raw.related),
    skills: pickSkills(raw.skills),
    summary: pickSummary(raw.summary, authorSummary),
    translation: pickTranslation(raw.translation),
    tts: pickTts(raw.tts),
    paywall: pickPaywall(raw.paywall),
  }
}

export function isEmptyArticleMeta(
  meta: Partial<ArticleNoticeMeta> | null,
): boolean {
  if (!meta) return true
  return (
    !meta.summary &&
    (meta.related?.length ?? 0) === 0 &&
    (meta.skills?.length ?? 0) === 0 &&
    !meta.hasInsights &&
    !meta.translation
  )
}

export function noticeMetaNeedsBackfill(meta: unknown): boolean {
  if (!isRecord(meta)) return true
  const translation = isRecord(meta.translation) ? meta.translation : null
  return (
    !Array.isArray(meta.skills) ||
    typeof meta.hasInsights !== 'boolean' ||
    !Array.isArray(meta.aiGen) ||
    !('tts' in meta) ||
    !('paywall' in meta) ||
    (translation !== null &&
      (!Array.isArray(translation.availableTranslations) ||
        !['partial', 'ready', 'unknown'].includes(String(translation.state))))
  )
}

export function translatedBodyNeedsRefresh(meta: unknown): boolean {
  if (!isRecord(meta)) return false
  const translation = isRecord(meta.translation) ? meta.translation : null
  if (!translation) return false
  return translation.state !== 'ready'
}

export function aiNoticeChips(
  meta: Partial<ArticleNoticeMeta>,
): AiNoticeChip[] {
  const chips: AiNoticeChip[] = []
  if (meta.summary) chips.push('summary')
  if (meta.hasInsights) chips.push('insights')
  if ((meta.skills?.length ?? 0) > 0) chips.push('skills')
  return chips
}
