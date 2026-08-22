import type { ArticleNoticeMeta } from '@/api/article-meta'
import { aiNoticeChips, isEmptyArticleMeta } from '@/api/article-meta'
import { formatDuration } from '@/tts/format'
import type { TtsStatus } from '@/tts/use-tts-session'

export function shouldShowArticleNotice(
  meta: ArticleNoticeMeta | null,
  listenAvailable: boolean,
): boolean {
  return listenAvailable || !isEmptyArticleMeta(meta)
}

export function shouldShowAiRow(
  meta: ArticleNoticeMeta | null,
  listenAvailable: boolean,
): boolean {
  if (listenAvailable) return true
  return meta !== null && aiNoticeChips(meta).length > 0
}

export function aiRowCanFold(meta: ArticleNoticeMeta | null): boolean {
  return meta !== null && aiNoticeChips(meta).length > 0
}

export function aiRowTrail({
  chipLabels,
  current,
  elapsed,
  narrating,
  status,
  total,
}: {
  chipLabels: string[]
  current: number
  elapsed: number
  narrating: boolean
  status: TtsStatus
  total: number
}): string | null {
  if (narrating) {
    if (status === 'loading' || total === 0) return '—'
    return `${formatDuration(elapsed)} · ${current}/${total}`
  }
  if (chipLabels.length === 0) return null
  return chipLabels.join(' · ')
}
