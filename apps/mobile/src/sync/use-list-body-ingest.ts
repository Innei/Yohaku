import { useEffect, useRef } from 'react'

import type { ArticleBodyKind } from '@/api/article-body'
import { ARTICLE_BODY_BATCH_LIMIT } from '@/api/article-body'
import { useLocale } from '@/i18n'

import { ingestArticleBodies } from './engine'
import { needsListBody } from './merge'

const INGEST_DEBOUNCE_MS = 280

export type ListBodyCandidate = {
  bodyVersion: number | null
  contentFormat?: string | null
  createdAt: Date | string
  hasPassword?: boolean | null
  id: string
  kind: ArticleBodyKind
  modifiedAt: Date | string | null
}

export function useListBodyIngest(
  items: ListBodyCandidate[],
  options?: { visibleIds?: string[] },
) {
  const locale = useLocale()
  const itemsRef = useRef(items)
  itemsRef.current = items
  const visibleIdsRef = useRef(options?.visibleIds)
  visibleIdsRef.current = options?.visibleIds
  const idsKey = items.map((item) => `${item.kind}:${item.id}`).join(',')
  const visibleKey = options?.visibleIds?.join(',') ?? null

  useEffect(() => {
    const visibleIds = visibleIdsRef.current
    if (visibleIds === undefined) return
    const pool = itemsRef.current.filter((item) => visibleIds.includes(item.id))
    const need = pool
      .filter(needsListBody)
      .slice(0, ARTICLE_BODY_BATCH_LIMIT)
      .map((item) => ({
        id: item.id,
        kind: item.kind,
        ...(typeof item.bodyVersion === 'number'
          ? { bodyVersion: item.bodyVersion }
          : {}),
      }))
    if (need.length === 0) return
    const timer = setTimeout(() => {
      void ingestArticleBodies(need, locale)
    }, INGEST_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [idsKey, locale, visibleKey])
}
